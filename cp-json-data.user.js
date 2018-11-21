// ==UserScript==
// @name         CP JSON Data Button
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Eldad Bercovici
// @match        https://community.soaphub.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';
  let button = document.createElement('button');
  button.style.position = 'absolute';
  button.style.top = 0;
  button.style.left = 0;
  button.innerText = 'json-data';
  button.addEventListener('click', () => {
    const spotId = __SPOTIM_DEV_STORE__.getState().topic.spotId;
    const handle = __SPOTIM_DEV_STORE__.getState().entities.topics[__SPOTIM_DEV_STORE__.getState().topic.topicId].handle;
    const url = `https://community-spoxy.spot.im/${spotId}/${handle}/json-data`
    window.open(url);
  })
  document.body.appendChild(button);
  // Your code here...
})();
