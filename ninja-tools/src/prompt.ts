import * as message from './message';
import getColors from './colors';
import rawCSS from './prompt.css';

export function show({
  prompt,
  initialValue,
}: {
  prompt: string;
  initialValue?: string;
}) {
  return new Promise<string>(resolve => {
    const { messageBodyEl } = message.set(
      /*html*/ `<style>
        ${rawCSS}
      </style>
      <div class="input prompt">
        <div class="promptMessage">${prompt}</div>
        <input class="promptInput" value="${initialValue ?? ''}">
      </div>
      <div class="results"></div>`,
      {
        color: getColors().default,
        hideCloseButton: true,
      }
    );

    function handleKeyDown(e: KeyboardEvent) {
      if (e.keyCode === 13) {
        messageBodyEl
          ?.querySelector('input')
          ?.removeEventListener('keydown', handleKeyDown);
        message.hide();
        resolve(messageBodyEl?.querySelector('input')?.value);
      }
    }

    messageBodyEl
      ?.querySelector('input')
      ?.addEventListener('keydown', handleKeyDown);
    messageBodyEl?.querySelector('input')?.focus();
    if (initialValue) {
      messageBodyEl
        ?.querySelector('input')
        ?.setSelectionRange(0, initialValue.length);
    }
  });
}
