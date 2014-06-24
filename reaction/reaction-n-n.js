;(function(window) {
  var stepTime, currentLink, nextStep, paused = true, busy = false;
  var container = document.querySelector('#container');
  var blocker = document.querySelector('#blocker');
  var ms = document.querySelector('#ms');
  var instructions = document.querySelector('#instructions');
  var urls = [], categories = {};

  function populate(sites) {
    containerChildren = [blocker];

    function appendLink(url, categories) {
      var element = document.createElement('a');
      element.href = url;
      element.setAttribute('data-categories', categories.join(' '));
      containerChildren.push(container.insertBefore(element, containerChildren[ Math.ceil(Math.random() * containerChildren.length) ]));
    }

    for (var site in sites) {
      if (sites.hasOwnProperty(site)) {
        appendLink(site, sites[site]);
      }
    }

  }

  function step(duration) {
    var timeUntilNext, index, children;
    stepTime = new Date().getTime();

    if (currentLink) {
      container.removeChild(currentLink);
    }

    if (duration > 10000) {
      nextStep = currentLink = false;
      blocker.className = 'dummy';
    } else {
      children = container.children;
      index = children.length - 1;

      if (index) {
        currentLink = children[ index ];
      } else currentLink = false;

      // run it again in [800, 1000)ms
      timeUntilNext = Math.floor((Math.random() * 200) + 800);
      nextStep = window.setTimeout(function() {
        step(duration + timeUntilNext);
      }, timeUntilNext);
    }
  }

  function start() {
    function countdown(stage) {
      if (stage) {
        ms.textContent = stage;
        window.setTimeout(function() {
          countdown(stage - 1);
        }, 500);
      } else {
        ms.textContent = 'GO';
        window.setTimeout(function() {
          blocker.className = '';
          ms.textContent = '';
          busy = false;
          step(0);
        }, 500);
      }
    }
    busy = true;
    blocker.className = 'blocking';
    countdown(3);
  }

  function handleKeydown(e) {
    var key = e.key || e.keyCode;

    if (!busy && key === 32) {
      if (paused) {
        paused = false;
        instructions.textContent = "when red";
        start();
      } else {
        if (nextStep) {
          window.clearTimeout(nextStep);
          blocker.className = 'non-blocking';
          urls.push(currentLink.href);
          currentLink.getAttribute('data-categories').split(' ').forEach(function(category) {
            if (categories[category] === undefined) {
              categories[category] = 1;
            } else ++categories[category];
          });
        }
        instructions.textContent = "to retry";
        paused = true;
        ms.innerText = new Date().getTime() - stepTime + 'ms';
      }
    } else if (key === 65) {
      // prevent meta + a for select all
      e.preventDefault();
      return false;
    }
  }

  var request = new XMLHttpRequest();

  request.open('GET', '../sites.json', true);

  request.onload = function() {
    if (request.status >= 200 && request.status < 400){
      var sites = JSON.parse(request.responseText);
      var userAgent = navigator.userAgent||navigator.vendor||window.opera;

      populate(sites);
      if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(userAgent)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0,4))) {
        // we're on a mobile device
        document.querySelector('#verb').textContent = 'Tap';
        document.querySelector('#noun').textContent = 'screen';
        window.addEventListener('touchstart', function() {
          handleKeydown({key: 32}); // lol
        }, false);
      } else {
        window.addEventListener('keydown', handleKeydown, false);
      }
    }
  };

  request.send();
})(this);
