// ==UserScript==
// @name         SpotIM Ninja Tools
// @namespace    https://spot.im/
// @version      0.2
// @description  A bunch of tools to make our lives easier
// @author       dutzi
// @match        http*://*/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  let lastKeyStrokes = [];
  let lastKeyStrokesResetTimeout;
  let isScrolling;
  let scrollingInterval;
  let messageEl;
  let hasScrolledDown;
  let hasAddedMessage;
  let hasAddedStyleTag;
  let hideMessageTimeout;

  const DEFAULT_COLOR = '#467FDB';
  const ERROR_COLOR = '#f44336';

  function toggleScrolling() {
    if (isScrolling) {
      stopScrolling();
    } else {
      startScrolling();
    }
  }

  function getLauncherEl(displayErrorIfNotFound) {
    const launcher = document.querySelector(
      'script[data-spotim-module="spotim-launcher"]',
    );

    if (!launcher && displayErrorIfNotFound) {
      setMessage(`Could not find launcher script 😕`, 2000);
      setMessageColor(ERROR_COLOR);
    }

    return launcher;
  }

  function isProduction(launcher) {
    return launcher.src.indexOf('//launcher.spot.im') > -1;
  }

  function copySpotId() {
    const launcher = getLauncherEl(true);
    if (launcher) {
      const spotId = launcher.src.split('/').pop();
      navigator.clipboard.writeText(spotId);
      setMessage(`Copied ${spotId} to clipboard! 😃`, 2000);
      setMessageColor(DEFAULT_COLOR);
    }
  }

  function showInfo() {
    const launcher = getLauncherEl(true);
    if (launcher) {
      const spotId = launcher.src.split('/').pop();
      const version = !!window.__SPOTIM__ ? 'V.2.0' : 'V.1.0';
      const env = isProduction(launcher) ? 'Production' : 'Dev';

      setMessage(`spot-id: ${spotId} <br/> ${version} <br/> ${env}`, 2000);
      setMessageColor(DEFAULT_COLOR);
    }
  }

  function openAdminPanel() {
    const launcher = getLauncherEl(true);
    if (launcher) {
      window.open(
        isProduction(launcher)
          ? 'https://admin.spot.im/internal/super-admin'
          : 'https://admin.staging-spot.im/internal/super-admin',
      );
    }
  }

  function showHelp() {
    setMessage(
      `
    Available Shortcuts:<br/>
    sss - Scroll to conversation<br/>
    ssi - Show Info<br/>
    ssa - Open Host Panel<br/>
    ssh - Show Help
    `,
      5000,
    );
    setMessageColor(DEFAULT_COLOR);
  }

  function executeCommand() {
    const lastCommand = lastKeyStrokes.join('');

    if (lastCommand === 'sss') {
      toggleScrolling();
    } else if (lastCommand === 'ssc') {
      copySpotId();
    } else if (lastCommand === 'ssi') {
      showInfo();
    } else if (lastCommand === 'ssa') {
      openAdminPanel();
    } else if (lastCommand === 'ssh') {
      showHelp();
    } else {
      return false;
    }

    return true;
  }

  function handleKeyDown(e) {
    if (e.key.toLowerCase() === 'escape' && isScrolling) {
      stopScrolling();
    } else {
      lastKeyStrokes.push(e.key.toLowerCase());
      clearTimeout(lastKeyStrokesResetTimeout);
      if (executeCommand()) {
        lastKeyStrokes = [];
      } else {
        lastKeyStrokesResetTimeout = setTimeout(() => {
          lastKeyStrokes = [];
        }, 500);
      }
    }
  }

  document.addEventListener('keydown', handleKeyDown);

  function showMessage() {
    if (!messageEl.parentNode) {
      document.body.appendChild(messageEl);
    }
  }

  function hideMessage() {
    messageEl.parentNode.removeChild(messageEl);
  }

  function setMessage(message, timeout) {
    addStyleTag();
    addMessage();
    showMessage();
    messageEl.innerHTML = message;

    clearTimeout(hideMessageTimeout);
    if (timeout) {
      hideMessageTimeout = setTimeout(() => {
        hideMessage();
      }, timeout);
    }
  }

  function setMessageColor(color) {
    messageEl.style.backgroundColor = color;
  }

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
    });
    setMessageColor(DEFAULT_COLOR);
    document.body.appendChild(messageEl);
  }

  function scrollDown() {
    if (!hasScrolledDown) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      hasScrolledDown = true;
    }
  }

  function startScrolling() {
    setMessage('Scroll To Conversation');
    isScrolling = true;
    scrollingInterval = setInterval(() => {
      let conversation;
      conversation =
        document.querySelector('[data-conversation-id]') ||
        document.querySelector('[data-spotim-app="conversation"]');
      if (conversation) {
        conversation.scrollIntoView();
        setMessage('Scroll To Conversation (found! 😃)');
        setMessageColor('#4caf50');
      } else {
        scrollDown();
        setMessage(
          'Scroll To Conversation (not found 😕 try scrolling up and down a bit)',
        );
        setMessageColor(ERROR_COLOR);
      }
    }, 100);
  }

  function stopScrolling() {
    hideMessage();
    clearInterval(scrollingInterval);
    isScrolling = false;
  }
})();
