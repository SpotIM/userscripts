import { IColor } from './colors';
import * as scrollToConversation from './scroll-to-conversation';
import getColors from './colors';
import * as shadowDOM from './shadow-dom';
import styles from './message.css';

let messageEl;
let messageBodyEl;
let messageProgressEl;
let hasAddedMessage;
let hasAddedStyleTag;
let hideMessageTimeout;
let isMouseOver;
let shadowWrapper;

function addStyleTag() {
  if (hasAddedStyleTag) {
    return;
  }
  hasAddedStyleTag = true;

  const style = document.createElement('style');

  // For syntax highlighting, install this extension: https://bit.ly/36X6EOY
  //
  style.innerHTML = styles;
  shadowDOM.get().appendChild(style);
}

function addMessage() {
  if (hasAddedMessage) {
    return;
  }
  hasAddedMessage = true;

  messageEl = document.createElement('div');
  messageEl.className = 'sptmninja_message';

  const insetShadow = document.createElement('div');
  insetShadow.className = 'sptmninja_inset_shadow';

  messageBodyEl = document.createElement('div');

  messageProgressEl = document.createElement('div');
  messageProgressEl.className = 'sptmninja_message_progress';

  const messageCloseEl = document.createElement('div');
  messageCloseEl.innerText = '×';
  messageCloseEl.className = 'sptmninja_close_button';
  messageCloseEl.addEventListener('click', () => {
    hideMessage(true);
    scrollToConversation.stop();
  });

  messageEl.appendChild(messageBodyEl);
  messageEl.appendChild(messageCloseEl);
  messageEl.appendChild(insetShadow);
  messageEl.appendChild(messageProgressEl);

  messageEl.addEventListener('mouseenter', () => {
    isMouseOver = true;
  });

  messageEl.addEventListener('mouseleave', () => {
    isMouseOver = false;
  });

  setMessageColor(getColors().default);

  shadowWrapper = document.createElement('div');
  document.body.appendChild(shadowWrapper);

  shadowDOM.set(shadowWrapper.attachShadow({ mode: 'open' }));
  shadowDOM.get().appendChild(messageEl);
}

function showMessage() {
  isMouseOver = false;

  if (!shadowWrapper.parentNode) {
    document.body.appendChild(shadowWrapper);
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

function hideMessage(force?: boolean) {
  function hideMessageImpl() {
    if (shadowWrapper && shadowWrapper.parentNode) {
      shadowWrapper.parentNode.removeChild(shadowWrapper);
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
    belowNotificationPopover,
    overflow,
  }: {
    timeout?: number;
    color?: IColor;
    step?: number;
    numSteps?: number;
    title?: string;
    emoji?: string;
    belowNotificationPopover?: string;
    overflow?: 'scroll';
  } = {}
) {
  addMessage();
  addStyleTag();
  showMessage();

  let fullMessageHTML = message;

  if (overflow === 'scroll') {
    fullMessageHTML = `<div class="scrollable_area">${fullMessageHTML}</div>`;
  }

  let prefix = '';
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
    messageEl.classList.add('sptmninja_below_notifications');
  } else {
    messageEl.classList.remove('sptmninja_below_notifications');
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

  if (!isNaN((step ?? 0) / (numSteps ?? 0))) {
    setMessageProgress(step! / numSteps!);
  } else {
    setMessageProgress(0);
  }

  return messageBodyEl;
}

function setMessageProgress(progress) {
  messageProgressEl.style.width = progress * 100 + '%';
}

function setMessageColor(color) {
  messageEl.style.backgroundColor = color.bg;
  if (messageEl.querySelector('.sptmninja_title')) {
    messageEl.querySelector('.sptmninja_title').style.backgroundColor =
      color.bg;
  }
  messageEl.style.borderColor = color.border;
}

export const set = setMessage;
export const show = showMessage;
export const hide = hideMessage;
