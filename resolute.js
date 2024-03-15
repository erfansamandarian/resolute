(function () {
  document.addEventListener('yt-navigate-finish', function (event) {
    if (location.pathname === '/watch') {
      runObserverIfExtensionEnabled();
    }
  });

  function runObserverIfExtensionEnabled() {
    chrome.storage.sync.get(['extensionEnabled'], function (result) {
      if (result.extensionEnabled !== undefined && result.extensionEnabled === false) {
        console.log('Simple Auto HD Extension Disabled. Please enable it through popup menu.');
      } else {
        console.log('Simple Auto HD Extension Enabled. Proceeding to initiate observer ');
        initiateObserverAndObserve();
      }
    });
  }

  var config = {
    childList: true,
    attributes: true,
    subtree: true,
    characterData: true
  };

  var qualitiesArray = [
    '4320p',
    '2160p',
    '1440p',
    '1080p',
    '720p',
  ];

  var qualityTitles = [
    'Quality'
  ];

  function initiateObserverAndObserve() {
    var observer = new MutationObserver(function (mutations) {
      if (!document.contains(document.querySelector('.ytp-settings-button'))) {
        return;
      }

      observer.disconnect();

      setTimeout(() => {
        selectPreferredQuality();
      }, 100)
    });

    observer.observe(document.body, config);
  }


  var selectPreferredQuality = function () {
    var preferredQuality;

    chrome.storage.sync.get(['preferredQuality'], function (result) {
      updateQuality(result.preferredQuality);
    });
  };

  var updateQuality = function (preferredQuality) {
    if (preferredQuality === undefined) {
      preferredQuality = 'best-available';
      chrome.storage.sync.set({ preferredQuality: preferredQuality }, function () { });
    }

    var settingsButton = document.getElementsByClassName('ytp-settings-button')[0];

    settingsButton.click();

    var buttons = document.getElementsByClassName('ytp-menuitem-label');

    for (var i = 0; i < buttons.length; i++) {
      if (qualityTitles.includes(buttons[i].innerHTML)) {
        buttons[i].click();
      }
    }

    var targetItem;

    if (preferredQuality === 'best-available') {
      targetItem = document.querySelector('.ytp-quality-menu .ytp-menuitem-label');
    } else {
      var targetItems = document.querySelectorAll('.ytp-quality-menu .ytp-menuitem-label');

      targetItem = findTargetItem(preferredQuality, targetItems);
    }

    targetItem.click();
  }

  function findTargetItem(preferredQuality, targetItems) {
    var targetItem = '';

    for (var i = 0; i < targetItems.length; i++) {
      var potentialTargetItem = targetItems[i].childNodes[0].childNodes[0];

      var quality = potentialTargetItem.innerHTML.split(' ')[0];

      if (quality === preferredQuality) {
        targetItem = potentialTargetItem;
      }
    }

    var key = qualitiesArray.indexOf(preferredQuality);

    if (targetItem === '' && (qualitiesArray[key + 1] !== undefined)) {
      preferredQuality = qualitiesArray[key + 1];

      return findTargetItem(preferredQuality, targetItems);
    }

    return targetItem;
  }

})();
