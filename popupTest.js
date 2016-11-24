/**
 * Created by Matt Willden on 11/22/16.
 */
//function clickHandler() {
//    window.webkitNotifications.createNotification("Sherlock.gif", "Clicked", "It was clicked").show();
//
//
//}

function test() {
    console.log("made it to test");
    // debugger;
    //alert("Triggered JS")
    $("#test").html("I have been clicked");
    window.webkitNotifications.createNotification("Sherlock.gif", "Clicked", "It was clicked").show();
}

$(document).ready(function() {

    $("#btn").click(test);
});