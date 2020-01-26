import { IColor } from './colors';
import * as scrollToConversation from './scroll-to-conversation';
import colors from './colors';
import * as shadowDOM from './shadow-dom';

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

    .scrollable_area {
      max-height: calc(100vh - 300px);
      overflow-y: auto;
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

    .sptmninja_pallete_row_main_col {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .palette_row_description {
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }

    .palette_row_recently_used {
      font-weight: normal;
      font-size: 0.7em;
      opacity: 0.7;
      margin: 0px 7px;
      flex: 0 0 auto;
      transform: translateX(26px);
    }

    [data-selected] .palette_row_recently_used {
      transform: translateX(0px);
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

    .sptmninja_results {
      max-height: 270px;
      overflow-y: scroll;
      padding-right: 10px;
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

    ::-webkit-scrollbar {
      width: 6px;
    }

    ::-webkit-scrollbar-track {
      border-radius: 10px;
      background: #0000001a;
    }

    ::-webkit-scrollbar-thumb {
      border-radius: 10px;
      background: #00000036;
    }

    .gutterActions {
      display: flex;
      margin: -10px;
      padding: 10px 0px;
      border-top: 1px solid #0000000f;
      background: linear-gradient(#ffffff2b, #0000001a);
      margin-top: 0px;
      z-index: 1;
      position: relative;
    }

    .gutterActions .gutterActionsButton {
      font-size: inherit;
      font-family: inherit;
      color: inherit;
      background: none;
      border: none;
      flex: auto;
      margin: -10px 0px;
      border-right: 1px solid #00000038;
      cursor: pointer;
      padding: 1em 0px;
    }
  `;

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

  setMessageColor(colors.default);

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
