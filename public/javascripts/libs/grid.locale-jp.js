;(function($){
/**
 * jqGrid Japanese Translation
 * OKADA Yoshitada okada.dev@sth.jp
 * http://trirand.com/blog/
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
**/
$.jgrid = {
    defaults : {
        recordtext: "{0}\u4ef6 \uff5e {1}\u4ef6 / {2}件",
        emptyrecords: "\u8868\u793a\u3059\u308b\u30c7\u30fc\u30bf\u306f\u3042\u308a\u307e\u305b\u3093",
        loadtext: "\u8aad\u307f\u8fbc\u307f\u4e2d...",
        pgtext : "ページ {0} of {1}"
    },
    search : {
        caption: "\u691c\u7d22...",
        Find: "\u691c\u7d22",
        Reset: "\u30ea\u30bb\u30c3\u30c8",
        odata : ['\u7b49\u3057\u3044', '\u7b49\u3057\u304f\u306a\u3044', '\u5c0f\u3055\u3044', '\u4ee5\u4e0b','\u5927\u304d\u3044','\u4ee5\u4e0a', '\u59cb\u307e\u308b','\u59cb\u307e\u3089\u306a\u3044','\u542b\u3080','\u542b\u307e\u306a\u3044','\u7d42\u308f\u308b','\u7d42\u308f\u3089\u306a\u3044','\u542b\u3080','\u542b\u307e\u306a\u3044'],
        groupOps: [ { op: "AND", text: "all" }, { op: "OR",  text: "any" }  ],
        matchText: " match",
        rulesText: " rules"
    },
    edit : {
        addCaption: "\u30ec\u30b3\u30fc\u30c9\u8ffd\u52a0",
        editCaption: "\u30ec\u30b3\u30fc\u30c9\u7de8\u96c6",
        bSubmit: "\u9001\u4fe1",
        bCancel: "\u30ad\u30e3\u30f3\u30bb\u30eb",
        bClose: "\u9589\u3058\u308b",
        saveData: "Data has been changed! Save changes?",
        bYes : "Yes",
        bNo : "No",
        bExit : "Cancel",
        msg: {
            required:"\u3053\u306e\u9805\u76ee\u306f\u5fc5\u9808\u3067\u3059\u3002",
            number:"\u6b63\u3057\u3044\u6570\u5024\u3092\u5165\u529b\u3057\u3066\u4e0b\u3055\u3044\u3002",
            minValue:"\u6b21\u306e\u5024\u4ee5\u4e0a\u3067\u5165\u529b\u3057\u3066\u4e0b\u3055\u3044\u3002",
            maxValue:"\u6b21\u306e\u5024\u4ee5\u4e0b\u3067\u5165\u529b\u3057\u3066\u4e0b\u3055\u3044\u3002",
            email: "e-mail\u304c\u6b63\u3057\u304f\u3042\u308a\u307e\u305b\u3093\u3002",
            integer: "\u6b63\u3057\u3044\u6574\u6570\u5024\u3092\u5165\u529b\u3057\u3066\u4e0b\u3055\u3044\u3002",
            date: "\u6b63\u3057\u3044\u5024\u3092\u5165\u529b\u3057\u3066\u4e0b\u3055\u3044\u3002",
            url: "is not a valid URL. Prefix required ('http://' or 'https://')"
        }
    },
    view : {
        caption: "View Record",
        bClose: "Close"
    },
    del : {
        caption: "\u524a\u9664",
        msg: "\u9078\u629e\u3057\u305f\u30ec\u30b3\u30fc\u30c9\u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f",
        bSubmit: "\u524a\u9664",
        bCancel: "\u30ad\u30e3\u30f3\u30bb\u30eb"
    },
    nav : {
        edittext: " ",
        edittitle: "\u9078\u629e\u3057\u305f\u884c\u3092\u7de8\u96c6",
        addtext:" ",
        addtitle: "\u884c\u3092\u65b0\u898f\u8ffd\u52a0",
        deltext: " ",
        deltitle: "\u9078\u629e\u3057\u305f\u884c\u3092\u524a\u9664",
        searchtext: " ",
        searchtitle: "\u30ec\u30b3\u30fc\u30c9\u691c\u7d22",
        refreshtext: "",
        refreshtitle: "\u518d\u8aad\u8fbc",
        alertcap: "\u8b66\u544a",
        alerttext: "\u884c\u3092\u9078\u629e\u3057\u3066\u4e0b\u3055\u3044\u3002",
        viewtext: "",
        viewtitle: "\u8a73\u7d30\u3092\u8868\u793a"
    },
    col : {
        caption: "\u5217\u3092\u8868\u793a\uff0f\u96a0\u3059",
        bSubmit: "\u9001\u4fe1",
        bCancel: "\u30ad\u30e3\u30f3\u30bb\u30eb"
    },
    errors : {
        errcap : "\u30a8\u30e9\u30fc",
        nourl : "URL\u304c\u8a2d\u5b9a\u3055\u308c\u3066\u3044\u307e\u305b\u3093\u3002",
        norecords: "\u51e6\u7406\u5bfe\u8c61\u306e\u30ec\u30b3\u30fc\u30c9\u304c\u3042\u308a\u307e\u305b\u3093\u3002",
        model : "colNames\u306e\u9577\u3055\u304ccolModel\u3068\u4e00\u81f4\u3057\u307e\u305b\u3093\u3002"
    },
    formatter : {
        integer : {thousandsSeparator: " ", defaultValue: '0'},
        number : {decimalSeparator:".", thousandsSeparator: " ", decimalPlaces: 2, defaultValue: '0.00'},
        currency : {decimalSeparator:".", thousandsSeparator: " ", decimalPlaces: 2, prefix: "", suffix:"", defaultValue: '0.00'},
        date : {
            dayNames:   [
                "\u65e5", "\u6708", "\u706b", "\u6c34", "\u6728", "\u91d1", "\u571f",
                "\u65e5", "\u6708", "\u706b", "\u6c34", "\u6728", "\u91d1", "\u571f"
            ],
            monthNames: [
                "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
                "1\u6708", "2\u6708", "3\u6708", "4\u6708", "5\u6708", "6\u6708", "7\u6708", "8\u6708", "9\u6708", "10\u6708", "11\u6708", "12\u6708"
            ],
            AmPm : ["am","pm","AM","PM"],
            S: function (j) {return "\u756a\u76ee";},
            srcformat: 'Y-m-d',
            newformat: 'Y/m/d',
            masks : {
                ISO8601Long:"Y-m-d H:i:s",
                ISO8601Short:"Y-m-d",
                ShortDate: "n/j/Y",
                LongDate: "l, F d, Y",
                FullDateTime: "l, F d, Y g:i:s A",
                MonthDay: "F d",
                ShortTime: "g:i A",
                LongTime: "g:i:s A",
                SortableDateTime: "Y-m-d\\TH:i:s",
                UniversalSortableDateTime: "Y-m-d H:i:sO",
                YearMonth: "F, Y"
            },
            reformatAfterEdit : false
        },
        baseLinkUrl: '',
        showAction: '',
        target: '',
        checkbox : {disabled:true},
        idName : 'id'
    }
};
})(jQuery);
