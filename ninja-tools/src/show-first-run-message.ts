import * as prefs from './prefs';
import * as message from './message';
import getColors from './colors';
import * as whatsNew from './whats-new';
import rawCSS from './show-first-run-message.css';
import { isWindows } from './utils';

function renderWelcomeMessage() {
  // injecting the font in the document because it turns out that injecting
  // it in the shadow-dom doesn't work
  //
  const fontFaceStyle = unsafeWindow.document.createElement('style');
  fontFaceStyle.innerHTML = /*css*/ `
    @font-face {
      font-family: "BigBlue TerminalPlus";
      src: url('${GM_getResourceURL('bigBlueFont')}') format('truetype');
    }
  `;

  unsafeWindow.document.head.appendChild(fontFaceStyle);

  const paletteKeyBinding = isWindows ? 'Alt+S' : 'Ctrl+S';

  return /*html*/ `
    <style>
      ${rawCSS}
    </style>
    <div class="welcomeMessageWrapper">
      <div class="welcomeMessageWrapperMessage">
        <p>👋 Welcome,</p>
        <p>You can now hit <span class="shortcut">${paletteKeyBinding}</span> to open the command palette.</p>
      </div>
      <img src="${GM_getResourceURL('welcomeImage')}">
      <p class="cta">Press ${paletteKeyBinding}</p>
    </div>
  `;
}

export default async (force?: boolean) => {
  const isNotFirstRun = prefs.get().isNotFirstRun;
  if (!isNotFirstRun || force) {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === 'KeyS' && e.metaKey) {
        message.set('You are hitting Cmd+S, hit Ctrl+S instead.', {
          color: getColors().error,
          emoji: '🤦🏻‍♂️',
        });
        e.preventDefault();
      }
    }

    function handleMessageUnload() {
      document.removeEventListener('keydown', handleKeyDown);
    }

    document.addEventListener('keydown', handleKeyDown);

    message.set(renderWelcomeMessage(), {
      color: getColors().default,
      title: 'Welcome to Spot.IM Ninja Tools!',
      onMessageUnload: handleMessageUnload,
    });

    await prefs.set({ isNotFirstRun: true });

    // prevents what's new message from showing up right after welcome message
    // (what's new should only show up after the userscript has been upgraded,
    // not right after it was installed)
    //
    await whatsNew.setCurrentVersionAsLastShown();
  }
};
