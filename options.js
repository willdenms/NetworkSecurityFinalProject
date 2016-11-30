// Saves options to chrome.storage.sync.
function save_options() {
  var alertChecks = get_checked_boxes("alertSettings");
  chrome.storage.sync.set({'alertChecks': alertChecks}, function() {
    console.log("Checked Boxes:"+alertChecks);
    console.log("Box 1: "+alertChecks[0]);
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}
// Pass the checkbox name to the function
function get_checked_boxes(chkboxName) {
  var checkboxes = document.getElementsByName(chkboxName);
  var checkboxesChecked = [];
  // loop over them all
  for (var i=0; i<checkboxes.length; i++) {
     // And stick the checked ones onto an array...
     if (checkboxes[i].checked) {
        checkboxesChecked.push(checkboxes[i].id);
     }
  }
  // Return the array if it is non-empty, or null
  return checkboxesChecked.length > 0 ? checkboxesChecked : null;
}
function set_checkboxes(){

}
// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options(optionType) {
  chrome.storage.sync.get(null, function(data){
    for( var i = 0; i < data[optionType].length; i++){
      document.getElementById(data[optionType][i]).checked = true;
    }
  });
}
document.getElementById('save-alerts').addEventListener('click',
    save_options);
