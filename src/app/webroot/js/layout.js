var layoutSettings = {
    name: "appLayout",
    defaults: {
        resizerClass:           "ui-state-default"
    },
    north: {
        spacing_open:           0,
        togglerLength_open:     0,
        togglerLength_closed:   -1,
        resizable:              false,
        slidable:               false,
        fxName:                 "none",
        closable:               false
    },
    west: {
        size:                   250,
        spacing_closed:         15,
        togglerLength_closed:   15,
        togglerAlign_closed:    "top",
        togglerLength_open:     0,
        togglerTip_open:        "閉じる",
        togglerTip_closed:      "開く",
        resizerTip_open:        "サイズを変更",
        slideTrigger_open:      "click",
        initClosed:             false,
        closable:               false,
        fxSettings_open:        { easing: "easeOutBounce" },
        onresize: function (pane, $Pane) {
            sh = $(".ui-layout-west").attr("scrollHeight");
            ch = $(".ui-layout-west").attr("clientHeight");
            if(sh > ch) {
                jQuery("#west-grid").setGridWidth($Pane.innerWidth()-17);
            }else{
                jQuery("#west-grid").setGridWidth($Pane.innerWidth()-2);
            }
        }
    },
    center: {
        paneSelector:           "#mainContent",
        onresize:               "innerLayout.resizeAll",
        minWidth:               200,
        minHeight:              200,
        onresize: function (pane, $Pane) {
            sh = $("#mainContent").attr("scrollHeight");
            ch = $("#mainContent").attr("clientHeight");
            if(sh > ch) {
                jQuery("#task").setGridWidth($Pane.innerWidth()-18);
            }else{
                jQuery("#task").setGridWidth($Pane.innerWidth()-2);
            }
        }
    }
};
