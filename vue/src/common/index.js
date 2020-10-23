export const isSuccessEnv = () => {
    const bgPage = chrome.extension.getBackgroundPage();
    const checkResult = bgPage.checkEnv();
    
    let checkStatus = checkResult.reduce((checkStatus, item) => checkStatus && item.iconType === "success", true)

    return checkStatus;
}

export const isLogin = () => {

}