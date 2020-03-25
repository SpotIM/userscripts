import * as message from './message';
import commonMessages from './common-messages';
import getColors from './colors';

export const isTopMostFrame = () => {
  return window.parent === window;
};

export const findConversation = () => {
  return (
    document.querySelector('[data-conversation-id]') ||
    document.querySelector('[data-spotim-app="conversation"]') ||
    document.querySelector('[data-spotim-module="conversation"]')
  );
};

export const getLauncherEl = (displayErrorIfNotFound?: boolean) => {
  const launcher = document.querySelector(
    'script[data-spotim-module="spotim-launcher"]'
  );

  if (!launcher && displayErrorIfNotFound) {
    if (isTopMostFrame()) {
      message.set(`Could not find launcher script`, {
        timeout: 2000,
        color: getColors().error,
        emoji: '😕',
      });
    } else {
      window.parent.focus();
      message.set(
        `${commonMessages.focusWarning}<br/>Could not find launcher script`,
        {
          timeout: 3000,
          color: getColors().error,
          emoji: '😕️',
        }
      );
    }
  }

  return launcher;
};

export const isProduction = launcher => {
  if (unsafeWindow.__SPOTIMENV__) {
    return unsafeWindow.__SPOTIMENV__ === 'production';
  } else {
    return launcher.src.indexOf('//launcher.spot.im') > -1;
  }
};

export const getSpotId = launcher => {
  const possibleSpotId = launcher.src
    .split('/')
    .pop()
    .split('?')[0];

  if (possibleSpotId === 'launcher-bundle.js') {
    return launcher.getAttribute('data-spot-id');
  } else {
    return possibleSpotId;
  }
};

export const getPostId = launcher => {
  return launcher.getAttribute('data-post-id');
};

export const getSpotimVersion = () => {
  if (
    unsafeWindow.__SPOTIM__ &&
    (findConversation() || {}).tagName !== 'IFRAME'
  ) {
    return 2;
  } else {
    return 1;
  }
};

export const getConfigUrl = () => {
  const launcher = getLauncherEl(true);
  return `https://api-2-0.spot.im/v1.0.0/config/launcher/${getSpotId(
    launcher
  )}/${getPostId(launcher)}/vendor,init,conversation`;
};

export const padTime = str => {
  if (str.length === 1) {
    return `0${str}`;
  } else {
    return str;
  }
};

export const renderTable = data => {
  return (
    "<div class='table'><tbody>" +
    data
      .map(
        line =>
          "<div class='tr'><div class='td'>" +
          line.join("</div><div class='td'>") +
          '</div></div>'
      )
      .join('') +
    '</tbody></div>'
  );
};

export const createElement = (html, className, tag = 'div') => {
  return `<${tag} class="${className}">${html}</${tag}>`;
};

export const getRandomOptimisticEmoji = () => {
  const emojis = ['🎈', '🚀', '🌈', '🦄', '🍪'];
  return emojis[Math.floor(Math.random() * emojis.length)];
};

export const onFoundSpotimObject = callback => {
  function updateOnFoundSpotimObject() {
    if (unsafeWindow.__SPOTIM__) {
      clearInterval(interval);
      callback();
    }
  }
  const interval = setInterval(updateOnFoundSpotimObject, 500);

  updateOnFoundSpotimObject();
};

export const isWindows = window.navigator.platform === 'Win32';

export function gmFetch(url: string, type: string) {
  return new Promise(resolve => {
    GM_xmlhttpRequest({
      method: 'GET',
      url,
      onload: function(response) {
        if (type === 'json') {
          resolve(JSON.parse(response.responseText));
        } else {
          resolve(response.responseText);
        }
      },
    });
  });
}
