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
    if (utils.isTopMostFrame()) {
      message.set(`Could not find launcher script`, {
        timeout: 2000,
        color: colors.error,
        emoji: '😕',
      });
    } else {
      window.parent.focus();
      message.set(
        `${commonMessages.focusWarning}<br/>Could not find launcher script`,
        {
          timeout: 3000,
          color: colors.error,
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

getPostId: launcher => {
  return launcher.getAttribute('data-post-id');
};

export const getSpotimVersion = () => {
  if (
    unsafeWindow.__SPOTIM__ &&
    (utils.findConversation() || {}).tagName !== 'IFRAME'
  ) {
    return 2;
  } else {
    return 1;
  }
};

export const getConfigUrl = () => {
  const launcher = utils.getLauncherEl(true);
  return `https://api-2-0.spot.im/v1.0.0/config/launcher/${utils.getSpotId(
    launcher
  )}/${utils.getPostId(launcher)}/vendor,init,conversation`;
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
    "<div class='sptmninja_table'><tbody>" +
    data
      .map(
        line =>
          "<div class='sptmninja_tr'><div class='sptmninja_td'>" +
          line.join("</div><div class='sptmninja_td'>") +
          '</div></div>'
      )
      .join('') +
    '</tbody></div>'
  );
};

export const createElement = (html, className, tag = 'div') => {
  return `<${tag} class="sptmninja_${className}">${html}</${tag}>`;
};

export const getRandomOptimisticEmoji = () => {
  const emojis = ['🎈', '🚀', '🌈', '🦄'];
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
