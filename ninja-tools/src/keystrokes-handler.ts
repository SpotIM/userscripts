export function init() {
  let lastKeyStrokesResetTimeout;

  let lastKeyStrokes = [];

  function isFocusedOnInput() {
    const el = document.activeElement;
    return el.getAttribute('contenteditable') || el.tagName === 'INPUT';
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
      scrolling.stop();
      message.hide(true);
    }
  }

  function handleKeyPress(e) {
    if (isFocusedOnInput()) {
      return;
    }

    if ((e.key.toLowerCase() === 's' || e.key === 'ד') && e.ctrlKey) {
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

  // for some reason pressing on escape doesn't register as a keypress
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keypress', handleKeyPress);
}
