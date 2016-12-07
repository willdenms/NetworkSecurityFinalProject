/**
 * Created by mahowa on 12/6/2016.
 */
function onWindowLoad() {

    var message = document.querySelector('#message');

    chrome.tabs.executeScript(null, {
        file: "getPagesSource.js"
    }, function() {
        // If you try and inject into an extensions page or the webstore/NTP you'll get an error
        if (chrome.runtime.lastError) {

        }
    });

}

window.onload = onWindowLoad;