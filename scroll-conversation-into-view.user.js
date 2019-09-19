// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Scroll Conversation Into View
// @author       You
// @match        http*://*/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  let clickCounter = 0;
  let clickCounterResetTimeout;
  let isScrolling;
  let scrollingInterval;
  let scrollingMessage;
  let hasScrolledDown;

  function handleKeyDown(e) {
      if (e.key.toLowerCase() === 's') {
          clearTimeout(clickCounterResetTimeout);
          clickCounter++;
          if (clickCounter === 3) {
              clickCounter = 0;
              if (isScrolling) {
                  stopScrolling();
              } else {
                  startScrolling();
              }
          } else {
              clickCounterResetTimeout = setTimeout(() => {
                  clickCounter = 0;
              }, 500);
          }
      }
  }

  document.addEventListener('keydown', handleKeyDown);

  function addScrollingMessage() {
    scrollingMessage = document.createElement('div');
    Object.assign(scrollingMessage.style, {
      position: 'fixed',
      top: 0,
      left:0,
      right: 0,
      textAlign: 'center',
      background: 'red',
      color: 'white',
      fontWeight: 'bold',
      padding: '10px',
      zIndex: 100000000000
    });
    scrollingMessage.innerText = 'Scrolling To Conversation';
    document.body.appendChild(scrollingMessage)
  }

  function removeScrollingMessage() {
    scrollingMessage.parentNode.removeChild(scrollingMessage)
  }

  function scrollDown() {
    if (!hasScrolledDown) {
      window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
      hasScrolledDown = true;
    }
  }

  function startScrolling() {
      addScrollingMessage();
      isScrolling = true;
      scrollingInterval = setInterval(() => {
        let conversation;
        conversation = document.querySelector('[data-conversation-id]') || document.querySelector('[data-spotim-app="conversation"]');
        if (conversation) {
          conversation.scrollIntoView();
          scrollingMessage.innerText = 'Scrolling To Conversation (found!)';
        } else {
          scrollDown();
          scrollingMessage.innerText = 'Scrolling To Conversation (not found)';
        }
      }, 100);
    }

    function stopScrolling() {
      removeScrollingMessage();
      clearInterval(scrollingInterval);
      isScrolling = false;
  }
})();
