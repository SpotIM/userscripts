import * as utils from './utils';
import * as message from './message';
import colors from './colors';

let assetChangeInterval;

function isConfigContainsConfig(config1, config2) {
  return !config1.find(config1Module => {
    const config2Module = config2.find(
      config2Module =>
        config1Module.module === config2Module.module &&
        config1Module.name === config2Module.name
    );

    if (!config2Module) {
      return true;
    }

    if (config1Module.url !== config2Module.url) {
      return true;
    }
  });
}

function isConfigEqual(config1, config2) {
  return (
    isConfigContainsConfig(config1, config2) &&
    isConfigContainsConfig(config2, config1)
  );
}

async function notifyOnChange() {
  // if (location.protocol !== "https:") {
  //   message.set(`Can't display notifications on non-https sites`, {
  //     timeout: 4000,
  //     color: colors.error,
  //     emoji: "😞"
  //   });

  //   return;
  // }

  // message.set(`Please allow notifications on this site`, {
  //   color: colors.default,
  //   emoji: "🚦",
  //   belowNotificationPopover: true
  // });

  // const result = await Notification.requestPermission();

  // if (result !== "granted") {
  //   message.set(`Notification permission denied`, {
  //     timeout: 3000,
  //     color: colors.error,
  //     emoji: "😕"
  //   });

  //   return;
  // }

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
      color: colors.default,
      emoji: '⬆️',
    });
    // var notification = new Notification("");
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

    if (lastConfig && !isConfigEqual(config, lastConfig)) {
      showNotification();
    }

    lastConfig = config;
  }

  checkForUpdates();

  assetChangeInterval = setInterval(checkForUpdates, 1000);

  message.set(`I will notify you on asset updates!`, {
    timeout: 4000,
    color: colors.success,
    emoji: '😃',
  });
}

function stopListeningToChanges(showMessage?: boolean) {
  clearInterval(assetChangeInterval);
  assetChangeInterval = false;

  if (showMessage) {
    message.set(`Stopped listening to asset updates`, {
      timeout: 4000,
      color: colors.default,
      emoji: '👍',
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
