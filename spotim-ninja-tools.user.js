// ==UserScript==
// @name         SpotIM Ninja Tools
// @namespace    https://spot.im/
// @version      2.1
// @description  A bunch of shortcuts to make our lives easier
// @author       dutzi
// @match        http*://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// ==/UserScript==

(function() {
  "use strict";

  const FOCUS_WARNING =
    "⚠️⚠️️⚠️ TRY AGAIN. (Moving focus to parent frame) ️⚠️⚠️️⚠️";

  const colors = {
    default: { bg: "#467FDB", border: "#46abdb" },
    error: { bg: "#f44336", border: "#d81054" },
    success: { bg: "#4caf50", border: "#4dd052" }
  };

  const prefs = (() => {
    return {
      get: () => {
        return GM_getValue("prefs", {});
      },
      set: prefs => {
        return GM_setValue("prefs", prefs);
      }
    };
  })();

  // first run message
  (async () => {
    const isNotFirstRun = await prefs.get().isNotFirstRun;
    if (!isNotFirstRun) {
      message.set(
        "Welcome to Ninja Tools<br/>(you'll only see this message once)",
        { timeout: 3000, color: colors.default }
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
      await GM_setValue("email", email);
      await GM_setValue("password", password);
      console.log("successfully set creds!");
    };

    unsafeWindow.__spotim_ninja_tools_set_prefs__ = async newPrefs => {
      const currentPrefs = await prefs.get();

      const mergedPrefs = {
        ...currentPrefs,
        ...newPrefs
      };
      await prefs.set(mergedPrefs);

      console.log("successfully set prefs!");
      console.log(mergedPrefs);
    };
  })();

  const utils = {
    isTopMostFrame: () => {
      return window.parent === window;
    },

    findConversation: () => {
      return (
        document.querySelector("[data-conversation-id]") ||
        document.querySelector('[data-spotim-app="conversation"]') ||
        document.querySelector('[data-spotim-module="conversation"]')
      );
    },

    getLauncherEl: displayErrorIfNotFound => {
      const launcher = document.querySelector(
        'script[data-spotim-module="spotim-launcher"]'
      );

      if (!launcher && displayErrorIfNotFound) {
        if (utils.isTopMostFrame()) {
          message.set(`Could not find launcher script`, {
            timeout: 2000,
            color: colors.error,
            emoji: "😕"
          });
        } else {
          window.parent.focus();
          message.set(`${FOCUS_WARNING}<br/>Could not find launcher script`, {
            timeout: 3000,
            color: colors.error,
            emoji: "😕️"
          });
        }
      }

      return launcher;
    },

    isProduction: launcher => {
      if (unsafeWindow.__SPOTIMENV__) {
        return unsafeWindow.__SPOTIMENV__ === "production";
      } else {
        return launcher.src.indexOf("//launcher.spot.im") > -1;
      }
    },

    getSpotId: launcher => {
      const possibleSpotId = launcher.src
        .split("/")
        .pop()
        .split("?")[0];

      if (possibleSpotId === "launcher-bundle.js") {
        return launcher.getAttribute("data-spot-id");
      } else {
        return possibleSpotId;
      }
    },

    getPostId: launcher => {
      return launcher.getAttribute("data-post-id");
    },

    getSpotimVersion: () => {
      if (
        unsafeWindow.__SPOTIM__ &&
        (utils.findConversation() || {}).tagName !== "IFRAME"
      ) {
        return 2;
      } else {
        return 1;
      }
    }
  };

  // autoscroll
  (async () => {
    let findConversationInterval;

    function shouldAutoScrollInDomain() {
      return (
        ["s3.amazonaws.com", "www.spotim.name", "localhost"].indexOf(
          location.hostname
        ) === -1
      );
    }

    if (
      utils.isTopMostFrame() &&
      (await prefs.get().autoScroll) &&
      shouldAutoScrollInDomain()
    ) {
      findConversationInterval = setInterval(() => {
        let conversation = utils.findConversation();

        if (conversation) {
          scrolling.start();
          clearInterval(findConversationInterval);
        }
      }, 100);
    }
  })();

  // apis
  const message = (() => {
    let messageEl;
    let messageBodyEl;
    let messageProgressEl;
    let messageEmojiEl;
    let hasAddedMessage;
    let hasAddedStyleTag;
    let hideMessageTimeout;
    let isMouseOver;

    function addStyleTag() {
      if (hasAddedStyleTag) {
        return;
      }
      hasAddedStyleTag = true;

      const style = document.createElement("style");
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

        .sptmninja_message {
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
          overflow: hidden;
          border: 3px solid;
          box-shadow: 0px 1px 4px #00000075, 0px 1px 24px #00000075, 0px 0px 40px 5px #0000001c inset;
          text-shadow: 0px 2px #00000033;
        }

        .sptmninja_close_button {
          position: absolute;
          top: 0px;
          right: 0px;
          color: #ffffff73;
          cursor: pointer;
          padding: 10px;
          line-height: 11px;
          z-index: 11;
        }

        .sptmninja_inset_shadow {
          position: absolute;
          top: 0px;
          left: 0px;
          right: 0px;
          bottom: 0px;
          box-shadow: 0px 0px 3px black inset;
          z-index: 100;
          border-radius: 14px;
          pointer-events: none;
        }

        .sptmninja_title {
          padding: 12px 0px 10px;
          box-shadow: 0px -20px 50px -24px #00ffff36 inset, 0px 1px 1px #00000038;
          margin: -10px -10px 8px;
          position: relative;
          z-index: 10;
        }

        .sptmninja_emoji {
          position: absolute;
          font-size: 6em;
          transform: translateY(-50%);
          top: 50%;
          left: -15px;
          z-index: -1;
          text-shadow: 0px 0px 10px #0000006e;
        }

        .sptmninja_message_progress {
          background: black;
          position: absolute;
          left: 0px;
          height: 100%;
          width: 0%;
          top: 0px;
          opacity: 0.2;
          z-index: -1;
          transition: width 0.2s ease-out;
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

        .sptmninja_mono {
          background: #0000004f;
          padding: 0px 8px 3px;
          border-radius: 5px;
          box-shadow: 0px 1px 0px #00000052 inset;
          color: white;
          font-family: monaco;
          line-height: 1.9;
        }
      `;
      document.head.appendChild(style);
    }

    function addMessage() {
      if (hasAddedMessage) {
        return;
      }
      hasAddedMessage = true;

      messageEl = document.createElement("div");
      messageEl.className = "sptmninja_message";

      const insetShadow = document.createElement("div");
      insetShadow.className = "sptmninja_inset_shadow";

      messageBodyEl = document.createElement("div");

      messageProgressEl = document.createElement("div");
      messageProgressEl.className = "sptmninja_message_progress";

      messageEmojiEl = document.createElement("div");
      messageEmojiEl.className = "sptmninja_emoji";

      const messageCloseEl = document.createElement("div");
      messageCloseEl.innerText = "×";
      messageCloseEl.className = "sptmninja_close_button";
      messageCloseEl.addEventListener("click", () => {
        hideMessage(true);
      });

      messageEl.appendChild(messageBodyEl);
      messageEl.appendChild(messageCloseEl);
      messageEl.appendChild(insetShadow);
      messageEl.appendChild(messageProgressEl);
      messageEl.appendChild(messageEmojiEl);

      messageEl.addEventListener("mouseenter", () => {
        isMouseOver = true;
      });

      messageEl.addEventListener("mouseleave", () => {
        isMouseOver = false;
      });

      setMessageColor(colors.default);
      document.body.appendChild(messageEl);
    }

    function showMessage() {
      isMouseOver = false;

      if (!messageEl.parentNode) {
        document.body.appendChild(messageEl);
      }
    }

    function mouseOut() {
      return new Promise(resolve => {
        if (!isMouseOver) {
          resolve();
        } else {
          const interval = setInterval(() => {
            if (!isMouseOver) {
              clearInterval(interval);
              resolve();
            }
          }, 100);
        }
      });
    }

    function hideMessage(force) {
      function hideMessageImpl() {
        if (messageEl && messageEl.parentNode) {
          messageEl.parentNode.removeChild(messageEl);
          setMessageProgress(0);
        }
      }

      if (force) {
        hideMessageImpl();
      } else {
        mouseOut().then(hideMessageImpl);
      }
    }

    function setMessage(
      message,
      { timeout, color, step, numSteps, title, emoji } = {}
    ) {
      addStyleTag();
      addMessage();
      showMessage();

      let fullMessageHTML = message;
      if (title) {
        fullMessageHTML = `<div class="sptmninja_title">${title}</div>${fullMessageHTML}`;
      }
      if (emoji) {
        fullMessageHTML = `<div class="sptmninja_emoji">${emoji}</div>${fullMessageHTML}`;
      }

      if (messageBodyEl.innerHTML !== fullMessageHTML) {
        messageBodyEl.innerHTML = fullMessageHTML;
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

      if (!isNaN(step / numSteps)) {
        setMessageProgress(step / numSteps);
      } else {
        setMessageProgress(0);
      }
    }

    function setMessageProgress(progress) {
      messageProgressEl.style.width = progress * 100 + "%";
    }

    function setMessageColor(color) {
      messageEl.style.backgroundColor = color.bg;
      if (messageEl.querySelector(".sptmninja_title")) {
        messageEl.querySelector(".sptmninja_title").style.backgroundColor =
          color.bg;
      }
      messageEl.style.borderColor = color.border;
    }

    return {
      set: setMessage,
      show: showMessage,
      hide: hideMessage
    };
  })();

  const scrolling = (() => {
    let isScrolling;
    let scrollingInterval;
    let hasScrolledDown;
    let isHighlighted;
    let isInViewport;

    function highlightConversation(conversation) {
      Object.assign(conversation.style, {
        boxShadow: "#4caf50 0px 0px 0px 12px, black 0px 0px 40px 22px"
        // outline: 'solid 2000px #00000070',
      });

      isHighlighted = true;
    }

    function unhighlightConversation(conversation) {
      if (!isHighlighted) {
        return;
      }

      conversation.style.transition = "all 1s ease-out";
      conversation.style.boxShadow = null;
      conversation.style.outline = null;

      isHighlighted = false;
    }

    function scrollDown() {
      if (!hasScrolledDown) {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth"
        });
        hasScrolledDown = true;
      }
    }

    function startScrolling() {
      if (isScrolling) {
        return;
      }

      let observer = new IntersectionObserver(
        data => {
          isInViewport = data[0].isIntersecting;
        },
        {
          rootMargin: "0px",
          threshold: 0
        }
      );

      message.set("Scroll To Conversation");
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
          message.set(
            'Scroll To Conversation... found!<br/>Hit <span class="sptmninja_mono">esc</span> to stop',
            {
              color: colors.success,
              emoji: "😃"
            }
          );
          highlightConversation(conversation);
        } else {
          scrollDown();

          if (utils.isTopMostFrame()) {
            message.set(
              "Scroll To Conversation... not found. Try scrolling up and down a bit",
              { color: colors.error, emoji: "😕" }
            );
          } else {
            window.parent.focus();
            message.set(
              `${FOCUS_WARNING}<br/>Scroll To Conversation... not found. Try scrolling up and down a bit.`,

              { color: colors.error, timeout: 3000, emoji: "😕" }
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
        hasScrolledDown = false;
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
      toggle: toggleScrolling
    };
  })();

  const hostPanel = (() => {
    let windowRef;
    let lastUrl;

    return {
      open: async ({ spotId }) => {
        function showSuccessMessage() {
          message.set("Openning Host Panel...", {
            color: colors.success,
            timeout: 2000
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

        const email = await GM_getValue("email");
        const password = await GM_getValue("password");

        if (!email || !password) {
          message.set(
            "First you need to enter you're credentials for the Host Panel.<br/>" +
              "Do so by running the following command in the console:<br/>" +
              '<span class="sptmninja_code">__spotim_ninja_tools_set_creds__("john@example.com", "Password!123")</span><br/>' +
              "Note that the credentials will be saved as clear text somewhere in TamperMonkey's storage!",
            colors.default
          );

          return;
        }

        var networkName = "spotim";

        message.set("Fetching network id...", {
          color: colors.default,
          step: 0,
          numSteps: 5,
          title: "Open Admin Panel"
        });

        var networkIdJson = await fetch(
          `https://www.spot.im/api/me/network-id-by-name/${networkName}`
        ).then(r => r.json());

        message.set("Fetching network token...", {
          color: colors.default,
          step: 1,
          numSteps: 5,
          title: "Open Admin Panel"
        });

        var networkTokenJson = await fetch(
          `https://www.spot.im/api/me/network-token/${networkIdJson.network_id}`,
          { method: "post" }
        ).then(r => r.json());

        message.set("Logging in...", {
          color: colors.default,
          step: 2,
          numSteps: 5,
          title: "Open Admin Panel"
        });

        var emailConnectJson = await fetch(
          `https://www.spot.im/api/email-connect/login`,
          {
            method: "post",
            headers: new Headers({
              "x-spotim-networkid": networkIdJson.network_id,
              "x-spotim-token": networkTokenJson.token,
              "Content-Type": "application/json"
            }),
            body: JSON.stringify({ email, password })
          }
        ).then(r => r.json());

        if (emailConnectJson.type === "EmailLogin_TooManyLoginAttemptsError") {
          message.set("Too many login attempts", {
            color: colors.error,
            timeout: 2000,
            emoji: "😕"
          });
          return;
        }

        message.set("Fetching login json...", {
          color: colors.default,
          step: 3,
          numSteps: 5,
          title: "Open Admin Panel"
        });

        var loginRegisteredJson = await fetch(
          `https://www.spot.im/api/me/login-registered`,
          {
            method: "post",
            headers: new Headers({
              "x-spotim-networkid": networkIdJson.network_id,
              "x-spotim-token": networkTokenJson.token
            })
          }
        ).then(r => r.json());

        message.set("Calling me-make-admin...", {
          color: colors.default,
          step: 4,
          numSteps: 5,
          title: "Open Admin Panel"
        });

        var makeMeAdminJson = await fetch(
          `https://www.spot.im/api/moderation/internal/make-me-admin?spot_id=${spotId}`,
          {
            headers: new Headers({
              "x-spotim-networkid": networkIdJson.network_id,
              "x-spotim-token": networkTokenJson.token
            })
          }
        ).then(r => r.json());

        message.set("Fetching token JSON...", {
          color: colors.default,
          step: 5,
          numSteps: 5,
          title: "Open Admin Panel"
        });

        var tokenByTicketJson = await fetch(
          `https://www.spot.im/api/me/token-by-ticket/${makeMeAdminJson.token_ticket}`,
          { method: "post" }
        ).then(r => r.json());

        const isStaging = !utils.isProduction(utils.getLauncherEl());
        var hostPrefix = isStaging ? "staging-" : "";

        const url = [
          `https://admin.${hostPrefix}spot.im/spot/${spotId}/moderation?`,
          `name=${makeMeAdminJson.spot_name}&`,
          `token=${tokenByTicketJson.token}&`,
          `network_name=${tokenByTicketJson.network_name}`
        ].join("");

        message.set("Opening Host Panel", {
          color: colors.success,
          timeout: 2000,
          emoji: "😃"
        });

        windowRef = window.open(url);

        if (windowRef === null) {
          message.set(
            'Popup blocker probably blocked us<br/>But type <span class="sptmninja_mono">ssa</span> again and it will work immediately!',
            { timeout: 8000, color: colors.error, emoji: "😞" }
          );
          lastUrl = url;
        }
      }
    };
  })();

  const help = (() => {
    return {
      show: () => {
        message.set(
          [
            '<span class="sptmninja_mono">sss</span> - Scroll to Conversation',
            '<span class="sptmninja_mono">ssi</span> - Show Info',
            '<span class="sptmninja_mono">ssc</span> - Copy Spot ID to Clipboard (only on HTTPs)',
            '<span class="sptmninja_mono">ssa</span> - Open Host Panel',
            '<span class="sptmninja_mono">ssv</span> - Open config data',
            '<span class="sptmninja_mono">ssh</span> - Show Help',
            '<span class="sptmninja_mono">escape</span> - Hides Floating Messages'
          ].join("<br/>"),
          { color: colors.default, title: "Available Shortcuts" }
        );
      }
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
          message.set(`Copied ${spotId} to clipboard!`, {
            timeout: 2000,
            color: colors.default,
            emoji: "😃"
          });
        } else {
          message.set(`Can't copy ${spotId} to clipboard on non-https sites`, {
            timeout: 4000,
            color: colors.error,
            emoji: "😞"
          });
        }
      }
    },

    // show info
    ssi: () => {
      scrolling.stop();

      const launcher = utils.getLauncherEl(true);
      if (launcher) {
        const spotId = utils.getSpotId(launcher);
        const version = utils.getSpotimVersion() === 2 ? "V.2.0" : "V.1.0";
        const env = utils.isProduction(launcher) ? "Production" : "Dev";

        message.set(`spot-id: ${spotId} <br/> ${version} <br/> ${env}`, {
          timeout: 8000,
          color: colors.default,
          emoji: "💁‍♂️"
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
          window.open("https://admin.staging-spot.im/internal/super-admin");
        } else {
          hostPanel.open({ spotId: utils.getSpotId(launcher) });
        }
      }
    },

    // dumb open admin panel
    ssda: () => {
      scrolling.stop();

      const launcher = utils.getLauncherEl(true);
      if (launcher) {
        if (!utils.isProduction(launcher)) {
          window.open("https://admin.staging-spot.im/internal/super-admin");
        } else {
          window.open("https://admin.spot.im/internal/super-admin");
        }
      }
    },

    ssv: () => {
      scrolling.stop();

      const launcher = utils.getLauncherEl(true);
      if (utils.isProduction(launcher)) {
        window.open(
          `https://api-2-0.spot.im/v1.0.0/config/launcher/${utils.getSpotId(
            launcher
          )}/${utils.getPostId(launcher)}/vendor,init,conversation`
        );
      }
    },

    // show help
    ssh: () => {
      scrolling.stop();
      help.show();
    }
  };

  // handle keystrokes
  (() => {
    let lastKeyStrokesResetTimeout;

    let lastKeyStrokes = [];

    function isFocusedOnInput() {
      const el = document.activeElement;
      return el.getAttribute("contenteditable") || el.tagName === "INPUT";
    }

    function executeCommand(keyCombo) {
      let commandImpl = commands[keyCombo];
      if (
        !commandImpl &&
        keyCombo.length === 3 &&
        keyCombo.slice(0, 2) === "sp"
      ) {
        commandImpl = commands[`ss${keyCombo.slice(2)}`];
      }

      if (commandImpl) {
        commandImpl();
        return true;
      } else {
        return false;
      }
    }

    function handleKeyDown(e) {
      if (e.key && e.key.toLowerCase() === "escape") {
        scrolling.stop();
        message.hide(true);
      }
    }

    function handleKeyPress(e) {
      if (isFocusedOnInput()) {
        return;
      }

      lastKeyStrokes.push(e.key.toLowerCase());
      clearTimeout(lastKeyStrokesResetTimeout);

      const keyCombo = lastKeyStrokes.join("");

      if (executeCommand(keyCombo)) {
        lastKeyStrokes = [];
      } else {
        lastKeyStrokesResetTimeout = setTimeout(() => {
          lastKeyStrokes = [];
        }, 500);
      }
    }

    // for some reason pressing on escape doesn't register as a keypress
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keypress", handleKeyPress);
  })();
})();
