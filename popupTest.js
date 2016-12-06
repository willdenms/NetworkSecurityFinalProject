/**
 * Created by Matt Willden on 11/22/16.
 */
//function clickHandler() {
//    window.webkitNotifications.createNotification("Sherlock.gif", "Clicked", "It was clicked").show();
//
//
//}


//Template Type
//"basic"
//icon, title, message, expandedMessage, up to two buttons
//
//"image"
//icon, title, message, expandedMessage, image, up to two buttons
//
//"list"
//icon, title, message, items, up to two buttons
//
//"progress"
//icon, title, message, progress, up to two buttons
//var notification = {
//
//    type: "basic",      //Required for notifications.create
//    iconUrl: "",        //Required for notifications.create .
//    appIconMaskUrl: "",
//    title: "",          //Required for notifications.create
//    message: "",        //Required for notifications.create
//    contextMessage: "",
//    priority: 0,
//    eventTime: 0.0,
//    buttons: [
//        {
//            title: "",
//            iconurl: "",
//        },
//    ],
//    imageUrl: "",
//    items: [
//        {
//            title: "",
//            message: ""
//        },
//    ],
//    progress: 0,
//    isClickable: false,
//    requireIneraction: false,
//
//}
function NotificationOptions() {
    var notification = {
        type: "basic",      //Required for notifications.create
        iconUrl: "",        //Required for notifications.create .
        title: "",          //Required for notifications.create
        message: "",        //Required for notifications.create
    };
    return notification;
}

function test() {
    console.log(chrome.extension.getBackgroundPage());

    //console.log("made it to test");
    //// debugger;
    ////alert("Triggered JS")
    //$("#test").html("I have been clicked");
    //
    //var options = NotificationOptions();
    //options.title = "Test";
    //options.iconUrl = "Sherlock.png";
    //options.message = "Made it!";
    //
    //chrome.notifications.create(options, function(d){
    //    alert("callback in test");
    //})
}

$(document).ready(function() {

    $("#btn").click(test);
});