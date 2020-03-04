// import * as shadowDOM from './shadow-dom';
import rawCSS from './events-viewer.css';
import * as prefs from './prefs';
import { parse } from 'shell-quote';
import matcher from 'matcher';

const EVENTS_VIEWER_WIDTH = 340;
const EVENTS_VIEWER_MARGIN_END = 20;
const EVENTS_VIEWER_FULL_WIDTH = EVENTS_VIEWER_WIDTH + EVENTS_VIEWER_MARGIN_END;

const existingConsoleLog = (unsafeWindow as Window).console.log;
let isShowing: boolean;
let isClickThrough: boolean;
let shadowWrapper: HTMLDivElement;
let shadowDOM: ShadowRoot;
let eventsViewerEl: HTMLDivElement;
let eventsListEl: HTMLDivElement;
let addedEventsList: boolean;
let uniqueProps: { [key: string]: string[] };
let isPaused: boolean;
let queryInputEl: HTMLInputElement;
let query = '';
let events: any[] = [];

function addEventsList() {
  if (addedEventsList) {
    return;
  }

  addedEventsList = true;

  eventsViewerEl = document.createElement('div');
  eventsViewerEl.className = 'events-viewer';
  eventsViewerEl.addEventListener('mouseover', handleViewerMouseOver);
  document.addEventListener('mousemove', handleDocumentMouseMove);

  eventsViewerEl.innerHTML = /* html */ `
    <style>${rawCSS}</style>
    <div class="resizer"></div>
    <div class="query-input-wrapper">
      <input type="text" class="query-input" placeholder='Type a query, e.g., "-type:loaded\"'>
    </div>
    <div class="events-list"></div>
  `;

  queryInputEl = eventsViewerEl.querySelector(
    '.query-input'
  ) as HTMLInputElement;
  eventsListEl = eventsViewerEl.querySelector('.events-list') as HTMLDivElement;

  const position = (prefs.get().eventsViewerPosition || {})[
    unsafeWindow.location.host
  ];

  if (position) {
    eventsViewerEl.style.left = position.x * 100 + '%';
    eventsViewerEl.style.top = position.y * 100 + '%';

    eventsListEl.style.height = `calc(100vh - ${position.y * 100}%)`;
  }

  queryInputEl.addEventListener('keyup', handleQueryChange);

  (eventsViewerEl.querySelector('.resizer') as HTMLDivElement).addEventListener(
    'mousedown',
    handleResizeMouseDown
  );

  shadowWrapper = document.createElement('div');
  document.body.parentElement!.appendChild(shadowWrapper);

  shadowDOM = shadowWrapper.attachShadow({ mode: 'open' });
  shadowDOM.appendChild(eventsViewerEl);

  if (
    eventsViewerEl.getBoundingClientRect().left >
    window.innerWidth - EVENTS_VIEWER_FULL_WIDTH
  ) {
    eventsViewerEl.style.left =
      window.innerWidth - EVENTS_VIEWER_FULL_WIDTH + 'px';
  }
}

function handleResizeMouseDown(downEvent: MouseEvent) {
  const target = downEvent.currentTarget as Element;
  const initY = downEvent.clientY - target.getBoundingClientRect().top;
  const initX = downEvent.clientX - target.getBoundingClientRect().left;
  const previousUserSelect = unsafeWindow.document.body.style.userSelect;
  unsafeWindow.document.body.style.userSelect = 'none';

  function handleMouseMove(moveEvent: MouseEvent) {
    const top = Math.max(moveEvent.clientY - initY, 20);
    eventsViewerEl.style.top = top + 'px';
    eventsViewerEl.style.left =
      Math.min(
        Math.max(moveEvent.clientX - initX, 20),
        window.innerWidth - 340 - 20
      ) + 'px';

    eventsListEl.style.height = `calc(100vh - ${top}px)`;
  }

  function handleMouseUp(moveEvent: MouseEvent) {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    const bounds = eventsViewerEl.getBoundingClientRect();

    prefs.set({
      eventsViewerPosition: {
        ...prefs.get().eventsViewerPosition,
        [unsafeWindow.location.host]: {
          x: bounds.left / unsafeWindow.innerWidth,
          y: bounds.top / unsafeWindow.innerHeight,
        },
      },
    });

    unsafeWindow.document.body.style.userSelect = previousUserSelect;
  }

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

function handleQueryChange(e) {
  query = queryInputEl.value;
  renderEvents();
}

function handleViewerMouseOver(e: MouseEvent) {
  if (e.shiftKey) {
    isClickThrough = true;
    renderEvents();
  }
}

function handleDocumentMouseMove(e: MouseEvent) {
  if (isClickThrough && !e.shiftKey) {
    isClickThrough = false;
    renderEvents();
  }
}

function removeEventsList() {
  if (!addedEventsList) {
    return;
  }

  addedEventsList = false;

  shadowWrapper.parentElement!.removeChild(shadowWrapper);
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

function isNegative(queryPart: string) {
  return queryPart.startsWith('-');
}

// function getNegativePart(queryPart: string) {
//   return queryPart.substr(1);
// }

function hasNameAndValue(queryPart: string) {
  return queryPart.indexOf(':') !== -1;
}

function getName(queryPart: string) {
  const name = queryPart.substr(0, queryPart.indexOf(':'));
  if (isNegative(queryPart)) {
    return name.substr(1);
  } else {
    return name;
  }
}

function getValue(queryPart: string) {
  return queryPart.substr(queryPart.indexOf(':') + 1);
}

function renderEvents(scrollToBottom = true) {
  addEventsList();

  if (isPaused) {
    eventsViewerEl.classList.add('paused');
  } else {
    eventsViewerEl.classList.remove('paused');
  }

  if (isClickThrough) {
    eventsViewerEl.classList.add('click-through');
  } else {
    eventsViewerEl.classList.remove('click-through');
  }

  const shouldScroll =
    eventsListEl.scrollHeight ===
    eventsListEl.scrollTop + eventsListEl.offsetHeight;

  events = events.map((event, index) => ({ ...event, __sptmninja_id: index }));

  const filteredEvents = events.filter(event => {
    const splitQueryParts: any[] = parse(query);

    if (query === '') {
      return true;
    }

    for (let i = 0; i < splitQueryParts.length; i++) {
      const queryPart =
        typeof splitQueryParts[i] === 'object'
          ? splitQueryParts[i].pattern
          : splitQueryParts[i];

      if (isNegative(queryPart)) {
        if (hasNameAndValue(queryPart)) {
          if (matcher.isMatch(event[getName(queryPart)], getValue(queryPart))) {
            return false;
          }
        } else {
          if (matcher.isMatch(event.type, queryPart.substr(1))) {
            return false;
          }
        }
      } else {
        if (hasNameAndValue(queryPart)) {
          if (
            !matcher.isMatch(event[getName(queryPart)], getValue(queryPart))
          ) {
            return false;
          }
        } else {
          if (!matcher.isMatch(event.type, queryPart)) {
            return false;
          }
        }
      }
    }

    return true;
  });

  eventsListEl.innerHTML =
    `<div class="instructions">
      <div>Ctrl+K to clear</div>
      <div>Ctrl+P to pause</div>
    </div>` +
    filteredEvents
      .map(
        (event, index) => `
      <div class="event ${
        event.__sptmninja_expanded ? 'expanded' : ''
      }" data-id="${event.__sptmninja_id}">
        <div class="container">
          <div class="toolbar">
            <button class="button expand-button"></button>
            <button class="button remove-button"></button>
          </div>
          ${(event.__sptmninja_expanded
            ? [
                'type',
                ...Object.keys(event)
                  .filter(
                    key =>
                      key !== '__sptmninja_expanded' &&
                      key !== '__sptmninja_id' &&
                      key !== 'type'
                  )
                  .sort(),
              ]
            : [
                'type',
                ...uniqueProps[event.type]
                  .sort()
                  .filter(
                    key =>
                      key !== '__sptmninja_expanded' &&
                      key !== '__sptmninja_id' &&
                      key !== 'type'
                  ),
              ]
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

  // [
  //   ...eventsListEl.querySelectorAll('.event:not(.expanded) .container'),
  // ].forEach(eventEl => {
  //   eventEl.addEventListener('click', e => {
  //     events[
  //       Number(e.currentTarget.closest('.event').dataset.id)
  //     ].__sptmninja_expanded = true;
  //     renderEvents(false);
  //   });
  // });

  [...eventsListEl.querySelectorAll('.event .remove-button')].forEach(
    eventEl => {
      eventEl.addEventListener('click', e => {
        e.stopPropagation();
        events.splice(Number(e.currentTarget.closest('.event').dataset.id), 1);
        renderEvents(false);
      });
    }
  );

  [...eventsListEl.querySelectorAll('.event .expand-button')].forEach(
    eventEl => {
      eventEl.addEventListener('click', e => {
        e.stopPropagation();
        const eventIndex = Number(e.currentTarget.closest('.event').dataset.id);

        events[eventIndex].__sptmninja_expanded = !events[eventIndex]
          .__sptmninja_expanded;
        renderEvents(false);
      });
    }
  );

  if (shouldScroll && scrollToBottom) {
    eventsListEl.scrollTop = eventsListEl.scrollHeight;
  }
}

function consoleLogProxy(...args) {
  if (args[0].startsWith('%cSpot.IM Analytics')) {
    existingConsoleLog.call(unsafeWindow.console, 'analytics');
    addEvent(...args);
    createUniquePropsMap();
    renderEvents();
  }
  existingConsoleLog.call(unsafeWindow.console, ...args);
}

export function toggle() {
  isShowing = !isShowing;

  if (isShowing) {
    unsafeWindow.localStorage.setItem('SPOTIM_DEBUG_API', '*');

    unsafeWindow.console.log = consoleLogProxy;

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
  if (!isShowing) {
    return;
  }

  if (e.code === 'KeyK' && e.ctrlKey) {
    events = [];
    createUniquePropsMap();
    renderEvents();
  }

  if (e.code === 'KeyP' && e.ctrlKey) {
    isPaused = !isPaused;

    if (isPaused) {
      unsafeWindow.console.log = existingConsoleLog;
    } else {
      unsafeWindow.console.log = consoleLogProxy;
    }

    renderEvents();
  }
});
