/**
 */

var version = "0.5";

/**
 * application start.
 */

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
        $("#start_dt").datepicker('option', 'maxDate', null);
        $("#end_dt").datepicker('option', 'minDate', null);
        jQuery("#west-grid").editGridRow("new",{
            addCaption: "プロジェクトの追加",
            bSubmit: "登録",
            url: '/projects/add',
            errorTextFormat: function(xhr) {
                if(xhr.status == 403) {
                    logout();
                }
                return true;
            },
            reloadAfterSubmit: true,
            closeAfterAdd: true,
            closeOnEscape: true,
            afterShowForm: function(){
                jQuery("#start_dt").datepicker({
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
                jQuery("#end_dt").datepicker({
                    showButtonPanel: true,
                    showOn: 'both',
                    buttonImage: '/img/icons/calendar.png',
                    buttonImageOnly: true,
                    showButtonPanel: true,
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
                url: '/projects/del',
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
    $.getJSON('/tasks/get_task/'+rowid, function(json) {
        task = new Array;
        f = "";
        t = "";
        for(i=0,l=json.rows.length; i < l; i++) {
            d = json.rows[i].cell;
            s = d[3].replace(/-/g, "");
            e = d[4].replace(/-/g, "");
            c = {
                'titles': d[1],
                'start_date': s,
                'end_date': e,
                'priority': d[6],
                'user': d[7],
                'status': d[8]
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
                location.href="/users/logout";
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
    h = '<div title="パスワード変更" class="ui-jqdialog-content ui-widget-content" id="editcntwest-grid"><span><form style="overflow: auto; width: 100%; position: relative; height: auto;" class="FormGrid" id="FrmGrid_change_password" name="FormPost"><table cellspacing="0" border="0" cellpading="0" class="EditTable" id="TblGrid_west-grid"><tbody><tr style="display: none;" id="FormError"><td colspan="2" class="ui-state-error"/></tr><tr rowpos="1" class="FormData" id="tr_old_password"><td class="CaptionTD ui-widget-content">旧パスワード</td><td style="white-space: pre;" class="DataTD ui-widget-content"> <input type="password" size="12" id="old_password" name="old_password" class="FormElement"/></td></tr><tr rowpos="1" class="FormData" id="tr_new_password"><td class="CaptionTD ui-widget-content">新パスワード</td><td style="white-space: pre;" class="DataTD ui-widget-content"> <input type="password" size="12" id="new_password" name="new_password" class="FormElement"/></td></tr></tbody></table></form></span></div>';

    function checkLength(o, n, min, max) {
        if(o.val().length > max || o.val().length < min ) {
            appendErr("3文字以上、20文字以内で入力してください");
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
        if(o.val() == n.val()) {
            appendErr("新旧パスワードが同じです");
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
        //height:105,
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
                old_pass = $("#old_password");
                new_pass = $("#new_password");
                bvalid = bvalid && checkLength(old_pass, "旧パスワード",3,20);
                bvalid = bvalid && checkLength(new_pass, "新パスワード",3,20);

                bvalid = bvalid && checkRegexp(old_pass,/^([0-9a-za-z])+$/);
                bvalid = bvalid && checkRegexp(new_pass,/^([0-9a-za-z])+$/);

                bvalid = bvalid && checkCompare(old_pass, new_pass);
                f = $(this);
                d = {
                    'old_password': old_pass.val(),
                    'new_password': new_pass.val()
                };

                if(bvalid) {
                    $.ajax({
                        type: 'POST',
                        url: '/users/change_password',
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
    //get_init_data("/projects/get_project_list", "project_id");
    get_init_data("/priorities/get_priority",   "priority_id");
    get_init_data("/users/get_user",            "user_id");
    get_init_data("/statuses/get_status",       "status_id");
}

function get_init_data(url, data) {
    var label = data;
    $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        async: false,
        label: data,
        success: function(msg){
            $("#task").setColProp(this.label, {editoptions: msg});
        }
    });
}

function edit_project (rowid) {
    jQuery("#west-grid").editGridRow(rowid, {
        editCaption: "プロジェクトの編集",
        bSubmit: "保存",
        url: '/projects/edit',
        errorTextFormat: function(xhr) {
            if(xhr.status == 403) {
                logout();
            }
            return true;
        },
        reloadAfterSubmit:false,
        closeAfterEdit:true,
        closeOnEscape: true,
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
                showButtonPanel: true,
                numberOfMonths: 3,
                beforeShow: function(i) {
                    s = $("#start_dt").val();
                    console.log(s);
                    sp = s.split("/");
                    $("#end_dt").datepicker('option', 'minDate', new Date(parseInt(sp[0]),parseInt(sp[1])-1,parseInt(sp[2])+1));
                }
            });
        }
    });
}
