chrome.browserAction.onClicked.addListener(tellContentScript)

function tellContentScript(tab) {
    let msg = {text: "send it, dude"}
    chrome.tabs.sendMessage(tab.id, msg)
}

function testAPI() {
    console.log("hi");
    btAPI = "https://www.berkeleytime.com/api/grades/grades_json/?form=long";
    const request = $.ajax({url: btAPI, success: function(data) {
        console.log("Capture data success!")
    }}).done(function (response) {
        console.log(response); 
        
        var catalog = response.courses;
        console.log(catalog);
        console.log(catalog[0].abbreviation);
        
        const toCourseIDS = new Map();
        for(key in catalog) {
            value = catalog[key];
            toCourseIDS.set(value.title.toLowerCase().replace(new RegExp("\\s+", "g"), ""), value.id);
        }
        console.log(toCourseIDS);
    })
        .fail(function (Response) {
    });;
}