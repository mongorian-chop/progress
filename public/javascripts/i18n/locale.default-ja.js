;(function($){
/**
 * Progress Gantt Chart English Translation
 **/
Language = {
    dialog: {
        error: "\u30a8\u30e9\u30fc",
        confirm: "\u78ba\u8a8d",
        cancel: "\u30ad\u30e3\u30f3\u30bb\u30eb",
        change: "\u5909\u66f4",
        password: {
            title: "\u30d1\u30b9\u30ef\u30fc\u30c9\u5909\u66f4",
            password1: "\u30d1\u30b9\u30ef\u30fc\u30c9",
            password2: "\u30d1\u30b9\u30ef\u30fc\u30c9\uff08\u78ba\u8a8d\uff09",
            error: "\u30d1\u30b9\u30ef\u30fc\u30c9\u306e\u5909\u66f4\u306b\u5931\u6557\u3057\u307e\u3057\u305f"
        }
    },
    project :{
        column: {
            id: "ID",
            project: "\u30d7\u30ed\u30b8\u30a7\u30af\u30c8",
            detail: "\u8a73\u7d30",
            start: "\u958b\u59cb\u65e5",
            end: "\u7d42\u4e86\u65e5"
        },
        add: {
            caption: "\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u306e\u8ffd\u52a0",
            button: "\u767b\u9332",
        },
        edit: {
            caption: "\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u306e\u7de8\u96c6",
            button: "\u4fdd\u5b58",
        },
        delete: {
            caption: "\u524a\u9664\u306e\u78ba\u8a8d",
            msg: "\u9078\u629e\u3057\u305f\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f",
            button: "\u524a\u9664",
        },
        caption: "\u30d7\u30ed\u30b8\u30a7\u30af\u30c8",
        errorMsg: "\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3092\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044"
    },
    account: {
        changepass: "\u30d1\u30b9\u30ef\u30fc\u30c9\u5909\u66f4",
        changepassmsg: "\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u5909\u66f4\u3057\u307e\u3059\u304b\uff1f",
        logout: "\u30ed\u30b0\u30a2\u30a6\u30c8",
        logoutmsg: "\u30ed\u30b0\u30a2\u30a6\u30c8\u3057\u307e\u3059\u304b\uff1f"
    },
    task: {
        column: {
            id: "ID",
            task: "\u30bf\u30b9\u30af",
            detail: "\u8a73\u7d30",
            start: "\u958b\u59cb\u65e5",
            end: "\u7d42\u4e86\u65e5",
            project: "\u30d7\u30ed\u30b8\u30a7\u30af\u30c8",
            priority: "\u512a\u5148\u5ea6",
            owner: "\u62c5\u5f53\u8005",
            status: "\u30b9\u30c6\u30fc\u30bf\u30b9",
            priorityid: "\u512a\u5148\u5ea6",
            ownerid: "\u62c5\u5f53\u8005",
            statusid: "\u30b9\u30c6\u30fc\u30bf\u30b9"
        },
        add: {
            caption: "\u30bf\u30b9\u30af\u306e\u8ffd\u52a0",
            button: "\u767b\u9332"
        },
        edit: {
            caption: "\u30bf\u30b9\u30af\u306e\u7de8\u96c6",
            button: "\u4fdd\u5b58"
        },
        delete: {
            caption: "\u524a\u9664\u306e\u78ba\u8a8d",
            button: "\u524a\u9664",
            msg: "\u9078\u629e\u3057\u305f\u30bf\u30b9\u30af\u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f"
        },
        caption: "\u5168\u30bf\u30b9\u30af",
    },
    gantt: {
        caption:  "\u30ac\u30f3\u30c8\u30c1\u30e3\u30fc\u30c8",
        title: "\u30bf\u30b9\u30af"
    },
    layout: {
        toggle: {
            open: "\u9589\u3058\u308b",
            close: "\u958b\u304f",
        },
        resize: "\u30b5\u30a4\u30ba\u3092\u5909\u66f4"
    },
    validate: {
        range: "{1}\u6587\u5b57\u4ee5\u4e0a\u3001{2}\u6587\u5b57\u4ee5\u5185\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044",
        alphanum: "\u82f1\u6570\u5b57\u306e\u307f\u4f7f\u7528\u3057\u3066\u304f\u3060\u3055\u3044",
        unmatch: "\u30d1\u30b9\u30ef\u30fc\u30c9\u4e0d\u4e00\u81f4",
    }
};
})(jQuery);
$l = Language;
