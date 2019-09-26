// ==UserScript==
// @name         SpotIM Ninja Tools
// @namespace    https://spot.im/
// @version      1.12
// @description  A bunch of shortcuts to make our lives easier
// @author       dutzi
// @match        http*://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// ==/UserScript==

(function() {
  'use strict';

  const FOCUS_WARNING =
    '⚠️⚠️️⚠️ TRY AGAIN. (Moving focus to parent frame) ️⚠️⚠️️⚠️';

  const colors = {
    default: '#467FDB',
    error: '#f44336',
    success: '#4caf50',
  };

  const prefs = (() => {
    return {
      get: () => {
        return GM_getValue('prefs', {});
      },
      set: prefs => {
        return GM_setValue('prefs', prefs);
      },
    };
  })();

  // first run message
  (async () => {
    const isNotFirstRun = await prefs.get().isNotFirstRun;
    if (!isNotFirstRun) {
      message.set(
        "Welcome to Ninja Tools<br/>(you'll only see this message once)",
        { timeout: 3000, color: colors.default },
      );

      setTimeout(() => {
        help.show();
      }, 3500);

      await prefs.set({ isNotFirstRun: true });
    }
  })();

  // set settings/creds method
  (() => {
    unsafeWindow.__spotim_ninja_tools_set_creds__ = async (email, password) => {
      await GM_setValue('email', email);
      await GM_setValue('password', password);
      console.log('successfully set creds!');
    };

    unsafeWindow.__spotim_ninja_tools_set_prefs__ = async newPrefs => {
      const currentPrefs = await prefs.get();

      const mergedPrefs = {
        ...currentPrefs,
        ...newPrefs,
      };
      await prefs.set(mergedPrefs);

      console.log('successfully set prefs!');
      console.log(mergedPrefs);
    };
  })();

  const utils = {
    isTopMostFrame: () => {
      return window.parent === window;
    },

    findConversation: () => {
      return (
        document.querySelector('[data-conversation-id]') ||
        document.querySelector('[data-spotim-app="conversation"]')
      );
    },

    getLauncherEl: displayErrorIfNotFound => {
      const launcher = document.querySelector(
        'script[data-spotim-module="spotim-launcher"]',
      );

      if (!launcher && displayErrorIfNotFound) {
        if (utils.isTopMostFrame()) {
          message.set(`Could not find launcher script 😕`, {
            timeout: 2000,
            color: colors.error,
          });
        } else {
          window.parent.focus();
          message.set(
            `${FOCUS_WARNING}<br/>Could not find launcher script 😕️`,
            { timeout: 3000, color: colors.error },
          );
        }
      }

      return launcher;
    },

    isProduction: launcher => {
      if (unsafeWindow.__SPOTIMENV__) {
        return unsafeWindow.__SPOTIMENV__ === 'production';
      } else {
        return launcher.src.indexOf('//launcher.spot.im') > -1;
      }
    },

    getSpotId: launcher => {
      const possibleSpotId = launcher.src
        .split('/')
        .pop()
        .split('?')[0];

      if (possibleSpotId === 'launcher-bundle.js') {
        return launcher.getAttribute('data-spot-id');
      } else {
        return possibleSpotId;
      }
    },

    getSpotimVersion: () => {
      if (
        unsafeWindow.__SPOTIM__ &&
        (utils.findConversation() || {}).tagName !== 'IFRAME'
      ) {
        return 2;
      } else {
        return 1;
      }
    },
  };

  // autoscroll
  (async () => {
    let findConversationInterval;

    if (utils.isTopMostFrame() && (await prefs.get().autoScroll)) {
      findConversationInterval = setInterval(() => {
        let conversation = utils.findConversation();

        if (conversation) {
          console.log('scrolling.start()', findConversationInterval);
          scrolling.start();
          clearInterval(findConversationInterval);
        }
      }, 100);
    }
  })();

  // apis
  const message = (() => {
    let messageEl;
    let hasAddedMessage;
    let hasAddedStyleTag;
    let hideMessageTimeout;

    function addStyleTag() {
      if (hasAddedStyleTag) {
        return;
      }
      hasAddedStyleTag = true;

      const style = document.createElement('style');
      style.innerHTML = /*css*/ `
        @keyframes spotim-scroll-to-comments-appear {
          0% {
            transform: scale(0.7);
            opacity: 0;
          }
          90% {
            transform: scale(1.02);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .sptmninja_code {
          font-family: monaco;
          font-size: 13px;
          color: #d3d5da;
          margin: 10px 0px;
          display: inline-block;
          background: #2b579c;
          padding: 4px 8px;
          border-radius: 5px;
        }
      `;
      document.head.appendChild(style);
    }

    function addMessage() {
      if (hasAddedMessage) {
        return;
      }
      hasAddedMessage = true;

      messageEl = document.createElement('div');
      messageEl.setAttribute(
        'style',
        /* css */ `{
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            text-align: center;
            background: red;
            color: white;
            font-weight: bold;
            font-family: Helvetica;
            font-size: 18px;
            padding: 10px;
            line-height: 1.5;
            z-index: 100000000000;
            animation: spotim-scroll-to-comments-appear 0.2s ease-out;
            direction: ltr;
            max-width: 600px;
            margin: 5em auto;
            border-radius: 1em;
          }
        `.slice(1, -1),
      );
      setMessageColor(colors.default);
      document.body.appendChild(messageEl);
    }

    function showMessage() {
      if (!messageEl.parentNode) {
        document.body.appendChild(messageEl);
      }
    }

    function hideMessage() {
      messageEl.parentNode.removeChild(messageEl);
    }

    function setMessage(message, { timeout, color } = {}) {
      addStyleTag();
      addMessage();
      showMessage();

      if (messageEl.innerHTML !== message) {
        messageEl.innerHTML = message;
      }

      clearTimeout(hideMessageTimeout);
      if (timeout) {
        hideMessageTimeout = setTimeout(() => {
          hideMessage();
        }, timeout);
      }

      if (color) {
        setMessageColor(color);
      }
    }

    function setMessageColor(color) {
      messageEl.style.backgroundColor = color;
    }

    return {
      set: setMessage,
      show: showMessage,
      hide: hideMessage,
    };
  })();

  const scrolling = (() => {
    let isScrolling;
    let scrollingInterval;
    let hasScrolledDown;
    let isConversationHighlighted;
    let isInViewport;

    function highlightConversation(conversation) {
      Object.assign(conversation.style, {
        boxShadow: '#4caf50 0px 0px 0px 12px, black 0px 0px 40px 22px',
        // outline: 'solid 2000px #00000070',
      });

      isConversationHighlighted = true;
    }

    function unhighlightConversation(conversation) {
      if (!isConversationHighlighted) {
        return;
      }

      conversation.style.transition = 'all 1s ease-out';
      conversation.style.boxShadow = null;
      conversation.style.outline = null;

      isConversationHighlighted = false;
    }

    function scrollDown() {
      if (!hasScrolledDown) {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth',
        });
        hasScrolledDown = true;
      }
    }

    function startScrolling() {
      let observer = new IntersectionObserver(
        data => {
          isInViewport = data[0].isIntersecting;
        },
        {
          rootMargin: '0px',
          threshold: 0,
        },
      );

      if (isScrolling) {
        return;
      }

      scrollDown();
      message.set('Scroll To Conversation');
      isScrolling = true;
      scrollingInterval = setInterval(() => {
        let conversation;
        conversation = utils.findConversation();
        if (conversation) {
          observer.observe(conversation);

          if (!isInViewport) {
            conversation.scrollIntoView();
            window.scrollBy(0, -200);
          }
          message.set('Scroll To Conversation... found! 😃', {
            color: colors.success,
          });
          highlightConversation(conversation);
        } else {
          if (utils.isTopMostFrame()) {
            message.set(
              'Scroll To Conversation... not found 😕 try scrolling up and down a bit',
              { color: colors.error },
            );
          } else {
            window.parent.focus();
            message.set(
              `${FOCUS_WARNING}<br/>Scroll To Conversation... not found 😕 try scrolling up and down a bit.`,
              { color: colors.error, timeout: 3000 },
            );
            stopScrolling({ hideMessage: false });
          }
        }
      }, 100);
    }

    function stopScrolling({ hideMessage } = { hideMessage: true }) {
      unhighlightConversation(utils.findConversation());
      if (isScrolling) {
        if (hideMessage) {
          message.hide();
        }
        clearInterval(scrollingInterval);
        isScrolling = false;
      }
    }

    function toggleScrolling() {
      if (isScrolling) {
        stopScrolling();
      } else {
        startScrolling();
      }
    }

    return {
      start: startScrolling,
      stop: stopScrolling,
      toggle: toggleScrolling,
    };
  })();

  const hostPanel = (() => {
    let windowRef;
    let lastUrl;

    return {
      open: async ({ spotId }) => {
        function showSuccessMessage() {
          message.set('Openning Host Panel...', {
            color: colors.success,
            timeout: 2000,
          });
        }

        if (lastUrl) {
          windowRef = window.open(lastUrl);
          lastUrl = null;

          showSuccessMessage();
        }

        if (windowRef && !windowRef.closed) {
          windowRef.focus();
          return;
        }

        const email = await GM_getValue('email');
        const password = await GM_getValue('password');

        if (!email || !password) {
          message.set(
            "First you need to enter you're credentials for the Host Panel.<br/>" +
              'Do so by running the following command in the console:<br/>' +
              '<span class="sptmninja_code">__spotim_ninja_tools_set_creds__("john@example.com", "Password!123")</span><br/>' +
              "Note that the credentials will be saved as clear text somewhere in TamperMonkey's storage!",
            colors.default,
          );

          return;
        }

        var networkName = 'spotim';

        message.set('Fetching network id...', { color: colors.default });

        var networkIdJson = await fetch(
          `https://www.spot.im/api/me/network-id-by-name/${networkName}`,
        ).then(r => r.json());

        message.set('Fetching network token...', { color: colors.default });

        var networkTokenJson = await fetch(
          `https://www.spot.im/api/me/network-token/${networkIdJson.network_id}`,
          { method: 'post' },
        ).then(r => r.json());

        message.set('Logging in...', { color: colors.default });

        var emailConnectJson = await fetch(
          `https://www.spot.im/api/email-connect/login`,
          {
            method: 'post',
            headers: new Headers({
              'x-spotim-networkid': networkIdJson.network_id,
              'x-spotim-token': networkTokenJson.token,
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify({ email, password }),
          },
        ).then(r => r.json());

        if (emailConnectJson.type === 'EmailLogin_TooManyLoginAttemptsError') {
          message.set('Too many login attempts 😕', {
            color: colors.error,
            timeout: 2000,
          });
          return;
        }

        message.set('Fetching login json...', { color: colors.default });

        var loginRegisteredJson = await fetch(
          `https://www.spot.im/api/me/login-registered`,
          {
            method: 'post',
            headers: new Headers({
              'x-spotim-networkid': networkIdJson.network_id,
              'x-spotim-token': networkTokenJson.token,
            }),
          },
        ).then(r => r.json());

        message.set('Calling me-make-admin...', { color: colors.default });

        var makeMeAdminJson = await fetch(
          `https://www.spot.im/api/moderation/internal/make-me-admin?spot_id=${spotId}`,
          {
            headers: new Headers({
              'x-spotim-networkid': networkIdJson.network_id,
              'x-spotim-token': networkTokenJson.token,
            }),
          },
        ).then(r => r.json());

        message.set('Fetching token JSON...', { color: colors.default });

        var tokenByTicketJson = await fetch(
          `https://www.spot.im/api/me/token-by-ticket/${makeMeAdminJson.token_ticket}`,
          { method: 'post' },
        ).then(r => r.json());

        const isStaging = !utils.isProduction(utils.getLauncherEl());
        var hostPrefix = isStaging ? 'staging-' : '';

        const url = `https://admin.${hostPrefix}spot.im/spot/${spotId}/moderation?name=${makeMeAdminJson.spot_name}&token=${tokenByTicketJson.token}&network_name=${tokenByTicketJson.network_name}`;

        message.set('Opening Host Panel 😃', {
          color: colors.success,
          timeout: 2000,
        });

        windowRef = window.open(url);

        if (windowRef === null) {
          message.set(
            'Popup blocker probably blocked us 😞<br/>But type ssa again and it will work immediately!',
            { timeout: 6000, color: colors.error },
          );
          lastUrl = url;
        }
      },
    };
  })();

  const help = (() => {
    return {
      show: () => {
        message.set(
          [
            'Available Shortcuts:',
            'sss - Scroll to Conversation',
            'ssi - Show Info',
            'ssc - Copy Spot ID to Clipboard (only on HTTPs)',
            'ssa - Open Host Panel',
            'ssh - Show Help',
            'escape - Hides Floating Messages',
          ].join('<br/>'),
          { color: colors.default },
        );
      },
    };
  })();

  const commands = {
    // scroll to conversation
    sss: () => {
      scrolling.toggle();
    },

    // copy spot id
    ssc: () => {
      scrolling.stop();

      const launcher = utils.getLauncherEl(true);
      if (launcher) {
        const spotId = utils.getSpotId(launcher);

        if (navigator.clipboard) {
          navigator.clipboard.writeText(spotId);
          message.set(`Copied ${spotId} to clipboard! 😃`, {
            timeout: 2000,
            color: colors.default,
          });
        } else {
          message.set(
            `Can't copy ${spotId} to clipboard on non-https sites 😞`,
            { timeout: 4000, color: colors.error },
          );
        }
      }
    },

    // show info
    ssi: () => {
      scrolling.stop();

      const launcher = utils.getLauncherEl(true);
      if (launcher) {
        const spotId = utils.getSpotId(launcher);
        const version = utils.getSpotimVersion() === 2 ? 'V.2.0' : 'V.1.0';
        const env = utils.isProduction(launcher) ? 'Production' : 'Dev';

        message.set(`spot-id: ${spotId} <br/> ${version} <br/> ${env}`, {
          timeout: 2000,
          color: colors.default,
        });
      }
    },

    // open admin panel
    ssa: () => {
      scrolling.stop();

      const launcher = utils.getLauncherEl(true);
      if (launcher) {
        if (!utils.isProduction(launcher)) {
          // todo - fix staging host panel login
          window.open('https://admin.staging-spot.im/internal/super-admin');
        } else {
          hostPanel.open({ spotId: utils.getSpotId(launcher) });
        }
      }
    },

    // dump open admin panel
    ssda: () => {
      scrolling.stop();

      const launcher = utils.getLauncherEl(true);
      if (launcher) {
        if (!utils.isProduction(launcher)) {
          window.open('https://admin.staging-spot.im/internal/super-admin');
        } else {
          window.open('https://admin.spot.im/internal/super-admin');
        }
      }
    },

    // show help
    ssh: () => {
      scrolling.stop();
      help.show();
    },
  };

  function executeCommand(keyCombo) {
    const commandImpl = commands[keyCombo];

    if (commandImpl) {
      commandImpl();
      return true;
    } else {
      return false;
    }
  }

  // handle keystrokes
  (() => {
    let lastKeyStrokesResetTimeout;

    let lastKeyStrokes = [];

    function handleKeyDown(e) {
      if (e.key && e.key.toLowerCase() === 'escape') {
        scrolling.stop();
        message.hide();
      }
    }

    function handleKeyPress(e) {
      lastKeyStrokes.push(e.key.toLowerCase());
      clearTimeout(lastKeyStrokesResetTimeout);

      const keyCombo = lastKeyStrokes.join('');

      if (executeCommand(keyCombo)) {
        lastKeyStrokes = [];
      } else {
        lastKeyStrokesResetTimeout = setTimeout(() => {
          lastKeyStrokes = [];
        }, 500);
      }
    }

    // for some reason pressing on escape doesn't register as a keypress
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keypress', handleKeyPress);
  })();
})();
