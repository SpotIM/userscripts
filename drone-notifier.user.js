// ==UserScript==
// @name         Drone Notifier
// @namespace    https://droneio.spot.im/
// @version      0.2
// @description  notifiy on drone builds
// @author       You
// @match        https://droneio.spot.im/*
// @grant        none
// ==/UserScript==

(async function () {
  'use strict';
  const dataLSKey = '__SPOTIM_DEPLOY_NOTIFIER__';
  const settingsLSKey = '__SPOTIM_SETTINGS__';
  const settingsElId = '__spotim_settings__';

  const icons = {
    running: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAAC/klEQVR4Ae2aA9AdSQCEu2K7cPZd+PK2+2wUzrZt27aVQmyzENu2bdt4+Se2Jzv7v6mar8u16G+NQSAQCAQCgUAgEAjERh6R77Adh3AyFynDtZrG3mzJ//m2yiObSZeKnmA7rpE5Sqbxb96IfMg2ovvZUVtkji9czB+iU5EtpNMaKHPC2cKm0cXIbSqVYX3myFin0fklkHtEt2iJzMmFc3kNcgMVYS2ZWJLRF8iDZLmouAbJxBe2Un4kR/myGi0Tc7qfXjixE1cTZeIPu51dCAmQh71kHKUz8sA1/EHGXfgr3MLbZdyGd7i99ixwLaAFlYrBFfpDJoH8CzekLlImEYFM1QsRK3mim/SzGnGmxRH9Nb+2mKt1bFd8PsM69sc9vwYAG4XURTG8nui7Q15OLOpbKtTFSZFP73GFTAz1bRU2VyoDW9IXaLhMnPWtFJ6HHdF1Wh1/fQuFznb179RmB/UtFLjR4tWf92iLo/oWCroaJwYvd7n1LRTGqAY/jR7WeTgeVI6L3Ne3vKgOjN5QORwddkmmvqWC4UZ9cZTXTj2fXH1bBRmO5+VHuOvGe9tyqJDDF3Ao/NtRfQsFi7VdVFzrXdZ3oPA39oevO67vQEGvYh/q4bq+A4WMrsYuqpRmjvv6DhSWpopiB7zXfX03CtE3FlcgF/VtFbi2fFkA7CgTZ3AMZGLMTwA01WOBCQC0zGMBkzodzPFZQK9Cm70WaASu8FmAPaHpPgtoEtjBZwGuhf7wWUCbwQd9FuByVD3NZwGNBsBR/gqwJQC+7q+APt71SrnOV4H0ldgB//JUYD7yYAc6kxt9FIh+xB70rYxv4SaVwx7OL6hJ3glUw/6ovNZ7JbC6SulDhhFwqz8C0XM4FL7ojUBjHB694sNeYP+jfGjnHVyT5fWHHOMXrMpzRhbXr38c47pSRaOPtCwL68/WbThOdki8q4XZU54b9d0Jj6mrVIDPaGIW1J+kf6KzYIvO42P6hwO4KflDhvWj51Kn4zAEAoFAIBAIBAKBwDZS1aBRvqqkqQAAAABJRU5ErkJggg==',
    success: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAADxUlEQVR4Ae2bA8xsVxSF97PtF9Sc3umctWrbQW1GtYLaiJPabuy6sWo+27at/cwf+86Ze+65L7nfCoffGmNvKSkpKSkpyY7aUbjGPc638C3/5DjO4yasw3yO55/4lm+5x3ENj5AiUunOW/App1PtYBo+dTcd00OKgjuR73M1tb5gJT5gInFhB3czfqP6B7+5m9lBYpD04fOYT80gc/h80kdypY27h4upGWahu0faSD5UT+Cf1AD5E8dJeHAN11ADZQ2ukqC0xWvUsMGrwR5Kh3bGd9TwwXeHdpbscQPwNzWf4O9KX8mW5HBMo+aYScnhkh0cwhnUnDPDDc3uwTOBGiHjj+2XyVOX/1Mj5f9KR2kUvEONmLekMdxF1Mi5RPxhfy6MXQAL2F98wdc5q77S7DFfih+183LVX8JjRXgftWlqZ4gH7TklV/1EdoBHqU0yzuNLD++PoN9yhfvqv/3n5K6/Bz7Z5DRTpb3UA+6Oor8HPt/klHdKPXB8TH0RvNj0g4Wkx51LzSXLbP29cedIWvBVTvqw9T3eD6rdsK6A+sq11W6SBndtwfT3xF0racDbxdSn4m1JA0fG0zcyUmwqfcPqY6WH/p6k+LLvLgysf6q/PtVdGPUzkK1v5n6x4JvmrfA6lkTSV74pFvjZuIj7RJhgSRR9xc9iwRGWvohdwV/fyAixwLRWNB6VPTDhMmrKrM5IXzFNLLDE0N8DkbLCap6VjT4VS8QCW6jN5jlpAoGVeepTsVkssJ7aXPCiNANPxcr89KlYLxZcRPWo4KHvlUViganUeitwdU76iqk+L6N2hbOaVsA6P30jIzzeyHwqYB0uCKCv+Eks+BbVrwLWBdD3+CjxINWvAi7AusD6igfEgpdQG6kQUp9au1gsju1HbaDCpSH1qZXuYoPhjVQIqY/hYmM/je0K/vpG3sr8ZxW8GFrf42eVajeu9a8QTh/rqt0kHfyC6l8hjD4Vn0ta3DlU/wph9Kk4O+DP63gxtD7HB/6DAy8G1VfcJXXRHrO9KwTQ5xxpLzb2ZyK7QhB9xQMeM6Ec51MhhD7HSXupn9oZ1GLEnS5+4KtCFPhSfGF/LIiuv5D9xR9eEv3hc9FBPfCEt7MYOfsvWoF/M5kgPbYfxxd96M/ADS3+2GXhBl9rh5ajx9GGv7+1nrr+tCn++L0Jr+fq8AsQQXHHh1lBwa847uBeAsqXpA9eCL+GFRh2wK34vbFFONzKDhKXWg0fYlX4VcSgHNODt/CTaMugAdZxv9uzjrse8zkef4VYxy0pKSkpKdkK2XrrCpgSCAEAAAAASUVORK5CYII=',
    failure: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAAC/ElEQVR4Ae2bM7RdURCGJ7ad5tm6e/4mdtLENqun6tVx0q/Y7Ks4/Ypt27Y1qcN97uG89c7398V3sDlD/hETExMTE4MMHmWqsIy34zAu4RG+8Sd+jMs4zNuxzFTxKGSQRgqaYhI24DbEHr7FG82EnGakBVOCVXgPSS78ltegiKIF9cwEPgBxHz5gJqIeRUFRK8zhxxAf8gBzi1pRqNTimXgO8TFPzSyqReHAeTgMCSCHOY+Ch0fhAySgfOAhFCi1sQgSbHhxYJ9SakPeAQk+vCO1YRBTVWs+CgknfLSgNflLUTquQULMtaJ08g90wh1IyLljOvv38VyBRJDLuW18+XVxAhJRThbUJ6/wckiEWUbeMAMgEWcQuSe3DZ5GLcBP0Jbcgq0QBdlK7jBdITqS6EYuqItLEPeh3/CkcMnFpgdlEDUCgrKknz/f0iTAN6kuJQPPgGgSgGA6JQMuqRO4TM4xvSDqBMT0SmL81yjgeD4obsKfVAp8LG5CTjCjISoFxIx2uP7UKsDLyQk4q1UAZx3tvyBqBcTBZt/01yxg+pMNlGsWQLldYKlqgaVkg/dqFuC9ZANnNAvgDNngW5oF+JZd4IVqgRd2gR+qBb7bBT6rFvhMNvBMswCekQ2+qVmAb9aAYXQvRG94D9nAMs0CTpYSlZoFuIJsYJBmgcRAspHTTLNAQVOyw6fVfkCnyY7q33iZ42MVnTGjHR5s4aPGiYw/FTchZ2CLSoHN5BTuqVKgZ805Xtd4wcEzkr1iuq9K4AHVpeTgSk0CXOGiJlTTNSvVpeRJdFMzgXWtmaUGRGjLTyAR56ml2EP77sAMqNYFT7zcj5Kz45EJHPelgjS3DS5rL/qzYDrrL7u0kEgNu/A1kRqXHv/5O/N2SPDh7akNg+vcWKy//N5CYjjea2+AsMB5vD+QZ7+f88JrApoRQBNQ6G1Yc/W3Ydk3PZP4oLdGOJ6MepG3IvIafqe8FdF+pm0m6m8GdUAi64923M/8GJf5SBDtuDExMTExMT8BMw5VmNe560sAAAAASUVORK5CYII=',
    pending: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAQAAABIkb+zAAAEUElEQVR4Ae2aA/AjTRDF+2xf4exLqlK3ybz32bZt27Zt27Zt27Ztnm31zG602f9U1fymFE73bKbn9dtIIDUCgUAgEAgEAoFAcwL74l68js/wKydiJL/Ec7gDF2Af5sVnSl3NlrgX/3NKwvgS52A5aSm+YTbAI5zAKZUN/IYTTW9/Vr7EVzil6jEBt5gFpKkpdMd1mMwpNY8bh3aWpsOsyt85pb6BH7CkNAVsjys5JZUxkUdKc8mWXCe+yinpDdzJVpId+R58L3FFX8DhZuliwfQe2HZmgcUqOAHPYFzCp57q2y6zjctPEur8tiO6SQx923EzPhV7FZ4c2DaTkxbPxgTwBtaTZlIWLMLnY5J4LIO9gBPdR5PZXgWfiFmLXzi/5zRpLFjDXc1znWqoYrc6U1izsbXnZ8eUV6q1rxhzhCOFnwsdpVHwTEf4Z0sd4EBHCudJY4hynGiFf6nUiTnWLsPF4SnXHbM8T+GN+Maa6sE0qgbusJblrvSk2ra4mj/HlM0P+7ZLaWd9p787yqXQnvD45OYEa0hKYGXr26+RumjJ/fF3GfXykqQI7lTfP77Qvfa1H8a3ysuv0uKSIoisGXaQ2jBL87/y4fNNSRk8acmKWjBrcXxF8ncPSRlsoWYYW0Prj3UrbMzHs4ukzMC2HK1mWUKqA4vErv5o3IGNiob9Gyl4+aia9X1ejsPMJhwilcCe+NWtM7kD20sGmINjr/grZk/2lGTwuMv64ClRB8kIrJm468byyIS2kzs4PvJXaTHJkChXtnR8hEViTl3HsfVFaaBkSr5HBdVvMnYUG5xjvfX3Yh/JmKFtKnQwjrHFlC5gYwhpAio2Yc6RecEe1hsOEvEsAT12m/djT6vwf3VW+8ytsyiHNXgF/nJ7T3OOuRHdtDmLncUjCq3NLvzekcIfswo81lPhj+vbTjxjYFvcaadgjnVWIDwsXoKzdQIYme8hInhEPb27+Ekz3GtdhZNFRDtkpWXEU9geP6gEPhYR/qmezIu3mK2s5r+v6BrELl7fwv3KOg90D6CNPa+wRc+NomWcdsX8giupkvOM8CufN7GmOFxdgU8FD6undhWPGdpZnwWW44yHxWMKHbW9INgoXkr4/xPCX1Lswyn+ijlNaUUV7XsignfVk79oOe0POEst9h3OhoaHiKfwK0ekuU4cpY0ss4B4CLawLObFYqQqf4/6eijmflRR/jTrDhH7Y6xOAZ+VBnomp+/XMZqTZDY8zm1s+aWCdMFnz3k9mU9d1iJOiDr40FLyHscCXyjzwjxHp2Lupm937eps6v+z/lSCNTAp1l6/ExtPt9fZ3hNbZYrZXmywk36bt+MmccNd9VXwceClBKMda+J/z8N/vcwtWObxtcfhX1eBUos6mIP5p4fhf8fVRZGUxH78xaOVH8vjq1bJhdbYlp94EP6nPNcMkFrhEGzOc/EyxmX/k8F1Znu3rAwEAoFAIBAIBAKBqSxt9Vs/QLVnAAAAAElFTkSuQmCC',
  }

  let isFirstRun = false;
  let deploymentTargets = loadSettings();

  function loadData() {
    return JSON.parse(localStorage.getItem(dataLSKey) || '{}')
  }

  function saveData(data) {
    localStorage.setItem(dataLSKey, JSON.stringify(data));
  }

  function loadSettings() {
    return JSON.parse(localStorage.getItem(settingsLSKey)) || ['staging-comm.topics, production-comm.topics'];
  }

  function saveSettings(data) {
    localStorage.setItem(settingsLSKey, JSON.stringify(data));
  }

  function showNotification({ title, message, deployNumber, icon }) {
    var notification = new Notification(title, {
      icon: icon,
      body: message,
    });

    notification.onclick = function () {
      location.href = `https://droneio.spot.im/SpotIM/fed.modules/${deployNumber}`;
    };
  }

  async function fetchBuilds() {
    let prevDeploys = loadData();

    const builds = await fetch('https://droneio.spot.im/api/repos/SpotIM/fed.modules/builds').then(res => res.json());
    const deploys = builds
      .filter(build => build.event === 'deployment')
      .filter(build => deploymentTargets.indexOf(build.deploy_to) !== -1)

    deploys.forEach(deploy => {
      if (!prevDeploys[deploy.number] || prevDeploys[deploy.number].status !== deploy.status) {
        if (!isFirstRun) {
          showNotification({
            title: `Deploy ${deploy.number} (${deploy.deploy_to})`,
            message: `Status: ${deploy.status}`,
            deployNumber: deploy.number,
            icon: icons[deploy.status]
          })
        }
      }
      prevDeploys[deploy.number] = deploy;
    });

    saveData(prevDeploys);

    isFirstRun = false;
  }

  function addSettings() {
    const drawer = document.querySelector('[class^="drawer__inner"]');
    drawer.innerHTML += `
            <div id="${settingsElId}" style="
                padding: 20px;
                background: #f7f7f7;
                border-top: 1px solid #eee;
            "><div>Notify On Environments:</div><input placeholder="staging-comm.topics, staging-fed.prerender" style="
                margin-top: 11px;
                padding: 10px;
                width: calc(100% - 20px);
            "></div>
        `
    const input = document.querySelector(`#${settingsElId} input`);
    input.value = loadSettings().join(', ');
    input.addEventListener('keyup', () => {
      saveSettings(input.value.split(',').map(item => item.trim()));
      deploymentTargets = loadSettings();
    });
  }

  Notification.requestPermission();
  setInterval(fetchBuilds, 1000)
  addSettings();
})();
