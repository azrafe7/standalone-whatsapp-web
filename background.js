"use strict";

let manifest = chrome.runtime.getManifest();
console.log(manifest.name + " v" + manifest.version);

const url = 'https://web.whatsapp.com/';
// const url = 'https://www.wikipedia.org/'; // for debugging

let size = {
  width: 800,
  height: 600,
};

let offset = {
  top: 20,
  left: 20,
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

function openPopupWindow(options) {
  chrome.windows.create(options, (win) => {
    createdPopupWin = win;
    console.log('created', createdPopupWin);
  });
}

async function getCandidateTabs(windowId) {
  let currWindow = await chrome.windows.getCurrent();
  if (!windowId) windowId = currWindow.id;
  let tabs = await chrome.tabs.query({ windowId:windowId });

  // console.log("tabs", tabs.map((tab) => tab.url));
  let candidateTabs = tabs.filter((tab) => {
    return tab.url.toLowerCase() == url.toLowerCase();
  });

  return candidateTabs;
}

chrome.runtime.onInstalled.addListener(async () => {
  let candidateTabs = await getCandidateTabs();
  console.log("candidateTabs", candidateTabs);
  for (const tab of candidateTabs) {
    chrome.scripting.executeScript({
      target: { tabId:tab.id },
      files: [ "contentScript.js" ],
    })
    .then(() => console.log("[StandaloneWA:BG] contentScript injected in tab", tab));
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  console.log("[StandaloneWA:BG] clicked");

  const options = {
    url: url,
    type: 'popup',
    width: size.width,
    height: size.height,
    top: offset.top,
    left: offset.left,
  };

  let currWindow = await chrome.windows.getCurrent();

  if (!createdPopupWin) { // create new popup
    // if a tab with `url` is already open in current window, move it to the popup
    let candidateTabs = await getCandidateTabs();
    console.log("candidateTabs", candidateTabs);
    if (candidateTabs.length > 0) {
      const tabToRemove = candidateTabs[0];
      delete options.url;
      options.tabId = tabToRemove.id;
      console.log("moved tab", tabToRemove.id);
      openPopupWindow(options);
    } else {
      openPopupWindow(options);
    }

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
    let [activeTab] = await chrome.tabs.query({active: true});
    const activeTabIndex = activeTab?.index ?? -2;
    chrome.tabs.move(createdPopupWin.tabs[0].id, { windowId:currWindow.id, index:activeTabIndex + 1 }, (tab) => {
      chrome.tabs.update(tab.id, { active:true });
      createdPopupWin = null;
      updateContextMenu({enable:false});
    });
  }
});

let actionTitle = manifest.name; // + " v" + manifest.version;
function setTitle(options={}) {
  const defaults = { title:actionTitle, append:'' };
  options = { ...defaults, ...options };
  let newTitle = options.title + options.append;
  chrome.action.setTitle({title:newTitle});
}

function setUnreadMessages(unreadMessages) {
  const unreadMessagesStr = "" + unreadMessages;
  const hasUnreadMessages = unreadMessages > 0;
  const newTitleAppend = hasUnreadMessages ? ` [${unreadMessagesStr} unread messages]` : '';
  const newBadge = hasUnreadMessages ? "" + unreadMessagesStr : "";

  setTitle({ append: newTitleAppend });
  chrome.action.setBadgeText({
    text: newBadge
  });
}

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  const { event, data } = msg;
  console.log('msg', msg, 'sender', sender, sendResponse);
  console.log('tabId', sender.tab.id);

  if (event === 'setBadge') {
    const text = data;
    chrome.action.setBadgeText({
      text: text
    });
  } else if (event === 'setUnreadMessages') {
    const unreadMessages = data;
    setUnreadMessages(unreadMessages);
  }
});
