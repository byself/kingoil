class checkEnv {
    constructor(){
        this.$background = chrome.extension.getBackgroundPage();
    }

    async isSuccess(){
        const checkResult = await this.$background.checkEnv();
        console.log("checkResult:", checkResult);
        let checkStatus = checkResult.reduce((checkStatus, item) => checkStatus && item.iconType === "success", true)
        console.log("checkStatus:", checkStatus);
        return checkStatus;
    }

    check(){

    }
}

export default checkEnv;
