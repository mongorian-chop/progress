/**
 */

var version = "0.5";

/**
 * application start.
 */
var g;
var $priorities
var $users
var $statuses
/* initial data load. */
initalize();

$(document).ready(function () {


    /* レイアウト */
    outerLayout = $('body').layout(layoutSettings);

    /* タスクGrid */
    $("#task").jqGrid(task).navGrid('#tasknav', tasknav.param, tasknav.edit, tasknav.add, tasknav.del);

    /* プロジェクトツリー */
    $("#west-grid").jqGrid(westgrid);

    /**
     * グローバル ツールバー
     */
    $("#new-project").click(function(){
        $("#start_on").datepicker('option', 'maxDate', null);
        $("#end_on").datepicker('option', 'minDate', null);
        jQuery("#west-grid").editGridRow("new",{
            addCaption: $l.project.add.caption,
            bSubmit: $l.project.add.button,
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
            alert_dlg($l.dialog.error, $l.project.errorMsg);
        }
    });
    $("#del-project").click(function(){
        var rowid = jQuery("#west-grid").getGridParam('selrow');
        if(rowid != null && rowid != 0) {
            jQuery("#west-grid").delGridRow(rowid, {
                caption: $l.project.delete.caption,
                msg: $l.project.delete.msg,
                bSubmit: $l.project.delete.button,
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
            alert_dlg($l.dialog.error, $l.project.errorMsg);
        }
    });
    $("#chg-pass").click(function(){
        change_password($l.account.changepass, $l.account.changepassmsg);
    });

    $("#view-gantt").live('click', toggle_btn);

    $("#logout").click(function(){
        confirm_dlg($l.account.logout, $l.account.logoutmsg);
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
            /*
            pr = decode($priorities, d["priority_id"]);
            us = decode($users, d["user_id"]);
            st = decode($statuses, d["status_id"]);
            */
            c = {
                id: d["id"],
                name: d["name"],
                series: [
                    {
                        name: d["last_name"],
                        start: Date.parseExact(d["start_on"], "yyyy-M-d"),
                        end: Date.parseExact(d["end_on"], "yyyy-M-d")
                    }
                ]
            };
            task.push(c);
            if(!f || f > s) {
                f = s;
                from = d["start_on"];
            }
            if(!t || t < e) {
                t = e;
                to = d["end_on"];
            }

        }
        $("#gantt_view").ganttView({
            data: task,
            start: Date.parseExact(from, "yyyy-M-d"),
            end: Date.parseExact(to, "yyyy-M-d"),
            slideWidth: 900
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
    h = '<div title="'+$l.dialog.password.title+'" class="ui-jqdialog-content ui-widget-content" id="editcntwest-grid"><span><form style="overflow: auto; width: 100%; position: relative; height: auto;" class="FormGrid" id="FrmGrid_change_password" name="FormPost"><table cellspacing="0" border="0" cellpading="0" class="EditTable" id="TblGrid_west-grid"><tbody><tr style="display: none;" id="FormError"><td colspan="2" class="ui-state-error"/></tr><tr rowpos="1" class="FormData" id="tr_password"><td class="CaptionTD ui-widget-content">'+$l.dialog.password.password1+'</td><td style="white-space: pre;" class="DataTD ui-widget-content"> <input type="password" size="12" id="password" name="password" class="FormElement"/></td></tr><tr rowpos="1" class="FormData" id="tr_password_confirmation"><td class="CaptionTD ui-widget-content">'+$l.dialog.password.password1+'</td><td style="white-space: pre;" class="DataTD ui-widget-content"> <input type="password" size="12" id="password_confirmation" name="password_confirmation" class="FormElement"/></td></tr></tbody></table></form></span></div>';

    function checkLength(o, n, min, max) {
        if(o.val().length > max || o.val().length < min ) {
            msg = $l.validate.range.replace(/\{1\}/, min);
            msg = msg.replace(/\{2\}/, max);
            appendErr(msg);
            return false;
        }
        return true;
    }
    function checkRegexp(o, regexp, n) {
        if(!(regexp.test(o.val()))) {
            appendErr($l.validate.alphanum);
            return false;
        }
        return true;
    }
    function checkCompare(o, n) {
        if(o.val() != n.val()) {
            appendErr($l.validate.unmatch);
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
            cancel: function() {
                $(this).dialog('close');
            },
            edit: function() {
                $("#FormError").css('display', 'none');
                var bvalid = true;
                password = $("#password");
                password_confirmation = $("#password_confirmation");
                bvalid = bvalid && checkLength(password, $l.dialog.password.password1,3,20);
                bvalid = bvalid && checkLength(password_confirmation, $l.dialog.password.password2,3,20);

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
                        type: 'PUT',
                        url: '/account',
                        data: d,
                        success: function(msg) {
                            if(msg == "false") {
                                appendErr($l.dialog.password.error);
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
    get_init_data("/users",            "user_id");
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
            o = (obj["rows"]) ? obj["rows"] : obj
            for(var i=0; i<o.length; i++) {
                if(o[i].name === undefined) {
                    opt += o[i].id+":"+o[i].last_name+" "+o[i].first_name;
                }else{
                    opt += o[i].id+":"+o[i].name;
                }
                if(i+1 < o.length) opt +=";";
            }
            $("#task").setColProp(this.label, {editoptions: {value:opt}});
        }
    });
}

function edit_task(rowid) {
    jQuery("#task").editGridRow(rowid, tasknav.edit);
}

function edit_project (rowid) {
    jQuery("#west-grid").editGridRow(rowid, {
        editCaption: $l.project.edit.caption,
        bSubmit: $l.project.edit.button,
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
    getList('priorities');
    getList('users');
    getList('statuses');
}

function getList(t) {
    u = "/"+t;
    d = "$"+t;
    $.ajax({
        url: u,
        type: 'GET',
        dataType: 'json',
        async: false,
        success: function(data, sts, req){
            if(sts == "success") {
                eval(d+" = data");
            }
        }
    });
}
