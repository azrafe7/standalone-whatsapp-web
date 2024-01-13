"use strict";

let manifest = chrome.runtime.getManifest();
console.log(manifest.name + " v" + manifest.version);

// const url = 'https://web.whatsapp.com';
const url = 'https://www.wikipedia.org/';

let size = {
  width: 800,
  height: 600,
};

let createdPopupWin = null;

// add/remove contextMenu entry to action button
const reattachContextId = "StandaloneWA_onReattachContextMenu";
function updateContextMenu(options={}) {
  const defaults = { enable:true };
  options = { ...defaults, ...options };
  chrome.contextMenus.removeAll(function() {
    // console.log("remove");
    if (chrome.runtime.lastError) {
      console.warn('Whoops...', chrome.runtime.lastError.message);
    } else if (options.enable) {
      chrome.contextMenus.create({
        id: reattachContextId,
        title: "Re-attach as tab...",
        contexts: ["action"],
      }, () => {
        // console.log("create");
        if (chrome.runtime.lastError) {
          console.warn('Whoops...', chrome.runtime.lastError.message);
        }      
      });
    }
  });
}

chrome.action.onClicked.addListener(async (tab) => {
  console.log("[StandaloneWA:BG] clicked");
  
  const options = {
    url: url,
    type: 'popup',
    width: size.width,
    height: size.height,
  };
  
  let currWindow = await chrome.windows.getCurrent();
  
  if (!createdPopupWin) { // create new popup
    chrome.windows.create(options, (win) => {
      createdPopupWin = win;
      console.log('created', createdPopupWin);
    });
    
    console.log('currWindow:', currWindow);
  } else {  // focus existing popup
    chrome.windows.update(createdPopupWin.id, { focused:true });
  }
  
  updateContextMenu({enable:true});
});

chrome.windows.onRemoved.addListener((winId) => {
  console.log("removed win", winId);
  if (createdPopupWin && winId == createdPopupWin.id) {
    createdPopupWin = null;
    updateContextMenu({enable:false});
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log("[StandaloneWA:BG] onContextMenuClicked:", [info, tab]);

  if (info.menuItemId === reattachContextId) {
    console.log("[StandaloneWA:BG] reattach as tab...");
    
    let currWindow = await chrome.windows.getCurrent();
    chrome.tabs.move(createdPopupWin.tabs[0].id, { windowId:currWindow.id, index:-1 }, (tab) => {
      chrome.tabs.update(tab.id, { active:true });
      createdPopupWin = null;
      updateContextMenu({enable:false});
    });
  }
});
