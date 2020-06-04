chrome.browserAction.onClicked.addListener(tellContentScript);
console.log("random");
function tellContentScript(tab) {
    let msg = {text: "send"}
    chrome.tabs.sendMessage(tab.id, msg);
}
