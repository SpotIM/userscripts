import * as keystrokesHandler from './keystrokes-handler';
import showFirstRunMessage from './show-first-run-message';
import showVersionsOnLoad from './show-versions-on-load';
import initSetCredentials from './init-set-credentials';
import initWindowObject from './init-window-object';
import * as whatsNew from './whats-new';
import * as utils from './utils';
import './events-viewer';

initSetCredentials();
initWindowObject();
showVersionsOnLoad();
whatsNew.showIfUpgraded();
keystrokesHandler.init();

utils.awaitBody().then(() => {
  showFirstRunMessage();
});
