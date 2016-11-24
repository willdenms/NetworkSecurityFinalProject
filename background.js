/**
 * Created by Matt Willden on 11/22/16.
 */

function loadHandler() {
    window.webkitNotifications.createNofication("Sherlock.png", "pluglin loaded", "yes it was loaded").show();

    if(location.protocol != "https") {
        window.alert("Did you know you're not on a secure website? \n"
            +" -This means that what you're doing can be seen, consider the validity of the current webpage");
    }
}