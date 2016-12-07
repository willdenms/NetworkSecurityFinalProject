/**
 * Created by mahowa on 12/7/2016.
 */
function loadTracker(){

    //function(array of ExtensionInfo result)
    chrome.management.getAll(function(result){
        debugger;
        //for(var i in result)
        var foundGhostery = false;
        var foundDisconnectMe = false;
        var ghostery = {};
        var disconnectMe = {};
        for(var i =0; i< result.length; i++){
            var r = result[i].shortName;
            if(r === "Ghostery") {
                foundGhostery = true;
                ghostery = result[i];
            }
            if(r === "Disconnect") {
                foundDisconnectMe = true;
                disconnectMe = result[i];
            }
        }
        var enabled;
        if(foundGhostery && foundDisconnectMe){
            //TODO give option to switch between the two but onlly allow one to be enabled
        }
        if(foundGhostery){
            enabled = ghostery.enabled;
            if(enabled)
                $("#ghostery").html("Ghostery found and enabled. You are surfing tracker free");
            else{
                //Todo ad buton and command to enable Ghostery
                $("#ghostery").html("Ghostery found but not enabled. Turn on to start surfing tracker free free");
            }

            //$("#disconnetme").html("")
        }
            //TODO make this into single function notice repeated code
        else{
            debugger;

            $("#ghostery").html("<p class='text-info'>Ghostery not found. Install it to start surfing tracker free</p>" +
                "<a class='btn btn-info center-block' href='https://chrome.google.com/webstore/detail/ghostery/mlomiejdfkolichcflejclcbmpeaniij/related?hl=en' target='_blank'  >Install</a>");
        }
        if(foundDisconnectMe){
            enabled = disconnectMe.enabled;
            if(enabled)
                $("#disconnectme").html("<p class='text-info'>DisconnectMe found and enabled. You are surfing tracker free</p>");
            else{
                //Todo ad buton and command to enable DisconnectMe
                $("#disconnectme").html("<p class='text-info'>DisconnectMe found but not enabled. Turn on to start surfing tracker free free</p>");
            }
            //$("#ghostery").html("")
        }
        else{
            debugger;

            $("#disconnectme").html("<p class='text-info'>DisconnectMe not found. Install it to start surfing tracker free</p>" +
                "<a class='btn btn-info center-block'  href='https://chrome.google.com/webstore/detail/disconnect/jeoacafpbcihiomhlakheieifhpjdfeo?hl=en' target='_blank'  >Install</a>");
        }
    })

}
$(document).ready(loadTracker());