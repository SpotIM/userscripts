import * as prefs from './prefs';
import * as message from './message';
import getColors from './colors';
import * as whatsNew from './whats-new';
import styles from './show-first-run-message';

function renderWelcomeMessage() {
  // injecting the font in the document because it turns out that injecting
  // it in the shadow-dom doesn't work
  //
  const fontFaceStyle = unsafeWindow.document.createElement('style');
  fontFaceStyle.innerHTML = /*css*/ `
    @font-face {
      font-family: "BigBlue TerminalPlus";
      src: url('${GM_getResourceURL('bigBlueFont')}') format('truetype')
    }
  `;

  unsafeWindow.document.head.appendChild(fontFaceStyle);

  return /*html*/ `
    <style>
      ${styles}
    </style>
    <div class="wrapper">
      <div class="message">
        <p>👋 Welcome,</p>
        <p>You can now hit <span class="shortcut">Ctrl+S</span> to open the command palette.</p>
      </div>
      <img src="${GM_getResourceURL('welcomeImage')}">
      <p class="cta">Press Ctrl+S</p>
    </div>
  `;
}

export default async (force?: boolean) => {
  const isNotFirstRun = await prefs.get().isNotFirstRun;
  if (!isNotFirstRun || force) {
    message.set(renderWelcomeMessage(), {
      color: getColors().default,
      title: 'Welcome to Spot.IM Ninja Tools!',
    });

    await prefs.set({ isNotFirstRun: true });
    await whatsNew.setCurrentVersionAsLastShown();
  }
};
