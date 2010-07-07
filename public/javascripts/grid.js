var task = {
    url: "/tasks",
    datatype: "json",
    height: 'auto',
    loadComplete: function() {
        pane = $("#mainContent");
        view = $("#task");
        view.setGridWidth(pane.attr("clientWidth")-2);
        $("#task tr").each(function(i){
            id = $(this).attr("id");
            row = $("#task").getRowData(id);
            if(row.status_id == 3) {
                c = $(this).children();
                c.addClass("task-terminated");
            }
            if(row.priority_id == 0) {
                c = $(this).children();
                c.addClass("task-highest");
            }
        });
    },
    loadError: function(xhr, st, err) {
        if(xhr.status == 403) {
            logout();
        }
    },
    colNames: [
        $l.task.column.id,
        $l.task.column.task,
        $l.task.column.description,
        $l.task.column.start,
        $l.task.column.end,
        $l.task.column.project,
        $l.task.column.priority,
        $l.task.column.owner,
        $l.task.column.status,
        $l.task.column.priorityid,
        $l.task.column.ownerid,
        $l.task.column.statusid
    ],
    colModel: [
        {
            name: "id",
            width:1,
            hidden:true,
            key:true,
            search: false
        },{
            name: "name",
            editable:true,
            editoptions: {size:50},
            editrules: { required: true },
            resizable: true
        },{
            name: "description",
            editable:true,
            editoptions: { size:200 },
            hidden: true,
            editrules: {
                required: true,
                edithidden: true
            },
            width: 150,
            resizable: true,
            edittype: "textarea"
        },{
            name: "start_on",
            editable: true,
            editoptions: { size:12 },
            formatter:'date',
            editrules: { required: true, },
            width:150,
            align: "center",
            resizable: false,
            width: 100
        },{
            name: "end_on",
            editable: true,
            editoptions: { size:12 },
            formatter:'date',
            editrules: { required: true, },
            width:150,
            align: "center",
            resizable: false,
            width: 100
        },{
            name: "project_id",
            hidden:true,
            editable: true,
            editrules: { required: true, edithidden: true },
            width:150,
            resizable: false,
            edittype: "select"
        },{
            name: "priority_name",
            editable: false,
            editrules: { required: true },
            width:100,
            align: "center",
            resizable: false,
            edittype: "select"
        },{
            name: "last_name",
            editable: false,
            editrules: { required: true, edithidden: true },
            width:150,
            resizable: false,
            edittype: "select"
        },{
            name: "status_name",
            editable: false,
            editrules: { required: true, edithidden: true },
            width:100,
            align: "center",
            resizable: true,
            edittype: "select"
        },{
            name: "priority_id",
            hidden:true,
            editable: true,
            editrules: { required: true, edithidden: true },
            edittype: "select"
        },{
            name: "user_id",
            hidden:true,
            editable: true,
            editrules: { required: true, edithidden: true },
            edittype: "select"
        },{
            name: "status_id",
            hidden:true,
            editable: true,
            editrules: { required: true, edithidden: true },
            edittype: "select"
        }],
    jsonReader: {
        repeatitems: false,
        root: "rows"
    },
    autowidth: true,
    pager: '#tasknav',
    viewrecords: false,
    pgbuttons: false,
    pginput: false,
    rowNum: 2000,
    caption: "&nbsp;",
    hidegrid: false,
    caption: "ALL",
    viewsortcols: [true,'vertical',true],
    onSelectRow: function(rowid) {
        var treedata = $("#task").getRowData(rowid);
        var st = "#t"+treedata.id;
    },
    ondblClickRow: function(rowid) {
        edit_task(rowid);
    },
    prmNames: {
        page:"page",
        rows:"rows",
        sort: "sort",
        order: "order",
        search:"_search",
        nd:"nd",
        id:"id",
        oper:"oper",
        editoper:"edit",
        addoper:"add",
        deloper:"del",
        subgridid:"id",
        npage: null,
        totalrows:"totalrows"
    }
}

var tasknav = {
    "param": {search: false, view: false},
    "edit": {
        editCaption: $l.task.edit.caption,
        bSubmit: $l.task.edit.button,
        mtype: 'PUT',
        reloadAfterSubmit:true,
        closeAfterEdit:true,
        closeOnEscape: true,
        loadError: function(xhr, st, err) {
            if(xhr.status == 403) {
                logout();
            }
        },
        beforeInitData: function() {
            get_init_data("/projects", "project_id");
        },
        afterShowForm: function(){
            jQuery("#start_on").datepicker({
                showButtonPanel: true,
                showOn: 'both',
                buttonImage: '/images/icons/calendar.png',
                buttonImageOnly: true,
                numberOfMonths: 3,
                beforeShow: function() {
                    e = $("#end_on").val();
                    sp = e.split("/");
                    $("#start_on").datepicker('option', 'maxDate', new Date(parseInt(sp[0]),parseInt(sp[1])-1,parseInt(sp[2])-1));
                }
            });
            jQuery("#end_on").datepicker({
                showButtonPanel: true,
                showOn: 'both',
                buttonImage: '/images/icons/calendar.png',
                buttonImageOnly: true,
                numberOfMonths: 3,
                beforeShow: function() {
                    e = $("#end_on").val();
                    sp = e.split("/");
                    $("#start_on").datepicker('option', 'maxDate', new Date(parseInt(sp[0]),parseInt(sp[1])-1,parseInt(sp[2])-1));
                }
            });
        },
        onclickSubmit: function(params, data){
            this.url = "/tasks/"+data.id;
            return {
                'oper': "",
                'task[id]': data.id,
                'task[name]': data.name,
                'task[description]': data.description,
                'task[start_on]': data.start_on,
                'task[end_on]': data.end_on,
                'task[project_id]': data.project_id,
                'task[priority_id]': data.priority_id,
                'task[user_id]': data.user_id,
                'task[status_id]': data.status_id
            };
        },
        afterSubmit: function(res, data) {
            jQuery("#west-grid").setGridParam({url:"/projects"})
                .trigger("reloadGrid");
                return true;
        }
    },
    "add": {
        addCaption: $l.task.add.caption,
        bSubmit: $l.task.add.button,
        url: '/tasks',
        reloadAfterSubmit: true,
        closeAfterAdd: true,
        closeOnEscape: true,
        height:280,
        loadError: function(xhr, st, err) {
            if(xhr.status == 403) {
                logout();
            }
        },
        beforeInitData: function() {
            get_init_data("/projects", "project_id");

        },
        onclickSubmit: function(params, data){
            return {
                'oper': "",
                'task[name]': data.name,
                'task[description]': data.description,
                'task[start_on]': data.start_on,
                'task[end_on]': data.end_on,
                'task[project_id]': data.project_id,
                'task[priority_id]': data.priority_id,
                'task[user_id]': data.user_id,
                'task[status_id]': data.status_id
            };
        },
        afterShowForm: function(){
            $("#start_on").datepicker('option', 'maxDate', null);
            $("#end_on").datepicker('option', 'minDate', null);
            $("#start_on").datepicker({
                showButtonPanel: true,
                showOn: 'both',
                buttonImage: '/images/icons/calendar.png',
                buttonImageOnly: true,
                numberOfMonths: 3,
                onClose: function(dateText, inst) {
                    if(dateText != "") {
                        y = parseInt(inst.selectedYear);
                        m = parseInt(inst.selectedMonth);
                        d = parseInt(inst.selectedDay)+1;
                        $("#end_on").datepicker('option', 'minDate', new Date(y,m,d));
                    }
                }
            });
            $("#end_on").datepicker({
                showButtonPanel: true,
                showOn: 'both',
                buttonImage: '/images/icons/calendar.png',
                buttonImageOnly: true,
                numberOfMonths: 3,
                onClose: function(dateText, inst) {
                    if(dateText != "") {
                        y = parseInt(inst.selectedYear);
                        m = parseInt(inst.selectedMonth);
                        d = parseInt(inst.selectedDay)-1;
                        $("#start_on").datepicker('option', 'maxDate', new Date(y,m,d));
                    }
                }
            });
            rowid = $("#west-grid").getGridParam('selrow');
            data = $("#west-grid").getRowData(rowid);
            $("#project_id").val(data.id);
            a = "";
        }
    },
    "del": {
        caption: $l.task.delete.caption,
        msg: $l.task.delete.msg,
        bSubmit: $l.task.delete.button,
        mtype: "DELETE",
        loadError: function(xhr, st, err) {
            if(xhr.status == 403) {
                logout();
            }
        },
        beforeSubmit: function(id) {
            this.url = '/tasks/'+id;
            return [true,""];
        },
        reloadAfterSubmit:false,
        closeOnEscape: true,
        closeAfterEdit:true
    },
    "search": {
        sopt: ["cn"]
    }
};

var westgrid = {
    url: "/projects",
    datatype: "json",
    height: "auto",
    loadui: "disable",
    colNames: [
        $l.project.column.id,
        $l.project.column.project,
        $l.project.column.detail,
        $l.project.column.start,
        $l.project.column.end
    ],
    colModel: [
        {
            name: "id",
            width:1,
            hidden:true,
            key:true
        },{
            name: "name",
            editable:true,
            editoptions: {size:12},
            editrules: {
                required: true
            },
            width:232,
            resizable: false,
            sortable:false
        },{
            name: "description",
            hidden: true,
            editable:true,
            editoptions: {
                size:200
            },
            editrules: {
                required: true,
                edithidden: true
            },
            resizable: false,
            sortable: false,
            edittype: "textarea"
        },{
            name: "start_on",
            hidden: true,
            editable: true,
            editoptions: {
                size:12
            },
            formatter:'date',
            editrules: {
                required: true,
                edithidden: true
            },
            resizable: false,
            sortable: false
        },{
            name: "end_on",
            hidden: true,
            editable: true,
            editoptions: {
                size:12
            },
            formatter:'date',
            editrules: {
                required: true,
                edithidden: true
            },
            resizable: false,
            sortable: false
        }
    ],
    caption: $l.project.caption,
    hidegrid: false,
    treeGrid: true,
    ExpandColumn: "name",
    autowidth: true,
    pager: false,
    rowNum: 200,
    jsonReader: {
        repeatitems: false,
        root: "rows"
    },
    editurl: "/projects/edit",
    loadComplete: function() {
        pane = $(".ui-layout-west");
        view = $("#west-grid");
        view.setGridWidth(pane.attr("clientWidth")-1);
        var rowid = jQuery("#west-grid").getGridParam('selrow');
        if(rowid) {
        }else{
            $("#west-grid").setSelection(0);
            title = $("#mainContent .ui-jqgrid-title:first").text();
            gantt_show(0, title);
        }
    },
    loadError: function(xhr, st, err) {
        if(xhr.status == 403) {
            logout();
        }
    },
    ondblClickRow: function(rowid) {
        edit_project(rowid);
    },
    onSelectRow: function(rowid) {
        var treedata = $("#west-grid").getRowData(rowid);
        var st = "#t"+treedata.id;
        current = $("#mainContent .ui-jqgrid-title:first").text();
        if(treedata.title != current) {
            jQuery("#task").setGridParam({
                url: "/projects/"+treedata.id+"/tasks"
            })
            .setCaption(treedata.title)
            .trigger("reloadGrid");
            gantt_show(treedata.id, treedata.title);
        }
    }
}
