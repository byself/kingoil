// 获取当前选项卡ID
const utils = {
 async getCurrentTabId() {
    return await new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, highlighted: true }, function(tabs) {
        const activeTabId = tabs.length ? tabs[0].id : null;
        resolve(activeTabId);
      })
    })
  }
}
