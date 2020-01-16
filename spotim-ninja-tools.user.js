// ==UserScript==
// @name         SpotIM Ninja Tools
// @namespace    https://spot.im/
// @version      3.2
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
      set: newPrefs => {
        return GM_setValue("prefs", { ...prefs.get(), ...newPrefs });
      }
    };
  })();

  // first run message
  (async () => {
    const isNotFirstRun = await prefs.get().isNotFirstRun;
    if (!isNotFirstRun) {
      message.set("(you'll only see this message once)", {
        timeout: 3000,
        color: colors.default,
        title: "Welcome to Spot.IM Ninja Tools!"
      });

      setTimeout(() => {
        commandPalette.show();
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
    },

    getConfigUrl: () => {
      const launcher = utils.getLauncherEl(true);
      return `https://api-2-0.spot.im/v1.0.0/config/launcher/${utils.getSpotId(
        launcher
      )}/${utils.getPostId(launcher)}/vendor,init,conversation`;
    },

    padTime: str => {
      if (str.length === 1) {
        return `0${str}`;
      } else {
        return str;
      }
    },

    renderTable: data => {
      return (
        "<div class='sptmninja_table'><tbody>" +
        data
          .map(
            line =>
              "<div class='sptmninja_tr'><div class='sptmninja_td'>" +
              line.join("</div><div class='sptmninja_td'>") +
              "</div></div>"
          )
          .join("") +
        "</tbody></div>"
      );
    },

    createElement: (html, className, tag = "div") => {
      return `<${tag} class="sptmninja_${className}">${html}</${tag}>`;
    },

    getRandomOptimisticEmoji: () => {
      const emojis = ["🎈", "🚀", "🌈", "🦄"];
      return emojis[Math.floor(Math.random() * emojis.length)];
    },

    onFoundSpotimObject: callback => {
      function updateOnFoundSpotimObject() {
        if (unsafeWindow.__SPOTIM__) {
          clearInterval(interval);
          callback();
        }
      }
      const interval = setInterval(updateOnFoundSpotimObject, 500);

      updateOnFoundSpotimObject();
    }
  };

  const pageLoadTime = (() => {
    const now = new Date();
    return now.getHours() + ":" + utils.padTime(now.getMinutes().toString());
  })();

  // show versions on load (__sst)
  (async () => {
    if ((await prefs.get()).showVersionsOnLoad) {
      function handleSpotimObjectFound() {
        if (
          unsafeWindow.__SPOTIM__.SERVICES.configProvider._data.assets_config
        ) {
          commandsImpl.ssv();
        } else {
          setTimeout(() => {
            utils.onFoundSpotimObject(handleSpotimObjectFound);
          }, 500);
        }
      }

      utils.onFoundSpotimObject(handleSpotimObjectFound);
    }
  })();

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

        .sptmninja_below_notifications {
          margin: 10em auto;
        }

        .sptmninja_message .sptmninja_table {
          display: table;
          border: none;
          width: 100%;
          text-align: left;
          border-collapse: collapse;
          margin: 0;
          color: inherit;
          font-weight: inherit;
        }

        .sptmninja_message .sptmninja_table .sptmninja_tr {
          display: table-row;
          background: initial !important;
        }

        .sptmninja_message .sptmninja_table .sptmninja_td {
          display: table-cell;
          padding: initial;
          border: none;
          border-bottom: 1px solid #00000021;
        }

        .sptmninja_message .sptmninja_table .sptmninja_tr:last-child .sptmninja_td {
          border-bottom: none;
        }

        .sptmninja_message .sptmninja_table .sptmninja_td:first-child {
          text-align: right;
          padding-right: 12px;
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

        .sptmninja_close_button:active {
          text-shadow: 0px -2px #00000033;
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

        .sptmninja_titleIcon {
          margin-inline-end: 12px;
        }

        .sptmninja_muted_text {
          text-shadow: none;
          color: #ffffff73;
          font-weight: normal;
        }

        .sptmninja_weight_normal {
          font-weight: normal;
        }

        .sptmninja_muted_result {
          font-weight: normal;
          opacity: 0.8;
        }

        .sptmninja_weight_bold {
          font-weight: bold;
        }

        .sptmninja_margin_top {
          margin-top: 12px;
        }

        .sptmninja_emoji {
          position: absolute;
          font-size: 6em;
          transform: translateY(-50%);
          top: 50%;
          left: -15px;
          z-index: -1;
          text-shadow: 0px 0px 10px #0000006e;
          height: 150px;
        }

        .sptmninja_title + .sptmninja_emoji {
          margin-top: 20px;
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
          background: #0000003d;
          padding: 1px 7px;
          border-radius: 5px;
          box-shadow: 0px 1px 0px #00000063;
          color: white;
          font-family: monaco;
          font-size: 15px;
          margin: 4px 0px;
          display: inline-block;
        }

        .sptmninja_hidden {
          opacity: 0.5;
        }

        .sptmninja_detailed_description {
          font-weight: normal;
          font-size: 0.8em;
          margin: 2px 0px 5px;
          color: #ffffffbf;
        }

        .sptmninja_mono a {
          color: inherit;
          text-decoration: none;
          outline: none;
        }

        .sptmninja_mono a:focus, .sptmninja_mono a:hover {
          text-decoration: underline;
        }

        .sptmninja_input {
          width: 100%;
          padding: 10px;
          box-sizing: border-box;
          font-size: 20px;
          background: #ffffff33;
          border: none;
          border-radius: 6px;
          outline: none;
          box-shadow: 0px 3px 9px #0000002e inset;
          border-top: 1px solid #0000004f;
          border-bottom: 1px solid #ffffff42;
          color: white;
          font-weight: bold;
        }

        .sptmninja_input + .sptmninja_results:not(:empty) {
          margin-top: 12px;
        }

        .sptmninja_results .sptmninja_tr {
          cursor: pointer;
        }

        .sptmninja_input + .sptmninja_results .sptmninja_table .sptmninja_tr .sptmninja_td:first-child {
          padding-right: 20px;
        }

        .sptmninja_input + .sptmninja_results .sptmninja_table .sptmninja_tr .sptmninja_td:nth-child(2) {
          width: 100%;
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

      const messageCloseEl = document.createElement("div");
      messageCloseEl.innerText = "×";
      messageCloseEl.className = "sptmninja_close_button";
      messageCloseEl.addEventListener("click", () => {
        hideMessage(true);
        scrolling.stop();
      });

      messageEl.appendChild(messageBodyEl);
      messageEl.appendChild(messageCloseEl);
      messageEl.appendChild(insetShadow);
      messageEl.appendChild(messageProgressEl);

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
      {
        timeout,
        color,
        step,
        numSteps,
        title,
        emoji,
        belowNotificationPopover
      } = {}
    ) {
      addStyleTag();
      addMessage();
      showMessage();

      let fullMessageHTML = message;
      let prefix = "";
      if (title) {
        prefix = `<div class="sptmninja_title">${title}</div>`;
      }
      if (emoji) {
        prefix += `<div class="sptmninja_emoji">${emoji}</div>`;
      }

      fullMessageHTML = prefix + fullMessageHTML;

      if (messageBodyEl.innerHTML !== fullMessageHTML) {
        messageBodyEl.innerHTML = fullMessageHTML;
      }

      if (belowNotificationPopover) {
        messageEl.classList.add("sptmninja_below_notifications");
      } else {
        messageEl.classList.remove("sptmninja_below_notifications");
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

      return messageBodyEl;
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
        boxShadow: `rgb(76, 175, 80) 0px 0px 0px 4px,
        rgb(26, 216, 34) 0px 0px 0px 5px,
        #00000036 0px 0px 40px 12px,
        #00000085 0px 0px 4px 5px,
        black 0px 0px 40px -4px`,
        borderRadius: "8px"
      });

      conversation.dataset.sptmninjaHighlighted = true;

      isHighlighted = true;
    }

    function unhighlightConversation() {
      if (!isHighlighted) {
        return;
      }

      [...document.querySelectorAll("[data-sptmninja-highlighted]")].forEach(
        el => {
          // el.style.transition = "all 1s ease-out";
          el.style.boxShadow = null;
          el.style.borderRadius = null;
          delete el.dataset.sptmninjaHighlighted;
        }
      );

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

      message.set("Looking for conversation element", {
        title: "Scroll To Conversation"
      });
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
            'Hit <span class="sptmninja_mono">escape</span> to stop',
            {
              title: "Scroll To Conversation",
              color: colors.success,
              emoji: "😃"
            }
          );
          highlightConversation(conversation);
        } else {
          scrollDown();

          if (utils.isTopMostFrame()) {
            message.set("Element not found. Try scrolling up and down a bit.", {
              color: colors.error,
              emoji: "😕",
              title: "Scroll To Conversation"
            });
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
      unhighlightConversation();
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
            "Popup blocker probably blocked us<br/>But run the command again and it will work immediately!",
            { timeout: 8000, color: colors.error, emoji: "😞" }
          );
          lastUrl = url;
        }
      }
    };
  })();

  const assetChangeListener = (() => {
    let assetChangeInterval;

    function isConfigEqualOneWay(config1, config2) {
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
        isConfigEqualOneWay(config1, config2) &&
        isConfigEqualOneWay(config2, config1)
      );
    }

    async function notifyOnChange() {
      if (location.protocol !== "https:") {
        message.set(`Can't display notifications on non-https sites`, {
          timeout: 4000,
          color: colors.error,
          emoji: "😞"
        });

        return;
      }

      message.set(`Please allow notifications on this site`, {
        color: colors.default,
        emoji: "🚦",
        belowNotificationPopover: true
      });

      const result = await Notification.requestPermission();

      if (result !== "granted") {
        message.set(`Notification permission denied`, {
          timeout: 3000,
          color: colors.error,
          emoji: "😕"
        });

        return;
      }

      let lastConfig;

      function showNotification() {
        stopListeningToChanges();
        var notification = new Notification("An asset has been updated");
      }

      async function checkForUpdates() {
        const launcher = utils.getLauncherEl();
        let response;
        if (launcher) {
          response = await fetch(
            `https://api-2-0.spot.im/v1.0.0/config/launcher/${utils.getSpotId(
              utils.getLauncherEl(true)
            )}/redesign-post/vendor,init,conversation`
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
        emoji: "😃"
      });
    }

    function stopListeningToChanges(showMessage) {
      clearInterval(assetChangeInterval);
      assetChangeInterval = false;

      if (showMessage) {
        message.set(`Stopped listening to asset updates`, {
          timeout: 4000,
          color: colors.default,
          emoji: "👍"
        });
      }
    }

    function toggleNotifyOnChange() {
      if (assetChangeInterval) {
        stopListeningToChanges(true);
      } else {
        notifyOnChange();
      }
    }

    return {
      toggleNotifyOnChange
    };
  })();

  const help = (() => {
    return {
      show: () => {
        message.set(
          utils.renderTable(
            [
              { keyCombo: "ctrl+s", description: "Open Command Palette" },
              ...commands,
              { keyCombo: "escape", description: "Hide Floating Message" }
            ].map(command => [
              `<span
                title="${
                  command.unlisted
                    ? "This command is unlisted, no key combo assigned to it"
                    : ""
                }"
                class="
                  sptmninja_mono
                  ${command.unlisted ? "sptmninja_hidden" : ""}
                ">
                ${command.unlisted ? "×" : command.keyCombo}
              </span>`,
              command.description +
                (command.detailedDescription
                  ? `<div class="sptmninja_detailed_description">${command.detailedDescription}</div>`
                  : "")
            ])
          ),
          { color: colors.default, title: "Available Shortcuts" }
        );
      }
    };
  })();

  const commandsImpl = {
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

        message.set(
          utils.renderTable([
            ["Spot Id", utils.createElement(spotId, "weight_normal")],
            ["Version", utils.createElement(version, "weight_normal")],
            ["Environment", utils.createElement(env, "weight_normal")]
          ]),
          {
            // timeout: 8000,
            color: colors.default,
            title: "Spot Info",
            emoji: "💁‍♂️"
          }
        );
      }
    },

    // show versions
    ssv: async () => {
      scrolling.stop();

      if (unsafeWindow.__SPOTIM__) {
        const assetsConfig =
          unsafeWindow.__SPOTIM__.SERVICES.configProvider._data.assets_config;

        const relevantAssets = assetsConfig.filter(
          item => item.url.indexOf("tags") > -1
        );

        if (relevantAssets.length) {
          const table =
            utils.renderTable(
              assetsConfig
                .filter(item => item.url.indexOf("tags") > -1)
                .sort((item1, item2) => (item1.name < item2.name ? -1 : 1))
                .map(item => [
                  `<span class="sptmninja_mono"><a target="_blank" href="${
                    item.url
                  }">${item.url.match(/tags\/(.*?)\//)[1]}</a></span>`,
                  item.name
                ])
            ) +
            `<div class="sptmninja_muted_text sptmninja_margin_top">Page loaded at ${pageLoadTime}</div>`;

          message.set(table, {
            color: colors.default,
            emoji: utils.getRandomOptimisticEmoji(),
            title: "Assets"
          });
        } else {
          message.set(`No assets found. Are you running locally?`, {
            timeout: 2000,
            color: colors.error,
            emoji: "😕"
          });
        }
      } else {
        message.set(`Could not find __SPOTIM__ object`, {
          timeout: 2000,
          color: colors.error,
          emoji: "😕"
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

    sso: () => {
      scrolling.stop();

      const launcher = utils.getLauncherEl(true);
      if (utils.isProduction(launcher)) {
        window.open(utils.getConfigUrl());
      }
    },

    ssn: async () => {
      scrolling.stop();

      assetChangeListener.toggleNotifyOnChange();
    },

    __sst: async () => {
      const showVersionsOnLoad = await prefs.get().showVersionsOnLoad;
      await prefs.set({ showVersionsOnLoad: !showVersionsOnLoad });

      if (!showVersionsOnLoad) {
        message.set("I will now show you asset versions on page load!", {
          timeout: 4000,
          emoji: "🤠",
          color: colors.success
        });
      } else {
        message.set("I will stop showing you asset versions on page load", {
          timeout: 4000,
          emoji: "❌",
          color: colors.default
        });
      }
    },

    __ssr: async () => {
      try {
        const spotAB = JSON.parse(unsafeWindow.localStorage.getItem("SPOT_AB"));
        spotAB[35].variant = "B";
        unsafeWindow.localStorage.setItem("SPOT_AB", JSON.stringify(spotAB));
        message.set("Redesign enabled! Hit refresh to see it.", {
          emoji: "😃",
          color: colors.success
        });
      } catch (err) {
        message.set("Are you sure this spot has redesign enabled?", {
          title: "Couldn't enable redesign A/B test",
          emoji: "😞",
          color: colors.error
        });
      }
    },

    // show help
    ssh: () => {
      scrolling.stop();
      help.show();
    }
  };

  const commands = [
    { keyCombo: "sss", description: "Scroll to Conversation" },
    { keyCombo: "ssi", description: "Show Info" },
    {
      keyCombo: "ssc",
      description: "Copy Spot ID to Clipboard"
    },
    { keyCombo: "ssa", description: "Open Host Panel", keywords: "admin" },
    { keyCombo: "ssv", description: "Show Asset Versions", keywords: "assets" },
    { keyCombo: "sso", description: "Open Config Data" },
    {
      keyCombo: "ssn",
      description: "Notify On Asset Update",
      keywords: "changes"
    },
    {
      keyCombo: "__sst",
      description: "Toggle Show Asset Versions on Load",
      detailedDescription:
        "Once activated, will display the asset versions once the page loads",
      unlisted: true
    },
    {
      keyCombo: "__ssr",
      description: "Enable Redesign In A/B Test",
      unlisted: true
    },
    { keyCombo: "ssh", description: "Show Help" }
  ];

  const commandPalette = (() => {
    // let selectedItemIndex = prefs.get().selectedItemIndex || 0;
    let selectedItemIndex = 0;

    function handleTableClick(e) {
      const line = e.target.closest(".sptmninja_tr");
      if (line && line.children.length) {
        const command = line.children[0].innerText;
        const commandImpl = commandsImpl[command];

        if (commandImpl) {
          commandImpl();
        }
      }
    }

    function show() {
      scrolling.stop({ hideMessage: false });
      let relevantCommands;

      const missingLauncherWarning = `<span class="sptmninja_titleIcon" title="Can't find Launcher script tag">⚠️</span>`;

      const messageBodyEl = message.set(
        '<input class="sptmninja_input"><div class="sptmninja_results"></div>',
        {
          title: `${
            !utils.getLauncherEl(false) ? missingLauncherWarning : ""
          }Start Typing A Command`,
          color: colors.default
        }
      );

      messageBodyEl
        .querySelector(".sptmninja_results")
        .addEventListener("click", handleTableClick);

      const input = document.querySelector(".sptmninja_input");
      updateRelevantResults();
      renderResults();
      input.focus();

      function runSelectedCommand() {
        const selectedCommand = relevantCommands[selectedItemIndex];
        if (selectedCommand) {
          message.hide(true);
          commandsImpl[selectedCommand.keyCombo]();
          return true;
        }

        return false;
      }

      function updateRelevantResults() {
        // const value = input.value.replace(/ /g, ".");
        const value = input.value.split("").join(".*?");
        const regExp = new RegExp(value, "i");

        relevantCommands = commands
          .filter(
            command =>
              command.description.match(regExp) ||
              command.keyCombo.match(regExp) ||
              (command.keywords && command.keywords.match(regExp))
          )
          .filter(command => value !== "" || !command.unlisted);
      }

      function renderResults() {
        messageBodyEl.querySelector(
          ".sptmninja_results"
        ).innerHTML = relevantCommands.length
          ? utils.renderTable(
              relevantCommands.map((command, index) => [
                `<span class="sptmninja_mono ${
                  command.unlisted ? "sptmninja_hidden" : ""
                }">${command.unlisted ? "×" : command.keyCombo}</span>`,
                `<span class="${
                  selectedItemIndex === index
                    ? "sptmninja_weight_bold"
                    : "sptmninja_muted_result"
                }">${command.description}</span>`,
                selectedItemIndex === index
                  ? utils.createElement("⏎", "muted_text")
                  : ""
              ])
            )
          : "";
      }

      input.addEventListener("keydown", e => {
        if (e.keyCode === 38) {
          selectedItemIndex--;
          if (selectedItemIndex < 0) {
            selectedItemIndex = relevantCommands.length - 1;
          }
          // prefs.set({ selectedItemIndex });
          e.preventDefault();
        } else if (e.keyCode === 40) {
          selectedItemIndex++;
          if (selectedItemIndex >= relevantCommands.length) {
            selectedItemIndex = 0;
          }
          // prefs.set({ selectedItemIndex });
          e.preventDefault();
        } else if (e.keyCode === 13) {
          if (runSelectedCommand()) {
            return;
          }
        }

        renderResults();
      });

      input.addEventListener("keyup", e => {
        updateRelevantResults();
        if (selectedItemIndex >= relevantCommands.length) {
          selectedItemIndex = Math.max(relevantCommands.length - 1, 0);
        }
        renderResults();
      });
    }

    return {
      show
    };
  })();

  // handle keystrokes
  (() => {
    let lastKeyStrokesResetTimeout;

    let lastKeyStrokes = [];

    function isFocusedOnInput() {
      const el = document.activeElement;
      return el.getAttribute("contenteditable") || el.tagName === "INPUT";
    }

    function executeCommand(keyCombo) {
      const commandImpl = commandsImpl[keyCombo];

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

      if (e.key === "s" && e.ctrlKey) {
        commandPalette.show();
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
