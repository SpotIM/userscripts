// ==UserScript==
// @name         SpotIM Ninja Tools
// @namespace    https://spot.im/
// @version      0.1
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

  const DEFAULT_COLOR = '#467FDB';
  const ERROR_COLOR = '#f44336';

  function toggleScrolling() {
    if (isScrolling) {
      stopScrolling();
    } else {
      startScrolling();
    }
  }

  function copySpotId() {
    const launcher = document.querySelector(
      'script[data-spotim-module="spotim-launcher"]',
    );
    if (launcher) {
      const spotId = launcher.src.split('/').pop();
      navigator.clipboard.writeText(spotId);
      setMessage(`Copied ${spotId} to clipboard`, 2000);
      setMessageColor(DEFAULT_COLOR);
    } else {
      setMessage(`Could not find launcher script`, 2000);
      setMessageColor(ERROR_COLOR);
    }
  }

  function executeCommand() {
    const lastCommand = lastKeyStrokes.join('');
    if (lastCommand === 'sss') {
      toggleScrolling();
      return true;
    } else if (lastCommand === 'ssc') {
      copySpotId();
      return true;
    }
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
    messageEl.innerText = message;
    if (timeout) {
      setTimeout(() => {
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
