/**
 */

var version = "0.5";

/**
 * application start.
 */

var $priorities
var $users
var $statuses
    /* initial data load. */
    initalize();

$(document).ready(function () {


    /* レイアウト */
    outerLayout = $('body').layout(layoutSettings);

    /* タスクGrid */
    $("#task").jqGrid(task).navGrid('#tasknav', tasknav.search, tasknav.edit, tasknav.add, tasknav.del, tasknav.search);

    /* プロジェクトツリー */
    $("#west-grid").jqGrid(westgrid);

    /**
     * グローバル ツールバー
     */
    $("#new-project").click(function(){
        $("#start_on").datepicker('option', 'maxDate', null);
        $("#end_on").datepicker('option', 'minDate', null);
        jQuery("#west-grid").editGridRow("new",{
            addCaption: "プロジェクトの追加",
            bSubmit: "登録",
            url: '/projects',
            errorTextFormat: function(xhr) {
                if(xhr.status == 403) {
                    logout();
                }
                return true;
            },
            reloadAfterSubmit: true,
            closeAfterAdd: true,
            closeOnEscape: true,
            onclickSubmit: function(params, data){
                return {
                    'oper': "",
                    'project[name]': data.name,
                    'project[description]': data.description,
                    'project[start_on]': data.start_on,
                    'project[end_on]': data.end_on
                };
            },
            afterShowForm: function(){
                jQuery("#start_on").datepicker({
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
                jQuery("#end_on").datepicker({
                    showButtonPanel: true,
                    showOn: 'both',
                    buttonImage: '/images/icons/calendar.png',
                    buttonImageOnly: true,
                    showButtonPanel: true,
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
            }
        });
    });
    $("#edit-project").click(function(){
        var rowid = jQuery("#west-grid").getGridParam('selrow');
        if(rowid != null && rowid != 0) {
            edit_project(rowid);
            }else{
                alert_dlg("エラー", "プロジェクトを選択してください");
            }
    });
    $("#del-project").click(function(){
        var rowid = jQuery("#west-grid").getGridParam('selrow');
        if(rowid != null && rowid != 0) {
            jQuery("#west-grid").delGridRow(rowid, {
                caption: "削除の確認",
                msg: "選択したプロジェクトを削除しますか？",
                bSubmit: "削除",
                url: '/projects/'+rowid,
                mtype: "DELETE",
                errorTextFormat: function(xhr) {
                    if(xhr.status == 403) {
                        logout();
                    }
                    return true;
                },
                reloadAfterSubmit:false,
                afterComplete: function() {
                    $("#west-grid").setSelection(0);
                },
                closeOnEscape: true,
                closeAfterEdit:true
            })
            }else{
                alert_dlg("エラー", "プロジェクトを選択してください");
            }
    });
    $("#chg-pass").click(function(){
        change_password("パスワード変更", "ログアウトしますか？");
    });

    $("#view-gantt").live('click', toggle_btn);

    $("#logout").click(function(){
        confirm_dlg("確認", "ログアウトしますか？");
    });
    init();
});

function gantt_show(rowid, project_name) {
    /* ガントチャート*/
    var data;
    if(rowid == 0) {
        url = '/tasks';
    }else{
        url = '/projects/'+rowid+'/tasks';
    }
    $.getJSON(url, function(json) {
        task = new Array;
        f = "";
        t = "";
        for(i=0,l=json.rows.length; i < l; i++) {
            d = json.rows[i];
            s = d["start_on"].replace(/-/g, "");
            e = d["end_on"].replace(/-/g, "");
            pr = decode($priorities, d["priority_id"]);
            us = decode($users, d["user_id"]);
            st = decode($statuses, d["status_id"]);
            c = {
                'titles': d["name"],
                'start_date': s,
                'end_date': e,
                'priority': pr,
                'user': us,
                'status': st
            };
            task.push(c);
            if(!f || f > s) {
                f = s;
            }
            if(!t || t < e) {
                t = e;
            }
        }
        $("#gantt").gantt({
            'titles': new Array('タスク'),
            'defaultRange': 1,
            'tasks': task,
            'from': f,
            'to': t
        });
    });
    $("#gantt_view span.ui-jqgrid-title").text(project_name);
    $("#ganttnav #prev").click(function() {
        $("#gantt").setPeriod('-1');
    });
    $("#ganttnav #prev-week").click(function() {
        $("#gantt").setPeriod('-7');
    });
    $("#ganttnav #next").click(function() {
        $("#gantt").setPeriod('+1');
    });
    $("#ganttnav #next-week").click(function() {
        $("#gantt").setPeriod('+7');
    });
}

function toggle_btn(e) {
    g = $("#view-gantt");
    t = $("#view-task");
    id = e.target.id;
    /* 一覧 */
    if(id == "view-task") {
        g.live('click', toggle_btn);
        t.addClass('hover');
        t.die('click', toggle_btn);
        g.removeClass('hover');
    }else{
        /* ガント */
        t.live('click', toggle_btn);
        g.addClass('hover');
        g.die('click', toggle_btn);
        t.removeClass('hover');
    }
    $("#task_view").toggle();
    $("#gantt_view").toggle();
}

function confirm_dlg(title, msg) {
    span = $("<span></span>");
    span.addClass('ui-icon ui-icon-alert');
    span.append(msg);
    tag = $("<div></div>");
    tag.attr('title', title);
    tag.append(span);
    tag.append(msg);
    tag.dialog({
        bgiframe: true,
        resizable: false,
        height:140,
        modal: true,
        overlay: {
            backgroundColor: '#000',
            opacity: 0.5
        },
        buttons: {
            Cancel: function() {
                $(this).dialog('close');
            },
            Ok: function() {
                $(this).dialog('close');
                location.href="/logout";
            }
        }
    });
}

function alert_dlg(title, msg) {
    span = $("<span></span>");
    p = $("<p></p>");
    span.addClass('ui-icon ui-icon-alert');
    tag = $("<div></div>");
    tag.attr('title', title);
    p.append(span);
    p.append(msg);
    tag.append(p);
    tag.dialog({
        bgiframe: true,
        modal: true,
        height: 100,
        overlay: {
            backgroundColor: '#000',
            opacity: 0.5
        },
        buttons: {
            Ok: function() {
                $(this).dialog('close');
            }
        }
    });
}

function change_password() {
    h = '<div title="パスワード変更" class="ui-jqdialog-content ui-widget-content" id="editcntwest-grid"><span><form style="overflow: auto; width: 100%; position: relative; height: auto;" class="FormGrid" id="FrmGrid_change_password" name="FormPost"><table cellspacing="0" border="0" cellpading="0" class="EditTable" id="TblGrid_west-grid"><tbody><tr style="display: none;" id="FormError"><td colspan="2" class="ui-state-error"/></tr><tr rowpos="1" class="FormData" id="tr_password"><td class="CaptionTD ui-widget-content">パスワード</td><td style="white-space: pre;" class="DataTD ui-widget-content"> <input type="password" size="12" id="password" name="password" class="FormElement"/></td></tr><tr rowpos="1" class="FormData" id="tr_password_confirmation"><td class="CaptionTD ui-widget-content">パスワード（確認）</td><td style="white-space: pre;" class="DataTD ui-widget-content"> <input type="password" size="12" id="password_confirmation" name="password_confirmation" class="FormElement"/></td></tr></tbody></table></form></span></div>';

    function checkLength(o, n, min, max) {
        if(o.val().length > max || o.val().length < min ) {
            appendErr(min+"文字以上、"+max+"文字以内で入力してください");
            return false;
        }
        return true;
    }
    function checkRegexp(o, regexp, n) {
        if(!(regexp.test(o.val()))) {
            appendErr("英数字のみ使用してください");
            return false;
        }
        return true;
    }
    function checkCompare(o, n) {
        if(o.val() != n.val()) {
            appendErr("パスワード不一致");
            return false;
        }
        return true;
    }
    function appendErr (msg) {
        $("#FormError td").text(msg);
        $("#FormError").toggle();
    }

    $(h).dialog({
        bgiframe: true,
        resizable: false,
        minHeight:10,
        modal: true,
        overlay: {
            backgroundcolor: '#000',
            opacity: 0.5
        },
        buttons: {
            'キャンセル': function() {
                $(this).dialog('close');
            },
            '変更する': function() {
                $("#FormError").css('display', 'none');
                var bvalid = true;
                password = $("#password");
                password_confirmation = $("#password_confirmation");
                bvalid = bvalid && checkLength(password, "パスワード",3,20);
                bvalid = bvalid && checkLength(password_confirmation, "パスワード（確認）",3,20);

                bvalid = bvalid && checkRegexp(password,/^([0-9a-za-z])+$/);
                bvalid = bvalid && checkRegexp(password_confirmation,/^([0-9a-za-z])+$/);

                bvalid = bvalid && checkCompare(password, password_confirmation);
                f = $(this);
                d = {
                    'password': password.val(),
                    'password_confirmation': password_confirmation.val()
                };

                if(bvalid) {
                    $.ajax({
                        type: 'POST',
                        url: '/user',
                        data: d,
                        success: function(msg) {
                            if(msg == "false") {
                                appendErr("パスワードの変更に失敗しました");
                            }else{
                                f.dialog("close");
                            }
                        },
                        error: function(msg) {
                            logout();
                        }
                    });
                }
            }
        },
        close: function(e, ui) {
            $(this).remove();
        }
    });
}

function logout() {
    location.href="/users/login";
}

function pickdates(id){
    jQuery(id).datepicker({dateFormat:"yy-mm-dd"});
}

function init() {
    get_init_data("/priorities",   "priority_id");
    get_init_data2("/users",            "user_id");
    get_init_data("/statuses",       "status_id");
}

function get_init_data(url, data) {
    var label = data;
    $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        async: false,
        label: data,
        success: function(obj){
            opt = "";
            for(var i=0; i<obj.length; i++) {
                opt += obj[i].id+":"+obj[i].name;
                if(i+1 < obj.length) opt +=";";
            }
            $("#task").setColProp(this.label, {editoptions: {value:opt}});
        }
    });
}
function get_init_data2(url, data) {
    var label = data;
    $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        async: false,
        label: data,
        success: function(obj){
            opt = "";
            for(var i=0; i<obj.length; i++) {
                opt += obj[i].id+":"+obj[i].last_name+" "+obj[i].first_name;
                if(i+1 < obj.length) opt +=";";
            }
            $("#task").setColProp(this.label, {editoptions: {value:opt}});
        }
    });
}
function get_init_data3(url, data) {
    var label = data;
    $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        async: false,
        label: data,
        success: function(o){
            opt = "";
            obj = o["rows"];
            for(var i=0; i<obj.length; i++) {
                opt += obj[i].id+":"+obj[i].name;
                if(i+1 < obj.length) opt +=";";
            }
            $("#task").setColProp(this.label, {editoptions: {value:opt}});
        }
    });
}

function edit_project (rowid) {
    jQuery("#west-grid").editGridRow(rowid, {
        editCaption: "プロジェクトの編集",
        bSubmit: "保存",
        url: '/projects/'+rowid,
        mtype: "PUT",
        errorTextFormat: function(xhr) {
            if(xhr.status == 403) {
                logout();
            }
            return true;
        },
        reloadAfterSubmit:false,
        closeAfterEdit:true,
        closeOnEscape: true,
        onclickSubmit: function(params, data){
            return {
                'oper': "",
                'project[id]': data.id,
                'project[name]': data.name,
                'project[description]': data.description,
                'project[start_on]': data.start_on,
                'project[end_on]': data.end_on
            };
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
                showButtonPanel: true,
                numberOfMonths: 3,
                beforeShow: function(i) {
                    s = $("#start_on").val();
                    console.log(s);
                    sp = s.split("/");
                    $("#end_on").datepicker('option', 'minDate', new Date(parseInt(sp[0]),parseInt(sp[1])-1,parseInt(sp[2])+1));
                }
            });
        }
    });
}

function decode(data, id) {
    for(var i=0; i<data.length; i++) {
        if(data[i].id == id && data[i].name != undefined) return data[i].name;
        if(data[i].id == id && data[i].last_name != undefined) return data[i].last_name;
    }
    return false;
}

function initalize() {
    getPriorities();
    getUsers();
    getStatuses();
}

function getPriorities() {
    $.ajax({
        url: '/priorities',
        type: 'GET',
        dataType: 'json',
        async: false,
        success: function(data, sts, req){
            if(sts == "success") {
                $priorities = data;
            }
        }
    });
}
function getUsers() {
    $.ajax({
        url: '/users',
        type: 'GET',
        dataType: 'json',
        async: false,
        success: function(data, sts, req){
            if(sts == "success") {
                $users = data;
            }
        }
    });
}
function getStatuses() {
    $.ajax({
        url: '/statuses',
        type: 'GET',
        dataType: 'json',
        async: false,
        success: function(data, sts, req){
            if(sts == "success") {
                $statuses = data;
            }
        }
    });
}
