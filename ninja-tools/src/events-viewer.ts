// import * as shadowDOM from './shadow-dom';
import rawCSS from './events-viewer.css';
import * as prefs from './prefs';

const existingConsoleLog = unsafeWindow.console.log;
let isShowing;
let shadowWrapper;
let shadowDOM;
let eventsListEl;
let addedEventsList;
let uniqueProps;
let events: any[] = [];

function addEventsList() {
  if (addedEventsList) {
    return;
  }

  addedEventsList = true;

  eventsListEl = document.createElement('div');
  const style = document.createElement('style');
  style.innerHTML = rawCSS;
  eventsListEl.appendChild(style);
  eventsListEl.className = 'events-list';

  shadowWrapper = document.createElement('div');
  document.body.parentElement!.appendChild(shadowWrapper);

  shadowDOM = shadowWrapper.attachShadow({ mode: 'open' });
  shadowDOM.appendChild(eventsListEl);
}

function removeEventsList() {
  if (!addedEventsList) {
    return;
  }

  addedEventsList = false;

  shadowWrapper.parentElement.removeChild(shadowWrapper);
}

function addEvent(...params) {
  events.push(params[3]);
}

function createUniquePropsMap() {
  uniqueProps = {};

  events.forEach(eventA => {
    uniqueProps[eventA.type] = [];

    events.forEach(eventB => {
      if (eventA !== eventB && eventA.type === eventB.type) {
        Object.keys(eventA).map(key => {
          if (
            key !== 'time_delta' &&
            key !== 'uid' &&
            key !== 'duration' &&
            eventA[key] !== eventB[key] &&
            uniqueProps[eventA.type].indexOf(key) === -1
          ) {
            uniqueProps[eventA.type].push(key);
          }
        });
      }
    });
  });
}

function renderEvents(scrollToBottom = true) {
  addEventsList();

  const shouldScroll =
    eventsListEl.scrollHeight ===
    eventsListEl.scrollTop + eventsListEl.offsetHeight;

  eventsListEl.innerHTML =
    `<style>${rawCSS}</style>` +
    `<div class="instructions">
      <div>Ctrl+K to clear</div>
    </div>` +
    events
      .map(
        (event, index) => `
      <div class="event ${
        event.__sptmninja_expanded ? 'expanded' : ''
      }" data-index="${index}">
        <div class="container">
          ${(event.__sptmninja_expanded
            ? [
                'type',
                ...Object.keys(event)
                  .filter(
                    key => key !== '__sptmninja_expanded' && key !== 'type'
                  )
                  .sort(),
              ]
            : ['type', ...uniqueProps[event.type].sort()]
          )
            .map(
              propName => `
              <span class="prop-name">${propName.replace(/_/g, ' ')}</span>
              <span class="prop-value">${event[propName]}</span>
            `
            )
            .join('')}
        </div>
      </div>
    `
      )
      .join('');

  [...eventsListEl.querySelectorAll('.event:not(.expanded)')].forEach(
    eventEl => {
      eventEl.addEventListener('click', e => {
        events[
          Number(e.currentTarget.dataset.index)
        ].__sptmninja_expanded = true;
        renderEvents(false);
      });
    }
  );

  if (shouldScroll && scrollToBottom) {
    eventsListEl.scrollTop = eventsListEl.scrollHeight;
  }
}

export function toggle() {
  isShowing = !isShowing;

  if (isShowing) {
    unsafeWindow.console.log = (...args) => {
      if (args[0] === '%cSpot.IM Analytics') {
        existingConsoleLog.call(this, 'analytics');
        addEvent(...args);
        createUniquePropsMap();
        renderEvents();
      }
      existingConsoleLog.call(this, ...args);
    };

    renderEvents();
  } else {
    unsafeWindow.console.log = existingConsoleLog;
    removeEventsList();
  }

  prefs.set({ showEventsViewer: isShowing });

  return isShowing;
}

if (prefs.get().showEventsViewer) {
  toggle();
}

unsafeWindow.addEventListener('keypress', e => {
  if (e.code === 'KeyK' && e.ctrlKey) {
    events = [];
    createUniquePropsMap();
    renderEvents();
  }
  if (e.code === 'KeyP' && e.ctrlKey) {
    unsafeWindow.console.log = existingConsoleLog;
  }
});
