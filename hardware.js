function loadData(){
  chrome.system.cpu.getInfo(function(data){
    document.getElementById("arc-name").textContent = data['archName'];
    document.getElementById("model-name").textContent = data['modelName'];
    document.getElementById("proc-name").textContent = data['numOfProcessors'];
  });
  chrome.system.storage.getInfo(function(data){
    var mem1 = data[0];
    document.getElementById("stor-name").textContent = mem1['name'];
    document.getElementById("stor-cap").textContent = mem1['capacity']+" bytes";
    var type = mem1['type'];
    if(type == "fixed"){
      document.getElementById("stor-type").textContent = "Hard Drive or SSD";
    }else if(type == "removable"){
      document.getElementById("stor-type").textContent = "USB";
    }else{
      document.getElementById("stor-type").textContent = "Unknown";
    }
  });
  chrome.system.memory.getInfo(function(data){
    document.getElementById("mem-cap").textContent = data['capacity']+" bytes";
  });
}



$(document).ready(loadData())
