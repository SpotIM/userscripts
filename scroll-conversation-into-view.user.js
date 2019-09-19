// ==UserScript==
// @name         Scroll Conversation Into View
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Scroll Conversation Into View
// @author       dutzi
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
  let hasAddedStyleTag;

  function handleKeyDown(e) {
      if (e.key.toLowerCase() === 'escape' && isScrolling) {
        stopScrolling();
      } else if (e.key.toLowerCase() === 's') {
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

  function setScrollMessage(message) {
    scrollingMessage.innerText = 'Scrolling To Conversation' + (message ? ` (${message})` : '');
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
    document.head.appendChild(style)
  }

  function addScrollingMessage() {
    addStyleTag()
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
      zIndex: 100000000000,
      animation: 'spotim-scroll-to-comments-appear 0.2s ease-out'
    });
    setScrollMessage()
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
          setScrollMessage('found! 😃')
        } else {
          scrollDown();
          setScrollMessage('not found 😕')
        }
      }, 100);
    }

    function stopScrolling() {
      removeScrollingMessage();
      clearInterval(scrollingInterval);
      isScrolling = false;
  }
})();
