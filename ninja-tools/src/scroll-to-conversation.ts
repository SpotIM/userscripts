let isScrolling;
let scrollingInterval;
let hasScrolledDown;
let isHighlighted;
let isInViewport;

function highlightConversation(conversation) {
  Object.assign(conversation.style, {
    boxShadow: `rgb(76, 175, 80) 0px 0px 0px 4px,
        rgb(26, 216, 34) 0px 0px 0px 5px,
        #00000036 0px 0px 40px 12px,
        #00000085 0px 0px 4px 5px,
        black 0px 0px 40px -4px`,
    borderRadius: '8px',
  });

  conversation.dataset.sptmninjaHighlighted = true;

  isHighlighted = true;
}

function unhighlightConversation() {
  if (!isHighlighted) {
    return;
  }

  [...document.querySelectorAll('[data-sptmninja-highlighted]')].forEach(el => {
    // el.style.transition = "all 1s ease-out";
    el.style.boxShadow = null;
    el.style.borderRadius = null;
    delete el.dataset.sptmninjaHighlighted;
  });

  isHighlighted = false;
}

function scrollDown() {
  if (!hasScrolledDown) {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
    hasScrolledDown = true;
  }
}

function startScrolling() {
  if (isScrolling) {
    return;
  }

  let observer = new IntersectionObserver(
    data => {
      isInViewport = data[0].isIntersecting;
    },
    {
      rootMargin: '0px',
      threshold: 0,
    }
  );

  message.set('Looking for conversation element', {
    title: 'Scroll To Conversation',
  });
  isScrolling = true;
  scrollingInterval = setInterval(() => {
    let conversation;
    conversation = utils.findConversation();
    if (conversation) {
      observer.observe(conversation);

      if (!isInViewport) {
        conversation.scrollIntoView();
        window.scrollBy(0, -200);
      }
      message.set('Hit <span class="sptmninja_mono">escape</span> to stop', {
        title: 'Scroll To Conversation',
        color: colors.success,
        emoji: '😃',
      });
      highlightConversation(conversation);
    } else {
      scrollDown();

      if (utils.isTopMostFrame()) {
        message.set('Element not found. Try scrolling up and down a bit.', {
          color: colors.error,
          emoji: '😕',
          title: 'Scroll To Conversation',
        });
      } else {
        window.parent.focus();
        message.set(
          `${commonMessages.focusWarning}<br/>Scroll To Conversation... not found. Try scrolling up and down a bit.`,

          { color: colors.error, timeout: 3000, emoji: '😕' }
        );
        stopScrolling({ hideMessage: false });
      }
    }
  }, 100);
}

function stopScrolling({ hideMessage } = { hideMessage: true }) {
  unhighlightConversation();
  if (isScrolling) {
    if (hideMessage) {
      message.hide();
    }
    clearInterval(scrollingInterval);
    isScrolling = false;
    hasScrolledDown = false;
  }
}

function toggleScrolling() {
  if (isScrolling) {
    stopScrolling();
  } else {
    startScrolling();
  }
}

export const start = startScrolling;
export const stop = stopScrolling;
export const toggle = toggleScrolling;
