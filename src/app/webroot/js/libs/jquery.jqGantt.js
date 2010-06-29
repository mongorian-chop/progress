(function ($) {
/**
 * Gantt Chart Plugin.
 */

$.fn.jqGantt = function(opt) {
    opt = $.extend(true, {
        caption: "",
        height: "auto",
        width: "auto",
        numberOfMonth: 3,
        stepOfMonth: 1
    }, opt || {});

    var gantt = {
        data: {},
        target: "",
        debug: function(msg) {
            console.log(msg);
        },
        init: function() {
        },
        show: function() {
        },
        load: function(url, data, type) {
            switch(type) {
                case 'xml':
                    break;
                case 'json':
                default:
                    $.getJSON(url, null, function(json) {
                    var t = new Array;
                        f = "";
                        for(i=0,l=json.rows.length; i < l; i++) {
                            d = json.rows[i].cell;
                            s = d[3].replace('-', '', 'g');
                            e = d[4].replace('-', '', 'g');
                            c = {
                                'name': d[1],
                                'start_date': s,
                                'end_date': e
                            };
                            t.push(c);
                        }
                        gantt.data = t;
                    });
                    break;
            }
        },
        setCaption: function(caption) {
            cap = '<div class="gantt-project-title ui-jqgrid-titlebar ui-widget-header ui-corner-tl ui-corner-tr ui-helper-clearfix"><span class="ui-jqgrid-title"></span></div>';
            div = $("<div></div>");
            div.addClass("gantt-project-title ui-jqgrid-titlebar ui-widget-header ui-corner-tl ui-corner-tr ui-helper-clearfix");
            span = $("<span></span>");
            span.addClass("ui-jqgrid-title");
            span.text(caption);
            div.append(span);
            return div;
        },
        setBody: function() {
            table = "<table></table>";
            thead = "<thead></thead>";
            tbody = "<tbody></tbody>";
            tr = "<tr></tr>";
            td = "<td></td>";
            div = "<div></div>"
            $(td).append($(div));
            $(tr).append($(td));
            $(tbody).append(tr);
            $(table).append(tbody);
        }
    };

    return this.each(function() {
        if(this.gantt){ return;}
        var g = this;
        g.opt = opt;
        var data = {};
        gantt.load('/tasks/get_task/1', data);
        //g.prepend(gantt.setCaption(g.opt.caption));
    });
}

})(jQuery);
