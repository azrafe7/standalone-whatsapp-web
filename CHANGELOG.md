 # CHANGELOG

 ### v0.3.1 (02 Feb 2024)
 - fix badge showing "loading" instead of # of unread messages in some situations
 - better logging (for debugging)

 ### v0.3.0 (26 Jan 2024)
 - add "Close All WhatsApp Web Tabs..." feature
 - add loading in badge and title
 - send drawAttention message only if newUnreadMessages > unreadMessages

 ### v0.2.4 (23 Jan 2024)
 - send drawAttention message also when newUnreadMessages < unreadMessages
 
 ### v0.2.3 (18 Jan 2024)
 - search candidateTabs in all windows
 
 ### v0.2.2 (17 Jan 2024)
 - set drawAttention on new unread messages
 
 ### v0.2.1 (16 Jan 2024)
 - improve the check for already open popup (as the serviceWorker may have gone to sleep)
 - populate windows when searching for candidateTabs
 
 ### v0.2.0 (15 Jan 2024)
 - implement "# unread messages in badge"
 - send reset message on browsing away
 - search candidateTabs in the current window
 - check if WA is already open and inject extension onInstall
 - set popup offset
 
 ### v0.1.4 (13 Jan 2024)
 - add move to popup functionality (instead of closing the tab and reopening it in the popup)
 
 ### v0.1.3 (13 Jan 2024)
 - remove already open tab before opening popup
 - only open one popup
 - context menu entry to re-attach

 ### v0.1.0 (04 Jan 2024)
 - initial version
