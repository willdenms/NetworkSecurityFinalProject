// Saves options to chrome.storage
function save_options() {
  var checkedAlerts = getCheckedBoxes("alertModals");
  chrome.storage.sync.set({
    checkedAlerts: checkedAlerts
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default alerts to none and likesColor = true.
  chrome.storage.sync.get({
    checkedAlerts: []
  }, function(items) {
    document.getElementByName('alertModals') = [];
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);

function getCheckedBoxes(checkboxName){
      var checkboxes = document.getElementByName(checkboxName);
      var checkBoxexChecked = [];
      for(var i=0; i<checkboxes.length; i++){
        if(checkboxes[i].checked){
          checkBoxexChecked.push(checkboxes[i]);
        }
      }
      return checkBoxexChecked.length > 0 ? checkBoxexChecked : null;
    }
