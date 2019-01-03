// ==UserScript==
// @name         Debug Everywhere
// @namespace    https://droneio.spot.im/
// @version      0.1
// @description  Add SPOTIM_DEBUG_API=* to localStorage everywhere
// @author       Arnon Eilat
// @match        *
// @grant        none
// ==/UserScript==

'use strict';
localStorage.setItem('SPOTIM_DEBUG_API', '*');
