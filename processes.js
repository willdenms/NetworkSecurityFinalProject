/**
 * Created by mahowa on 12/7/2016.
 */
//https://developer.chrome.com/extensions/processes#method-getProcessInfo
//chrome.processes

//chrome.processes.getProcessInfo(integer or array of integer processIds, boolean includeMemory, function callback)
//$(document).ready( function () {
//    $('#table_id').DataTable();
//} );
//TODO Get All Processes
//TODO Read Metrics for Network, CPU, And Memory
//TODO Create simple d3 bar charts to display data
//TODO Show all processes in a list box
//TODO Create function to stop processes and remove form listBoxes
//TODO Make LisBox sortable by one of the three Metrics









$(document).ready( function () {
    $('#processes_table').DataTable({
        paging: false,
        bFilter: false,
        bInfo : false
    });
} );