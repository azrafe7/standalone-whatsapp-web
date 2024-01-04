"use strict";

let manifest = chrome.runtime.getManifest();
console.log(manifest.name + " v" + manifest.version);

const url = 'https://web.whatsapp.com';

let size = {
  width: 800,
  height: 600,
};

// enable picker when clicking the browser action
chrome.action.onClicked.addListener(async (tab) => {
  console.log("[StandaloneWA:BG] clicked");
  
  const options = {
    url: url,
    type: 'popup',
    width: size.width,
    height: size.height,
  };
  
  chrome.windows.create(options);
});
