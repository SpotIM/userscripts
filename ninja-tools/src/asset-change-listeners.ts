import * as utils from './utils';
import * as message from './message';
import getColors from './colors';
import isEqual from 'lodash.isequal';

let assetChangeInterval;

async function notifyOnChange() {
  let lastConfig;

  function showNotification() {
    stopListeningToChanges();
    GM_notification({
      title: 'An asset has been updated!',
      text: `${window.location.hostname} — Detected asset update`,
      onclick: () => {
        window.focus();
      },
    });

    message.set('An asset has been updated!', {
      color: getColors().default,
      emoji: '⬆️',
    });
  }

  async function checkForUpdates() {
    const launcher = utils.getLauncherEl();
    let response;
    if (launcher) {
      response = await fetch(
        `https://api-2-0.spot.im/v1.0.0/config/launcher/${utils.getSpotId(
          launcher
        )}/${utils.getPostId(launcher)}/vendor,init,conversation`
      );
    } else if (
      unsafeWindow.location.href.match(
        /https:\/\/api-2-0.spot.im\/v1.0.0\/config\/launcher\/.*?\/.*?\/.*/
      )
    ) {
      response = await fetch(unsafeWindow.location.href);
    }

    const config = (await response.json()).assets_config;

    if (lastConfig && !isEqual(config, lastConfig)) {
      showNotification();
    }

    lastConfig = config;
  }

  checkForUpdates();

  assetChangeInterval = setInterval(checkForUpdates, 1000);

  message.set(`I will notify you on asset updates!`, {
    timeout: 4000,
    color: getColors().success,
    emoji: '😃',
  });
}

function stopListeningToChanges(showMessage?: boolean) {
  clearInterval(assetChangeInterval);
  assetChangeInterval = false;

  if (showMessage) {
    message.set(`Stopped listening to asset updates`, {
      timeout: 4000,
      color: getColors().default,
      emoji: '❌',
    });
  }
}

export function toggleNotifyOnChange() {
  if (assetChangeInterval) {
    stopListeningToChanges(true);
  } else {
    notifyOnChange();
  }
}
