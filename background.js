/**
 * Created by Matt Willden on 11/22/16.
 * Edidted by Matt Howa
 */

function loadHandler() {
    window.webkitNotifications.createNofication("Sherlock.png", "pluglin loaded", "yes it was loaded").show();

    if(location.protocol != "https") {
        window.alert("Did you know you're not on a secure website? \n"
            +" -This means that what you're doing can be seen, consider the validity of the current webpage");
    }
}

chrome.runtime.onMessage.addListener(function(request, sender) {

    if (request.action == "getSource") {
        if(includesUnsafe(request.source))
            if(sender.tab.url.split("/")[0] != "https:")
            {
                var urlKey = sender.tab.url.split("/")[2];
                storeSiteIfo(urlKey);
            }
    }
});

function includesUnsafe(str){
    var words = ["username","password","email","address","credit","card","payment"];
    str = str.toLowerCase();
    var found = false;
    words.forEach(function(w){
        if(str.includes(w))
            found = true;
    })
    return found;
}



function storeSiteIfo(site) {

    chrome.storage.local.get('sites', function (siteGet) {
        var sites = siteGet.sites;

        var mustAdd = true;
        var NeedsAlert = false;

        if(jQuery.isEmptyObject(sites)) {
            sites = [];
        }

        for(var i = 0; i< sites.length; i++) {
            if (sites[i].Name === site) {
                mustAdd = false;

                if (Date.now() - sites[i].Time > 86400000) {
                    NeedsAlert = true;
                    sites[i].Time = Date.now();
                }
            }
        }

        if(mustAdd)
        {
            NeedsAlert = true;
            var sitePack = {};
            sitePack.Name = site;
            sitePack.Time = Date.now();

            sites.push(sitePack);
        }

        chrome.storage.local.set({'sites': sites}, function (setResult) {
            var source = {
                NeedsAlert: NeedsAlert,
                SiteName: site
            }
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "alert",
                    source: source
                }, function(response) {});
            });
            //TODO remove
            //NeedsAlert = !NeedsAlert;
        });
    });
}

