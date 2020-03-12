import colors, { IColor } from './colors';
import * as scrollToConversation from './scroll-to-conversation';
import getColors, { getUseDarkTheme } from './colors';
import * as shadowDOM from './shadow-dom';
import styles from './message.css';
import isEqual from 'lodash.isequal';

let messageEl: HTMLElement;
let messageBodyEl: HTMLElement;
let messageProgressEl: HTMLElement;
let hasAddedMessage: boolean;
let hasAddedStyleTag: boolean;
let hideMessageTimeout: NodeJS.Timeout;
let isMouseOver: boolean;
let shadowWrapper: HTMLElement;
let isShowingMessage: boolean;
let lastMessageProps: any;
let progressAnimationTimeout: NodeJS.Timeout;

function addStyleTag() {
  if (hasAddedStyleTag) {
    return;
  }
  hasAddedStyleTag = true;

  const style = document.createElement('style');

  style.innerHTML = styles;
  shadowDOM.get().appendChild(style);
}

function addMessage() {
  if (hasAddedMessage) {
    if (getUseDarkTheme()) {
      messageEl.classList.add('dark');
    } else {
      messageEl.classList.remove('dark');
    }

    return;
  }
  hasAddedMessage = true;

  messageEl = document.createElement('div');
  messageEl.className = 'message reset-css';

  if (getUseDarkTheme()) {
    messageEl.classList.add('dark');
  }

  const insetShadow = document.createElement('div');
  insetShadow.className = 'inset_shadow';

  messageBodyEl = document.createElement('div');

  messageProgressEl = document.createElement('div');
  messageProgressEl.className = 'message_progress';

  const messageCloseEl = document.createElement('div');
  messageCloseEl.innerText = '×';
  messageCloseEl.className = 'close_button';
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
      isShowingMessage = false;
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
    progressBarDuration,
    styleAsMessageBox,
  }: {
    timeout?: number;
    color?: IColor;
    step?: number;
    numSteps?: number;
    title?: string;
    emoji?: string;
    belowNotificationPopover?: string;
    overflow?: 'scroll';
    progressBarDuration?: number;
    styleAsMessageBox?: boolean;
  } = {}
) {
  const currentMessageProps = arguments;
  if (isShowingMessage && isEqual(lastMessageProps, currentMessageProps)) {
    return;
  }

  lastMessageProps = currentMessageProps;

  addMessage();
  addStyleTag();
  showMessage();

  let fullMessageHTML = message;

  if (overflow === 'scroll') {
    fullMessageHTML = `<div class="scrollable_area">${fullMessageHTML}</div>`;
  }

  let prefix = '';
  if (title) {
    prefix = `<div class="title">${title}</div>`;
  }
  if (emoji) {
    prefix += `<div class="emoji">${emoji}</div>`;
  }
  if (styleAsMessageBox) {
    fullMessageHTML = `<span class="message-box-content">${fullMessageHTML}</span>`;
  }

  fullMessageHTML = prefix + fullMessageHTML;

  messageBodyEl.innerHTML = fullMessageHTML;

  if (belowNotificationPopover) {
    messageEl.classList.add('below_notifications');
  } else {
    messageEl.classList.remove('below_notifications');
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

  clearTimeout(progressAnimationTimeout);

  if (progressBarDuration) {
    messageProgressEl.style.width = '0%';
    messageProgressEl.style.transition = `width ${progressBarDuration /
      1000}s linear`;
    progressAnimationTimeout = setTimeout(() => {
      messageProgressEl.style.width = '100%';
      progressAnimationTimeout = setTimeout(() => {
        messageProgressEl.style.transition = '';
      }, 100);
    }, 100);
  }

  if (isNaN((step ?? 0) / (numSteps ?? 0)) && !progressBarDuration) {
    messageProgressEl.style.transition = '';
    messageProgressEl.style.width = '';
  }

  isShowingMessage = true;

  return messageBodyEl;
}

function setMessageProgress(progress) {
  messageProgressEl.style.width = progress * 100 + '%';
}

function setMessageColor(color) {
  messageEl.style.backgroundColor = color.bg;
  if (messageEl.querySelector('.title')) {
    messageEl.querySelector<HTMLElement>('.title')!.style.backgroundColor =
      color.bg;
  }
  messageEl.style.borderColor = color.border;
}

export const set = setMessage;
export const show = showMessage;
export const hide = hideMessage;
