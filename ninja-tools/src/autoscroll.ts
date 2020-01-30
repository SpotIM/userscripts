import * as utils from './utils';
import * as prefs from './prefs';
import * as scrollToConversation from './scroll-to-conversation';

export default async () => {
  let findConversationInterval;

  function shouldAutoScrollInDomain() {
    return (
      ['s3.amazonaws.com', 'www.spotim.name', 'localhost'].indexOf(
        location.hostname
      ) === -1
    );
  }

  if (
    utils.isTopMostFrame() &&
    prefs.get().autoScroll &&
    shouldAutoScrollInDomain()
  ) {
    findConversationInterval = setInterval(() => {
      let conversation = utils.findConversation();

      if (conversation) {
        scrollToConversation.start();
        clearInterval(findConversationInterval);
      }
    }, 100);
  }
};
