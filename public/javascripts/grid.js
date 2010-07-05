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
            if(row.status_id == "完了") {
                c = $(this).children();
                c.addClass("task-terminated");
            }
            if(row.priority_id == "最高") {
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
        "id",
        "タスク",
        "詳細",
        "開始日",
        "終了日",
        "プロジェクト",
        "優先度",
        "担当者",
        "ステータス"
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
            name: "priority_id",
            editable: true,
            editrules: { required: true },
            width:100,
            align: "center",
            resizable: false,
            edittype: "select"
        },{
            name: "user_id",
            editable: true,
            editrules: { required: true, edithidden: true },
            width:150,
            resizable: false,
            edittype: "select"
        },{
            name: "status_id",
            editable: true,
            editrules: { required: true, edithidden: true },
            width:100,
            align: "center",
            resizable: true,
            edittype: "select"
        }],
    jsonReader: {
        repeatitems: false,
        root: "rows"
    },
    autowidth: true,
    height: "440px",
    pager: '#tasknav',
    rowNum: 20,
    viewrecords: true,
    caption: "&nbsp;",
    hidegrid: false,
    caption: "ALL",
    viewsortcols: [true,'vertical',true],
    onSelectRow: function(rowid) {
        var treedata = $("#task").getRowData(rowid);
        var st = "#t"+treedata.id;
    }
}

var tasknav = {
    "search": {search: true, view: true},
    "edit": {
        editCaption: "タスクの編集",
        bSubmit: "保存",
        url: '/tasks/edit',
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
            jQuery("#start_dt").datepicker({
                showButtonPanel: true,
                showOn: 'both',
                buttonImage: '/img/icons/calendar.png',
                buttonImageOnly: true,
                numberOfMonths: 3,
                beforeShow: function() {
                    e = $("#end_dt").val();
                    sp = e.split("/");
                    $("#start_dt").datepicker('option', 'maxDate', new Date(parseInt(sp[0]),parseInt(sp[1])-1,parseInt(sp[2])-1));
                }
            });
            jQuery("#end_dt").datepicker({
                showButtonPanel: true,
                showOn: 'both',
                buttonImage: '/img/icons/calendar.png',
                buttonImageOnly: true,
                numberOfMonths: 3,
                beforeShow: function() {
                    e = $("#end_dt").val();
                    sp = e.split("/");
                    $("#start_dt").datepicker('option', 'maxDate', new Date(parseInt(sp[0]),parseInt(sp[1])-1,parseInt(sp[2])-1));
                }
            });
        },
        afterSubmit: function() {
            jQuery("#west-grid").setGridParam({url:"/projects"})
                .trigger("reloadGrid");
                return true;
            }
    },
    "add": {
        addCaption: "タスクの追加",
        bSubmit: "登録",
        url: '/tasks/add',
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
            get_init_data("/projects/get_project_list", "project_id");

        },
        afterShowForm: function(){
            $("#start_dt").datepicker('option', 'maxDate', null);
            $("#end_dt").datepicker('option', 'minDate', null);
            $("#start_dt").datepicker({
                showButtonPanel: true,
                showOn: 'both',
                buttonImage: '/img/icons/calendar.png',
                buttonImageOnly: true,
                numberOfMonths: 3,
                onClose: function(dateText, inst) {
                    if(dateText != "") {
                        y = parseInt(inst.selectedYear);
                        m = parseInt(inst.selectedMonth);
                        d = parseInt(inst.selectedDay)+1;
                        $("#end_dt").datepicker('option', 'minDate', new Date(y,m,d));
                    }
                }
            });
            $("#end_dt").datepicker({
                showButtonPanel: true,
                showOn: 'both',
                buttonImage: '/img/icons/calendar.png',
                buttonImageOnly: true,
                numberOfMonths: 3,
                onClose: function(dateText, inst) {
                    if(dateText != "") {
                        y = parseInt(inst.selectedYear);
                        m = parseInt(inst.selectedMonth);
                        d = parseInt(inst.selectedDay)-1;
                        $("#start_dt").datepicker('option', 'maxDate', new Date(y,m,d));
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
        caption: "削除の確認",
        msg: "選択したタスクを削除しますか？",
        bSubmit: "削除",
        url: '/tasks/del',
        loadError: function(xhr, st, err) {
            if(xhr.status == 403) {
                logout();
            }
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
    colNames: ["id","プロジェクト", "詳細", "開始日", "終了日"],
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
            width:150,
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
    caption: "プロジェクト",
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
