import commandsImpl from './commands-impl';
import * as scrollToConversation from './scroll-to-conversation';
import * as message from './message';
import * as commandPalette from './command-palette';
import { isWindows } from './utils';

export function init() {
  let lastKeyStrokesResetTimeout;

  let lastKeyStrokes: string[] = [];

  function isFocusedOnInput() {
    const el = document.activeElement;
    return el?.getAttribute('contenteditable') || el?.tagName === 'INPUT';
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
    if (e.key && e.key.toLowerCase() === 'escape') {
      scrollToConversation.stop();
      message.hide(true);
    }

    if (isFocusedOnInput()) {
      return;
    }

    if (
      (e.key.toLowerCase() === 's' || e.key === 'ד') &&
      ((isWindows && e.altKey) || e.ctrlKey)
    ) {
      commandPalette.show();
      return;
    }

    lastKeyStrokes.push(e.key.toLowerCase());
    clearTimeout(lastKeyStrokesResetTimeout);

    const keyCombo = lastKeyStrokes.join('');

    if (executeCommand(keyCombo)) {
      lastKeyStrokes = [];
    } else {
      lastKeyStrokesResetTimeout = setTimeout(() => {
        lastKeyStrokes = [];
      }, 500);
    }
  }

  document.addEventListener('keydown', handleKeyDown);
}
