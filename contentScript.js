"use strict";

(async () => {

  const DEBUG = false;
  let debug = {
    log: DEBUG ? console.log.bind(console) : () => {} // log or NO_OP
  }

  let manifest = chrome.runtime.getManifest();
  console.log(manifest.name + " v" + manifest.version);

  let unreadMessages = 0;

  /**
   * elementsChanged() reworked from jwilson8767 elementReady() code
   *
   * MIT Licensed
   * Authors: jwilson8767, azrafe7
   *
   */
  function elementsChanged(selectors, callback, options={}) {
    const defaults = {once:false, root:document.documentElement, filterFn:(elements) => {return true}};
    options = {...defaults, ...options};
    const root = options.root;
    const filterFn = options.filterFn;
    if (!Array.isArray(selectors)) selectors = [selectors];

    let matchedSelectors = selectors.map(() => false);

    const query = (msg) => {
      debug.log("[StandaloneWA:CTX]", msg);
      for (const [index, selector] of selectors.entries()) {
        const alreadyMatched = matchedSelectors[index];
        if (options.once && alreadyMatched) continue;
        let elements = Array.from(root.querySelectorAll(selector));
        if (elements.length > 0) {
          matchedSelectors[index] = true;
        }
        if (filterFn) {
          elements = elements.filter(filterFn);
        }
        if (elements.length > 0) {
          debug.log("[StandaloneWA:CTX] selector index", index);
          callback(elements, selector, index, matchedSelectors);
        }
      }
    }

    query("query from function");
    if (options.once && matchedSelectors.every((matched) => matched)) {
      debug.log("[StandaloneWA:CTX]", "ALL");
      return true;
    }

    let mutObserver = new MutationObserver((mutationRecords, observer) => {
      query("query from observer");
      if (options.once && matchedSelectors.every((matched) => matched)) {
        debug.log("[StandaloneWA:CTX]", "ALL");
        observer.disconnect();
        return true;
      }
    });
    mutObserver.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      // attributes: true,
      // attibuteFilter: ['class']
    });

    return mutObserver;
  }

  const callback = async (elements, selector, index, matchedSelectors) => {
    debug.log("[StandaloneWA:CTX]", 'callback called');

    let newUnreadMessages = 0;
    for (let element of elements) {
      let unread = parseInt(element.innerText);
      unread = isNaN(unread) ? 0 : unread;
      newUnreadMessages += unread;
    }

    debug.log("[StandaloneWA:CTX] unread messages", unreadMessages);

    if (newUnreadMessages != unreadMessages) {
      unreadMessages = newUnreadMessages;
      debug.log("[StandaloneWA:CTX] send new unread messages", unreadMessages);
      if (chrome.runtime?.id) {
        chrome.runtime.sendMessage({
          event: "setUnreadMessages",
          data: unreadMessages,
        });
      }
    }
  }

  let selectors = ['.ovhn1urg']; // unread-marker-background class
  elementsChanged(selectors, callback, { once:false });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    debug.log("[StandaloneWA:CTX]", msg);
    const { event, data } = msg;
  });

  // reset badge and title when browsing away from page
  window.addEventListener('beforeunload', () => {
    if (chrome.runtime?.id) {
      chrome.runtime.sendMessage({
        event: "setUnreadMessages",
        data: 0,
      });
    }
  });
})();
