// Listen for the extension installation event
chrome.runtime.onInstalled.addListener(() => {
  console.log('Tab Inspector installed.');
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
