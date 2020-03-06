// import * as shadowDOM from './shadow-dom';
import rawCSS from './events-viewer.css';
import { parse } from 'shell-quote';
import matcher from 'matcher';
import * as prefs from './prefs';
import { onFoundSpotimObject } from './utils';
import bookmarkSvg from './icons/bookmark.svg';

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
let historyQueryIndex: number = (prefs.get().eventsQueryHistory || []).length;

function saveLastQuery() {
  prefs.set({ eventsQuery: queryInputEl.value });
}

function loadLastQuery() {
  query = queryInputEl.value = prefs.get().eventsQuery || '';
}

function addQueryToHistory() {
  const currentQuery = queryInputEl.value.trim();
  const eventsQueryHistory = prefs.get().eventsQueryHistory || [];

  if (
    currentQuery &&
    eventsQueryHistory[eventsQueryHistory.length - 1] !== currentQuery
  ) {
    eventsQueryHistory.push(currentQuery);
    prefs.set({ eventsQueryHistory });

    historyQueryIndex = prefs.get().eventsQueryHistory.length;
  }
}

function addEventsList() {
  if (addedEventsList) {
    return;
  }

  addedEventsList = true;

  eventsViewerEl = document.createElement('div');
  eventsViewerEl.className = 'events-viewer';
  // eventsViewerEl.addEventListener('mouseover', handleViewerMouseOver);
  // document.addEventListener('mousemove', handleDocumentMouseMove);

  eventsViewerEl.innerHTML = /* html */ `
    <style>${rawCSS}</style>
    <div class="resizer"></div>
    <div class="query-input-wrapper">
      <input type="text" class="query-input" placeholder='Type a query, e.g., "-type:loaded"'>
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

  queryInputEl.addEventListener('keydown', handleQueryKeyDown);
  queryInputEl.addEventListener('keyup', handleQueryKeyUp);
  queryInputEl.addEventListener('change', handleQueryChange);

  (eventsViewerEl.querySelector('.resizer') as HTMLDivElement).addEventListener(
    'mousedown',
    handleResizeMouseDown
  );

  shadowWrapper = document.createElement('div');
  document.body.parentElement!.appendChild(shadowWrapper);

  shadowDOM = shadowWrapper.attachShadow({ mode: 'open' });

  const eventsViewerWrapper = document.createElement('div');
  eventsViewerWrapper.className = 'events-viewer-wrapper';
  eventsViewerWrapper.appendChild(eventsViewerEl);

  shadowDOM.appendChild(eventsViewerWrapper);

  // if (
  //   eventsViewerEl.getBoundingClientRect().left >
  //   window.innerWidth - EVENTS_VIEWER_FULL_WIDTH
  // ) {
  //   eventsViewerEl.style.left =
  //     window.innerWidth - EVENTS_VIEWER_FULL_WIDTH + 'px';
  // }

  loadLastQuery();

  unsafeWindow.addEventListener('keydown', handleGlobalKeyDown);
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

    const x =
      bounds.left / (unsafeWindow.innerWidth - EVENTS_VIEWER_FULL_WIDTH);
    const y = bounds.top / unsafeWindow.innerHeight;

    prefs.set({
      eventsViewerPosition: {
        ...prefs.get().eventsViewerPosition,
        [unsafeWindow.location.host]: {
          x,
          y,
        },
      },
    });

    eventsViewerEl.style.left = x * 100 + '%';
    eventsViewerEl.style.top = y * 100 + '%';
    eventsListEl.style.height = `calc(100vh - ${y * 100}%)`;

    unsafeWindow.document.body.style.userSelect = previousUserSelect;
  }

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

function handleQueryKeyDown(e: KeyboardEvent) {
  const eventsQueryHistory = prefs.get().eventsQueryHistory || [];
  if (e.key === 'ArrowUp') {
    e.preventDefault();

    historyQueryIndex = Math.max(0, historyQueryIndex - 1);

    if (eventsQueryHistory[historyQueryIndex] === queryInputEl.value) {
      historyQueryIndex = Math.max(0, historyQueryIndex - 1);
    }

    queryInputEl.value = eventsQueryHistory[historyQueryIndex] || '';
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();

    historyQueryIndex = historyQueryIndex + 1;

    if (historyQueryIndex >= eventsQueryHistory.length) {
      historyQueryIndex = eventsQueryHistory.length;
      queryInputEl.value = '';
    } else {
      queryInputEl.value = eventsQueryHistory[historyQueryIndex];
    }
  } else if (e.key === 'Enter') {
    addQueryToHistory();
  }
}

function handleQueryKeyUp(e: KeyboardEvent) {
  query = queryInputEl.value;
  saveLastQuery();
  renderEvents();
}

function handleQueryChange(e: Event) {
  addQueryToHistory();
}

// function handleViewerMouseOver(e: MouseEvent) {
//   if (e.shiftKey) {
//     isClickThrough = true;
//     renderEvents();
//   }
// }

// function handleDocumentMouseMove(e: MouseEvent) {
//   if (isClickThrough && !e.shiftKey) {
//     isClickThrough = false;
//     renderEvents();
//   }
// }

function removeEventsList() {
  if (!addedEventsList) {
    return;
  }

  addedEventsList = false;

  shadowWrapper.parentElement!.removeChild(shadowWrapper);
  unsafeWindow.removeEventListener('keydown', handleGlobalKeyDown);
}

function addEvent(event) {
  events.push(event);
}

function isBookmark(event) {
  return event.type === '__sptmninja_bookmark';
}

function createUniquePropsMap() {
  uniqueProps = {};

  const pushUniqueEventProps = (eventA, eventB) => key => {
    if (
      key !== 'time_delta' &&
      key !== 'uid' &&
      key !== 'duration' &&
      eventA[key] !== eventB[key] &&
      uniqueProps[eventA.type].indexOf(key) === -1
    ) {
      uniqueProps[eventA.type].push(key);
    }
  };

  events.forEach(eventA => {
    if (isBookmark(eventA)) {
      return;
    }

    uniqueProps[eventA.type] = uniqueProps[eventA.type] || [];

    events.forEach(eventB => {
      if (isBookmark(eventB)) {
        return;
      }

      if (eventA !== eventB && eventA.type === eventB.type) {
        Object.keys(eventA).forEach(pushUniqueEventProps(eventA, eventB));
        Object.keys(eventB).forEach(pushUniqueEventProps(eventA, eventB));
      }
    });
  });
}

function isNegative(queryPart: string) {
  return queryPart.startsWith('-');
}

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

function isMandatoryProp(queryPart: string) {
  return queryPart.endsWith('!');
}

function getMandatoryPropName(queryPart: string) {
  return queryPart.substr(0, queryPart.length - 1);
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

  events = events.map((event, index) => ({
    ...event,
    __sptmninja_index: index,
  }));

  function filterRelevantProps(key) {
    return (
      key !== '__sptmninja_expanded' &&
      key !== '__sptmninja_index' &&
      key !== 'type'
    );
  }

  const mandatoryProps: string[] = [];

  const filteredEvents = events.filter(event => {
    const splitQueryParts: any[] = parse(query);

    if (query === '') {
      return true;
    }

    if (event.type === '__sptmninja_bookmark') {
      return true;
    }

    for (let i = 0; i < splitQueryParts.length; i++) {
      const queryPart: string =
        typeof splitQueryParts[i] === 'object'
          ? splitQueryParts[i].pattern
          : splitQueryParts[i];

      if (isMandatoryProp(queryPart)) {
        const propName = getMandatoryPropName(queryPart);
        if (mandatoryProps.indexOf(propName) === -1) {
          mandatoryProps.push(propName);
        }
        continue;
      }

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
    /*html*/ `<div class="instructions">
      <div>Ctrl+K to clear</div>
      <div>Ctrl+P to pause</div>
      <div>Ctrl+B to bookmark</div>
    </div>` +
    filteredEvents
      .map((event, index) => {
        if (event.type === '__sptmninja_bookmark') {
          return /*html*/ `<div class="bookmark">${bookmarkSvg}</div>`;
        } else {
          return /*html*/ `
              <div class="event ${
                event.__sptmninja_expanded ? 'expanded' : ''
              }" data-index="${event.__sptmninja_index}">
                <div class="container">
                  <div class="toolbar">
                    <button class="button expand-button"></button>
                    <button class="button remove-button"></button>
                  </div>
                  ${(event.__sptmninja_expanded
                    ? [
                        'type',
                        ...Object.keys(event)
                          .filter(filterRelevantProps)
                          .sort(),
                      ]
                    : [
                        'type',
                        ...uniqueProps[event.type]
                          .sort()
                          .filter(filterRelevantProps),
                        ...mandatoryProps.filter(
                          propName =>
                            uniqueProps[event.type].indexOf(propName) === -1
                        ),
                      ]
                  )
                    .map(
                      propName => `
                      <span class="prop-name">${propName.replace(
                        /_/g,
                        ' '
                      )}</span>
                      <span class="prop-value">${event[propName]}</span>
                    `
                    )
                    .join('')}
                </div>
              </div>`;
        }
      })
      .join('');

  function getWrappingEventIndex(target: EventTarget) {
    return Number(
      ((target as HTMLElement).closest('.event') as HTMLElement).dataset.index
    );
  }

  Array.from(eventsListEl.querySelectorAll('.event .remove-button')).forEach(
    eventEl => {
      eventEl.addEventListener('click', e => {
        e.stopPropagation();

        events.splice(getWrappingEventIndex(e.currentTarget!), 1);
        renderEvents(false);
      });
    }
  );

  Array.from(eventsListEl.querySelectorAll('.event .expand-button')).forEach(
    eventEl => {
      eventEl.addEventListener('click', e => {
        e.stopPropagation();
        const eventIndex = getWrappingEventIndex(e.currentTarget!);

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
  if (
    typeof args[0] === 'string' &&
    (typeof args[1] === 'object' || typeof args[3] === 'object') &&
    (args[0].startsWith('%cSpot.IM Analytics') || args[0] === 'Analytics Track')
  ) {
    if (typeof args[3] === 'object') {
      addEvent(args[3]);
    } else {
      addEvent(args[1]);
    }
    createUniquePropsMap();
    renderEvents();
  }
  existingConsoleLog.call(unsafeWindow.console, ...args);
}

function show() {
  unsafeWindow.console.log = consoleLogProxy;

  renderEvents();
}

export function toggle({
  waitForSpotimObject,
}: { waitForSpotimObject?: boolean } = {}) {
  isShowing = !isShowing;

  if (isShowing) {
    unsafeWindow.localStorage.setItem('SPOTIM_DEBUG_API', '*');

    if (waitForSpotimObject) {
      onFoundSpotimObject(show);
    } else {
      show();
    }
  } else {
    unsafeWindow.console.log = existingConsoleLog;
    removeEventsList();
  }

  prefs.set({ showEventsViewer: isShowing });

  return isShowing;
}

if (prefs.get().showEventsViewer) {
  toggle({ waitForSpotimObject: true });
}

function handleGlobalKeyDown(e: KeyboardEvent) {
  if (!isShowing) {
    return;
  }

  if (e.key === ';' && e.ctrlKey) {
    prefs.set({ eventsQuery: undefined });
    prefs.set({ eventsQueryHistory: undefined });
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

  if (e.code === 'KeyC' && e.ctrlKey) {
    GM_setClipboard(JSON.stringify(events, undefined, 2));
  }

  if (e.key === '/' && e.ctrlKey) {
    queryInputEl.focus();
  }

  if (e.code === 'KeyB' && e.ctrlKey) {
    events.push({ type: '__sptmninja_bookmark' });
    renderEvents();
  }
}
