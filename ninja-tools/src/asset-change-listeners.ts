import * as utils from './utils';
import * as message from './message';
import getColors from './colors';
import isEqual from 'lodash.isequal';
import { diff } from 'deep-object-diff';
import formatHighlight from 'json-format-highlight';

let assetChangeInterval;

async function notifyOnChange() {
  let lastConfig;

  function showNotification(change: any) {
    stopListeningToChanges();
    GM_notification({
      title: 'A configuration has changed!',
      text: `${window.location.hostname} — Detected configuration change`,
      onclick: () => {
        window.focus();
      },
    });

    message.set(
      `<pre>${formatHighlight(change, {
        keyColor: 'white; font-weight: bold;',
        numberColor: '#FFEB3B',
        nullColor: '#FFEB3B',
        falseColor: '#FFEB3B',
        trueColor: '#FFEB3B',
        stringColor: '#FFEB3B',
      })}</pre>`,
      {
        title: 'A configuration has changed!',
        color: getColors().default,
        // emoji: '⬆️',
        overflow: 'scroll',
      }
    );
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

    const configResponse = await response.json();

    const config = {
      config: configResponse.init_data.config,
      assetsConfig: configResponse.assets_config,
    };

    if (lastConfig && !isEqual(config, lastConfig)) {
      showNotification(diff(config, lastConfig));
    }

    lastConfig = config;
  }

  checkForUpdates();

  assetChangeInterval = setInterval(checkForUpdates, 1000);

  message.set(`I will notify you on configuration changes!`, {
    timeout: 4000,
    color: getColors().default,
    emoji: '😃',
  });
}

function stopListeningToChanges(showMessage?: boolean) {
  clearInterval(assetChangeInterval);
  assetChangeInterval = false;

  if (showMessage) {
    message.set(`Stopped listening to configuration changes`, {
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
