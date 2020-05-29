chrome.runtime.onMessage.addListener(gotMessage);

function gotMessage(message, sender, sendResponse){
    if (message.text == "send it, dude") {
        changeImagesToPikachu()
    }
}

function changeImagesToPikachu() {
    let images = document.querySelectorAll('img')
    for (const img of images) {
        img.src = 'https://steemitimages.com/p/2KZBmxW92GugPsdvGSLvCon8CyF7TQbZHzgRNoQyseAPG841VZpdmX1b6aEr6G4PzoAhegoXoYqi1656RDebm3QvunkXNZ3wF5Wew3MsK3hAcUHX3SQrHW9ssobzJs6qFoGUQ2iUpHwXcNjm2x9wV8ReKdu8HYMeHc8hRZeQiV7Hp1pkVyusqRaUF3bSeLZPg7MS?format=match&mode=fit'
    }
}