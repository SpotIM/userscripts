// ==UserScript==
// @name         SpotIM Ninja Tools
// @namespace    https://spot.im/
// @version      1.7
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
    '⚠️⚠️️⚠️ Moving focus to parent frame (try again) ️⚠️⚠️️⚠️';

  const colors = {
    default: '#467FDB',
    error: '#f44336',
    success: '#4caf50',
  };

  // global methods
  (() => {
    unsafeWindow.__spotim_ninja_tools_set_creds__ = (email, password) => {
      GM_setValue('email', email);
      GM_setValue('password', password);
    };
  })();

  const utils = {
    getLauncherEl: displayErrorIfNotFound => {
      const launcher = document.querySelector(
        'script[data-spotim-module="spotim-launcher"]',
      );

      if (!launcher && displayErrorIfNotFound) {
        if (window.parent === window) {
          message.set(`Could not find launcher script 😕`, {
            timeout: 2000,
            color: colors.error,
          });
        } else {
          window.parent.focus();
          message.set(
            `Could not find launcher script 😕<br/>️${FOCUS_WARNING}`,
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
  };

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
      style.innerHTML = `
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
      Object.assign(messageEl.style, {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        textAlign: 'center',
        background: 'red',
        color: 'white',
        fontWeight: 'bold',
        fontFamily: 'Helvetica',
        fontSize: '18px',
        padding: '10px',
        lineHeight: '1.5',
        zIndex: 100000000000,
        animation: 'spotim-scroll-to-comments-appear 0.2s ease-out',
        direction: 'ltr',
        maxWidth: '600px',
        margin: '5em auto',
        borderRadius: '1em',
      });
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
      scrollDown();
      message.set('Scroll To Conversation');
      isScrolling = true;
      scrollingInterval = setInterval(() => {
        let conversation;
        conversation =
          document.querySelector('[data-conversation-id]') ||
          document.querySelector('[data-spotim-app="conversation"]');
        if (conversation) {
          conversation.scrollIntoView();
          message.set('Scroll To Conversation... found! 😃', {
            color: colors.success,
          });
        } else {
          if (window.parent === window) {
            message.set(
              'Scroll To Conversation... not found 😕 try scrolling up and down a bit',
              { color: colors.error },
            );
          } else {
            window.parent.focus();
            message.set(
              `Scroll To Conversation... not found 😕 try scrolling up and down a bit.<br/>${FOCUS_WARNING}`,
              { color: colors.error, timeout: 3000 },
            );
            stopScrolling({ hideMessage: false });
          }
        }
      }, 100);
    }

    function stopScrolling({ hideMessage } = { hideMessage: true }) {
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
    return {
      open: async ({ spotId }) => {
        const email = await GM_getValue('email');
        const password = await GM_getValue('password');

        if (!email || !password) {
          message.set(
            "First you need to enter you're credentials for the Host Panel.<br/>" +
              'Do so by running the following command in the console:<br/>' +
              '<span class="sptmninja_code">__spotim_ninja_tools_set_creds__("john@example.com", "Password!123")</span><br/>' +
              "Note that the credentials will be saved as clear text somewhere in TamperMonkey's storage!",
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

        message.set('Openning Host Panel...', {
          color: colors.success,
          timeout: 2000,
        });

        const isStaging = !utils.isProduction(utils.getLauncherEl());
        var hostPrefix = isStaging ? 'staging-' : '';
        window.open(
          `https://admin.${hostPrefix}spot.im/spot/${spotId}/moderation?name=${makeMeAdminJson.spot_name}&token=${tokenByTicketJson.token}&network_name=${tokenByTicketJson.network_name}`,
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
        const version = !!window.__SPOTIM__ ? 'V.2.0' : 'V.1.0';
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

      message.set(
        `
        Available Shortcuts:<br/>
        sss - Scroll to conversation<br/>
        ssi - Show Info<br/>
        ssc - Copy Spot ID to Clipboard (only on HTTPs)<br/>
        ssa - Open Host Panel<br/>
        ssh - Show Help
        `,
        { timeout: 5000, color: colors.default },
      );
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
