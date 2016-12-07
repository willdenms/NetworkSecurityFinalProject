/**
 * Created by mahowa on 12/7/2016.
 */
function loadAd(){

    //function(array of ExtensionInfo result)
    chrome.management.getAll(function(result){
        debugger;
        //for(var i in result)
        var found = false;
        var adblocker = {};
        for(var i =0; i< result.length; i++){
            var r = result[i].shortName;
            if(r === "Adblock Plus") {
                found = true;
                adblocker = result[i];
            }
        }

        if(found){
            var enabled = adblocker.enabled;
            if(enabled)
                $("#addblocker").html("Ad Blocker found and enabled. You are surfing ad free");
            else{
                //Todo ad buton and command to enable Ad Blocker
                $("#addblocker").html("Ad Blocker found but not enabled. Turn on to start surfing ad free");
            }
        }
        else{
            debugger;
            //TODO provide link to download
            $("#addblocker").html("<p>Ad Blocker not found. Install it to start surfing ad free</p>" +
                "<a class='btn btn-info center-block' href='https://chrome.google.com/webstore/detail/adblock-plus/cfhdojbkjhnklbpkdaibdccddilifddb?hl=en-US' target='_blank'  >Install</a>");
        }
    })

}
$(document).ready(loadAd());