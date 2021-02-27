// 获取当前选项卡ID
const utils = {
 async getCurrentTabId() {
    return await new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, highlighted: true }, function(tabs) {
        const activeTabId = tabs.length ? tabs[0].id : null;
        resolve(activeTabId);
      })
    })
  },
  domReady: (function (){
    var listeners = [];
    var doc = window.document;
    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    var observer;
  
    function ready(selector, fn){
      // 储存选择器和回调函数
      listeners.push({
        selector: selector,
        fn: fn
      });
      if(!observer){
        // 监听document变化
        observer = new MutationObserver(check);
        observer.observe(doc.documentElement, {
          childList: true,
          subtree: true,
        });
      }
      // 检查该节点是否已经在DOM中
      check();
    }
  
    function check(){
      
    // 检查是否匹配已储存的节点
      for(let i = 0; i < listeners.length; i++){
        let listener = listeners[i];
        // 检查指定节点是否有匹配
        let elements = doc.querySelectorAll(listener.selector);
        // console.log("check1", elements, elements[0] && elements[0].ready)
        for(let j = 0; j < elements.length; j++){
          let element = elements[j];
          // 确保回调函数只会对该元素调用一次
          // console.log("check2", element, JSON.stringify(element.ready))
          if(!element.ready){
            element.ready = true;
            // 对该节点调用回调函数
            listener.fn.call(element, element);
          }
        }
      }
    }

    return ready
  })()
}
