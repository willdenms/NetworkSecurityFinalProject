/**
 * Created by mahowa on 12/6/2016.
 */
function DOMtoString(document_root) {

    var html = '',
        node = document_root.firstChild;
    while (node) {
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                html += node.outerHTML;
                break;
            case Node.TEXT_NODE:
                html += node.nodeValue;
                break;
            case Node.CDATA_SECTION_NODE:
                html += '<![CDATA[' + node.nodeValue + ']]>';
                break;
            case Node.COMMENT_NODE:
                html += '<!--' + node.nodeValue + '-->';
                break;
            case Node.DOCUMENT_TYPE_NODE:
                // (X)HTML documents are identified by public identifiers
                html += "<!DOCTYPE " + node.name + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '') + (!node.publicId && node.systemId ? ' SYSTEM' : '') + (node.systemId ? ' "' + node.systemId + '"' : '') + '>\n';
                break;
        }
        node = node.nextSibling;
    }
    return html;
}




function onWindowLoad() {

    chrome.runtime.sendMessage({
        action: "getSource",
        source: DOMtoString(document)
    });

}

window.onload = onWindowLoad;

//Create SSL Alert
chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.action === "alert") {
        if(request.source.NeedsAlert) {

            bootbox.confirm({
                title: "Beware: " + request.source.SiteName,
                message: "This site is not secure. Do NOT provide it any personal information or passwords.",
                buttons: {
                    confirm: {
                        label: '<i class="fa fa-check"></i> Im Aware. Let me through.'
                    },
                    cancel: {
                        label: '<i class="fa fa-check"></i> Take me to my safety spot'
                    }

                },
                callback: function (result) {
                    if(!result) {
                        resetSiteNotification(request.source.SiteName);
                        window.location.href = "https://google.com";
                    }

                    else{

                        var notification = {
                            icon: "glyphicon glyphicon-warning-sign",        //Required for notifications.create .
                            title: "SSL Warning:",          //Required for notifications.create
                            message: "This message has been dismissed for 24 hrs for " + request.source.SiteName,        //Required for notifications.create
                        }
                        var settings = {
                            type: "danger"      //Required for notifications.create
                        }

                        $.notify(notification,settings);

                    }
                }
            });

        }
    }
});

function resetSiteNotification(site) {

    chrome.storage.local.get('sites', function (siteGet) {
        var sites = siteGet.sites;

        if(jQuery.isEmptyObject(sites)) {
            sites = [];
        }

        for(var i = 0; i< sites.length; i++) {
            if (sites[i].Name === site) {
                sites[i].Time = Date.now()- 86400000;
            }
        }

        chrome.storage.local.set({'sites': sites}, function (setResult) {

        });
    });
}