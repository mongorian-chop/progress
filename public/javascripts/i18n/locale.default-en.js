;(function($){
/**
 * Progress Gantt Chart English Translation
 **/
Language = {
    dialog: {
        error: "error",
        confirm: "confirm",
        cancel: "cancel",
        change: "change",
        password: {
            title: "Change Password",
            password1: "New Password",
            password2: "Retype New Password",
            error: "Change Password Faild."
        }
    },
    project :{
        column: {
            id: "Id",
            project: "Project",
            detail: "Detail",
            start: "Start",
            end: "End"
        },
        add: {
            caption: "Add Project",
            button: "Regist",
        },
        edit: {
            caption: "Edit Project",
            button: "Save",
        },
        delete: {
            caption: "Delete Project",
            msg: "Are you sure you want to delete the selected project?",
            button: "Delete",
        },
        caption: "Project",
        errorMsg: "Please select the project."
    },
    account: {
        changepass: "Change Password",
        changepassmsg: "Is the password changed?",
        logout: "logout",
        logoutmsg: "Do you logout?"
    },
    task: {
        column: {
            id: "Id",
            task: "Task",
            detail: "Detail",
            start: "Start",
            end: "End",
            project: "Project",
            priority: "Priority",
            owner: "Owner",
            status: "Status",
            priorityid: "Priority",
            ownerid: "Owner",
            statusid: "Status"
        },
        add: {
            caption: "Add Task",
            button: "Regist"
        },
        edit: {
            caption: "Edit Task",
            button: "Save"
        },
        delete: {
            caption: "Delete Task",
            button: "Delete",
            msg: "Is the task of selecting it deleted?"
        },
        caption: "ALL",
    },
    gantt: {
        caption:  "Gantt Chart",
    },
    layout: {
        toggle: {
            open: "Close",
            close: "Open",
        },
        resize: "Resize"
    },
    validate: {
        range: "character range {1} to {2}.",
        alphanum: "alphanum only.",
        unmatch: "The two passwords do not match.",
    }
};
})(jQuery);
$l = Language;
