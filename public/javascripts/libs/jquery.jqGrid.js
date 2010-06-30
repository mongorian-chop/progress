/*
    The below work is licensed under Creative Commons GNU LGPL License.

    Original work:

    License:     http://creativecommons.org/licenses/LGPL/2.1/
    Author:      Stefan Goessner/2006
    Web:         http://goessner.net/

    Modifications made:

    Version:     0.9-p5
    Description: Restructured code, JSLint validated (no strict whitespaces),
                 added handling of empty arrays, empty strings, and int/floats values.
    Author:      Michael Sch淡ler/2008-01-29
    Web:         http://michael.hinnerup.net/blog/2008/01/26/converting-json-to-xml-and-xml-to-json/

    Description: json2xml added support to convert functions as CDATA
                 so it will be easy to write characters that cause some problems when convert
    Author:      Tony Tomov
*/

/*global alert */
var xmlJsonClass = {
    // Param "xml": Element or document DOM node.
    // Param "tab": Tab or indent string for pretty output formatting omit or use empty string "" to supress.
    // Returns:     JSON string
    xml2json: function(xml, tab) {
        if (xml.nodeType === 9) {
            // document node
            xml = xml.documentElement;
        }
        var nws = this.removeWhite(xml);
        var obj = this.toObj(nws);
        var json = this.toJson(obj, xml.nodeName, "\t");
        return "{\n" + tab + (tab ? json.replace(/\t/g, tab) : json.replace(/\t|\n/g, "")) + "\n}";
    },

    // Param "o":   JavaScript object
    // Param "tab": tab or indent string for pretty output formatting omit or use empty string "" to supress.
    // Returns:     XML string
    json2xml: function(o, tab) {
        var toXml = function(v, name, ind) {
            var xml = "";
            var i, n;
            if (v instanceof Array) {
                if (v.length === 0) {
                    xml += ind + "<"+name+">__EMPTY_ARRAY_</"+name+">\n";
                }
                else {
                    for (i = 0, n = v.length; i < n; i += 1) {
                        var sXml = ind + toXml(v[i], name, ind+"\t") + "\n";
                        xml += sXml;
                    }
                }
            }
            else if (typeof(v) === "object") {
                var hasChild = false;
                xml += ind + "<" + name;
                var m;
                for (m in v) if (v.hasOwnProperty(m)) {
                    if (m.charAt(0) === "@") {
                        xml += " " + m.substr(1) + "=\"" + v[m].toString() + "\"";
                    }
                    else {
                        hasChild = true;
                    }
                }
                xml += hasChild ? ">" : "/>";
                if (hasChild) {
                    for (m in v) if (v.hasOwnProperty(m)) {
                        if (m === "#text") {
                            xml += v[m];
                        }
                        else if (m === "#cdata") {
                            xml += "<![CDATA[" + v[m] + "]]>";
                        }
                        else if (m.charAt(0) !== "@") {
                            xml += toXml(v[m], m, ind+"\t");
                        }
                    }
                    xml += (xml.charAt(xml.length - 1) === "\n" ? ind : "") + "</" + name + ">";
                }
            }
            else if (typeof(v) === "function") {
                xml += ind + "<" + name + ">" + "<![CDATA[" + v + "]]>" + "</" + name + ">";
            }
            else {
                if (v.toString() === "\"\"" || v.toString().length === 0) {
                    xml += ind + "<" + name + ">__EMPTY_STRING_</" + name + ">";
                }
                else {
                    xml += ind + "<" + name + ">" + v.toString() + "</" + name + ">";
                }
            }
            return xml;
        };
        var xml = "";
        var m;
        for (m in o) if (o.hasOwnProperty(m)) {
            xml += toXml(o[m], m, "");
        }
        return tab ? xml.replace(/\t/g, tab) : xml.replace(/\t|\n/g, "");
    },
    // Internal methods
    toObj: function(xml) {
        var o = {};
        var FuncTest = /function/i;
        if (xml.nodeType === 1) {
            // element node ..
            if (xml.attributes.length) {
                // element with attributes ..
                var i;
                for (i = 0; i < xml.attributes.length; i += 1) {
                    o["@" + xml.attributes[i].nodeName] = (xml.attributes[i].nodeValue || "").toString();
                }
            }
            if (xml.firstChild) {
                // element has child nodes ..
                var textChild = 0, cdataChild = 0, hasElementChild = false;
                var n;
                for (n = xml.firstChild; n; n = n.nextSibling) {
                    if (n.nodeType === 1) {
                        hasElementChild = true;
                    }
                    else if (n.nodeType === 3 && n.nodeValue.match(/[^ \f\n\r\t\v]/)) {
                        // non-whitespace text
                        textChild += 1;
                    }
                    else if (n.nodeType === 4) {
                        // cdata section node
                        cdataChild += 1;
                    }
                }
                if (hasElementChild) {
                    if (textChild < 2 && cdataChild < 2) {
                        // structured element with evtl. a single text or/and cdata node ..
                        this.removeWhite(xml);
                        for (n = xml.firstChild; n; n = n.nextSibling) {
                            if (n.nodeType === 3) {
                                // text node
                                o["#text"] = this.escape(n.nodeValue);
                            }
                            else if (n.nodeType === 4) {
                                // cdata node
                                if (FuncTest.test(n.nodeValue)) {
                                    o[n.nodeName] = [o[n.nodeName], n.nodeValue];
                                } else {
                                    o["#cdata"] = this.escape(n.nodeValue);
                                }
                            }
                            else if (o[n.nodeName]) {
                                // multiple occurence of element ..
                                if (o[n.nodeName] instanceof Array) {
                                    o[n.nodeName][o[n.nodeName].length] = this.toObj(n);
                                }
                                else {
                                    o[n.nodeName] = [o[n.nodeName], this.toObj(n)];
                                }
                            }
                            else {
                                // first occurence of element ..
                                o[n.nodeName] = this.toObj(n);
                            }
                        }
                    }
                    else {
                        // mixed content
                        if (!xml.attributes.length) {
                            o = this.escape(this.innerXml(xml));
                        }
                        else {
                            o["#text"] = this.escape(this.innerXml(xml));
                        }
                    }
                }
                else if (textChild) {
                    // pure text
                    if (!xml.attributes.length) {
                        o = this.escape(this.innerXml(xml));
                        if (o === "__EMPTY_ARRAY_") {
                            o = "[]";
                        } else if (o === "__EMPTY_STRING_") {
                            o = "";
                        }
                    }
                    else {
                        o["#text"] = this.escape(this.innerXml(xml));
                    }
                }
                else if (cdataChild) {
                    // cdata
                    if (cdataChild > 1) {
                        o = this.escape(this.innerXml(xml));
                    }
                    else {
                        for (n = xml.firstChild; n; n = n.nextSibling) {
                            if(FuncTest.test(xml.firstChild.nodeValue)) {
                                o = xml.firstChild.nodeValue;
                                break;
                            } else {
                                o["#cdata"] = this.escape(n.nodeValue);
                            }
                        }
                    }
                }
            }
            if (!xml.attributes.length && !xml.firstChild) {
                o = null;
            }
        }
        else if (xml.nodeType === 9) {
            // document.node
            o = this.toObj(xml.documentElement);
        }
        else {
            alert("unhandled node type: " + xml.nodeType);
        }
        return o;
    },
    toJson: function(o, name, ind) {
        var json = name ? ("\"" + name + "\"") : "";
        if (o === "[]") {
            json += (name ? ":[]" : "[]");
        }
        else if (o instanceof Array) {
            var n, i;
            for (i = 0, n = o.length; i < n; i += 1) {
                o[i] = this.toJson(o[i], "", ind + "\t");
            }
            json += (name ? ":[" : "[") + (o.length > 1 ? ("\n" + ind + "\t" + o.join(",\n" + ind + "\t") + "\n" + ind) : o.join("")) + "]";
        }
        else if (o === null) {
            json += (name && ":") + "null";
        }
        else if (typeof(o) === "object") {
            var arr = [];
            var m;
            for (m in o) if (o.hasOwnProperty(m)) {
                arr[arr.length] = this.toJson(o[m], m, ind + "\t");
            }
            json += (name ? ":{" : "{") + (arr.length > 1 ? ("\n" + ind + "\t" + arr.join(",\n" + ind + "\t") + "\n" + ind) : arr.join("")) + "}";
        }
        else if (typeof(o) === "string") {
            var objRegExp  = /(^-?\d+\.?\d*$)/;
            var FuncTest = /function/i;
            o = o.toString();
            if (objRegExp.test(o) || FuncTest.test(o) || o==="false" || o==="true") {
                // int or float
                json += (name && ":") + o;
            }
            else {
                json += (name && ":") + "\"" + o + "\"";
            }
        }
        else {
            json += (name && ":") + o.toString();
        }
        return json;
    },
    innerXml: function(node) {
        var s = "";
        if ("innerHTML" in node) {
            s = node.innerHTML;
        }
        else {
            var asXml = function(n) {
                var s = "", i;
                if (n.nodeType === 1) {
                    s += "<" + n.nodeName;
                    for (i = 0; i < n.attributes.length; i += 1) {
                        s += " " + n.attributes[i].nodeName + "=\"" + (n.attributes[i].nodeValue || "").toString() + "\"";
                    }
                    if (n.firstChild) {
                        s += ">";
                        for (var c = n.firstChild; c; c = c.nextSibling) {
                            s += asXml(c);
                        }
                        s += "</" + n.nodeName + ">";
                    }
                    else {
                        s += "/>";
                    }
                }
                else if (n.nodeType === 3) {
                    s += n.nodeValue;
                }
                else if (n.nodeType === 4) {
                    s += "<![CDATA[" + n.nodeValue + "]]>";
                }
                return s;
            };
            for (var c = node.firstChild; c; c = c.nextSibling) {
                s += asXml(c);
            }
        }
        return s;
    },
    escape: function(txt) {
        return txt.replace(/[\\]/g, "\\\\").replace(/[\"]/g, '\\"').replace(/[\n]/g, '\\n').replace(/[\r]/g, '\\r');
    },
    removeWhite: function(e) {
        e.normalize();
        var n;
        for (n = e.firstChild; n; ) {
            if (n.nodeType === 3) {
                // text node
                if (!n.nodeValue.match(/[^ \f\n\r\t\v]/)) {
                    // pure whitespace text node
                    var nxt = n.nextSibling;
                    e.removeChild(n);
                    n = nxt;
                }
                else {
                    n = n.nextSibling;
                }
            }
            else if (n.nodeType === 1) {
                // element node
                this.removeWhite(n);
                n = n.nextSibling;
            }
            else {
                // any other node
                n = n.nextSibling;
            }
        }
        return e;
    }
};;(function ($) {
/*
 * jqGrid  3.5.3 - jQuery Grid
 * Copyright (c) 2008, Tony Tomov, tony@trirand.com
 * Dual licensed under the MIT and GPL licenses
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 * Date: 2009-09-06
 */
$.jgrid = $.jgrid || {};
$.extend($.jgrid,{
    htmlDecode : function(value){
        if(value=='&nbsp;' || value=='&#160;' || (value.length==1 && value.charCodeAt(0)==160)) { return "";}
        return !value ? value : String(value).replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"');
    },
    htmlEncode : function (value){
        return !value ? value : String(value).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/\"/g, "&quot;");
    },
    format : function(format){ //jqgformat
        var args = $.makeArray(arguments).slice(1);
        return format.replace(/\{(\d+)\}/g, function(m, i){
            return args[i];
        });
    },
    getCellIndex : function (cell) {
        cell = $(cell);
        cell = (!cell.is('td') && !cell.is('th') ? cell.closest("td,th") : cell)[0];
        if ($.browser.msie) return $.inArray(cell, cell.parentNode.cells);
        return cell.cellIndex;
    },
    stripHtml : function(v) {
        var regexp = /<("[^"]*"|'[^']*'|[^'">])*>/gi;
        if(v) { return v.replace(regexp,"");}
        else {return v;}
    },
    stringToDoc : function (xmlString) {
        var xmlDoc;
        if(typeof xmlString !== 'string') return xmlString;
        try {
            var parser = new DOMParser();
            xmlDoc = parser.parseFromString(xmlString,"text/xml");
        }
        catch(e) {
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async=false;
            xmlDoc["loadXM"+"L"](xmlString);
        }
        return (xmlDoc && xmlDoc.documentElement && xmlDoc.documentElement.tagName != 'parsererror') ? xmlDoc : null;
    },
    parse : function(jsonString) {
        var js = jsonString;
        if (js.substr(0,9) == "while(1);") { js = js.substr(9); }
        if (js.substr(0,2) == "/*") { js = js.substr(2,js.length-4); }
        if(!js) { js = "{}"; }
        with(window) {
            return  eval('('+js+')');
        }
    },
    empty : function () {
        while ( this.firstChild ) this.removeChild( this.firstChild );
    },
    jqID : function(sid){
        sid = sid + "";
        return sid.replace(/([\.\:\[\]])/g,"\\$1");
    },
    extend : function(methods) {
        $.extend($.fn.jqGrid,methods);
        if (!this.no_legacy_api) {
            $.fn.extend(methods);
        }
    }
});

$.fn.jqGrid = function( p ) {
    if (typeof p == 'string') {
        var fn = $.fn.jqGrid[p];
        if (!fn) {
            throw ("jqGrid - No such method: " + p);
        }
        var args = $.makeArray(arguments).slice(1);
        return fn.apply(this,args);
    }

    p = $.extend(true,{
    url: "",
    height: 150,
    page: 1,
    rowNum: 20,
    records: 0,
    pager: "",
    pgbuttons: true,
    pginput: true,
    colModel: [],
    rowList: [],
    colNames: [],
    sortorder: "asc",
    sortname: "",
    datatype: "xml",
    mtype: "GET",
    altRows: false,
    selarrrow: [],
    savedRow: [],
    shrinkToFit: true,
    xmlReader: {},
    jsonReader: {},
    subGrid: false,
    subGridModel :[],
    reccount: 0,
    lastpage: 0,
    lastsort: 0,
    selrow: null,
    beforeSelectRow: null,
    onSelectRow: null,
    onSortCol: null,
    ondblClickRow: null,
    onRightClickRow: null,
    onPaging: null,
    onSelectAll: null,
    loadComplete: null,
    gridComplete: null,
    loadError: null,
    loadBeforeSend: null,
    afterInsertRow: null,
    beforeRequest: null,
    onHeaderClick: null,
    viewrecords: false,
    loadonce: false,
    multiselect: false,
    multikey: false,
    editurl: null,
    search: false,
    caption: "",
    hidegrid: true,
    hiddengrid: false,
    postData: {},
    userData: {},
    treeGrid : false,
    treeGridModel : 'nested',
    treeReader : {},
    treeANode : -1,
    ExpandColumn: null,
    tree_root_level : 0,
    prmNames: {page:"page",rows:"rows", sort: "sidx",order: "sord", search:"_search", nd:"nd"},
    forceFit : false,
    gridstate : "visible",
    cellEdit: false,
    cellsubmit: "remote",
    nv:0,
    loadui: "enable",
    toolbar: [false,""],
    scroll: false,
    multiboxonly : false,
    deselectAfterSort : true,
    scrollrows : false,
    autowidth: false,
    scrollOffset :18,
    cellLayout: 5,
    subGridWidth: 20,
    multiselectWidth: 20,
    gridview: false,
    rownumWidth: 25,
    rownumbers : false,
    pagerpos: 'center',
    recordpos: 'right',
    footerrow : false,
    userDataOnFooter : false,
    hoverrows : true,
    altclass : 'ui-priority-secondary',
    viewsortcols : [false,'vertical',true],
    resizeclass : '',
    autoencode : false,
    remapColumns : []
    }, $.jgrid.defaults, p || {});
    var grid={
        headers:[],
        cols:[],
        footers: [],
        dragStart: function(i,x,y) {
            this.resizing = { idx: i, startX: x.clientX, sOL : y[0]};
            this.hDiv.style.cursor = "col-resize";
            this.curGbox = $("#rs_m"+p.id,"#gbox_"+p.id);
            this.curGbox.css({display:"block",left:y[0],top:y[1],height:y[2]});
            document.onselectstart=new Function ("return false");
        },
        dragMove: function(x) {
            if(this.resizing) {
                var diff = x.clientX-this.resizing.startX,
                h = this.headers[this.resizing.idx],
                newWidth = h.width + diff, hn, nWn;
                if(newWidth > 33) {
                    this.curGbox.css({left:this.resizing.sOL+diff});
                    if(p.forceFit===true ){
                        hn = this.headers[this.resizing.idx+p.nv];
                        nWn = hn.width - diff;
                        if(nWn >33) {
                            h.newWidth = newWidth;
                            hn.newWidth = nWn;
                            this.newWidth = p.tblwidth;
                        }
                    } else {
                        this.newWidth = p.tblwidth+diff;
                        h.newWidth = newWidth;
                    }
                }
            }
        },
        dragEnd: function() {
            this.hDiv.style.cursor = "default";
            if(this.resizing) {
                var idx = this.resizing.idx,
                nw = this.headers[idx].newWidth || this.headers[idx].width;
                this.resizing = false;
                $("#rs_m"+p.id).css("display","none");
                p.colModel[idx].width = nw;
                this.headers[idx].width = nw;
                this.headers[idx].el.style.width = nw + "px";
                if(this.cols.length>0) {this.cols[idx].style.width = nw+"px";}
                if(this.footers.length>0) {this.footers[idx].style.width = nw+"px";}
                if(p.forceFit===true){
                    nw = this.headers[idx+p.nv].newWidth || this.headers[idx+p.nv].width;
                    this.headers[idx+p.nv].width = nw;
                    this.headers[idx+p.nv].el.style.width = nw + "px";
                    if(this.cols.length>0) this.cols[idx+p.nv].style.width = nw+"px";
                    if(this.footers.length>0) {this.footers[idx+p.nv].style.width = nw+"px";}
                    p.colModel[idx+p.nv].width = nw;
                } else  {
                    p.tblwidth = this.newWidth;
                    $('table:first',this.bDiv).css("width",p.tblwidth+"px");
                    $('table:first',this.hDiv).css("width",p.tblwidth+"px");
                    this.hDiv.scrollLeft = this.bDiv.scrollLeft;
                    if(p.footerrow) {
                        $('table:first',this.sDiv).css("width",p.tblwidth+"px");
                        this.sDiv.scrollLeft = this.bDiv.scrollLeft;
                    }
                }
            }
            this.curGbox=null;
            document.onselectstart=new Function ("return true");
        },
        scrollGrid: function() {
            if(p.scroll === true) {
                var scrollTop = this.bDiv.scrollTop;
                if (scrollTop != this.scrollTop) {
                    this.scrollTop = scrollTop;
                    if ((this.bDiv.scrollHeight-scrollTop-$(this.bDiv).height()) <= 0) {
                        if(parseInt(p.page,10)+1<=parseInt(p.lastpage,10)) {
                            p.page = parseInt(p.page,10)+1;
                            this.populate();
                        }
                    }
                }
            }
            this.hDiv.scrollLeft = this.bDiv.scrollLeft;
            if(p.footerrow) {
                this.sDiv.scrollLeft = this.bDiv.scrollLeft;
            }
        }
    };
    return this.each( function() {
        if(this.grid) {return;}
        this.p = p ;
        var i;
        if(this.p.colNames.length === 0) {
            for (i=0;i<this.p.colModel.length;i++){
                this.p.colNames[i] = this.p.colModel[i].label || this.p.colModel[i].name;
            }
        }
        if( this.p.colNames.length !== this.p.colModel.length ) {
            alert($.jgrid.errors.model);
            return;
        }
        var gv = $("<div class='ui-jqgrid-view'></div>"), ii,
        isMSIE = $.browser.msie ? true:false,
        isSafari = $.browser.safari ? true : false;

        $(gv).insertBefore(this);
        $(this).appendTo(gv).removeClass("scroll");
        var eg = $("<div class='ui-jqgrid ui-widget ui-widget-content ui-corner-all'></div>");
        $(eg).insertBefore(gv).attr("id","gbox_"+this.id);
        $(gv).appendTo(eg).attr("id","gview_"+this.id);
        if (isMSIE && $.browser.version <= 6) {
            ii = '<iframe style="display:block;position:absolute;z-index:-1;filter:Alpha(Opacity=\'0\');" src="javascript:false;"></iframe>';
        } else { ii="";}
        $("<div class='ui-widget-overlay jqgrid-overlay' id='lui_"+this.id+"'></div>").append(ii).insertBefore(gv);
        $("<div class='loading ui-state-default ui-state-active' id='load_"+this.id+"'>"+this.p.loadtext+"</div>").insertBefore(gv);
        $(this).attr({cellSpacing:"0",cellPadding:"0",border:"0","role":"grid","aria-multiselectable":this.p.multiselect,"aria-labelledby":"gbox_"+this.id});
        var ts = this,
        bSR = $.isFunction(this.p.beforeSelectRow) ? this.p.beforeSelectRow :false,
        ondblClickRow = $.isFunction(this.p.ondblClickRow) ? this.p.ondblClickRow :false,
        onSortCol = $.isFunction(this.p.onSortCol) ? this.p.onSortCol : false,
        loadComplete = $.isFunction(this.p.loadComplete) ? this.p.loadComplete : false,
        loadError = $.isFunction(this.p.loadError) ? this.p.loadError : false,
        loadBeforeSend = $.isFunction(this.p.loadBeforeSend) ? this.p.loadBeforeSend : false,
        onRightClickRow = $.isFunction(this.p.onRightClickRow) ? this.p.onRightClickRow : false,
        afterInsRow = $.isFunction(this.p.afterInsertRow) ? this.p.afterInsertRow : false,
        onHdCl = $.isFunction(this.p.onHeaderClick) ? this.p.onHeaderClick : false,
        beReq = $.isFunction(this.p.beforeRequest) ? this.p.beforeRequest : false,
        onSC = $.isFunction(this.p.onCellSelect) ? this.p.onCellSelect : false,
        sortkeys = ["shiftKey","altKey","ctrlKey"],
        IntNum = function(val,defval) {
            val = parseInt(val,10);
            if (isNaN(val)) { return defval ? defval : 0;}
            else {return val;}
        },
        formatCol = function (pos, rowInd){
            var ral = ts.p.colModel[pos].align, result="style=\"";
            if(ral) result += "text-align:"+ral+";";
            if(ts.p.colModel[pos].hidden===true) result += "display:none;";
            if(rowInd===0) {
                result += "width: "+grid.headers[pos].width+"px;"
            }
            return result+"\"";
        },
        addCell = function(rowId,cell,pos,irow, srvr) {
            var v,prp;
            v = formatter(rowId,cell,pos,srvr,'add');
            prp = formatCol( pos,irow);
            return "<td role=\"gridcell\" "+prp+" title=\""+$.jgrid.stripHtml(v)+"\">"+v+"</td>";
        },
        formatter = function (rowId, cellval , colpos, rwdat, _act){
            var cm = ts.p.colModel[colpos],v;
            if(typeof cm.formatter !== 'undefined') {
                var opts= {rowId: rowId, colModel:cm };
                if($.isFunction( cm.formatter ) ) {
                    v = cm.formatter(cellval,opts,rwdat,_act);
                } else if($.fmatter){
                    v = $.fn.fmatter(cm.formatter, cellval,opts, rwdat, _act);
                } else {
                    v = cellVal(cellval);
                }
            } else {
                v = cellVal(cellval);
            }
            return v;
        },
        cellVal =  function (val) {
            return val === undefined || val === null || val === "" ? "&#160;" : ts.p.autoencode ? $.jgrid.htmlEncode(val+"") : val+"";
        },
        addMulti = function(rowid,pos,irow){
            var v = "<input type=\"checkbox\""+" id=\"jqg_"+rowid+"\" class=\"cbox\" name=\"jqg_"+rowid+"\"/>",
            prp = formatCol(pos,irow);
            return "<td role='gridcell' "+prp+">"+v+"</td>";
        },
        addRowNum = function (pos,irow,pG,rN) {
            var v =  (parseInt(pG)-1)*parseInt(rN)+1+irow,
            prp = formatCol(pos,irow);
            return "<td role=\"gridcell\" class=\"ui-state-default jqgrid-rownum\" "+prp+">"+v+"</td>";
        },
        reader = function (datatype) {
            var field, f=[], j=0, i;
            for(i =0; i<ts.p.colModel.length; i++){
                field = ts.p.colModel[i];
                if (field.name !== 'cb' && field.name !=='subgrid' && field.name !=='rn') {
                    f[j] = (datatype=="xml") ? field.xmlmap || field.name : field.jsonmap || field.name;
                    j++;
                }
            }
            return f;
        },
        orderedCols = function (offset) {
            var order = ts.p.remapColumns;
            if (!order || !order.length)
                order = $.map(ts.p.colModel, function(v,i) { return i; });
            if (offset)
                order = $.map(order, function(v) { return v<offset?null:v-offset });
            return order;
        },
        emptyRows = function (parent) {
            var tBody = $("tbody:first", parent);
            if(!ts.p.gridview) $("*",tBody).children().unbind();
            if(isMSIE) $.jgrid.empty.apply(tBody[0]);
            else tBody[0].innerHTML="";
            tBody = null;
        },
        addXmlData = function (xml,t, rcnt) {
            var startReq = new Date();
            ts.p.reccount = 0;
            if($.isXMLDoc(xml)) {
                if(ts.p.treeANode===-1 && ts.p.scroll===false) {
                    emptyRows(t);
                    rcnt=0;
                } else { rcnt = rcnt > 0 ? rcnt :0; }
            } else { return; }
            var i,fpos,ir=0,v,row,gi=0,si=0,ni=0,idn, getId,f=[],F,rd ={}, rl= ts.rows.length, xmlr,rid, rowData=[],ari=0, cn=(ts.p.altRows === true) ? ts.p.altclass:'',cn1;
            if(!ts.p.xmlReader.repeatitems) {f = reader("xml");}
            if( ts.p.keyIndex===false) {
                idn = ts.p.xmlReader.id;
            } else {
                idn = ts.p.keyIndex;
            }
            if(f.length>0 && !isNaN(idn)) {
                if (ts.p.remapColumns && ts.p.remapColumns.length) {
                    idn = $.inArray(idn, ts.p.remapColumns);
                }
                idn=f[idn];
            }
            if( (idn+"").indexOf("[") === -1 ) {
                if (f.length) {
                    getId = function( trow, k) {return $(idn,trow).text() || k;};
                } else {
                    getId = function( trow, k) {return $(ts.p.xmlReader.cell,trow).eq(idn).text() || k;};
                }
            }
            else {
                getId = function( trow, k) {return trow.getAttribute(idn.replace(/[\[\]]/g,"")) || k;};
            }
            $(ts.p.xmlReader.page,xml).each(function() {ts.p.page = this.textContent  || this.text || 1; });
            $(ts.p.xmlReader.total,xml).each(function() {ts.p.lastpage = this.textContent  || this.text || 1; }  );
            $(ts.p.xmlReader.records,xml).each(function() {ts.p.records = this.textContent  || this.text  || 0; }  );
            $(ts.p.xmlReader.userdata,xml).each(function() {ts.p.userData[this.getAttribute("name")]=this.textContent || this.text;});
            var gxml = $(ts.p.xmlReader.root+" "+ts.p.xmlReader.row,xml),gl = gxml.length, j=0;
            if(gxml && gl){
            var rn = ts.p.rowNum;
            while (j<gl) {
                xmlr = gxml[j];
                rid = getId(xmlr,j+1);
                cn1 = j%2 == 1 ? cn : '';
                rowData[ari++] = "<tr id=\""+rid+"\" role=\"row\" class =\"ui-widget-content jqgrow "+cn1+"\">";
                if(ts.p.rownumbers===true) {
                    rowData[ari++] = addRowNum(0,j,ts.p.page,ts.p.rowNum);
                    ni=1;
                }
                if(ts.p.multiselect===true) {
                    rowData[ari++] = addMulti(rid,ni,j);
                    gi=1;
                }
                if (ts.p.subGrid===true) {
                    rowData[ari++]= $(ts).jqGrid("addSubGridCell",gi+ni,j+rcnt);
                    si= 1;
                }
                if(ts.p.xmlReader.repeatitems){
                    if (!F) F=orderedCols(gi+si+ni);
                    var cells = $(ts.p.xmlReader.cell,xmlr);
                    $.each(F, function (k) {
                        var cell = cells[this];
                        if (!cell) return false;
                        v = cell.textContent || cell.text;
                        rd[ts.p.colModel[k+gi+si+ni].name] = v;
                        rowData[ari++] = addCell(rid,v,k+gi+si+ni,j+rcnt,xmlr);
                    });
                } else {
                    for(i = 0; i < f.length;i++) {
                        v = $(f[i],xmlr).text();
                        rd[ts.p.colModel[i+gi+si+ni].name] = v;
                        rowData[ari++] = addCell(rid, v, i+gi+si+ni, j+rcnt, xmlr);
                    }
                }
                rowData[ari++] = "</tr>";
                if(ts.p.gridview === false ) {
                    if( ts.p.treeGrid === true) {
                        fpos = ts.p.treeANode >= -1 ? ts.p.treeANode: 0;
                        row = $(rowData.join(''))[0]; // speed overhead
                        try {$(ts).jqGrid("setTreeNode",rd,row);} catch (e) {}
                        rl ===  0 ? $("tbody:first",t).append(row) : $(ts.rows[j+fpos+rcnt]).after(row);
                    } else {
                        $("tbody:first",t).append(rowData.join(''));
                    }
                    if (ts.p.subGrid===true) {
                        try {$(ts).jqGrid("addSubGrid",ts.rows[ts.rows.length-1],gi+ni);} catch (e){}
                    }
                    if(afterInsRow) {ts.p.afterInsertRow(rid,rd,xmlr);}
                    rowData=[];ari=0;
                }
                rd={};
                ir++;
                j++;
                if( rn !=-1 && ir>rn) {break;}
            }
            }
            if(ts.p.gridview === true) {
                $("tbody:first",t).append(rowData.join(''));
            }
            ts.p.totaltime = new Date() - startReq;
            if(ir>0) {ts.grid.cols = ts.rows[0].cells;if(ts.p.records===0)ts.p.records=gl;}
            rowData =null;
            if(!ts.p.treeGrid && !ts.p.scroll) {ts.grid.bDiv.scrollTop = 0;}
            ts.p.reccount=ir;
            ts.p.treeANode = -1;
            if(ts.p.userDataOnFooter) $(ts).jqGrid("footerData","set",ts.p.userData,true);
            updatepager(false);
        },
        addJSONData = function(data,t, rcnt) {
            var startReq = new Date();
            ts.p.reccount = 0;
            if(data) {
                if(ts.p.treeANode === -1 && ts.p.scroll===false) {
                    emptyRows(t);
                    rcnt=0;
                } else { rcnt = rcnt > 0 ? rcnt :0; }
            } else { return; }
            var ir=0,v,i,j,row,f=[],F,cur,gi=0,si=0,ni=0,len,drows,idn,rd={}, fpos,rl = ts.rows.length,idr,rowData=[],ari=0,cn=(ts.p.altRows === true) ? ts.p.altclass:'',cn1;
            ts.p.page = data[ts.p.jsonReader.page] || 1;
            ts.p.lastpage= data[ts.p.jsonReader.total] || 1;
            ts.p.records= data[ts.p.jsonReader.records] || 0;
            ts.p.userData = data[ts.p.jsonReader.userdata] || {};
            if(!ts.p.jsonReader.repeatitems) {
                F = f = reader("json");
            }

            if( ts.p.keyIndex===false ) {
                idn = ts.p.jsonReader.id;
            } else {
                idn = ts.p.keyIndex;
            }
            if(f.length>0 && !isNaN(idn)) {
                if (ts.p.remapColumns && ts.p.remapColumns.length) {
                    idn = $.inArray(idn, ts.p.remapColumns);
                }
                idn=f[idn];
            }
            drows = data[ts.p.jsonReader.root];
            if (drows) {
            len = drows.length, i=0;
            var rn = ts.p.rowNum;
            while (i<len) {
                cur = drows[i];
                idr = cur[idn];
                if(idr === undefined) {
                    if(f.length===0){
                        if(ts.p.jsonReader.cell){
                            var ccur = cur[ts.p.jsonReader.cell];
                            idr = ccur[idn] || i+1;
                            ccur=null;
                        } else {idr=i+1;}
                    } else {
                        idr=i+1;
                    }
                }
                cn1 = i%2 == 1 ? cn : '';
                rowData[ari++] = "<tr id=\""+ idr +"\" role=\"row\" class= \"ui-widget-content jqgrow "+ cn1+"\">";
                if(ts.p.rownumbers===true) {
                    rowData[ari++] = addRowNum(0,i,ts.p.page,ts.p.rowNum);
                    ni=1;
                }
                if(ts.p.multiselect){
                    rowData[ari++] = addMulti(idr,ni,i);
                    gi = 1;
                }
                if (ts.p.subGrid) {
                    rowData[ari++]= $(ts).jqGrid("addSubGridCell",gi+ni,i+rcnt);
                    si= 1;
                }
                if (ts.p.jsonReader.repeatitems) {
                    if(ts.p.jsonReader.cell) {cur = cur[ts.p.jsonReader.cell];}
                    if (!F) F=orderedCols(gi+si+ni);
                }
                for (j=0;j<F.length;j++) {
                    v=cur[F[j]];
                    if(v===undefined) {
                        try { v = eval("cur."+F[j]);}
                        catch (e) {}
                    }
                    rowData[ari++] = addCell(idr,v,j+gi+si+ni,i+rcnt,cur);
                    rd[ts.p.colModel[j+gi+si+ni].name] = v;
                }

                rowData[ari++] = "</tr>";
                if(ts.p.gridview === false ) {
                    if( ts.p.treeGrid === true) {
                        fpos = ts.p.treeANode >= -1 ? ts.p.treeANode: 0;
                        row = $(rowData.join(''))[0];
                        try {$(ts).jqGrid("setTreeNode",rd,row);} catch (e) {}
                        rl ===  0 ? $("tbody:first",t).append(row) : $(ts.rows[i+fpos+rcnt]).after(row);
                    } else {
                        $("tbody:first",t).append(rowData.join(''));
                    }
                    if(ts.p.subGrid === true ) {
                        try { $(ts).jqGrid("addSubGrid",ts.rows[ts.rows.length-1],gi+ni);} catch (e){}
                    }
                    if(afterInsRow) {ts.p.afterInsertRow(idr,rd,cur);}
                    rowData=[];ari=0;
                }
                rd={};
                ir++;
                i++;
                if(rn !=-1 && ir>rn) break;
            }
            if(ts.p.gridview === true ) {
                $("tbody:first",t).append(rowData.join(''));
            }
            ts.p.totaltime = new Date() - startReq;
            if(ir>0) {ts.grid.cols = ts.rows[0].cells;if(ts.p.records===0)ts.p.records=len;}
            }
            if(!ts.p.treeGrid && !ts.p.scroll) {ts.grid.bDiv.scrollTop = 0;}
            ts.p.reccount=ir;
            ts.p.treeANode = -1;
            if(ts.p.userDataOnFooter) $(ts).jqGrid("footerData","set",ts.p.userData,true);
            updatepager(false);
        },
        updatepager = function(rn) {
            var cp, last, base,bs, from,to,tot,fmt;
            base = (parseInt(ts.p.page)-1)*parseInt(ts.p.rowNum);
            if(ts.p.pager) {
                if (ts.p.loadonce) {
                    cp = last = 1;
                    ts.p.lastpage = ts.page =1;
                    $(".selbox",ts.p.pager).attr("disabled",true);
                } else {
                    cp = IntNum(ts.p.page);
                    last = IntNum(ts.p.lastpage);
                    $(".selbox",ts.p.pager).attr("disabled",false);
                }
                if(ts.p.pginput===true) {
                    $('.ui-pg-input',ts.p.pager).val(ts.p.page);
                    $('#sp_1',ts.p.pager).html(ts.p.lastpage );
                }
                if (ts.p.viewrecords){
                    bs = ts.p.scroll === true ? 0 : base;
                    if(ts.p.reccount === 0)
                        $(".ui-paging-info",ts.p.pager).html(ts.p.emptyrecords);
                    else {
                        from = bs+1; to = base+ts.p.reccount; tot=ts.p.records;
                        if($.fmatter) {
                            fmt = $.jgrid.formatter.integer || {};
                            from = $.fmatter.util.NumberFormat(from,fmt);
                            to = $.fmatter.util.NumberFormat(to,fmt);
                            tot = $.fmatter.util.NumberFormat(tot,fmt);
                        }
                        $(".ui-paging-info",ts.p.pager).html($.jgrid.format(ts.p.recordtext,from,to,tot));
                    }
                }
                if(ts.p.pgbuttons===true) {
                    if(cp<=0) {cp = last = 1;}
                    if(cp==1) {$("#first, #prev",ts.p.pager).addClass('ui-state-disabled').removeClass('ui-state-hover');} else {$("#first, #prev",ts.p.pager).removeClass('ui-state-disabled');}
                    if(cp==last) {$("#next, #last",ts.p.pager).addClass('ui-state-disabled').removeClass('ui-state-hover');} else {$("#next, #last",ts.p.pager).removeClass('ui-state-disabled');}
                }
            }
            if(rn===true && ts.p.rownumbers === true) {
                $("td.jqgrid-rownum",ts.rows).each(function(i){
                    $(this).html(base+1+i);
                });
            }
            if($.isFunction(ts.p.gridComplete)) {ts.p.gridComplete();}
        },
        populate = function () {
            if(!ts.grid.hDiv.loading) {
                var prm = {}, dt, dstr, pN=ts.p.prmNames;;
                if(pN.search !== null) prm[pN.search] = ts.p.search; if(pN.nd != null) prm[pN.nd] = new Date().getTime();
                if(pN.rows !== null) prm[pN.rows]= ts.p.rowNum; if(pN.page !== null) prm[pN.page]= ts.p.page;
                if(pN.sort !== null) prm[pN.sort]= ts.p.sortname; if(pN.order !== null) prm[pN.order]= ts.p.sortorder;
                $.extend(ts.p.postData,prm);
                var rcnt = ts.p.scroll===false ? 0 : ts.rows.length-1;
                if ($.isFunction(ts.p.datatype)) { ts.p.datatype(ts.p.postData,"load_"+ts.p.id); return;}
                else if(beReq) {ts.p.beforeRequest();}
                dt = ts.p.datatype.toLowerCase();
                switch(dt)
                {
                case "json":
                case "jsonp":
                case "xml":
                case "script":
                    $.ajax({url:ts.p.url,type:ts.p.mtype,dataType: dt ,data: ts.p.postData,
                        complete:function(req,st) {
                            if(st=="success" || (req.statusText == "OK" && req.status == "200")) {
                                if(dt === "xml") addXmlData(req.responseXML,ts.grid.bDiv,rcnt);
                                else addJSONData($.jgrid.parse(req.responseText),ts.grid.bDiv,rcnt);
                                if(loadComplete) loadComplete(req);
                            }
                            req=null;
                            endReq();
                        },
                        error:function(xhr,st,err){
                            if(loadError) loadError(xhr,st,err);
                            endReq();
                            xhr=null;
                        },
                        beforeSend: function(xhr){
                            beginReq();
                            if(loadBeforeSend) loadBeforeSend(xhr);
                        }
                    });
                    if( ts.p.loadonce || ts.p.treeGrid) {ts.p.datatype = "local";}
                break;
                case "xmlstring":
                    beginReq();
                    addXmlData(dstr = $.jgrid.stringToDoc(ts.p.datastr),ts.grid.bDiv);
                    ts.p.datatype = "local";
                    if(loadComplete) {loadComplete(dstr);}
                    ts.p.datastr = null;
                    endReq();
                break;
                case "jsonstring":
                    beginReq();
                    if(typeof ts.p.datastr == 'string') dstr = $.jgrid.parse(ts.p.datastr);
                    else dstr = ts.p.datastr;
                    addJSONData(dstr,ts.grid.bDiv);
                    ts.p.datatype = "local";
                    if(loadComplete) {loadComplete(dstr);}
                    ts.p.datastr = null;
                    endReq();
                break;
                case "local":
                case "clientside":
                    beginReq();
                    ts.p.datatype = "local";
                    sortArrayData();
                    endReq();
                break;
                }
            }
        },
        beginReq = function() {
            ts.grid.hDiv.loading = true;
            if(ts.p.hiddengrid) { return;}
            switch(ts.p.loadui) {
                case "disable":
                    break;
                case "enable":
                    $("#load_"+ts.p.id).show();
                    break;
                case "block":
                    $("#lui_"+ts.p.id).show();
                    $("#load_"+ts.p.id).show();
                    break;
            }
        },
        endReq = function() {
            ts.grid.hDiv.loading = false;
            switch(ts.p.loadui) {
                case "disable":
                    break;
                case "enable":
                    $("#load_"+ts.p.id).hide();
                    break;
                case "block":
                    $("#lui_"+ts.p.id).hide();
                    $("#load_"+ts.p.id).hide();
                    break;
            }
        },
        sortArrayData = function() {
            var stripNum = /[\$,%]/g;
            var rows=[], col=0, st, sv, findSortKey,newDir = (ts.p.sortorder == "asc") ? 1 :-1;
            $.each(ts.p.colModel,function(i,v){
                if(this.index == ts.p.sortname || this.name == ts.p.sortname){
                    col = ts.p.lastsort= i;
                    st = this.sorttype;
                    return false;
                }
            });
            if (st == 'float' || st== 'number' || st== 'currency') {
                findSortKey = function($cell) {
                    var key = parseFloat($cell.replace(stripNum, ''));
                    return isNaN(key) ? 0 : key;
                };
            } else if (st=='int' || st=='integer') {
                findSortKey = function($cell) {
                    return IntNum($cell.replace(stripNum, ''));
                };
            } else if(st == 'date') {
                findSortKey = function($cell) {
                    var fd = ts.p.colModel[col].datefmt || "Y-m-d";
                    return parseDate(fd,$cell).getTime();
                };
            } else {
                findSortKey = function($cell) {
                    return $.trim($cell.toUpperCase());
                };
            }
            $.each(ts.rows, function(index, row) {
                try { sv = $.unformat($(row).children('td').eq(col),{colModel:ts.p.colModel[col]},col,true);}
                catch (_) { sv = $(row).children('td').eq(col).text(); }
                row.sortKey = findSortKey(sv);
                rows[index] = this;
            });
            if(ts.p.treeGrid) {
                $(ts).jqGrid("SortTree",newDir);
            } else {
                rows.sort(function(a, b) {
                    if (a.sortKey < b.sortKey) {return -newDir;}
                    if (a.sortKey > b.sortKey) {return newDir;}
                    return 0;
                });
                if(rows[0]){
                    $("td",rows[0]).each( function( k ) {
                        $(this).css("width",grid.headers[k].width+"px");
                    });
                    grid.cols = rows[0].cells;
                }
                $.each(rows, function(index, row) {
                    $('tbody',ts.grid.bDiv).append(row);
                    row.sortKey = null;
                });
            }
            if(ts.p.multiselect) {
                $("tbody tr", ts.grid.bDiv).removeClass("ui-state-highlight");
                $("[id^=jqg_]",ts.rows).attr("checked",false);
                $("#cb_jqg",ts.grid.hDiv).attr("checked",false);
                ts.p.selarrrow = [];
            }
            ts.grid.bDiv.scrollTop = 0;
        },
        parseDate = function(format, date) {
            var tsp = {m : 1, d : 1, y : 1970, h : 0, i : 0, s : 0},k,hl,dM;
            date = date.split(/[\\\/:_;.\t\T\s-]/);
            format = format.split(/[\\\/:_;.\t\T\s-]/);
            var dfmt  = $.jgrid.formatter.date.monthNames;
            for(k=0,hl=format.length;k<hl;k++){
                if(format[k] == 'M') {
                    dM = $.inArray(date[k],dfmt);
                    if(dM !== -1 && dM < 12){date[k] = dM+1;}
                }
                if(format[k] == 'F') {
                    dM = $.inArray(date[k],dfmt);
                    if(dM !== -1 && dM > 11){date[k] = dM+1-12;}
                }
                tsp[format[k].toLowerCase()] = parseInt(date[k],10);
            }
            tsp.m = parseInt(tsp.m,10)-1;
            var ty = tsp.y;
            if (ty >= 70 && ty <= 99) {tsp.y = 1900+tsp.y;}
            else if (ty >=0 && ty <=69) {tsp.y= 2000+tsp.y;}
            return new Date(tsp.y, tsp.m, tsp.d, tsp.h, tsp.i, tsp.s,0);
        },
        setPager = function (){
            var sep = "<td class='ui-pg-button ui-state-disabled' style='width:4px;'><span class='ui-separator'></span></td>",
            pgid= $(ts.p.pager).attr("id") || 'pager',
            pginp = (ts.p.pginput===true) ? "<td>"+$.jgrid.format(ts.p.pgtext || "","<input class='ui-pg-input' type='text' size='2' maxlength='7' value='0' role='textbox'/>","<span id='sp_1'></span>")+"</td>" : "",
            pgl="<table cellspacing='0' cellpadding='0' border='0' style='table-layout:auto;' class='ui-pg-table'><tbody><tr>",
            str, pgcnt, lft, cent, rgt, twd, tdw, i,
            clearVals = function(onpaging){
                if ($.isFunction(ts.p.onPaging) ) {ts.p.onPaging(onpaging);}
                ts.p.selrow = null;
                if(ts.p.multiselect) {ts.p.selarrrow =[];$('#cb_jqg',ts.grid.hDiv).attr("checked",false);}
                ts.p.savedRow = [];
            };
            pgcnt = "pg_"+pgid;
            lft = pgid+"_left"; cent = pgid+"_center"; rgt = pgid+"_right";
            $(ts.p.pager).addClass('ui-jqgrid-pager corner-bottom')
            .append("<div id='"+pgcnt+"' class='ui-pager-control' role='group'><table cellspacing='0' cellpadding='0' border='0' class='ui-pg-table' style='width:100%;table-layout:fixed;' role='row'><tbody><tr><td id='"+lft+"' align='left'></td><td id='"+cent+"' align='center' style='white-space:nowrap;'></td><td id='"+rgt+"' align='right'></td></tr></tbody></table></div>");
            if(ts.p.pgbuttons===true) {
                pgl += "<td id='first' class='ui-pg-button ui-corner-all'><span class='ui-icon ui-icon-seek-first'></span></td>";
                pgl += "<td id='prev' class='ui-pg-button ui-corner-all'><span class='ui-icon ui-icon-seek-prev'></span></td>";
                pgl += pginp !="" ? sep+pginp+sep:"";
                pgl += "<td id='next' class='ui-pg-button ui-corner-all'><span class='ui-icon ui-icon-seek-next'></span></td>";
                pgl += "<td id='last' class='ui-pg-button ui-corner-all'><span class='ui-icon ui-icon-seek-end'></span></td>";
            } else if (pginp !="") { pgl += pginp; }
            if(ts.p.rowList.length >0){
                str="<select class='ui-pg-selbox' role='listbox'>";
                for(i=0;i<ts.p.rowList.length;i++){
                    str +="<option role='option' value="+ts.p.rowList[i]+((ts.p.rowNum == ts.p.rowList[i])?' selected':'')+">"+ts.p.rowList[i];
                }
                str +="</select>";
                pgl += "<td>"+str+"</td>";
            }
            pgl += "</tr></tbody></table>";
            if(ts.p.viewrecords===true) {$("td#"+pgid+"_"+ts.p.recordpos,"#"+pgcnt).append("<div style='text-align:"+ts.p.recordpos+"' class='ui-paging-info'></div>");}
            $("td#"+pgid+"_"+ts.p.pagerpos,"#"+pgcnt).append(pgl);
            tdw = $(".ui-jqgrid").css("font-size") || "11px";
            $('body').append("<div id='testpg' class='ui-jqgrid ui-widget ui-widget-content' style='font-size:"+tdw+";visibility:hidden;' ></div>");
            twd = $(pgl).clone().appendTo("#testpg").width();
            $("#testpg").remove();
            if(twd > 0) {
                twd += 25;
                $("td#"+pgid+"_"+ts.p.pagerpos,"#"+pgcnt).width(twd);
            }
            ts.p._nvtd = [];
            ts.p._nvtd[0] = twd ? Math.floor((ts.p.width - twd)/2) : Math.floor(ts.p.width/3);
            ts.p._nvtd[1] = 0;
            pgl=null;
            $('.ui-pg-selbox',"#"+pgcnt).bind('change',function() {
                ts.p.page = Math.round(ts.p.rowNum*(ts.p.page-1)/this.value-0.5)+1;
                ts.p.rowNum = this.value;
                clearVals('records');
                populate();
                return false;
            });
            if(ts.p.pgbuttons===true) {
            $(".ui-pg-button","#"+pgcnt).hover(function(e){
                if($(this).hasClass('ui-state-disabled')) {
                    this.style.cursor='default';
                } else {
                    $(this).addClass('ui-state-hover');
                    this.style.cursor='pointer';
                }
            },function(e) {
                if($(this).hasClass('ui-state-disabled')) {
                } else {
                    $(this).removeClass('ui-state-hover');
                    this.style.cursor= "default";
                }
            });
            $("#first, #prev, #next, #last",ts.p.pager).click( function(e) {
                var cp = IntNum(ts.p.page),
                last = IntNum(ts.p.lastpage), selclick = false,
                fp=true, pp=true, np=true,lp=true;
                if(last ===0 || last===1) {fp=false;pp=false;np=false;lp=false; }
                else if( last>1 && cp >=1) {
                    if( cp === 1) { fp=false; pp=false; }
                    else if( cp>1 && cp <last){ }
                    else if( cp===last){ np=false;lp=false; }
                } else if( last>1 && cp===0 ) { np=false;lp=false; cp=last-1;}
                if( this.id === 'first' && fp ) { ts.p.page=1; selclick=true;}
                if( this.id === 'prev' && pp) { ts.p.page=(cp-1); selclick=true;}
                if( this.id === 'next' && np) { ts.p.page=(cp+1); selclick=true;}
                if( this.id === 'last' && lp) { ts.p.page=last; selclick=true;}
                if(selclick) {
                    clearVals(this.id);
                    populate();
                }
                return false;
            });
            }
            if(ts.p.pginput===true) {
            $('input.ui-pg-input',"#"+pgcnt).keypress( function(e) {
                var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
                if(key == 13) {
                    ts.p.page = ($(this).val()>0) ? $(this).val():ts.p.page;
                    clearVals('user');
                    populate();
                    return false;
                }
                return this;
            });
            }
        },
        sortData = function (index, idxcol,reload,sor){
            if(!ts.p.colModel[idxcol].sortable) return;
            var imgs, so;
            if(ts.p.savedRow.length > 0) {return;}
            if(!reload) {
                if( ts.p.lastsort == idxcol ) {
                    if( ts.p.sortorder == 'asc') {
                        ts.p.sortorder = 'desc';
                    } else if(ts.p.sortorder == 'desc') { ts.p.sortorder = 'asc';}
                } else { ts.p.sortorder = 'asc';}
                ts.p.page = 1;
            }
            if(sor) {
                if(ts.p.lastsort == idxcol && ts.p.sortorder == sor) return;
                else ts.p.sortorder = sor;
            }
            var thd= $("thead:first",ts.grid.hDiv).get(0);
            $("tr th:eq("+ts.p.lastsort+") span.ui-grid-ico-sort",thd).addClass('ui-state-disabled');
            $("tr th:eq("+ts.p.lastsort+")",thd).attr("aria-selected","false");
            $("tr th:eq("+idxcol+") span.ui-icon-"+ts.p.sortorder,thd).removeClass('ui-state-disabled');
            $("tr th:eq("+idxcol+")",thd).attr("aria-selected","true");
            if(!ts.p.viewsortcols[0]) {
                if(ts.p.lastsort != idxcol) {
                    $("tr th:eq("+ts.p.lastsort+") span.s-ico",thd).hide();
                    $("tr th:eq("+idxcol+") span.s-ico",thd).show();
                }
            }
            ts.p.lastsort = idxcol;
            index = index.substring(5);
            ts.p.sortname = ts.p.colModel[idxcol].index || index;
            so = ts.p.sortorder;
            if(onSortCol) {onSortCol(index,idxcol,so);}
            if(ts.p.datatype == "local") {
                if(ts.p.deselectAfterSort) {$(ts).jqGrid("resetSelection");}
            } else {
                ts.p.selrow = null;
                if(ts.p.multiselect){$("#cb_jqg",ts.grid.hDiv).attr("checked",false);}
                ts.p.selarrrow =[];
                ts.p.savedRow =[];
                if(ts.p.scroll===true) {emptyRows(ts.grid.bDiv);}
            }
            if(ts.p.subGrid && ts.p.datatype=='local') {
                $("td.sgexpanded","#"+ts.p.id).each(function(){
                    $(this).trigger("click");
                });
            }
            populate();
            if(ts.p.sortname != index && idxcol) {ts.p.lastsort = idxcol;}
        },
        setColWidth = function () {
            var initwidth = 0, brd=ts.p.cellLayout, vc=0, lvc, scw=ts.p.scrollOffset,cw,hs=false,aw,tw=0,gw=0,
            msw = ts.p.multiselectWidth, sgw=ts.p.subGridWidth, rnw=ts.p.rownumWidth, cl = ts.p.cellLayout, cr;
            $.each(ts.p.colModel, function(i) {
                if(typeof this.hidden === 'undefined') {this.hidden=false;}
                if(this.hidden===false){
                    initwidth += IntNum(this.width);
                    vc++;
                }
            });
            if(isNaN(ts.p.width)) {ts.p.width = grid.width = initwidth;}
            else { grid.width = ts.p.width}
            ts.p.tblwidth = initwidth;
            if(ts.p.shrinkToFit ===false && ts.p.forceFit === true) {ts.p.forceFit=false;}
            if(ts.p.shrinkToFit===true) {
                if (isSafari) { brd=0; msw +=cl; sgw += cl; rnw += cl;}
                if(ts.p.multiselect) {tw = msw; gw = msw+brd; vc--;}
                if(ts.p.subGrid) {tw += sgw; gw += sgw+brd; vc--;}
                if(ts.p.rownumbers) { tw += rnw; gw += rnw+brd; vc--;}
                aw = grid.width-brd*vc-gw;
                if(isNaN(ts.p.height)) {
                } else {
                    aw -= scw;
                    hs = true;
                }
                initwidth =0;
                $.each(ts.p.colModel, function(i) {
                    if(this.hidden === false && this.name !== 'cb' && this.name !== 'subgrid' && this.name !== 'rn'){
                        cw = Math.floor(aw/(ts.p.tblwidth-tw)*this.width);
                        this.width =cw;
                        initwidth += cw;
                        lvc = i;
                    }
                });
                cr =0;
                if (hs && grid.width-gw-(initwidth+brd*vc) !== scw) {
                    cr = grid.width-gw-(initwidth+brd*vc)-scw;
                } else if(!hs && Math.abs(grid.width-gw-(initwidth+brd*vc)) !== 1) {
                    cr = grid.width-gw-(initwidth+brd*vc);
                }
                ts.p.colModel[lvc].width += cr;
                ts.p.tblwidth = initwidth+tw+cr;
            }
        },
        nextVisible= function(iCol) {
            var ret = iCol, j=iCol, i;
            for (i = iCol+1;i<ts.p.colModel.length;i++){
                if(ts.p.colModel[i].hidden !== true ) {
                    j=i; break;
                }
            }
            return j-ret;
        },
        getOffset = function (iCol) {
            var i, ret = {}, brd1 = isSafari ? 0 : ts.p.cellLayout;
            ret[0] =  ret[1] = ret[2] = 0;
            for(i=0;i<=iCol;i++){
                if(ts.p.colModel[i].hidden === false ) {
                    ret[0] += ts.p.colModel[i].width+brd1;
                }
            }
            ret[0] = ret[0] - ts.grid.bDiv.scrollLeft;
            if($(ts.grid.cDiv).is(":visible")) {ret[1] += $(ts.grid.cDiv).height() +parseInt($(ts.grid.cDiv).css("padding-top"))+parseInt($(ts.grid.cDiv).css("padding-bottom"));}
            if(ts.p.toolbar[0]==true && (ts.p.toolbar[1]=='top' || ts.p.toolbar[1]=='both')) {ret[1] += $(ts.grid.uDiv).height()+parseInt($(ts.grid.uDiv).css("border-top-width"))+parseInt($(ts.grid.uDiv).css("border-bottom-width"));}
            ret[2] += $(ts.grid.bDiv).height() + $(ts.grid.hDiv).height();
            return ret;
        };
        this.p.id = this.id;
        if ($.inArray(ts.p.multikey,sortkeys) == -1 ) {ts.p.multikey = false;}
        ts.p.keyIndex=false;
        for (i=0; i<ts.p.colModel.length;i++) {
            if (ts.p.colModel[i].key===true) {
                ts.p.keyIndex = i;
                break;
            }
        }
        ts.p.sortorder = ts.p.sortorder.toLowerCase();
        if(this.p.treeGrid === true) {
            try { $(this).jqGrid("setTreeGrid");} catch (_) {}
        }
        if(this.p.subGrid) {
            try { $(ts).jqGrid("setSubGrid");} catch (_){}
        }
        if(this.p.multiselect) {
            this.p.colNames.unshift("<input id='cb_jqg' class='cbox' type='checkbox'/>");
            this.p.colModel.unshift({name:'cb',width:isSafari ?  ts.p.multiselectWidth+ts.p.cellLayout : ts.p.multiselectWidth,sortable:false,resizable:false,hidedlg:true,search:false,align:'center'});
        }
        if(this.p.rownumbers) {
            this.p.colNames.unshift("");
            this.p.colModel.unshift({name:'rn',width:ts.p.rownumWidth,sortable:false,resizable:false,hidedlg:true,search:false,align:'center'});
        }
        ts.p.xmlReader = $.extend({
            root: "rows",
            row: "row",
            page: "rows>page",
            total: "rows>total",
            records : "rows>records",
            repeatitems: true,
            cell: "cell",
            id: "[id]",
            userdata: "userdata",
            subgrid: {root:"rows", row: "row", repeatitems: true, cell:"cell"}
        }, ts.p.xmlReader);
        ts.p.jsonReader = $.extend({
            root: "rows",
            page: "page",
            total: "total",
            records: "records",
            repeatitems: true,
            cell: "cell",
            id: "id",
            userdata: "userdata",
            subgrid: {root:"rows", repeatitems: true, cell:"cell"}
        },ts.p.jsonReader);
        if(ts.p.scroll===true){
            ts.p.pgbuttons = false; ts.p.pginput=false; ts.p.rowList=[];
        }
        var thead = "<thead><tr class='ui-jqgrid-labels' role='rowheader'>",
        tdc, idn, w, res, sort,
        td, ptr, tbody, imgs,iac="",idc="";
        if(ts.p.shrinkToFit===true && ts.p.forceFit===true) {
            for (i=ts.p.colModel.length-1;i>=0;i--){
                if(!ts.p.colModel[i].hidden) {
                    ts.p.colModel[i].resizable=false;
                    break;
                }
            }
        }
        if(ts.p.viewsortcols[1] == 'horizontal') {iac=" ui-i-asc";idc=" ui-i-desc";}
        tdc = isMSIE ?  "class='ui-th-div-ie'" :"";
        imgs = "<span class='s-ico' style='display:none'><span sort='asc' class='ui-grid-ico-sort ui-icon-asc"+iac+" ui-state-disabled ui-icon ui-icon-triangle-1-n'></span>";
        imgs += "<span sort='desc' class='ui-grid-ico-sort ui-icon-desc"+idc+" ui-state-disabled ui-icon ui-icon-triangle-1-s'></span></span>";
        for(i=0;i<this.p.colNames.length;i++){
            thead += "<th role='columnheader' class='ui-state-default ui-th-column'>";
            idn = ts.p.colModel[i].index || ts.p.colModel[i].name;
            thead += "<div id='jqgh_"+ts.p.colModel[i].name+"' "+tdc+">"+ts.p.colNames[i];
            if (idn == ts.p.sortname) {
                ts.p.lastsort = i;
            }
            thead += imgs+"</div></th>";
        }
        thead += "</tr></thead>";
        $(this).append(thead);
        $("thead tr:first th",this).hover(function(){$(this).addClass('ui-state-hover');},function(){$(this).removeClass('ui-state-hover');});
        if(this.p.multiselect) {
            var onSA = true, emp=[], chk;
            if(typeof ts.p.onSelectAll !== 'function') {onSA=false;}
            $('#cb_jqg',this).bind('click',function(){
                if (this.checked) {
                    $("[id^=jqg_]",ts.rows).attr("checked",true);
                    $(ts.rows).each(function(i) {
                        if(!$(this).hasClass("subgrid")){
                        $(this).addClass("ui-state-highlight").attr("aria-selected","true");
                        ts.p.selarrrow[i]= ts.p.selrow = this.id;
                        }
                    });
                    chk=true;
                    emp=[];
                }
                else {
                    $("[id^=jqg_]",ts.rows).attr("checked",false);
                    $(ts.rows).each(function(i) {
                        if(!$(this).hasClass("subgrid")){
                            $(this).removeClass("ui-state-highlight").attr("aria-selected","false");
                            emp[i] = this.id;
                        }
                    });
                    ts.p.selarrrow = []; ts.p.selrow = null;
                    chk=false;
                }
                if(onSA) {ts.p.onSelectAll(chk ? ts.p.selarrrow : emp,chk);}
            });
        }

        $.each(ts.p.colModel, function(i){if(!this.width) {this.width=150;}});
        if(ts.p.autowidth===true) {
            var pw = $(eg).innerWidth();
            ts.p.width = pw > 0?  pw: 'nw';
        }
        setColWidth();
        $(eg).css("width",grid.width+"px").append("<div class='ui-jqgrid-resize-mark' id='rs_m"+ts.p.id+"'>&nbsp;</div>");
        $(gv).css("width",grid.width+"px");
        thead = $("thead:first",ts).get(0);
        var tfoot = "<table role='grid' style='width:"+ts.p.tblwidth+"px' class='ui-jqgrid-ftable' cellspacing='0' cellpadding='0' border='0'><tbody><tr role='row' class='ui-widget-content footrow'>";
        var thr = $("tr:first",thead);
        ts.p.disableClick=false;
        $("th",thr).each(function ( j ) {
            var ht = $('div',this)[0];
            w = ts.p.colModel[j].width;
            if(typeof ts.p.colModel[j].resizable === 'undefined') {ts.p.colModel[j].resizable = true;}
            if(ts.p.colModel[j].resizable){
                res = document.createElement("span");
                $(res).html("&#160;").addClass('ui-jqgrid-resize');
                $(this).addClass(ts.p.resizeclass);
            } else {
                res = "";
            }
            $(this).css("width",w+"px").prepend(res);
            if( ts.p.colModel[j].hidden ) $(this).css("display","none");
            grid.headers[j] = { width: w, el: this };
            sort = ts.p.colModel[j].sortable;
            if( typeof sort !== 'boolean') {ts.p.colModel[j].sortable =  true; sort=true;}
            var nm = ts.p.colModel[j].name;
            if( !(nm == 'cb' || nm=='subgrid' || nm=='rn') ) {
                if(ts.p.viewsortcols[2])
                    $("div",this).addClass('ui-jqgrid-sortable');
            }
            if(sort) {
                if(ts.p.viewsortcols[0]) {$("div span.s-ico",this).show(); if(j==ts.p.lastsort){ $("div span.ui-icon-"+ts.p.sortorder,this).removeClass("ui-state-disabled");}}
                else if( j == ts.p.lastsort) {$("div span.s-ico",this).show();$("div span.ui-icon-"+ts.p.sortorder,this).removeClass("ui-state-disabled");}
            }
            tfoot += "<td role='gridcell' "+formatCol(j,0)+">&nbsp;</td>";
        }).mousedown(function(e) {
            if ($(e.target).closest("th>span.ui-jqgrid-resize").length != 1) return;
            var ci = $.jgrid.getCellIndex(this);
            if(ts.p.forceFit===true) {ts.p.nv= nextVisible(ci);}
            grid.dragStart(ci, e, getOffset(ci));
            return false;
        }).click(function(e) {
            if (ts.p.disableClick) {
                ts.p.disableClick = false;
                return false;
            }
            var s = "th>div.ui-jqgrid-sortable",r,d;
            if (!ts.p.viewsortcols[2]) { s = "th>div>span>span.ui-grid-ico-sort" }
            var t = $(e.target).closest(s);
            if (t.length != 1) return;
            var ci = $.jgrid.getCellIndex(this);
            if (!ts.p.viewsortcols[2]) { r=true,d=t.attr("sort") }
            sortData($('div',this)[0].id,ci,r,d);
            return false;
        });
        if (ts.p.sortable && $.fn.sortable) {
            try {
                $(ts).jqGrid("sortableColumns", thr);
            } catch (e){}
        }
        tfoot += "</tr></tbody></table>";

        tbody = document.createElement("tbody");
        this.appendChild(tbody);
        $(this).addClass('ui-jqgrid-btable');
        var hTable = $("<table class='ui-jqgrid-htable' style='width:"+ts.p.tblwidth+"px' role='grid' aria-labelledby='gbox_"+this.id+"' cellspacing='0' cellpadding='0' border='0'></table>").append(thead),
        hg = (ts.p.caption && ts.p.hiddengrid===true) ? true : false,
        hb = $("<div class='ui-jqgrid-hbox'></div>");
        grid.hDiv = document.createElement("div");
        $(grid.hDiv)
            .css({ width: grid.width+"px"})
            .addClass("ui-state-default ui-jqgrid-hdiv")
            .append(hb);
        $(hb).append(hTable);
        if(hg) $(grid.hDiv).hide();
        ts.p._height =0;
        if(ts.p.pager){
            if(typeof ts.p.pager == "string") {if(ts.p.pager.substr(0,1) !="#") ts.p.pager = "#"+ts.p.pager;}
            $(ts.p.pager).css({width: grid.width+"px"}).appendTo(eg).addClass('ui-state-default ui-jqgrid-pager');
            ts.p._height += parseInt($(ts.p.pager).height(),10);
            if(hg) {$(ts.p.pager).hide();}
            setPager();
        }
        if( ts.p.cellEdit === false && ts.p.hoverrows === true) {
        $(ts).bind('mouseover',function(e) {
            ptr = $(e.target).parents("tr.jqgrow");
            if($(ptr).attr("class") !== "subgrid") {
                $(ptr).addClass("ui-state-hover");
            }
            return false;
        }).bind('mouseout',function(e) {
            ptr = $(e.target).parents("tr.jqgrow");
            $(ptr).removeClass("ui-state-hover");
            return false;
        });
        }
        var ri,ci;
        $(ts).before(grid.hDiv).click(function(e) {
            td = e.target;
            var scb = $(td).hasClass("cbox");
            ptr = $(td,ts.rows).parents("tr.jqgrow");
            if($(ptr).length === 0 ) {
                return this;
            }
            var cSel = true;
            if(bSR) cSel = bSR(ptr[0].id, e);
            if (td.tagName == 'A' || ((td.tagName == 'INPUT' || td.tagName == 'TEXTAREA' || td.tagName == 'OPTION' || td.tagName == 'SELECT' ) && !scb) ) { return true; }
            if(cSel === true) {
                if(ts.p.cellEdit === true) {
                    if(ts.p.multiselect && scb){
                        $(ts).jqGrid("setSelection",ptr[0].id,true);
                    } else {
                        ri = ptr[0].rowIndex;
                        ci = $.jgrid.getCellIndex(td);
                        try {$(ts).jqGrid("editCell",ri,ci,true);} catch (_) {}
                    }
                } else if ( !ts.p.multikey ) {
                    if(ts.p.multiselect && ts.p.multiboxonly) {
                        if(scb){$(ts).jqGrid("setSelection",ptr[0].id,true);}
                        else {
                            $(ts.p.selarrrow).each(function(i,n){
                                var ind = ts.rows.namedItem(n);
                                $(ind).removeClass("ui-state-highlight");
                                $("#jqg_"+$.jgrid.jqID(n),ind).attr("checked",false);
                            });
                            ts.p.selarrrow = [];
                            $("#cb_jqg",ts.grid.hDiv).attr("checked",false);
                            $(ts).jqGrid("setSelection",ptr[0].id,true);
                        }
                    } else {
                        $(ts).jqGrid("setSelection",ptr[0].id,true);
                    }
                } else {
                    if(e[ts.p.multikey]) {
                        $(ts).jqGrid("setSelection",ptr[0].id,true);
                    } else if(ts.p.multiselect && scb) {
                        scb = $("[id^=jqg_]",ptr).attr("checked");
                        $("[id^=jqg_]",ptr).attr("checked",!scb);
                    }
                }
                if(onSC) {
                    ri = ptr[0].id;
                    ci = $.jgrid.getCellIndex(td);
                    onSC(ri,ci,$(td).html(),td);
                }
            }
            e.stopPropagation();
        }).bind('reloadGrid', function(e) {
            if(ts.p.treeGrid ===true) { ts.p.datatype = ts.p.treedatatype;}
            if(ts.p.datatype=="local"){ $(ts).jqGrid("resetSelection");}
            else if(!ts.p.treeGrid) {
                ts.p.selrow=null;
                if(ts.p.multiselect) {ts.p.selarrrow =[];$('#cb_jqg',ts.grid.hDiv).attr("checked",false);}
                ts.p.savedRow = [];
                if(ts.p.scroll===true) {emptyRows(ts.grid.bDiv);}
            }
            ts.grid.populate();
            return false;
        });
        if( ondblClickRow ) {
            $(this).dblclick(function(e) {
                td = e.target;
                ptr = $(td,ts.rows).parents("tr.jqgrow");
                if($(ptr).length === 0 ){return false;}
                ri = ptr[0].rowIndex;
                ci = $.jgrid.getCellIndex(td);
                ts.p.ondblClickRow($(ptr).attr("id"),ri,ci, e);
                return false;
            });
        }
        if (onRightClickRow) {
            $(this).bind('contextmenu', function(e) {
                td = e.target;
                ptr = $(td,ts.rows).parents("tr.jqgrow");
                if($(ptr).length === 0 ){return false;}
                if(!ts.p.multiselect) { $(ts).jqGrid("setSelection",ptr[0].id,true);    }
                ri = ptr[0].rowIndex;
                ci = $.jgrid.getCellIndex(td);
                ts.p.onRightClickRow($(ptr).attr("id"),ri,ci, e);
                return false;
            });
        }
        grid.bDiv = document.createElement("div");
        $(grid.bDiv)
            .append(this)
            .addClass("ui-jqgrid-bdiv")
            .css({ height: ts.p.height+(isNaN(ts.p.height)?"":"px"), width: (grid.width)+"px"})
            .scroll(function (e) {grid.scrollGrid();});
        $("table:first",grid.bDiv).css({width:ts.p.tblwidth+"px"});
        if( isMSIE ) {
            if( $("tbody",this).size() == 2 ) { $("tbody:first",this).remove();}
            if( ts.p.multikey) {$(grid.bDiv).bind("selectstart",function(){return false;});}
        } else {
            if( ts.p.multikey) {$(grid.bDiv).bind("mousedown",function(){return false;});}
        }
        if(hg) {$(grid.bDiv).hide();}
        grid.cDiv = document.createElement("div");
        var arf = ts.p.hidegrid===true ? $("<a role='link' href='javascript:void(0)'/>").addClass('ui-jqgrid-titlebar-close HeaderButton').hover(
            function(){ arf.addClass('ui-state-hover');},
            function() {arf.removeClass('ui-state-hover');})
        .append("<span class='ui-icon ui-icon-circle-triangle-n'></span>") : "";
        $(grid.cDiv).append(arf).append("<span class='ui-jqgrid-title'>"+ts.p.caption+"</span>")
        .addClass("ui-jqgrid-titlebar ui-widget-header ui-corner-tl ui-corner-tr ui-helper-clearfix");
        $(grid.cDiv).insertBefore(grid.hDiv);
        if( ts.p.toolbar[0] ) {
            grid.uDiv = document.createElement("div");
            if(ts.p.toolbar[1] == "top") {$(grid.uDiv).insertBefore(grid.hDiv);}
            else if (ts.p.toolbar[1]=="bottom" ) {$(grid.uDiv).insertAfter(grid.hDiv);}
            if(ts.p.toolbar[1]=="both") {
                grid.ubDiv = document.createElement("div");
                $(grid.uDiv).insertBefore(grid.hDiv).addClass("ui-userdata ui-state-default").attr("id","t_"+this.id);
                $(grid.ubDiv).insertAfter(grid.hDiv).addClass("ui-userdata ui-state-default").attr("id","tb_"+this.id);
                ts.p._height += IntNum($(grid.ubDiv).height());
                if(hg)  {$(grid.ubDiv).hide();}
            } else {
                $(grid.uDiv).width(grid.width).addClass("ui-userdata ui-state-default").attr("id","t_"+this.id);
            }
            ts.p._height += IntNum($(grid.uDiv).height());
            if(hg) {$(grid.uDiv).hide();}
        }
        if(ts.p.footerrow) {
            grid.sDiv = document.createElement("div");
            hb = $("<div class='ui-jqgrid-hbox'></div>");
            $(grid.sDiv).addClass("ui-jqgrid-sdiv").append(hb).insertAfter(grid.hDiv).width(grid.width);
            $(hb).append(tfoot);
            grid.footers = $(".ui-jqgrid-ftable",grid.sDiv)[0].rows[0].cells;
            if(ts.p.rownumbers) grid.footers[0].className = 'ui-state-default jqgrid-rownum';
            if(hg) {$(grid.sDiv).hide();}
        }
        if(ts.p.caption) {
            ts.p._height += parseInt($(grid.cDiv,ts).height(),10);
            var tdt = ts.p.datatype;
            if(ts.p.hidegrid===true) {
                $(".ui-jqgrid-titlebar-close",grid.cDiv).click( function(){
                    if(ts.p.gridstate == 'visible') {
                        $(".ui-jqgrid-bdiv, .ui-jqgrid-hdiv","#gview_"+ts.p.id).slideUp("fast");
                        if(ts.p.pager) {$(ts.p.pager).slideUp("fast");}
                        if(ts.p.toolbar[0]===true) {
                            if( ts.p.toolbar[1]=='both') {
                                $(grid.ubDiv).slideUp("fast");
                            }
                            $(grid.uDiv).slideUp("fast");
                        }
                        if(ts.p.footerrow) $(".ui-jqgrid-sdiv","#gbox_"+ts.p.id).slideUp("fast");
                        $("span",this).removeClass("ui-icon-circle-triangle-n").addClass("ui-icon-circle-triangle-s");
                        ts.p.gridstate = 'hidden';
                        if(onHdCl) {if(!hg) {ts.p.onHeaderClick(ts.p.gridstate);}}
                    } else if(ts.p.gridstate == 'hidden'){
                        $(".ui-jqgrid-hdiv, .ui-jqgrid-bdiv","#gview_"+ts.p.id).slideDown("fast");
                        if(ts.p.pager) {$(ts.p.pager).slideDown("fast");}
                        if(ts.p.toolbar[0]===true) {
                            if( ts.p.toolbar[1]=='both') {
                                $(grid.ubDiv).slideDown("fast");
                            }
                            $(grid.uDiv).slideDown("fast");
                        }
                        if(ts.p.footerrow) $(".ui-jqgrid-sdiv","#gbox_"+ts.p.id).slideDown("fast");
                        $("span",this).removeClass("ui-icon-circle-triangle-s").addClass("ui-icon-circle-triangle-n");
                        if(hg) {ts.p.datatype = tdt;populate();hg=false;}
                        ts.p.gridstate = 'visible';
                        if(onHdCl) {ts.p.onHeaderClick(ts.p.gridstate)}
                    }
                    return false;
                });
                if(hg) {ts.p.datatype="local"; $(".ui-jqgrid-titlebar-close",grid.cDiv).trigger("click");}
            }
        } else {$(grid.cDiv).hide();}
        $(grid.hDiv).after(grid.bDiv);
        $(".ui-jqgrid-labels",grid.hDiv).bind("selectstart", function () { return false; })
        .mousemove(function (e) {
            if(grid.resizing){grid.dragMove(e);return false;}
        });
        ts.p._height += parseInt($(grid.hDiv).height(),10);
        $(document).mouseup(function (e) {
            if(grid.resizing) { grid.dragEnd(); return false;}
            return true;
        });
        this.updateColumns = function () {
            var r = this.rows[0], self =this;
            if(r) {
                $("td",r).each( function( k ) {
                    $(this).css("width",self.grid.headers[k].width+"px");
                });
                this.grid.cols = r.cells;
            }
            return this;
        }
        ts.formatCol = function(a,b) {return formatCol(a,b);};
        ts.sortData = function(a,b,c){sortData(a,b,c);};
        ts.updatepager = function(a){updatepager(a);};
        ts.formatter = function ( rowId, cellval , colpos, rwdat, act){return formatter(rowId, cellval , colpos, rwdat, act);};
        $.extend(grid,{populate : function(){populate();}});
        this.grid = grid;
        ts.addXmlData = function(d) {addXmlData(d,ts.grid.bDiv);};
        ts.addJSONData = function(d) {addJSONData(d,ts.grid.bDiv);};
        populate();ts.p.hiddengrid=false;
        $(window).unload(function () {
            $(this).empty();
            this.grid = null;
            this.p = null;
        });
    });
};
$.jgrid.extend({
    getGridParam : function(pName) {
        var $t = this[0];
        if (!$t.grid) {return;}
        if (!pName) { return $t.p; }
        else {return $t.p[pName] ? $t.p[pName] : null;}
    },
    setGridParam : function (newParams){
        return this.each(function(){
            if (this.grid && typeof(newParams) === 'object') {$.extend(true,this.p,newParams);}
        });
    },
    getDataIDs : function () {
        var ids=[], i=0, len;
        this.each(function(){
            len = this.rows.length;
            if(len && len>0){
                while(i<len) {
                    ids[i] = this.rows[i].id;
                    i++;
                }
            }
        });
        return ids;
    },
    setSelection : function(selection,onsr) {
        return this.each(function(){
            var $t = this, stat,pt, olr, ner, ia, tpsr;
            if(selection === undefined) return;
            onsr = onsr === false ? false : true;
            pt=$t.rows.namedItem(selection);
            if(pt==null) return;
            if($t.p.selrow && $t.p.scrollrows===true) {
                olr = $t.rows.namedItem($t.p.selrow).rowIndex;
                ner = $t.rows.namedItem(selection).rowIndex;
                if(ner >=0 ){
                    if(ner > olr ) {
                        scrGrid(ner,'d');
                    } else {
                        scrGrid(ner,'u');
                    }
                }
            }
            if(!$t.p.multiselect) {
                if($(pt).attr("class") !== "subgrid") {
                if( $t.p.selrow ) {$("tr#"+$.jgrid.jqID($t.p.selrow),$t.grid.bDiv).removeClass("ui-state-highlight").attr("aria-selected","false") ;}
                $t.p.selrow = pt.id;
                $(pt).addClass("ui-state-highlight").attr("aria-selected","true");
                if( $t.p.onSelectRow && onsr) { $t.p.onSelectRow($t.p.selrow, true); }
                }
            } else {
                $t.p.selrow = pt.id;
                ia = $.inArray($t.p.selrow,$t.p.selarrrow);
                if (  ia === -1 ){
                    if($(pt).attr("class") !== "subgrid") { $(pt).addClass("ui-state-highlight").attr("aria-selected","true");}
                    stat = true;
                    $("#jqg_"+$.jgrid.jqID($t.p.selrow),$t.rows).attr("checked",stat);
                    $t.p.selarrrow.push($t.p.selrow);
                    if( $t.p.onSelectRow && onsr) { $t.p.onSelectRow($t.p.selrow, stat); }
                } else {
                    if($(pt).attr("class") !== "subgrid") { $(pt).removeClass("ui-state-highlight").attr("aria-selected","false");}
                    stat = false;
                    $("#jqg_"+$.jgrid.jqID($t.p.selrow),$t.rows).attr("checked",stat);
                    $t.p.selarrrow.splice(ia,1);
                    if( $t.p.onSelectRow && onsr) { $t.p.onSelectRow($t.p.selrow, stat); }
                    tpsr = $t.p.selarrrow[0];
                    $t.p.selrow = (tpsr === undefined) ? null : tpsr;
                }
            }
            function scrGrid(iR,tp){
                var ch = $($t.grid.bDiv)[0].clientHeight,
                st = $($t.grid.bDiv)[0].scrollTop,
                nROT = $t.rows[iR].offsetTop+$t.rows[iR].clientHeight,
                pROT = $t.rows[iR].offsetTop;
                if(tp == 'd') {
                    if(nROT >= ch) { $($t.grid.bDiv)[0].scrollTop = st + nROT-pROT; }
                }
                if(tp == 'u'){
                    if (pROT < st) { $($t.grid.bDiv)[0].scrollTop = st - nROT+pROT; }
                }
            }
        });
    },
    resetSelection : function(){
        return this.each(function(){
            var t = this, ind;
            if(!t.p.multiselect) {
                if(t.p.selrow) {
                    $("tr#"+$.jgrid.jqID(t.p.selrow),t.grid.bDiv).removeClass("ui-state-highlight").attr("aria-selected","false");
                    t.p.selrow = null;
                }
            } else {
                $(t.p.selarrrow).each(function(i,n){
                    ind = t.rows.namedItem(n);
                    $(ind).removeClass("ui-state-highlight").attr("aria-selected","false");
                    $("#jqg_"+$.jgrid.jqID(n),ind).attr("checked",false);
                });
                $("#cb_jqg",t.grid.hDiv).attr("checked",false);
                t.p.selarrrow = [];
            }
            t.p.savedRow = [];
        });
    },
    getRowData : function( rowid ) {
        var res = {}, resall, getall=false, len, j=0;
        this.each(function(){
            var $t = this,nm,ind;
            if(typeof(rowid) == 'undefined') {
                getall = true;
                resall = [];
                len = $t.rows.length;
            } else {
                ind = $t.rows.namedItem(rowid);
                if(!ind) return res;
                len = 1;
            }
            while(j<len){
                if(getall) ind = $t.rows[j];
                $('td',ind).each( function(i) {
                    nm = $t.p.colModel[i].name;
                    if ( nm !== 'cb' && nm !== 'subgrid') {
                        if($t.p.treeGrid===true && nm == $t.p.ExpandColumn) {
                            res[nm] = $.jgrid.htmlDecode($("span:first",this).html());
                        } else {
                            try {
                                res[nm] = $.unformat(this,{colModel:$t.p.colModel[i]},i);
                            } catch (e){
                                res[nm] = $.jgrid.htmlDecode($(this).html());
                            }
                        }
                    }
                });
                j++;
                if(getall) { resall.push(res); res={}; }
            }
        });
        return resall ? resall: res;
    },
    delRowData : function(rowid) {
        var success = false, rowInd, ia, ri;
        this.each(function() {
            var $t = this;
            rowInd = $t.rows.namedItem(rowid);
            if(!rowInd) {return false;}
            else {
                ri = rowInd.rowIndex;
                $(rowInd).remove();
                $t.p.records--;
                $t.p.reccount--;
                $t.updatepager(true);
                success=true;
                if(rowid == $t.p.selrow) {$t.p.selrow=null;}
                ia = $.inArray(rowid,$t.p.selarrrow);
                if(ia != -1) {$t.p.selarrrow.splice(ia,1);}
            }
            if( ri == 0 && success ) {
                $t.updateColumns();
            }
            if( $t.p.altRows === true && success ) {
                var cn = $t.p.altclass;
                $($t.rows).each(function(i){
                    if(i % 2 ==1) $(this).addClass(cn);
                    else $(this).removeClass(cn);
                });
            }
        });
        return success;
    },
    setRowData : function(rowid, data, cssp) {
        var nm, success=false;
        this.each(function(){
            var t = this, vl, ind, cp = typeof cssp;;
            if(!t.grid) {return false;}
            ind = t.rows.namedItem(rowid);
            if(!ind) return false;
            if( data ) {
                $(this.p.colModel).each(function(i){
                    nm = this.name;
                    if( data[nm] != undefined) {
                        vl = t.formatter( rowid, data[nm], i, data, 'edit');
                        if(t.p.treeGrid===true && nm == t.p.ExpandColumn) {
                            $("td:eq("+i+") > span:first",ind).html(vl).attr("title",$.jgrid.stripHtml(vl));
                        } else {
                            $("td:eq("+i+")",ind).html(vl).attr("title",$.jgrid.stripHtml(vl));
                        }
                        success = true;
                    }
                });
            }
            if(cp === 'string') {$(ind).addClass(cssp);} else if(cp === 'object') {$(ind).css(cssp);}
        });
        return success;
    },
    addRowData : function(rowid,data,pos,src) {
        if(!pos) {pos = "last";}
        var success = false, nm, row, gi=0, si=0, ni=0,sind, i, v, prp="";
        if(data) {
            this.each(function() {
                var t = this;
                rowid = typeof(rowid) != 'undefined' ? rowid+"": (t.p.records+1)+"";
                row = "<tr id=\""+rowid+"\" role=\"row\" class=\"ui-widget-content jqgrow\">";
                if(t.p.rownumbers===true){
                    prp = t.formatCol(ni,1);
                    row += "<td role=\"gridcell\" class=\"ui-state-default jqgrid-rownum\" "+prp+">0</td>";
                    ni=1;
                }
                if(t.p.multiselect) {
                    v = "<input type=\"checkbox\""+" id=\"jqg_"+rowid+"\" class=\"cbox\"/>";
                    prp = t.formatCol(ni,1);
                    row += "<td role=\"gridcell\" "+prp+">"+v+"</td>";
                    gi = 1;
                }
                if(t.p.subGrid===true) {
                    row += $(t).jqGrid("addSubGridCell",gi+ni,1);
                    si=1;
                }
                for(i = gi+si+ni; i < this.p.colModel.length;i++){
                    nm = this.p.colModel[i].name;
                    v = t.formatter( rowid, data[nm], i, data, 'add');
                    prp = t.formatCol(i,1);
                    row += "<td role=\"gridcell\" "+prp+" title=\""+$.jgrid.stripHtml(v)+"\">"+v+"</td>";
                }
                row += "</tr>";
                if(t.p.subGrid===true) {
                    row = $(row)[0];
                    $(t).jqGrid("addSubGrid",row,gi+ni);
                }
                if(t.rows.length === 0){
                    $("table:first",t.grid.bDiv).append(row);
                } else {
                switch (pos) {
                    case 'last':
                        $(t.rows[t.rows.length-1]).after(row);
                        break;
                    case 'first':
                        $(t.rows[0]).before(row);
                        break;
                    case 'after':
                        sind = t.rows.namedItem(src);
                        if (sind) {$(t.rows[sind.rowIndex+1]).hasClass("ui-subgrid") ? $(t.rows[sind.rowIndex+1]).after(row) : $(sind).after(row);}
                        break;
                    case 'before':
                        sind = t.rows.namedItem(src);
                        if(sind) {$(sind).before(row);sind=sind.rowIndex;}
                        break;
                }
                }
                t.p.records++;
                t.p.reccount++;
                if(pos==='first' || (pos==='before' && sind <= 1) ||  t.rows.length === 1 ){
                    t.updateColumns();
                }
                if( t.p.altRows === true ) {
                    var cn = t.p.altclass;
                    if (pos == "last") {
                        if (t.rows.length % 2 == 1)  {$(t.rows[t.rows.length-1]).addClass(cn);}
                    } else {
                        $(t.rows).each(function(i){
                            if(i % 2 ==1) $(this).addClass(cn);
                            else $(this).removeClass(cn);
                        });
                    }
                }
                try {t.p.afterInsertRow(rowid,data); } catch(e){}
                t.updatepager(true);
                success = true;
            });
        }
        return success;
    },
    footerData : function(action,data, format) {
        var nm, success=false, res={};
        function isEmpty(obj) { for(var i in obj) { return false; } return true; }
        if(typeof(action) == "undefined") action = "get";
        if(typeof(format) != "boolean") format  = true;
        action = action.toLowerCase();
        this.each(function(){
            var t = this, vl, ind;
            if(!t.grid || !t.p.footerrow) {return false;}
            if(action == "set") { if(isEmpty(data)) return false; }
            success=true;
            $(this.p.colModel).each(function(i){
                nm = this.name;
                if(action == "set") {
                    if( data[nm] != undefined) {
                        vl = format ? t.formatter( "", data[nm], i, data, 'edit') : data[nm];
                        $("tr.footrow td:eq("+i+")",t.grid.sDiv).html(vl).attr("title",$.jgrid.stripHtml(vl));
                        success = true;
                    }
                } else if(action == "get") {
                    res[nm] = $("tr.footrow td:eq("+i+")",t.grid.sDiv).html();
                }
            });
        });
        return action == "get" ? res : success;
    },
    ShowHideCol : function(colname,show) {
        return this.each(function() {
            var $t = this, fndh=false;
            if (!$t.grid ) {return;}
            if( typeof colname === 'string') {colname=[colname];}
            show = show !="none" ? "" : "none";
            var sw = show == "" ? true :false;
            $(this.p.colModel).each(function(i) {
                if ($.inArray(this.name,colname) !== -1 && this.hidden === sw) {
                    $("tr",$t.grid.hDiv).each(function(){
                        $("th:eq("+i+")",this).css("display",show);
                    });
                    $($t.rows).each(function(j){
                        $("td:eq("+i+")",$t.rows[j]).css("display",show);
                    });
                    if($t.p.footerrow) $("td:eq("+i+")",$t.grid.sDiv).css("display", show);
                    if(show == "none") $t.p.tblwidth -= this.width; else $t.p.tblwidth += this.width;
                    this.hidden = !sw;
                    fndh=true;
                }
            });
            if(fndh===true) {
                $("table:first",$t.grid.hDiv).width($t.p.tblwidth);
                $("table:first",$t.grid.bDiv).width($t.p.tblwidth);
                $t.grid.hDiv.scrollLeft = $t.grid.bDiv.scrollLeft;
                if($t.p.footerrow) {
                    $("table:first",$t.grid.sDiv).width($t.p.tblwidth);
                    $t.grid.sDiv.scrollLeft = $t.grid.bDiv.scrollLeft;
                }
            }
        });
    },
    hideCol : function (colname) {
        return this.each(function(){$(this).jqGrid("ShowHideCol",colname,"none");});
    },
    showCol : function(colname) {
        return this.each(function(){$(this).jqGrid("ShowHideCol",colname,"");});
    },
    remapColumns : function(permutation, updateCells, keepHeader)
    {
        function resortArray(a) {
            var ac;
            if (a.length) {
                ac = $.makeArray(a);
            } else {
                ac = $.extend({}, a);
            }
            $.each(permutation, function(i) {
                a[i] = ac[this];
            });
        }
        var ts = this.get(0);
        function resortRows(parent, clobj) {
            $(">tr"+(clobj||""), parent).each(function() {
                var row = this;
                var elems = $.makeArray(row.cells);
                $.each(permutation, function() {
                    var e = elems[this];
                    if (e) {
                        row.appendChild(e);
                    }
                });
            });
        }
        resortArray(ts.p.colModel);
        resortArray(ts.p.colNames);
        resortArray(ts.grid.headers);
        resortRows($("thead:first", ts.grid.hDiv), keepHeader && ":not(.ui-jqgrid-labels)");
        if (updateCells) {
            resortRows($("tbody:first", ts.grid.bDiv), ".jqgrow");
            if (ts.p.footerrow) {
                resortRows($("tbody:first", ts.grid.sDiv));
            }
        }
        if (ts.p.remapColumns) {
            if (!ts.p.remapColumns.length)
                ts.p.remapColumns = $.makeArray(permutation);
            else
                resortArray(ts.p.remapColumns);
        }
        ts.p.lastsort = $.inArray(ts.p.lastsort, permutation);
        if(ts.p.treeGrid) ts.p.expColInd = $.inArray(ts.p.expColInd, permutation);
    },
    setGridWidth : function(nwidth, shrink) {
        return this.each(function(){
            var $t = this, cw,
            initwidth = 0, brd=$t.p.cellLayout, lvc, vc=0, isSafari,hs=false, scw=$t.p.scrollOffset, aw, gw=0, tw=0,
            msw = $t.p.multiselectWidth, sgw=$t.p.subGridWidth, rnw=$t.p.rownumWidth, cl = $t.p.cellLayout,cr;
            if (!$t.grid ) {return;}
            if(typeof shrink != 'boolean') {
                shrink=$t.p.shrinkToFit;
            }
            if(isNaN(nwidth)) {return;}
            if(nwidth == $t.grid.width) {return;}
            else { $t.grid.width = $t.p.width = nwidth;}
            $("#gbox_"+$t.p.id).css("width",nwidth+"px");
            $("#gview_"+$t.p.id).css("width",nwidth+"px");
            $($t.grid.bDiv).css("width",nwidth+"px");
            $($t.grid.hDiv).css("width",nwidth+"px");
            if($t.p.pager ) {$($t.p.pager).css("width",nwidth+"px");}
            if($t.p.toolbar[0] === true){
                $($t.grid.uDiv).css("width",nwidth+"px");
                if($t.p.toolbar[1]=="both") {$($t.grid.ubDiv).css("width",nwidth+"px");}
            }
            if($t.p.footerrow) $($t.grid.sDiv).css("width",nwidth+"px");
            if(shrink ===false && $t.p.forceFit == true) {$t.p.forceFit=false;}
            if(shrink===true) {
                $.each($t.p.colModel, function(i) {
                    if(this.hidden===false){
                        initwidth += parseInt(this.width,10);
                        vc++;
                    }
                });
                isSafari = $.browser.safari ? true : false;
                if (isSafari) { brd=0; msw +=cl; sgw += cl; rnw += cl;}
                if($t.p.multiselect) {tw = msw; gw = msw+brd; vc--;}
                if($t.p.subGrid) {tw += sgw;gw += sgw+brd; vc--;}
                if($t.p.rownumbers) { tw += rnw; gw += rnw+brd; vc--;}
                $t.p.tblwidth = initwidth;
                aw = nwidth-brd*vc-gw;
                if(!isNaN($t.p.height)) {
                    if($($t.grid.bDiv)[0].clientHeight < $($t.grid.bDiv)[0].scrollHeight){
                        hs = true;
                        aw -= scw;
                    }
                }
                initwidth =0;
                var cle = $t.grid.cols.length >0;
                $.each($t.p.colModel, function(i) {
                    var tn = this.name;
                    if(this.hidden === false && tn !== 'cb' && tn !== 'subgrid' && tn !== 'rn'){
                        cw = Math.floor((aw)/($t.p.tblwidth-tw)*this.width);
                        this.width =cw;
                        initwidth += cw;
                        $t.grid.headers[i].width=cw;
                        $t.grid.headers[i].el.style.width=cw+"px";
                        if($t.p.footerrow) $t.grid.footers[i].style.width = cw+"px";
                        if(cle) $t.grid.cols[i].style.width = cw+"px";
                        lvc = i;
                    }
                });
                cr =0;
                if (hs && nwidth-gw-(initwidth+brd*vc) !== scw) {
                    cr = nwidth-gw-(initwidth+brd*vc)-scw;
                } else if( Math.abs(nwidth-gw-(initwidth+brd*vc)) !== 1) {
                    cr = nwidth-gw-(initwidth+brd*vc);
                }
                $t.p.colModel[lvc].width += cr;
                cw= $t.p.colModel[lvc].width;
                $t.grid.headers[lvc].width = cw;
                $t.grid.headers[lvc].el.style.width=cw+"px";
                if(cle) $t.grid.cols[lvc].style.width = cw+"px";
                $t.p.tblwidth = initwidth+tw+cr;
                $('table:first',$t.grid.bDiv).css("width",initwidth+tw+cr+"px");
                $('table:first',$t.grid.hDiv).css("width",initwidth+tw+cr+"px");
                $t.grid.hDiv.scrollLeft = $t.grid.bDiv.scrollLeft;
                if($t.p.footerrow) {
                    $t.grid.footers[lvc].style.width = cw+"px";
                    $('table:first',$t.grid.sDiv).css("width",initwidth+tw+cr+"px");
                }
            }
        });
    },
    setGridHeight : function (nh) {
        return this.each(function (){
            var $t = this;
            if(!$t.grid) {return;}
            $($t.grid.bDiv).css({height: nh+(isNaN(nh)?"":"px")});
            $t.p.height = nh;
        });
    },
    setCaption : function (newcap){
        return this.each(function(){
            this.p.caption=newcap;
            $("span.ui-jqgrid-title",this.grid.cDiv).html(newcap);
            $(this.grid.cDiv).show();
        });
    },
    setLabel : function(colname, nData, prop, attrp ){
        return this.each(function(){
            var $t = this, pos=-1;
            if(!$t.grid) {return;}
            if(isNaN(colname)) {
                $($t.p.colModel).each(function(i){
                    if (this.name == colname) {
                        pos = i;return false;
                    }
                });
            } else {pos = parseInt(colname,10);}
            if(pos>=0) {
                var thecol = $("tr.ui-jqgrid-labels th:eq("+pos+")",$t.grid.hDiv);
                if (nData){
                    var ico = $(".s-ico",thecol);
                    $("[id^=jqgh_]",thecol).empty().html(nData).append(ico);
                    $t.p.colNames[pos] = nData;
                }
                if (prop) {
                    if(typeof prop === 'string') {$(thecol).addClass(prop);} else {$(thecol).css(prop);}
                }
                if(typeof attrp === 'object') {$(thecol).attr(attrp);}
            }
        });
    },
    setCell : function(rowid,colname,nData,cssp,attrp) {
        return this.each(function(){
            var $t = this, pos =-1,v;
            if(!$t.grid) {return;}
            if(isNaN(colname)) {
                $($t.p.colModel).each(function(i){
                    if (this.name == colname) {
                        pos = i;return false;
                    }
                });
            } else {pos = parseInt(colname,10);}
            if(pos>=0) {
                var ind = $t.rows.namedItem(rowid);
                if (ind){
                    var tcell = $("td:eq("+pos+")",ind);
                    if(nData !== "") {
                        v = $t.formatter(rowid, nData, pos,ind,'edit');
                        $(tcell).html(v).attr("title",$.jgrid.stripHtml(v));
                    }
                    if (cssp){
                        if(typeof cssp === 'string') {$(tcell).addClass(cssp);} else {$(tcell).css(cssp);}
                    }
                    if(typeof attrp === 'object') {$(tcell).attr(attrp);}
                }
            }
        });
    },
    getCell : function(rowid,col) {
        var ret = false;
        this.each(function(){
            var $t=this, pos=-1;
            if(!$t.grid) {return;}
            if(isNaN(col)) {
                $($t.p.colModel).each(function(i){
                    if (this.name === col) {
                        pos = i;return false;
                    }
                });
            } else {pos = parseInt(col,10);}
            if(pos>=0) {
                var ind = $t.rows.namedItem(rowid);
                if(ind) {
                    try {
                        ret = $.unformat($("td:eq("+pos+")",ind),{colModel:$t.p.colModel[pos]},pos);
                    } catch (e){
                        ret = $.jgrid.htmlDecode($("td:eq("+pos+")",ind).html());
                    }
                }
            }
        });
        return ret;
    },
    getCol : function (col, obj, mathopr) {
        var ret = [], val, sum=0;
        obj = typeof (obj) != 'boolean' ? false : obj;
        if(typeof mathopr == 'undefined') mathopr = false;
        this.each(function(){
            var $t=this, pos=-1;
            if(!$t.grid) {return;}
            if(isNaN(col)) {
                $($t.p.colModel).each(function(i){
                    if (this.name === col) {
                        pos = i;return false;
                    }
                });
            } else {pos = parseInt(col,10);}
            if(pos>=0) {
                var ln = $t.rows.length, i =0;
                if (ln && ln>0){
                    while(i<ln){
                        try {
                            val = $.unformat($($t.rows[i].cells[pos]),{colModel:$t.p.colModel[pos]},pos);
                        } catch (e) {
                            val = $.jgrid.htmlDecode($t.rows[i].cells[pos].innerHTML);
                        }
                        mathopr ? sum += parseFloat(val,10) :
                            obj ? ret.push({id:$t.rows[i].id,value:val}) : ret[i]=val;
                        i++;
                    }
                    if(mathopr) {
                        switch(mathopr.toLowerCase()){
                            case 'sum': ret =sum; break;
                            case 'avg': ret = sum/ln; break;
                            case 'count': ret = ln; break;
                        }
                    }
                }
            }
        });
        return ret;
    },
    clearGridData : function(clearfooter) {
        return this.each(function(){
            var $t = this;
            if(!$t.grid) {return;}
            if(typeof clearfooter != 'boolean') clearfooter = false;
            $("tbody:first tr", $t.grid.bDiv).remove();
            if($t.p.footerrow && clearfooter) $(".ui-jqgrid-ftable td",$t.grid.sDiv).html("&nbsp;");
            $t.p.selrow = null; $t.p.selarrrow= []; $t.p.savedRow = [];
            $t.p.records = 0;$t.p.page='0';$t.p.lastpage='0';$t.p.reccount=0;
            $t.updatepager(true);
        });
    },
    getInd : function(rowid,rc){
        var ret =false,rw;
        this.each(function(){
            rw = this.rows.namedItem(rowid);
            if(rw) {
                ret = rc===true ? rw: rw.rowIndex;
            }
        });
        return ret;
    }
});
})(jQuery);
;(function($){
/*
**
 * jqGrid extension for cellediting Grid Data
 * Tony Tomov tony@trirand.com
 * http://trirand.com/blog/
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
**/
/**
 * all events and options here are aded anonynous and not in the base grid
 * since the array is to big. Here is the order of execution.
 * From this point we use jQuery isFunction
 * formatCell
 * beforeEditCell,
 * onSelectCell (used only for noneditable cels)
 * afterEditCell,
 * beforeSaveCell, (called before validation of values if any)
 * beforeSubmitCell (if cellsubmit remote (ajax))
 * afterSubmitCell(if cellsubmit remote (ajax)),
 * afterSaveCell,
 * errorCell,
 * Options
 * cellsubmit (remote,clientArray) (added in grid options)
 * cellurl
* */
$.jgrid.extend({
    editCell : function (iRow,iCol, ed){
        return this.each(function (){
            var $t = this, nm, tmp,cc;
            if (!$t.grid || $t.p.cellEdit !== true) {return;}
            iCol = parseInt(iCol,10);
            // select the row that can be used for other methods
            $t.p.selrow = $t.rows[iRow].id;
            if (!$t.p.knv) {$($t).jqGrid("GridNav");}
            // check to see if we have already edited cell
            if ($t.p.savedRow.length>0) {
                // prevent second click on that field and enable selects
                if (ed===true ) {
                    if(iRow == $t.p.iRow && iCol == $t.p.iCol){
                        return;
                    }
                }
                // if so check to see if the content is changed
                var vl = $("td:eq("+$t.p.savedRow[0].ic+")>#"+$t.p.savedRow[0].id+"_"+$.jgrid.jqID($t.p.savedRow[0].name),$t.rows[$t.p.savedRow[0].id]).val();
                if ($t.p.savedRow[0].v !=  vl) {
                    // save it
                    $($t).jqGrid("saveCell",$t.p.savedRow[0].id,$t.p.savedRow[0].ic)
                } else {
                    // restore it
                    $($t).jqGrid("restoreCell",$t.p.savedRow[0].id,$t.p.savedRow[0].ic);
                }
            } else {
                window.setTimeout(function () { $("#"+$t.p.knv).attr("tabindex","-1").focus();},0);
            }
            nm = $t.p.colModel[iCol].name;
            if (nm=='subgrid' || nm=='cb' || nm=='rn') {return;}
            if ($t.p.colModel[iCol].editable===true && ed===true) {
                cc = $("td:eq("+iCol+")",$t.rows[iRow]);
                if(parseInt($t.p.iCol)>=0  && parseInt($t.p.iRow)>=0) {
                    $("td:eq("+$t.p.iCol+")",$t.rows[$t.p.iRow]).removeClass("edit-cell ui-state-highlight");
                    $($t.rows[$t.p.iRow]).removeClass("selected-row ui-state-hover");
                }
                $(cc).addClass("edit-cell ui-state-highlight");
                $($t.rows[iRow]).addClass("selected-row ui-state-hover");
                try {
                    tmp =  $.unformat(cc,{colModel:$t.p.colModel[iCol]},iCol);
                } catch (_) {
                    tmp = $(cc).html();
                }
                if (!$t.p.colModel[iCol].edittype) {$t.p.colModel[iCol].edittype = "text";}
                $t.p.savedRow.push({id:iRow,ic:iCol,name:nm,v:tmp});
                if($.isFunction($t.p.formatCell)) {
                    var tmp2 = $t.p.formatCell($t.rows[iRow].id,nm,tmp,iRow,iCol);
                    if(tmp2 != undefined ) {tmp = tmp2;}
                }
                var opt = $.extend({}, $t.p.colModel[iCol].editoptions || {} ,{id:iRow+"_"+nm,name:nm});
                var elc = createEl($t.p.colModel[iCol].edittype,opt,tmp,true);
                if ($.isFunction($t.p.beforeEditCell)) {
                    $t.p.beforeEditCell($t.rows[iRow].id,nm,tmp,iRow,iCol);
                }
                $(cc).html("").append(elc).attr("tabindex","0");
                window.setTimeout(function () { $(elc).focus();},0);
                $("input, select, textarea",cc).bind("keydown",function(e) {
                    if (e.keyCode === 27) {$($t).jqGrid("restoreCell",iRow,iCol);} //ESC
                    if (e.keyCode === 13) {$($t).jqGrid("saveCell",iRow,iCol);}//Enter
                    if (e.keyCode == 9)  {
                        if (e.shiftKey) {$($t).jqGrid("prevCell",iRow,iCol);} //Shift TAb
                        else {$($t).jqGrid("nextCell",iRow,iCol);} //Tab
                    }
                    e.stopPropagation();
                });
                if ($.isFunction($t.p.afterEditCell)) {
                    $t.p.afterEditCell($t.rows[iRow].id,nm,tmp,iRow,iCol);
                }
            } else {
                if (parseInt($t.p.iCol)>=0  && parseInt($t.p.iRow)>=0) {
                    $("td:eq("+$t.p.iCol+")",$t.rows[$t.p.iRow]).removeClass("edit-cell ui-state-highlight");
                    $($t.rows[$t.p.iRow]).removeClass("selected-row ui-state-hover");
                }
                $("td:eq("+iCol+")",$t.rows[iRow]).addClass("edit-cell ui-state-highlight");
                $($t.rows[iRow]).addClass("selected-row ui-state-hover");
                if ($.isFunction($t.p.onSelectCell)) {
                    tmp = $("td:eq("+iCol+")",$t.rows[iRow]).html().replace(/\&nbsp\;/ig,'');
                    $t.p.onSelectCell($t.rows[iRow].id,nm,tmp,iRow,iCol);
                }
            }
            $t.p.iCol = iCol; $t.p.iRow = iRow;
        });
    },
    saveCell : function (iRow, iCol){
        return this.each(function(){
            var $t= this, fr;
            if (!$t.grid || $t.p.cellEdit !== true) {return;}
            if ( $t.p.savedRow.length >= 1) {fr = 0;} else {fr=null;}
            if(fr != null) {
                var cc = $("td:eq("+iCol+")",$t.rows[iRow]),v,v2,
                nm = $t.p.colModel[iCol].name, nmjq = $.jgrid.jqID(nm);
                switch ($t.p.colModel[iCol].edittype) {
                    case "select":
                        if(!$t.p.colModel[iCol].editoptions.multiple) {
                            v = $("#"+iRow+"_"+nmjq+">option:selected",$t.rows[iRow]).val();
                            v2 = $("#"+iRow+"_"+nmjq+">option:selected",$t.rows[iRow]).text();
                        } else {
                            var sel = $("#"+iRow+"_"+nmjq,$t.rows[iRow]), selectedText = [];
                            v = $(sel).val();
                            if(v) v.join(","); else v="";
                            $("option:selected",sel).each(
                                function(i,selected){
                                    selectedText[i] = $(selected).text();
                                }
                            );
                            v2 = selectedText.join(",");
                        }
                        if($t.p.colModel[iCol].formatter) v2 = v;
                        break;
                    case "checkbox":
                        var cbv  = ["Yes","No"];
                        if($t.p.colModel[iCol].editoptions){
                            cbv = $t.p.colModel[iCol].editoptions.value.split(":");
                        }
                        v = $("#"+iRow+"_"+nmjq,$t.rows[iRow]).attr("checked") ? cbv[0] : cbv[1];
                        v2=v;
                        break;
                    case "password":
                    case "text":
                    case "textarea":
                    case "button" :
                        v = !$t.p.autoencode ? $("#"+iRow+"_"+nmjq,$t.rows[iRow]).val() : $.jgrid.htmlEncode($("#"+iRow+"_"+nmjq,$t.rows[iRow]).val());
                        v2=v;
                        break;
                }
                // The common approach is if nothing changed do not do anything
                if (v2 != $t.p.savedRow[fr].v){
                    if ($.isFunction($t.p.beforeSaveCell)) {
                        var vv = $t.p.beforeSaveCell($t.rows[iRow].id,nm, v, iRow,iCol);
                        if (vv) {v = vv;}
                    }
                    var cv = checkValues(v,iCol,$t);
                    if(cv[0] === true) {
                        var addpost = {};
                        if ($.isFunction($t.p.beforeSubmitCell)) {
                            addpost = $t.p.beforeSubmitCell($t.rows[iRow].id,nm, v, iRow,iCol);
                            if (!addpost) {addpost={};}
                        }
                        if(v2=="") v2=" ";
                        if ($t.p.cellsubmit == 'remote') {
                            if ($t.p.cellurl) {
                                var postdata = {};
                                postdata[nm] = v;
                                postdata["id"] = $t.rows[iRow].id;
                                postdata = $.extend(addpost,postdata);
                                $.ajax({
                                    url: $t.p.cellurl,
                                    data :postdata,
                                    type: "POST",
                                    complete: function (result, stat) {
                                        if (stat == 'success') {
                                            if ($.isFunction($t.p.afterSubmitCell)) {
                                                var ret = $t.p.afterSubmitCell(result,postdata.id,nm,v,iRow,iCol);
                                                if(ret[0] === true) {
                                                    $(cc).empty();
                                                    $($t).jqGrid("setCell",$t.rows[iRow].id, iCol, v2);
                                                    $(cc).addClass("dirty-cell");
                                                    $($t.rows[iRow]).addClass("edited");
                                                    if ($.isFunction($t.p.afterSaveCell)) {
                                                        $t.p.afterSaveCell($t.rows[iRow].id,nm, v, iRow,iCol);
                                                    }
                                                    $t.p.savedRow.splice(0,1);
                                                } else {
                                                    info_dialog($.jgrid.errors.errcap,ret[1],$.jgrid.edit.bClose);
                                                    $($t).jqGrid("restoreCell",iRow,iCol);
                                                }
                                            } else {
                                                $(cc).empty();
                                                $($t).jqGrid("setCell",$t.rows[iRow].id, iCol, v2);
                                                $(cc).addClass("dirty-cell");
                                                $($t.rows[iRow]).addClass("edited");
                                                if ($.isFunction($t.p.afterSaveCell)) {
                                                    $t.p.afterSaveCell($t.rows[iRow].id,nm, v, iRow,iCol);
                                                }
                                                $t.p.savedRow.splice(0,1);
                                            }
                                        }
                                    },
                                    error:function(res,stat){
                                        if ($.isFunction($t.p.errorCell)) {
                                            $t.p.errorCell(res,stat);
                                            $($t).jqGrid("restoreCell",iRow,iCol);
                                        } else {
                                            info_dialog($.jgrid.errors.errcap,res.status+" : "+res.statusText+"<br/>"+stat,$.jgrid.edit.bClose);
                                            $($t).jqGrid("restoreCell",iRow,iCol);
                                        }
                                    }
                                });
                            } else {
                                try {
                                    info_dialog($.jgrid.errors.errcap,$.jgrid.errors.nourl,$.jgrid.edit.bClose);
                                    $($t).jqGrid("restoreCell",iRow,iCol);
                                } catch (e) {}
                            }
                        }
                        if ($t.p.cellsubmit == 'clientArray') {
                            $(cc).empty();
                            $($t).jqGrid("setCell",$t.rows[iRow].id,iCol, v2);
                            $(cc).addClass("dirty-cell");
                            $($t.rows[iRow]).addClass("edited");
                            if ($.isFunction($t.p.afterSaveCell)) {
                                $t.p.afterSaveCell($t.rows[iRow].id,nm, v, iRow,iCol);
                            }
                            $t.p.savedRow.splice(0,1);
                        }
                    } else {
                        try {
                            window.setTimeout(function(){info_dialog($.jgrid.errors.errcap,v+" "+cv[1],$.jgrid.edit.bClose)},100);
                            $($t).jqGrid("restoreCell",iRow,iCol);
                        } catch (e) {}
                    }
                } else {
                    $($t).jqGrid("restoreCell",iRow,iCol);
                }
            }
            if ($.browser.opera) {
                $("#"+$t.p.knv).attr("tabindex","-1").focus();
            } else {
                window.setTimeout(function () { $("#"+$t.p.knv).attr("tabindex","-1").focus();},0);
            }
        });
    },
    restoreCell : function(iRow, iCol) {
        return this.each(function(){
            var $t= this, fr;
            if (!$t.grid || $t.p.cellEdit !== true ) {return;}
            if ( $t.p.savedRow.length >= 1) {fr = 0;} else {fr=null;}
            if(fr != null) {
                var cc = $("td:eq("+iCol+")",$t.rows[iRow]);
                // datepicker fix
                if($.isFunction($.fn['datepicker'])) {
                    try {
                        $("input.hasDatepicker",cc).datepicker('hide');
                    } catch (e) {}
                }
                $(cc).empty().attr("tabindex","-1");
                $($t).jqGrid("setCell",$t.rows[iRow].id, iCol, $t.p.savedRow[fr].v);
                $t.p.savedRow.splice(0,1);

            }
            window.setTimeout(function () { $("#"+$t.p.knv).attr("tabindex","-1").focus();},0);
        });
    },
    nextCell : function (iRow,iCol) {
        return this.each(function (){
            var $t = this, nCol=false;
            if (!$t.grid || $t.p.cellEdit !== true) {return;}
            // try to find next editable cell
            for (var i=iCol+1; i<$t.p.colModel.length; i++) {
                if ( $t.p.colModel[i].editable ===true) {
                    nCol = i; break;
                }
            }
            if(nCol !== false) {
                $($t).jqGrid("editCell",iRow,nCol,true);
            } else {
                if ($t.p.savedRow.length >0) {
                    $($t).jqGrid("saveCell",iRow,iCol);
                }
            }
        });
    },
    prevCell : function (iRow,iCol) {
        return this.each(function (){
            var $t = this, nCol=false;
            if (!$t.grid || $t.p.cellEdit !== true) {return;}
            // try to find next editable cell
            for (var i=iCol-1; i>=0; i--) {
                if ( $t.p.colModel[i].editable ===true) {
                    nCol = i; break;
                }
            }
            if(nCol !== false) {
                $($t).jqGrid("editCell",iRow,nCol,true);
            } else {
                if ($t.p.savedRow.length >0) {
                    $($t).jqGrid("saveCell",iRow,iCol);
                }
            }
        });
    },
    GridNav : function() {
        return this.each(function () {
            var  $t = this;
            if (!$t.grid || $t.p.cellEdit !== true ) {return;}
            // trick to process keydown on non input elements
            $t.p.knv = $("table:first",$t.grid.bDiv).attr("id") + "_kn";
            var selection = $("<span style='width:0px;height:0px;background-color:black;' tabindex='0'><span tabindex='-1' style='width:0px;height:0px;background-color:grey' id='"+$t.p.knv+"'></span></span>"),
            i;
            $(selection).insertBefore($t.grid.cDiv);
            $("#"+$t.p.knv).focus();
            $("#"+$t.p.knv).keydown(function (e){
                switch (e.keyCode) {
                    case 38:
                        if ($t.p.iRow-1 >=0 ) {
                            scrollGrid($t.p.iRow-1,$t.p.iCol,'vu');
                            $($t).jqGrid("editCell",$t.p.iRow-1,$t.p.iCol,false);
                        }
                    break;
                    case 40 :
                        if ($t.p.iRow+1 <=  $t.rows.length-1) {
                            scrollGrid($t.p.iRow+1,$t.p.iCol,'vd');
                            $($t).jqGrid("editCell",$t.p.iRow+1,$t.p.iCol,false);
                        }
                    break;
                    case 37 :
                        if ($t.p.iCol -1 >=  0) {
                            i = findNextVisible($t.p.iCol-1,'lft');
                            scrollGrid($t.p.iRow, i,'h');
                            $($t).jqGrid("editCell",$t.p.iRow, i,false);
                        }
                    break;
                    case 39 :
                        if ($t.p.iCol +1 <=  $t.p.colModel.length-1) {
                            i = findNextVisible($t.p.iCol+1,'rgt');
                            scrollGrid($t.p.iRow,i,'h');
                            $($t).jqGrid("editCell",$t.p.iRow,i,false);
                        }
                    break;
                    case 13:
                        if (parseInt($t.p.iCol,10)>=0 && parseInt($t.p.iRow,10)>=0) {
                            $($t).jqGrid("editCell",$t.p.iRow,$t.p.iCol,true);
                        }
                    break;
                }
                return false;
            });
            function scrollGrid(iR, iC, tp){
                if (tp.substr(0,1)=='v') {
                    var ch = $($t.grid.bDiv)[0].clientHeight,
                    st = $($t.grid.bDiv)[0].scrollTop,
                    nROT = $t.rows[iR].offsetTop+$t.rows[iR].clientHeight,
                    pROT = $t.rows[iR].offsetTop;
                    if(tp == 'vd') {
                        if(nROT >= ch) {
                            $($t.grid.bDiv)[0].scrollTop = $($t.grid.bDiv)[0].scrollTop + $t.rows[iR].clientHeight;
                        }
                    }
                    if(tp == 'vu'){
                        if (pROT < st) {
                            $($t.grid.bDiv)[0].scrollTop = $($t.grid.bDiv)[0].scrollTop - $t.rows[iR].clientHeight;
                        }
                    }
                }
                if(tp=='h') {
                    var cw = $($t.grid.bDiv)[0].clientWidth,
                    sl = $($t.grid.bDiv)[0].scrollLeft,
                    nCOL = $t.rows[iR].cells[iC].offsetLeft+$t.rows[iR].cells[iC].clientWidth,
                    pCOL = $t.rows[iR].cells[iC].offsetLeft;
                    if(nCOL >= cw+parseInt(sl)) {
                        $($t.grid.bDiv)[0].scrollLeft = $($t.grid.bDiv)[0].scrollLeft + $t.rows[iR].cells[iC].clientWidth;
                    } else if (pCOL < sl) {
                        $($t.grid.bDiv)[0].scrollLeft = $($t.grid.bDiv)[0].scrollLeft - $t.rows[iR].cells[iC].clientWidth;
                    }
                }
            };
            function findNextVisible(iC,act){
                var ind, i;
                if(act == 'lft') {
                    ind = iC+1;
                    for (i=iC;i>=0;i--){
                        if ($t.p.colModel[i].hidden !== true) {
                            ind = i;
                            break;
                        }
                    }
                }
                if(act == 'rgt') {
                    ind = iC-1;
                    for (i=iC; i<$t.p.colModel.length;i++){
                        if ($t.p.colModel[i].hidden !== true) {
                            ind = i;
                            break;
                        }
                    }
                }
                return ind;
            };
        });
    },
    getChangedCells : function (mthd) {
        var ret=[];
        if (!mthd) {mthd='all';}
        this.each(function(){
            var $t= this,nm;
            if (!$t.grid || $t.p.cellEdit !== true ) {return;}
            $($t.rows).each(function(j){
                var res = {};
                if ($(this).hasClass("edited")) {
                    $('td',this).each( function(i) {
                        nm = $t.p.colModel[i].name;
                        if ( nm !== 'cb' && nm !== 'subgrid') {
                            if (mthd=='dirty') {
                                if ($(this).hasClass('dirty-cell')) {
                                    try {
                                        res[nm] = $.unformat(this,{colModel:$t.p.colModel[i]},i);
                                    } catch (e){
                                        res[nm] = $.jgrid.htmlDecode($(this).html());
                                    }
                                }
                            } else {
                                try {
                                    res[nm] = $.unformat(this,{colModel:$t.p.colModel[i]},i);
                                } catch (e) {
                                    res[nm] = $.jgrid.htmlDecode($(this).html());
                                }
                            }
                        }
                    });
                    res["id"] = this.id;
                    ret.push(res);
                }
            });
        });
        return ret;
    }
/// end  cell editing
});
})(jQuery);
/*
 * jqGrid common function
 * Tony Tomov tony@trirand.com
 * http://trirand.com/blog/
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
*/
// Modal functions
var showModal = function(h) {
    h.w.show();
};
var closeModal = function(h) {
    h.w.hide().attr("aria-hidden","true");
    if(h.o) { h.o.remove(); }
};
var createModal = function(aIDs, content, p, insertSelector, posSelector, appendsel) {
    var mw  = document.createElement('div');
    mw.className= "ui-widget ui-widget-content ui-corner-all ui-jqdialog";
    mw.id = aIDs.themodal;
    var mh = document.createElement('div');
    mh.className = "ui-jqdialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix";
    mh.id = aIDs.modalhead;
    jQuery(mh).append("<span class='ui-jqdialog-title'>"+p.caption+"</span>");
    var ahr= jQuery("<a href='javascript:void(0)' class='ui-jqdialog-titlebar-close ui-corner-all'></a>")
    .hover(function(){ahr.addClass('ui-state-hover');},
           function(){ahr.removeClass('ui-state-hover');})
    .append("<span class='ui-icon ui-icon-closethick'></span>");
    jQuery(mh).append(ahr);
    var mc = document.createElement('div');
    jQuery(mc).addClass("ui-jqdialog-content ui-widget-content").attr("id",aIDs.modalcontent);
    jQuery(mc).append(content);
    mw.appendChild(mc);
    jQuery(mw).prepend(mh);
    if(appendsel===true) { jQuery('body').append(mw); } //append as first child in body -for alert dialog
    else {jQuery(mw).insertBefore(insertSelector);}
    if(typeof p.jqModal === 'undefined') {p.jqModal = true;} // internal use
    if ( jQuery.fn.jqm && p.jqModal === true) {
        if(p.left ==0 && p.top==0) {
            var pos = [];
            pos = findPos(posSelector);
            p.left = pos[0] + 4;
            p.top = pos[1] + 4;
        }
    }
    jQuery("a.ui-jqdialog-titlebar-close",mh).click(function(e){
        var oncm = jQuery("#"+aIDs.themodal).data("onClose") || p.onClose;
        var gboxclose = jQuery("#"+aIDs.themodal).data("gbox") || p.gbox;
        hideModal("#"+aIDs.themodal,{gb:gboxclose,jqm:p.jqModal,onClose:oncm});
        return false;
    });
    if (p.width == 0 || !p.width) {p.width = 300;}
    if(p.height==0 || !p.height) {p.height =200;}
    if(!p.zIndex) {p.zIndex = 950;}
    jQuery(mw).css({
        top: p.top+"px",
        left: p.left+"px",
        width: isNaN(p.width) ? "auto": p.width+"px",
        height:isNaN(p.height) ? "auto" : p.height + "px",
        zIndex:p.zIndex,
        overflow: 'hidden'
    })
    .attr({tabIndex: "-1","role":"dialog","aria-labelledby":aIDs.modalhead,"aria-hidden":"true"});
    if(typeof p.drag == 'undefined') { p.drag=true;}
    if(typeof p.resize == 'undefined') {p.resize=true;}
    if (p.drag) {
        jQuery(mh).css('cursor','move');
        if(jQuery.fn.jqDrag) {
            jQuery(mw).jqDrag(mh);
        } else {
            try {
                jQuery(mw).draggable({handle: jQuery("#"+mh.id)});
            } catch (e) {}
        }
    }
    if(p.resize) {
        if(jQuery.fn.jqResize) {
            jQuery(mw).append("<div class='jqResize ui-resizable-handle ui-resizable-se ui-icon ui-icon-gripsmall-diagonal-se ui-icon-grip-diagonal-se'></div>");
            jQuery("#"+aIDs.themodal).jqResize(".jqResize",aIDs.scrollelm ? "#"+aIDs.scrollelm : false);
        } else {
            try {
                jQuery(mw).resizable({handles: 'se',alsoResize: aIDs.scrollelm ? "#"+aIDs.scrollelm : false});
            } catch (e) {}
        }
    }
    if(p.closeOnEscape === true){
        jQuery(mw).keydown( function( e ) {
            if( e.which == 27 ) {
                var cone = jQuery("#"+aIDs.themodal).data("onClose") || p.onClose;
                hideModal(this,{gb:p.gbox,jqm:p.jqModal,onClose: cone});
            }
        });
    }
};
var viewModal = function (selector,o){
    o = jQuery.extend({
        toTop: true,
        overlay: 10,
        modal: false,
        onShow: showModal,
        onHide: closeModal,
        gbox: '',
        jqm : true,
        jqM : true
    }, o || {});
    if (jQuery.fn.jqm && o.jqm == true) {
        if(o.jqM) jQuery(selector).attr("aria-hidden","false").jqm(o).jqmShow();
        else jQuery(selector).attr("aria-hidden","false").jqmShow();
    } else {
        if(o.gbox != '') {
            jQuery(".jqgrid-overlay:first",o.gbox).show();
            jQuery(selector).data("gbox",o.gbox);
        }
        jQuery(selector).show().attr("aria-hidden","false");
        try{jQuery(':input:visible',selector)[0].focus();}catch(_){}
    }
};
var hideModal = function (selector,o) {
    o = jQuery.extend({jqm : true, gb :''}, o || {});
    if(o.onClose) {
        var oncret =  o.onClose(selector);
        if (typeof oncret == 'boolean'  && !oncret ) return;
    }
    if (jQuery.fn.jqm && o.jqm === true) {
        jQuery(selector).attr("aria-hidden","true").jqmHide();
    } else {
        if(o.gb != '') {
            try {jQuery(".jqgrid-overlay:first",o.gb).hide();} catch (e){}
        }
        jQuery(selector).hide().attr("aria-hidden","true");
    }
};

function info_dialog(caption, content,c_b, modalopt) {
    var mopt = {
        width:290,
        height:'auto',
        dataheight: 'auto',
        drag: true,
        resize: false,
        caption:"<b>"+caption+"</b>",
        left:250,
        top:170,
        jqModal : true,
        closeOnEscape : true,
        align: 'center',
        buttonalign : 'center'
    };
    jQuery.extend(mopt,modalopt || {});
    var jm = mopt.jqModal;
    if(jQuery.fn.jqm && !jm) jm = false;
    // in case there is no jqModal
    var dh = isNaN(mopt.dataheight) ? mopt.dataheight : mopt.dataheight+"px",
    cn = "text-align:"+mopt.align+";";
    var cnt = "<div id='info_id'>";
    cnt += "<div id='infocnt' style='margin:0px;padding-bottom:1em;width:100%;overflow:auto;position:relative;height:"+dh+";"+cn+"'>"+content+"</div>";
    cnt += c_b ? "<div class='ui-widget-content ui-helper-clearfix' style='text-align:"+mopt.buttonalign+";padding-bottom:0.8em;padding-top:0.5em;background-image: none;border-width: 1px 0 0 0;'><a href='javascript:void(0)' id='closedialog' class='fm-button ui-state-default ui-corner-all'>"+c_b+"</a></div>" : "";
    cnt += "</div>";

    try {jQuery("#info_dialog").remove();} catch (e){}
    createModal({
        themodal:'info_dialog',
        modalhead:'info_head',
        modalcontent:'info_content',
        scrollelm: 'infocnt'},
        cnt,
        mopt,
        '','',true
    );
    jQuery("#closedialog", "#info_id").click(function(e){
        hideModal("#info_dialog",{jqm:jm});
        return false;
    });
    jQuery(".fm-button","#info_dialog").hover(
        function(){jQuery(this).addClass('ui-state-hover');},
        function(){jQuery(this).removeClass('ui-state-hover');}
    );
    viewModal("#info_dialog",{
        onHide: function(h) {
            h.w.hide().remove();
            if(h.o) { h.o.remove(); }
        },
        modal :true,
        jqm:jm
    });
}
//Helper functions
function findPos(obj) {
    var curleft = curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        //do not change obj == obj.offsetParent
    }
    return [curleft,curtop];
}
function isArray(obj) {
    if (obj.constructor.toString().indexOf("Array") == -1) {
        return false;
    } else {
        return true;
    }
}
// Form Functions
function createEl(eltype,options,vl,autowidth) {
    var elem = "";
    if(options.defaultValue) delete options['defaultValue'];
    function bindEv (el, opt) {
        if(jQuery.isFunction(opt.dataInit)) {
            // datepicker fix
            el.id = opt.id;
            opt.dataInit(el);
            delete opt['id'];
            delete opt['dataInit'];
        }
        if(opt.dataEvents) {
            jQuery.each(opt.dataEvents, function() {
                if (this.data != null)
                    jQuery(el).bind(this.type, this.data, this.fn);
                else
                    jQuery(el).bind(this.type, this.fn);
            });
            delete opt['dataEvents'];
        }
        return opt;
    }
    switch (eltype)
    {
        case "textarea" :
                elem = document.createElement("textarea");
                if(autowidth) {
                    if(!options.cols) jQuery(elem).css({width:"98%"});
                } else if (!options.cols) options.cols = 20;
                if(!options.rows) options.rows = 2;
                if(vl=='&nbsp;' || vl=='&#160;' || (vl.length==1 && vl.charCodeAt(0)==160)) {vl="";}
                elem.value = vl;
                options = bindEv(elem,options);
                jQuery(elem).attr(options);
                break;
        case "checkbox" : //what code for simple checkbox
            elem = document.createElement("input");
            elem.type = "checkbox";
            if( !options.value ) {
                var vl1 = vl.toLowerCase();
                if(vl1.search(/(false|0|no|off|undefined)/i)<0 && vl1!=="") {
                    elem.checked=true;
                    elem.defaultChecked=true;
                    elem.value = vl;
                } else {
                    elem.value = "on";
                }
                jQuery(elem).attr("offval","off");
            } else {
                var cbval = options.value.split(":");
                if(vl === cbval[0]) {
                    elem.checked=true;
                    elem.defaultChecked=true;
                }
                elem.value = cbval[0];
                jQuery(elem).attr("offval",cbval[1]);
                try {delete options['value'];} catch (e){}
            }
            options = bindEv(elem,options);
            jQuery(elem).attr(options);
            break;
        case "select" :
            elem = document.createElement("select");
            var msl = options.multiple===true ? true : false;
            if(options.dataUrl != null) {
                jQuery.get(options.dataUrl,{_nsd : (new Date().getTime())},function(data){
                    try {delete options['dataUrl'];delete options['value'];} catch (e){}
                    var a = jQuery(data).html();
                    jQuery(elem).append(a);
                    options = bindEv(elem,options);
                    if(typeof options.size === 'undefined') { options.size =  msl ? 3 : 1;}
                    jQuery(elem).attr(options);
                    setTimeout(function(){
                        jQuery("option",elem).each(function(i){
                            if(jQuery(this).text()==vl || jQuery(this).val()==vl) {
                                this.selected= "selected";
                                return false;
                            }
                        });
                    },0);
                },'html');
            } else if(options.value) {
                var ovm = [], i;
                if(msl) {
                    ovm = vl.split(",");
                    ovm = jQuery.map(ovm,function(n){return jQuery.trim(n)});
                    if(typeof options.size === 'undefined') {options.size = 3;}
                } else {
                    options.size = 1;
                }
                if(typeof options.value === 'function') options.value = options.value();
                if(typeof options.value === 'string') {
                    var so = options.value.split(";"),sv, ov;
                    for(i=0; i<so.length;i++){
                        sv = so[i].split(":");
                        ov = document.createElement("option");
                        ov.value = sv[0]; ov.innerHTML = sv[1];
                        if (!msl &&  (sv[0] == vl || sv[1]==vl)) ov.selected ="selected";
                        if (msl && (jQuery.inArray(sv[1], ovm)>-1 || jQuery.inArray(sv[0], ovm)>-1)) {ov.selected ="selected";}
                        elem.appendChild(ov);
                    }
                } else if (typeof options.value === 'object') {
                    var oSv = options.value;
                    i=0;
                    for ( var key in oSv) {
                        i++;
                        ov = document.createElement("option");
                        ov.value = key; ov.innerHTML = oSv[key];
                        if (!msl &&  (key == vl ||oSv[key]==vl) ) ov.selected ="selected";
                        if (msl && (jQuery.inArray(oSv[key],ovm)>-1 || jQuery.inArray(key,ovm)>-1)) ov.selected ="selected";
                        elem.appendChild(ov);
                    }
                }
                options = bindEv(elem,options);
                try {delete options['value'];} catch (e){}
                jQuery(elem).attr(options);
            }
            break;
        case "text" :
        case "password" :
        case "button" :
            elem = document.createElement("input");
            elem.type = eltype;
            elem.value = jQuery.jgrid.htmlDecode(vl);
            options = bindEv(elem,options);
            if(eltype != "button"){
                if(autowidth) {
                    if(!options.size) jQuery(elem).css({width:"98%"});
                } else if (!options.size) options.size = 20;
            }
            jQuery(elem).attr(options);
            break;
        case "image" :
        case "file" :
            elem = document.createElement("input");
            elem.type = eltype;
            options = bindEv(elem,options);
            jQuery(elem).attr(options);
            break;
    }
    return elem;
}
function checkValues(val, valref,g) {
    var edtrul,i, nm;
    if(typeof(valref)=='string'){
        for( i =0, len=g.p.colModel.length;i<len; i++){
            if(g.p.colModel[i].name==valref) {
                edtrul = g.p.colModel[i].editrules;
                valref = i;
                try { nm = g.p.colModel[i].formoptions.label; } catch (e) {}
                break;
            }
        }
    } else if(valref >=0) {
        edtrul = g.p.colModel[valref].editrules;
    }
    if(edtrul) {
        if(!nm) nm = g.p.colNames[valref];
        if(edtrul.required === true) {
            if( val.match(/^s+$/) || val == "" )  return [false,nm+": "+jQuery.jgrid.edit.msg.required,""];
        }
        // force required
        var rqfield = edtrul.required === false ? false : true;
        if(edtrul.number === true) {
            if( !(rqfield === false && isEmpty(val)) ) {
                if(isNaN(val)) return [false,nm+": "+jQuery.jgrid.edit.msg.number,""];
            }
        }
        if(typeof edtrul.minValue != 'undefined' && !isNaN(edtrul.minValue)) {
            if (parseFloat(val) < parseFloat(edtrul.minValue) ) return [false,nm+": "+jQuery.jgrid.edit.msg.minValue+" "+edtrul.minValue,""];
        }
        if(typeof edtrul.maxValue != 'undefined' && !isNaN(edtrul.maxValue)) {
            if (parseFloat(val) > parseFloat(edtrul.maxValue) ) return [false,nm+": "+jQuery.jgrid.edit.msg.maxValue+" "+edtrul.maxValue,""];
        }
        var filter;
        if(edtrul.email === true) {
            if( !(rqfield === false && isEmpty(val)) ) {
            // taken from jquery Validate plugin
                filter = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i;
                if(!filter.test(val)) {return [false,nm+": "+jQuery.jgrid.edit.msg.email,""];}
            }
        }
        if(edtrul.integer === true) {
            if( !(rqfield === false && isEmpty(val)) ) {
                if(isNaN(val)) return [false,nm+": "+jQuery.jgrid.edit.msg.integer,""];
                if ((val % 1 != 0) || (val.indexOf('.') != -1)) return [false,nm+": "+jQuery.jgrid.edit.msg.integer,""];
            }
        }
        if(edtrul.date === true) {
            if( !(rqfield === false && isEmpty(val)) ) {
                var dft = g.p.colModel[valref].datefmt || "Y-m-d";
                if(!checkDate (dft, val)) return [false,nm+": "+jQuery.jgrid.edit.msg.date+" - "+dft,""];
            }
        }
        if(edtrul.time === true) {
            if( !(rqfield === false && isEmpty(val)) ) {
                if(!checkTime (val)) return [false,nm+": "+jQuery.jgrid.edit.msg.date+" - hh:mm (am/pm)",""];
            }
        }
        if(edtrul.url === true) {
            if( !(rqfield === false && isEmpty(val)) ) {
                filter = /^(((https?)|(ftp)):\/\/([\-\w]+\.)+\w{2,3}(\/[%\-\w]+(\.\w{2,})?)*(([\w\-\.\?\\\/+@&#;`~=%!]*)(\.\w{2,})?)*\/?)/i;
                if(!filter.test(val)) {return [false,nm+": "+jQuery.jgrid.edit.msg.url,""];}
            }
        }
    }
    return [true,"",""];
}
// Date Validation Javascript
function checkDate (format, date) {
    var tsp = {}, sep;
    format = format.toLowerCase();
    //we search for /,-,. for the date separator
    if(format.indexOf("/") != -1) {
        sep = "/";
    } else if(format.indexOf("-") != -1) {
        sep = "-";
    } else if(format.indexOf(".") != -1) {
        sep = ".";
    } else {
        sep = "/";
    }
    format = format.split(sep);
    date = date.split(sep);
    if (date.length != 3) return false;
    var j=-1,yln, dln=-1, mln=-1;
    for(var i=0;i<format.length;i++){
        var dv =  isNaN(date[i]) ? 0 : parseInt(date[i],10);
        tsp[format[i]] = dv;
        yln = format[i];
        if(yln.indexOf("y") != -1) { j=i; }
        if(yln.indexOf("m") != -1) {mln=i}
        if(yln.indexOf("d") != -1) {dln=i}
    }
    if (format[j] == "y" || format[j] == "yyyy") {
        yln=4;
    } else if(format[j] =="yy"){
        yln = 2;
    } else {
        yln = -1;
    }
    var daysInMonth = DaysArray(12);
    var strDate;
    if (j === -1) {
        return false;
    } else {
        strDate = tsp[format[j]].toString();
        if(yln == 2 && strDate.length == 1) {yln = 1;}
        if (strDate.length != yln || tsp[format[j]]==0 ){
            return false;
        }
    }
    if(mln === -1) {
        return false;
    } else {
        strDate = tsp[format[mln]].toString();
        if (strDate.length<1 || tsp[format[mln]]<1 || tsp[format[mln]]>12){
            return false;
        }
    }
    if(dln === -1) {
        return false;
    } else {
        strDate = tsp[format[dln]].toString();
        if (strDate.length<1 || tsp[format[dln]]<1 || tsp[format[dln]]>31 || (tsp[format[mln]]==2 && tsp[format[dln]]>daysInFebruary(tsp[format[j]])) || tsp[format[dln]] > daysInMonth[tsp[format[mln]]]){
            return false;
        }
    }
    return true;
}
function daysInFebruary (year){
    // February has 29 days in any year evenly divisible by four,
    // EXCEPT for centurial years which are not also divisible by 400.
    return (((year % 4 == 0) && ( (!(year % 100 == 0)) || (year % 400 == 0))) ? 29 : 28 );
}
function DaysArray(n) {
    for (var i = 1; i <= n; i++) {
        this[i] = 31;
        if (i==4 || i==6 || i==9 || i==11) {this[i] = 30;}
        if (i==2) {this[i] = 29;}
    }
    return this;
}

function isEmpty(val)
{
    if (val.match(/^s+$/) || val == "") {
        return true;
    } else {
        return false;
    }
}
function checkTime(time){
    // checks only hh:ss (and optional am/pm)
    var re = /^(\d{1,2}):(\d{2})([ap]m)?$/,regs;
    if(!isEmpty(time))
    {
        regs = time.match(re);
        if(regs) {
            if(regs[3]) {
                if(regs[1] < 1 || regs[1] > 12)
                    return false;
            } else {
                if(regs[1] > 23)
                    return false;
            }
            if(regs[2] > 59) {
                return false;
            }
        } else {
            return false;
        }
    }
    return true;
};(function($){
/**
 * jqGrid extension for custom methods
 * Tony Tomov tony@trirand.com
 * http://trirand.com/blog/
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
**/
$.jgrid.extend({
    getColProp : function(colname){
        var ret ={}, $t = this[0];
        if ( !$t.grid ) { return; }
        var cM = $t.p.colModel;
        for ( var i =0;i<cM.length;i++ ) {
            if ( cM[i].name == colname ) {
                ret = cM[i];
                break;
            }
        };
        return ret;
    },
    setColProp : function(colname, obj){
        //do not set width will not work
        return this.each(function(){
            if ( this.grid ) {
                if ( obj ) {
                    var cM = this.p.colModel;
                    for ( var i =0;i<cM.length;i++ ) {
                        if ( cM[i].name == colname ) {
                            $.extend(this.p.colModel[i],obj);
                            break;
                        }
                    }
                }
            }
        });
    },
    sortGrid : function(colname,reload){
        return this.each(function(){
            var $t=this,idx=-1;
            if ( !$t.grid ) { return;}
            if ( !colname ) { colname = $t.p.sortname; }
            for ( var i=0;i<$t.p.colModel.length;i++ ) {
                if ( $t.p.colModel[i].index == colname || $t.p.colModel[i].name==colname ) {
                    idx = i;
                    break;
                }
            }
            if ( idx!=-1 ){
                var sort = $t.p.colModel[idx].sortable;
                if ( typeof sort !== 'boolean' ) { sort =  true; }
                if ( typeof reload !=='boolean' ) { reload = false; }
                if ( sort ) { $t.sortData("jqgh_"+colname, idx, reload); }
            }
        });
    },
    GridDestroy : function () {
        return this.each(function(){
            if ( this.grid ) {
                if ( this.p.pager ) { // if not part of grid
                    $(this.p.pager).remove();
                }
                var gid = this.id;
                try {
                    $("#gbox_"+gid).remove();
                } catch (_) {}
            }
        });
    },
    GridUnload : function(){
        return this.each(function(){
            if ( !this.grid ) {return;}
            var defgrid = {id: $(this).attr('id'),cl: $(this).attr('class')};
            if (this.p.pager) {
                $(this.p.pager).empty().removeClass("ui-state-default ui-jqgrid-pager corner-bottom");
            }
            var newtable = document.createElement('table');
            $(newtable).attr({id:defgrid['id']});
            newtable.className = defgrid['cl'];
            var gid = this.id;
            $(newtable).removeClass("ui-jqgrid-btable");
            if( $(this.p.pager).parents("#gbox_"+gid).length === 1 ) {
                $(newtable).insertBefore("#gbox_"+gid).show();
                $(this.p.pager).insertBefore("#gbox_"+gid);
            } else {
                $(newtable).insertBefore("#gbox_"+gid).show();
            }
            $("#gbox_"+gid).remove();
        });
    },
    setGridState : function(state) {
        return this.each(function(){
            if ( !this.grid ) {return;}
            $t = this;
            if(state == 'hidden'){
                $(".ui-jqgrid-bdiv, .ui-jqgrid-hdiv","#gview_"+$t.p.id).slideUp("fast");
                if($t.p.pager) {$($t.p.pager).slideUp("fast");}
                if($t.p.toolbar[0]===true) {
                    if( $t.p.toolbar[1]=='both') {
                        $($t.grid.ubDiv).slideUp("fast");
                    }
                    $($t.grid.uDiv).slideUp("fast");
                }
                if($t.p.footerrow) $(".ui-jqgrid-sdiv","#gbox_"+$s.p.id).slideUp("fast");
                $(".ui-jqgrid-titlebar-close span",$t.grid.cDiv).removeClass("ui-icon-circle-triangle-n").addClass("ui-icon-circle-triangle-s");
                $t.p.gridstate = 'hidden';
            } else if(state=='visible') {
                $(".ui-jqgrid-hdiv, .ui-jqgrid-bdiv","#gview_"+$t.p.id).slideDown("fast");
                if($t.p.pager) {$($t.p.pager).slideDown("fast");}
                if($t.p.toolbar[0]===true) {
                    if( $t.p.toolbar[1]=='both') {
                        $($t.grid.ubDiv).slideDown("fast");
                    }
                    $($t.grid.uDiv).slideDown("fast");
                }
                if($t.p.footerrow) $(".ui-jqgrid-sdiv","#gbox_"+$t.p.id).slideDown("fast");
                $(".ui-jqgrid-titlebar-close span",$t.grid.cDiv).removeClass("ui-icon-circle-triangle-s").addClass("ui-icon-circle-triangle-n");
                $t.p.gridstate = 'visible';
            }

        });
    },
    updateGridRows : function (data, rowidname, jsonreader) {
        var nm, success=false;
        this.each(function(){
            var t = this, vl, ind, srow, sid;
            if(!t.grid) {return false;}
            if(!rowidname) rowidname = "id";
            if( data  && data.length >0 ) {
                $(data).each(function(j){
                    srow = this;
                    ind = t.rows.namedItem(srow[rowidname]);
                    if(ind) {
                        sid = srow[rowidname];
                        if(jsonreader === true){
                            if(t.p.jsonReader.repeatitems === true) {
                                if(t.p.jsonReader.cell) {srow = srow[t.p.jsonReader.cell];}
                                for (var k=0;k<srow.length;k++) {
                                    vl = t.formatter( sid, srow[k], k, srow, 'edit');
                                    if(t.p.treeGrid===true && nm == t.p.ExpandColumn) {
                                        $("td:eq("+k+") > span:first",ind).html(vl).attr("title",$.jgrid.stripHtml(vl));
                                    } else {
                                        $("td:eq("+k+")",ind).html(vl).attr("title",$.jgrid.stripHtml(vl));
                                    }
                                }
                                success = true;
                                return true;
                            }
                        }
                        $(t.p.colModel).each(function(i){
                            nm = jsonreader===true ? this.jsonmap || this.name :this.name;
                            if( srow[nm] != undefined) {
                                vl = t.formatter( sid, srow[nm], i, srow, 'edit');
                                if(t.p.treeGrid===true && nm == t.p.ExpandColumn) {
                                    $("td:eq("+i+") > span:first",ind).html(vl).attr("title",$.jgrid.stripHtml(vl));
                                } else {
                                    $("td:eq("+i+")",ind).html(vl).attr("title",$.jgrid.stripHtml(vl));
                                }
                                success = true;
                            }
                        });
                    }
                });
            }
        });
        return success;
    },
    filterGrid : function(gridid,p){
        p = $.extend({
            gridModel : false,
            gridNames : false,
            gridToolbar : false,
            filterModel: [], // label/name/stype/defval/surl/sopt
            formtype : "horizontal", // horizontal/vertical
            autosearch: true, // if set to false a serch button should be enabled.
            formclass: "filterform",
            tableclass: "filtertable",
            buttonclass: "filterbutton",
            searchButton: "Search",
            clearButton: "Clear",
            enableSearch : false,
            enableClear: false,
            beforeSearch: null,
            afterSearch: null,
            beforeClear: null,
            afterClear: null,
            url : '',
            marksearched: true
        },p  || {});
        return this.each(function(){
            var self = this;
            this.p = p;
            if(this.p.filterModel.length == 0 && this.p.gridModel===false) { alert("No filter is set"); return;}
            if( !gridid) {alert("No target grid is set!"); return;}
            this.p.gridid = gridid.indexOf("#") != -1 ? gridid : "#"+gridid;
            var gcolMod = $(this.p.gridid).jqGrid("getGridParam",'colModel');
            if(gcolMod) {
                if( this.p.gridModel === true) {
                    var thegrid = $(this.p.gridid)[0];
                    var sh;
                    // we should use the options search, edittype, editoptions
                    // additionally surl and defval can be added in grid colModel
                    $.each(gcolMod, function (i,n) {
                        var tmpFil = [];
                        this.search = this.search === false ? false : true;
                        if(this.editrules && this.editrules.searchhidden === true) {
                            sh = true;
                        } else {
                            if(this.hidden === true ) {
                                sh = false;
                            } else {
                                sh = true;
                            }
                        }
                        if( this.search === true && sh === true) {
                            if(self.p.gridNames===true) {
                                tmpFil.label = thegrid.p.colNames[i];
                            } else {
                                tmpFil.label = '';
                            }
                            tmpFil.name = this.name;
                            tmpFil.index = this.index || this.name;
                            // we support only text and selects, so all other to text
                            tmpFil.stype = this.edittype || 'text';
                            if(tmpFil.stype != 'select' ) {
                                tmpFil.stype = 'text';
                            }
                            tmpFil.defval = this.defval || '';
                            tmpFil.surl = this.surl || '';
                            tmpFil.sopt = this.editoptions || {};
                            tmpFil.width = this.width;
                            self.p.filterModel.push(tmpFil);
                        }
                    });
                } else {
                    $.each(self.p.filterModel,function(i,n) {
                        for(var j=0;j<gcolMod.length;j++) {
                            if(this.name == gcolMod[j].name) {
                                this.index = gcolMod[j].index || this.name;
                                break;
                            }
                        }
                        if(!this.index) {
                            this.index = this.name;
                        }
                    });
                }
            } else {
                alert("Could not get grid colModel"); return;
            }
            var triggerSearch = function() {
                var sdata={}, j=0, v;
                var gr = $(self.p.gridid)[0], nm;
                gr.p.searchdata = {};
                if($.isFunction(self.p.beforeSearch)){self.p.beforeSearch();}
                $.each(self.p.filterModel,function(i,n){
                    nm = this.index;
                    switch (this.stype) {
                        case 'select' :
                            v = $("select[name="+nm+"]",self).val();
                            if(v) {
                                sdata[nm] = v;
                                if(self.p.marksearched){
                                    $("#jqgh_"+this.name,gr.grid.hDiv).addClass("dirty-cell");
                                }
                                j++;
                            } else {
                                if(self.p.marksearched){
                                    $("#jqgh_"+this.name,gr.grid.hDiv).removeClass("dirty-cell");
                                }
                                try {
                                    delete gr.p.postData[this.index];
                                } catch (e) {}
                            }
                            break;
                        default:
                            v = $("input[name="+nm+"]",self).val();
                            if(v) {
                                sdata[nm] = v;
                                if(self.p.marksearched){
                                    $("#jqgh_"+this.name,gr.grid.hDiv).addClass("dirty-cell");
                                }
                                j++;
                            } else {
                                if(self.p.marksearched){
                                    $("#jqgh_"+this.name,gr.grid.hDiv).removeClass("dirty-cell");
                                }
                                try {
                                    delete gr.p.postData[this.index];
                                } catch(e) {}
                            }
                    }
                });
                var sd =  j>0 ? true : false;
                $.extend(gr.p.postData,sdata);
                var saveurl;
                if(self.p.url) {
                    saveurl = $(gr).jqGrid("getGridParam",'url');
                    $(gr).jqGrid("setGridParam",{url:self.p.url});
                }
                $(gr).jqGrid("setGridParam",{search:sd,page:1}).trigger("reloadGrid");
                if(saveurl) {$(gr).jqGrid("setGridParam",{url:saveurl});}
                if($.isFunction(self.p.afterSearch)){self.p.afterSearch();}
            };
            var clearSearch = function(){
                var sdata={}, v, j=0;
                var gr = $(self.p.gridid)[0], nm;
                if($.isFunction(self.p.beforeClear)){self.p.beforeClear();}
                $.each(self.p.filterModel,function(i,n){
                    nm = this.index;
                    v = (this.defval) ? this.defval : "";
                    if(!this.stype){this.stype=='text';}
                    switch (this.stype) {
                        case 'select' :
                            var v1;
                            $("select[name="+nm+"] option",self).each(function (i){
                                if(i==0) this.selected = true;
                                if ($(this).text() == v) {
                                    this.selected = true;
                                    v1 = $(this).val();
                                    return false;
                                }
                            });
                            if(v1) {
                                // post the key and not the text
                                sdata[nm] = v1;
                                if(self.p.marksearched){
                                    $("#jqgh_"+this.name,gr.grid.hDiv).addClass("dirty-cell");
                                }
                                j++;
                            } else {
                                if(self.p.marksearched){
                                    $("#jqgh_"+this.name,gr.grid.hDiv).removeClass("dirty-cell");
                                }
                                try {
                                    delete gr.p.postData[this.index];
                                } catch (e) {}
                            }
                            break;
                        case 'text':
                            $("input[name="+nm+"]",self).val(v);
                            if(v) {
                                sdata[nm] = v;
                                if(self.p.marksearched){
                                    $("#jqgh_"+this.name,gr.grid.hDiv).addClass("dirty-cell");
                                }
                                j++;
                            } else {
                                if(self.p.marksearched){
                                    $("#jqgh_"+this.name,gr.grid.hDiv).removeClass("dirty-cell");
                                }
                                try {
                                    delete gr.p.postData[this.index];
                                } catch (e) {}
                            }
                            break;
                    }
                });
                var sd =  j>0 ? true : false;
                $.extend(gr.p.postData,sdata);
                var saveurl;
                if(self.p.url) {
                    saveurl = $(gr).jqGrid("getGridParam",'url');
                    $(gr).jqGrid("setGridParam",{url:self.p.url});
                }
                $(gr).jqGrid("setGridParam",{search:sd,page:1}).trigger("reloadGrid");
                if(saveurl) {$(gr).jqGrid("setGridParam",{url:saveurl});}
                if($.isFunction(self.p.afterClear)){self.p.afterClear();}
            };
            var formFill = function(){
                var tr = document.createElement("tr");
                var tr1, sb, cb,tl,td, td1;
                if(self.p.formtype=='horizontal'){
                    $(tbl).append(tr);
                }
                $.each(self.p.filterModel,function(i,n){
                    tl = document.createElement("td");
                    $(tl).append("<label for='"+this.name+"'>"+this.label+"</label>");
                    td = document.createElement("td");
                    var $t=this;
                    if(!this.stype) { this.stype='text';}
                    switch (this.stype)
                    {
                    case "select":
                        if(this.surl) {
                            // data returned should have already constructed html select
                            $(td).load(this.surl,function(){
                                if($t.defval) $("select",this).val($t.defval);
                                $("select",this).attr({name:$t.index || $t.name, id: "sg_"+$t.name});
                                if($t.sopt) $("select",this).attr($t.sopt);
                                if(self.p.gridToolbar===true && $t.width) {
                                    $("select",this).width($t.width);
                                }
                                if(self.p.autosearch===true){
                                    $("select",this).change(function(e){
                                        triggerSearch();
                                        return false;
                                    });
                                }
                            });
                        } else {
                            // sopt to construct the values
                            if($t.sopt.value) {
                                var oSv = $t.sopt.value;
                                var elem = document.createElement("select");
                                $(elem).attr({name:$t.index || $t.name, id: "sg_"+$t.name}).attr($t.sopt);
                                if(typeof oSv === "string") {
                                    var so = oSv.split(";"), sv, ov;
                                    for(var k=0; k<so.length;k++){
                                        sv = so[k].split(":");
                                        ov = document.createElement("option");
                                        ov.value = sv[0]; ov.innerHTML = sv[1];
                                        if (sv[1]==$t.defval) ov.selected ="selected";
                                        elem.appendChild(ov);
                                    }
                                } else if(typeof oSv === "object" ) {
                                    for ( var key in oSv) {
                                        i++;
                                        ov = document.createElement("option");
                                        ov.value = key; ov.innerHTML = oSv[key];
                                        if (oSv[key]==$t.defval) ov.selected ="selected";
                                        elem.appendChild(ov);
                                    }
                                }
                                if(self.p.gridToolbar===true && $t.width) {
                                    $(elem).width($t.width);
                                }
                                $(td).append(elem);
                                if(self.p.autosearch===true){
                                    $(elem).change(function(e){
                                        triggerSearch();
                                        return false;
                                    });
                                }
                            }
                        }
                        break;
                    case 'text':
                        var df = this.defval ? this.defval: "";
                        $(td).append("<input type='text' name='"+(this.index || this.name)+"' id='sg_"+this.name+"' value='"+df+"'/>");
                        if($t.sopt) $("input",td).attr($t.sopt);
                        if(self.p.gridToolbar===true && $t.width) {
                            if($.browser.msie) {
                                $("input",td).width($t.width-4);
                            } else {
                                $("input",td).width($t.width-2);
                            }
                        }
                        if(self.p.autosearch===true){
                            $("input",td).keypress(function(e){
                                var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
                                if(key == 13){
                                    triggerSearch();
                                    return false;
                                }
                                return this;
                            });
                        }
                        break;
                    }
                    if(self.p.formtype=='horizontal'){
                        if(self.p.gridToolbar===true && self.p.gridNames===false) {
                            $(tr).append(td);
                        } else {
                            $(tr).append(tl).append(td);
                        }
                        $(tr).append(td);
                    } else {
                        tr1 = document.createElement("tr");
                        $(tr1).append(tl).append(td);
                        $(tbl).append(tr1);
                    }
                });
                td = document.createElement("td");
                if(self.p.enableSearch === true){
                    sb = "<input type='button' id='sButton' class='"+self.p.buttonclass+"' value='"+self.p.searchButton+"'/>";
                    $(td).append(sb);
                    $("input#sButton",td).click(function(){
                        triggerSearch();
                        return false;
                    });
                }
                if(self.p.enableClear === true) {
                    cb = "<input type='button' id='cButton' class='"+self.p.buttonclass+"' value='"+self.p.clearButton+"'/>";
                    $(td).append(cb);
                    $("input#cButton",td).click(function(){
                        clearSearch();
                        return false;
                    });
                }
                if(self.p.enableClear === true || self.p.enableSearch === true) {
                    if(self.p.formtype=='horizontal') {
                        $(tr).append(td);
                    } else {
                        tr1 = document.createElement("tr");
                        $(tr1).append("<td>&nbsp;</td>").append(td);
                        $(tbl).append(tr1);
                    }
                }
            };
            var frm = $("<form name='SearchForm' style=display:inline;' class='"+this.p.formclass+"'></form>");
            var tbl =$("<table class='"+this.p.tableclass+"' cellspacing='0' cellpading='0' border='0'><tbody></tbody></table>");
            $(frm).append(tbl);
            formFill();
            $(this).append(frm);
            this.triggerSearch = function () {triggerSearch();};
            this.clearSearch = function () {clearSearch();};
        });
    },
    filterToolbar : function(p){
        p = $.extend({
            autosearch: true,
            beforeSearch: null,
            afterSearch: null,
            beforeClear: null,
            afterClear: null,
            searchurl : ''
        },p  || {});
        return this.each(function(){
            var $t = this;
            var triggerToolbar = function() {
                var sdata={}, j=0, v, nm;
                $t.p.searchdata = {};
                if($.isFunction(p.beforeSearch)){p.beforeSearch();}
                $.each($t.p.colModel,function(i,n){
                    nm = this.index || this.name;
                    switch (this.stype) {
                        case 'select' :
                            v = $("select[name="+nm+"]",$t.grid.hDiv).val();
                            if(v) {
                                sdata[nm] = v;
                                j++;
                            } else {
                                try {
                                    delete $t.p.postData[nm];
                                } catch (e) {}
                            }
                            break;
                        case 'text':
                            v = $("input[name="+nm+"]",$t.grid.hDiv).val();
                            if(v) {
                                sdata[nm] = v;
                                j++;
                            } else {
                                try {
                                    delete $t.p.postData[nm];
                                } catch (e) {}
                            }
                            break;
                    }
                });
                var sd =  j>0 ? true : false;
                $.extend($t.p.postData,sdata);
                var saveurl;
                if($t.p.searchurl) {
                    saveurl = $t.p.url;
                    $($t).jqGrid("setGridParam",{url:$t.p.searchurl});
                }
                $($t).jqGrid("setGridParam",{search:sd,page:1}).trigger("reloadGrid");
                if(saveurl) {$($t).jqGrid("setGridParam",{url:saveurl});}
                if($.isFunction(p.afterSearch)){p.afterSearch();}
            };
            var clearToolbar = function(){
                var sdata={}, v, j=0, nm;
                if($.isFunction(p.beforeClear)){p.beforeClear();}
                $.each($t.p.colModel,function(i,n){
                    v = (this.searchoptions && this.searchoptions.defaultValue) ? this.searchoptions.defaultValue : "";
                    nm = this.index || this.name;
                    switch (this.stype) {
                        case 'select' :
                            var v1;
                            $("select[name="+nm+"] option",$t.grid.hDiv).each(function (i){
                                if(i==0) this.selected = true;
                                if ($(this).text() == v) {
                                    this.selected = true;
                                    v1 = $(this).val();
                                    return false;
                                }
                            });
                            if (v1) {
                                // post the key and not the text
                                sdata[nm] = v1;
                                j++;
                            } else {
                                try {
                                    delete $t.p.postData[nm];
                                } catch(e) {}
                            }
                            break;
                        case 'text':
                            $("input[name="+nm+"]",$t.grid.hDiv).val(v);
                            if(v) {
                                sdata[nm] = v;
                                j++;
                            } else {
                                try {
                                    delete $t.p.postData[nm];
                                } catch (e){}
                            }
                            break;
                    }
                });
                var sd =  j>0 ? true : false;
                $.extend($t.p.postData,sdata);
                var saveurl;
                if($t.p.searchurl) {
                    saveurl = $t.p.url;
                    $($t).jqGrid("setGridParam",{url:$t.p.searchurl});
                }
                $($t).jqGrid("setGridParam",{search:sd,page:1}).trigger("reloadGrid");
                if(saveurl) {$($t).jqGrid("setGridParam",{url:saveurl});}
                if($.isFunction(p.afterClear)){p.afterClear();}
            };
            var toggleToolbar = function(){
                var trow = $("tr.ui-search-toolbar",$t.grid.hDiv);
                if(trow.css("display")=='none') trow.show();
                else trow.hide();
            };
            // create the row
            function bindEvents(selector, events) {
                var jElem = $(selector);
                if (jElem[0] != null) {
                    jQuery.each(events, function() {
                        if (this.data != null)
                            jElem.bind(this.type, this.data, this.fn);
                        else
                            jElem.bind(this.type, this.fn);
                    });
                }
            }
            var tr = $("<tr class='ui-search-toolbar' role='rowheader'></tr>"), th,thd, soptions;
            $.each($t.p.colModel,function(i,n){
                var cm=this;
                th = $("<th role='columnheader' class='ui-state-default ui-th-column'></th>");
                thd = $("<div style='width:100%;position:relative;height:100%;padding-right:0.3em;'></div>");
                if(this.hidden===true) { $(th).css("display","none");}
                this.search = this.search === false ? false : true;
                if(typeof this.stype == 'undefined' ) {this.stype='text';}
                soptions = $.extend({},this.searchoptions || {});
                if(this.search){
                    switch (this.stype)
                    {
                    case "select":
                        if(this.surl) {
                            // data returned should have already have constructed html select
                            $(thd).load(this.surl,{_nsd : (new Date().getTime())},function(){
                                if(soptions.defaultValue) $("select",this).val(soptions.defaultValue);
                                $("select",this).attr({name:cm.index || cm.name, id: "gs_"+cm.name});
                                if(soptions.attr) {$("select",this).attr(soptions.attr);}
                                $("select",this).css({width: "100%"});
                                // preserve autoserch
                                if(soptions.dataInit != null) soptions.dataInit($("select",this)[0]);
                                if(soptions.dataEvents != null) bindEvents($("select",this)[0],soptions.dataEvents);
                                if(p.autosearch===true){
                                    $("select",this).change(function(e){
                                        triggerToolbar();
                                        return false;
                                    });
                                }
                            });
                        } else {
                            if(cm.editoptions && cm.editoptions.value) {
                                var oSv = cm.editoptions.value,
                                elem = document.createElement("select");
                                elem.style.width = "100%";
                                $(elem).attr({name:cm.index || cm.name, id: "gs_"+cm.name});
                                if(typeof oSv === "string") {
                                    var so = oSv.split(";"), sv, ov;
                                    for(var k=0; k<so.length;k++){
                                        sv = so[k].split(":");
                                        ov = document.createElement("option");
                                        ov.value = sv[0]; ov.innerHTML = sv[1];
                                        elem.appendChild(ov);
                                    }
                                } else if(typeof oSv === "object" ) {
                                    for ( var key in oSv) {
                                        i++;
                                        ov = document.createElement("option");
                                        ov.value = key; ov.innerHTML = oSv[key];
                                        elem.appendChild(ov);
                                    }
                                }
                                if(soptions.defaultValue) $(elem).val(soptions.defaultValue);
                                if(soptions.attr) {$(elem).attr(soptions.attr);}
                                if(soptions.dataInit != null) soptions.dataInit(elem);
                                if(soptions.dataEvents != null) bindEvents(elem, soptions.dataEvents);
                                $(thd).append(elem);
                                if(p.autosearch===true){
                                    $(elem).change(function(e){
                                        triggerToolbar();
                                        return false;
                                    });
                                }
                            }
                        }
                        break;
                    case 'text':
                        var df = soptions.defaultValue ? soptions.defaultValue: "";
                        $(thd).append("<input type='text' style='width:95%;padding:0px;' name='"+(cm.index || cm.name)+"' id='gs_"+cm.name+"' value='"+df+"'/>");
                        if(soptions.attr) {$("input",thd).attr(soptions.attr);}
                        if(soptions.dataInit != null) soptions.dataInit($("input",thd)[0]);
                        if(soptions.dataEvents != null) bindEvents($("input",thd)[0], soptions.dataEvents);
                        if(p.autosearch===true){
                            $("input",thd).keypress(function(e){
                                var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
                                if(key == 13){
                                    triggerToolbar();
                                    return false;
                                }
                                return this;
                            });
                        }
                        break;
                    }
                }
                $(th).append(thd);
                $(tr).append(th);
            });
            $("table thead",$t.grid.hDiv).append(tr);
            this.triggerToolbar = function () {triggerToolbar();};
            this.clearToolbar = function () {clearToolbar();};
            this.toggleToolbar = function() {toggleToolbar();};
        });
    }
});
})(jQuery);;(function($){
/**
 * jqGrid extension for form editing Grid Data
 * Tony Tomov tony@trirand.com
 * http://trirand.com/blog/
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
**/
var rp_ge = null;
$.jgrid.extend({
    searchGrid : function (p) {
        p = $.extend({
            recreateFilter: false,
            drag: true,
            sField:'searchField',
            sValue:'searchString',
            sOper: 'searchOper',
            sFilter: 'filters',
            beforeShowSearch: null,
            afterShowSearch : null,
            onInitializeSearch: null,
            closeAfterSearch : false,
            closeOnEscape : false,
            multipleSearch : false,
            // translation
            // if you want to change or remove the order change it in sopt
            // ['bw','eq','ne','lt','le','gt','ge','ew','cn']
            sopt: null,
            onClose : null
            // these are common options
        }, $.jgrid.search, p || {});
        return this.each(function() {
            var $t = this;
            if(!$t.grid) {return;}
            if($.fn.searchFilter) {
                var fid = "fbox_"+$t.p.id;
                if(p.recreateFilter===true) {$("#"+fid).remove();}
                if( $("#"+fid).html() != null ) {
                    if ( $.isFunction(p.beforeShowSearch) ) { p.beforeShowSearch($("#"+fid)); };
                    showFilter();
                    if( $.isFunction(p.afterShowSearch) ) { p.afterShowSearch($("#"+fid)); }
                } else {
                    var fields = [],
                    colNames = jQuery("#"+$t.p.id).jqGrid("getGridParam","colNames"),
                    colModel = jQuery("#"+$t.p.id).jqGrid("getGridParam","colModel"),
                    stempl = ['eq','ne','lt','le','gt','ge','bw','bn','in','ni','ew','en','cn','nc'],
                    j,pos,k,oprtr;
                    oprtr = jQuery.fn.searchFilter.defaults.operators;
                    if (p.sopt !=null) {
                        oprtr = [];
                        k=0;
                        for(j=0;j<p.sopt.length;j++) {
                            if( (pos= $.inArray(p.sopt[j],stempl)) != -1 ){
                                oprtr[k] = {op:p.sopt[j],text: p.odata[pos]};
                                k++;
                            }
                        }
                    }
                    $.each(colModel, function(i, v) {
                        var searchable = (typeof v.search === 'undefined') ?  true: v.search ,
                        hidden = (v.hidden === true),
                        soptions = $.extend({},{text: colNames[i],value: v.index || v.name},this.searchoptions),
                        ignoreHiding = (soptions.searchhidden === true) || true;
                        if(typeof soptions.sopt == 'undefined') soptions.sopt = p.sopt ||  stempl;
                        k=0;
                        soptions.ops =[];
                        if(soptions.sopt.length>0) {
                            for(j=0;j<soptions.sopt.length;j++) {
                                if( (pos= $.inArray(soptions.sopt[j],stempl)) != -1 ){
                                    soptions.ops[k] = {op:soptions.sopt[j],text: p.odata[pos]};
                                    k++;
                                }
                            }
                        }
                        if(typeof(this.stype) === 'undefined') this.stype='text';
                        if(this.stype == 'select') {
                            if ( soptions.dataUrl != null) {}
                            else if(this.editoptions) {
                                var eov = this.editoptions.value;
                                if(eov) {
                                    soptions.dataValues =[];
                                    if(typeof(eov) === 'string') {
                                        var so = eov.split(";"),sv;
                                        for(j=0;j<so.length;j++) {
                                            sv = so[j].split(":");
                                            soptions.dataValues[j] ={value:sv[0],text:sv[1]};
                                        }
                                    } else if (typeof(eov) === 'object') {
                                        j=0;
                                        for (var key in eov) {
                                            soptions.dataValues[j] ={value:key,text:eov[key]};
                                            j++;
                                        }
                                    }
                                }
                            }
                        }
                        if ((ignoreHiding && searchable) || (searchable && !hidden)) {
                            fields.push(soptions);
                        }
                    });
                    if(fields.length>0){
                        $("<div id='"+fid+"' role='dialog' tabindex='-1'></div>").insertBefore("#gview_"+$t.p.id);
                        jQuery("#"+fid).searchFilter(fields, { groupOps: p.groupOps, operators: oprtr, onClose:hideFilter, resetText: p.Reset, searchText: p.Find, windowTitle: p.caption,  rulesText:p.rulesText, matchText:p.matchText, onSearch: searchFilters, onReset: resetFilters,stringResult:p.multipleSearch });
                        $(".ui-widget-overlay","#"+fid).remove();
                        if (p.drag===true) {
                            $("#"+fid+" table thead tr:first td:first").css('cursor','move');
                            if(jQuery.fn.jqDrag) {
                                jQuery("#"+fid).jqDrag($("#"+fid+" table thead tr:first td:first"));
                            } else {
                                try {
                                    $("#"+fid).draggable({handle: jQuery("#"+fid+" table thead tr:first td:first")});
                                } catch (e) {}
                            }
                        }
                        if(p.multipleSearch === false) {
                            $(".ui-del, .ui-add, .ui-del, .ui-add-last, .matchText, .rulesText", "#"+fid).hide();
                            $("select[name='groupOp']","#"+fid).hide();
                        }
                        if ( $.isFunction(p.onInitializeSearch) ) { p.onInitializeSearch( $("#"+fid) ); };
                        if ( $.isFunction(p.beforeShowSearch) ) { p.beforeShowSearch($("#"+fid)); };
                        showFilter();
                        if( $.isFunction(p.afterShowSearch) ) { p.afterShowSearch($("#"+fid)); }
                        if(p.closeOnEscape===true){
                            jQuery("#"+fid).keydown( function( e ) {
                                if( e.which == 27 ) {
                                    hideFilter($("#"+fid));
                                }
                            });
                        }
                    }
                }
            }
            function searchFilters(filters) {
                var hasFilters = (filters !== undefined),
                grid = jQuery("#"+$t.p.id), sdata={};
                if(p.multipleSearch===false) {
                    sdata[p.sField] = filters.rules[0].field;
                    sdata[p.sValue] = filters.rules[0].data;
                    sdata[p.sOper] = filters.rules[0].op;
                } else {
                    sdata[p.sFilter] = filters;
                }
                grid[0].p.search = hasFilters;
                $.extend(grid[0].p.postData,sdata);
                grid[0].p.page= 1;
                grid.trigger("reloadGrid");
                if(p.closeAfterSearch) hideFilter($("#"+fid));
            }
            function resetFilters(filters) {
                var hasFilters = (filters !== undefined),
                grid = jQuery("#"+$t.p.id), sdata=[];
                grid[0].p.search = hasFilters;
                if(p.multipleSearch===false) {
                    sdata[p.sField] = sdata[p.sValue] = sdata[p.sOper] = "";
                } else {
                    sdata[p.sFilter] = "";
                }
                $.extend(grid[0].p.postData,sdata);
                grid[0].p.page= 1;
                grid.trigger("reloadGrid");
            }
            function hideFilter(selector) {
                if(p.onClose){
                    var fclm = p.onClose(selector);
                    if(typeof fclm == 'boolean' && !fclm) return;
                }
                selector.hide();
                $(".jqgrid-overlay","#gbox_"+$t.p.id).hide();
            }
            function showFilter(){
                $("#"+fid).show();
                $(".jqgrid-overlay","#gbox_"+$t.p.id).show();
                try{$(':input:visible',"#"+fid)[0].focus();}catch(_){}
            }
        });
    },
    editGridRow : function(rowid, p){
        p = $.extend({
            top : 0,
            left: 0,
            width: 300,
            height: 'auto',
            dataheight: 'auto',
            modal: false,
            drag: true,
            resize: true,
            url: null,
            mtype : "POST",
            clearAfterAdd :true,
            closeAfterEdit : false,
            reloadAfterSubmit : true,
            onInitializeForm: null,
            beforeInitData: null,
            beforeShowForm: null,
            afterShowForm: null,
            beforeSubmit: null,
            afterSubmit: null,
            onclickSubmit: null,
            afterComplete: null,
            onclickPgButtons : null,
            afterclickPgButtons: null,
            editData : {},
            recreateForm : false,
            jqModal : true,
            closeOnEscape : false,
            addedrow : "first",
            topinfo : '',
            bottominfo: '',
            saveicon : [],
            closeicon : [],
            savekey: [false,13],
            navkeys: [false,38,40],
            checkOnSubmit : false,
            checkOnUpdate : false,
            _savedData : {},
            onClose : null
        }, $.jgrid.edit, p || {});
        rp_ge = p;
        return this.each(function(){
            var $t = this;
            if (!$t.grid || !rowid) { return; }
            var gID = $t.p.id,
            frmgr = "FrmGrid_"+gID,frmtb = "TblGrid_"+gID,
            IDs = {themodal:'editmod'+gID,modalhead:'edithd'+gID,modalcontent:'editcnt'+gID, scrollelm : frmgr},
            onBeforeShow = $.isFunction(rp_ge.beforeShowForm) ? rp_ge.beforeShowForm : false,
            onAfterShow = $.isFunction(rp_ge.afterShowForm) ? rp_ge.afterShowForm : false,
            onBeforeInit = $.isFunction(rp_ge.beforeInitData) ? rp_ge.beforeInitData : false,
            onInitializeForm = $.isFunction(rp_ge.onInitializeForm) ? rp_ge.onInitializeForm : false,
            copydata = null,
            maxCols = 1, maxRows=0, gurl, postdata, ret, extpost, newData, diff;
            if (rowid=="new") {
                rowid = "_empty";
                p.caption=p.addCaption;
            } else {
                p.caption=p.editCaption;
            };
            if(p.recreateForm===true && $("#"+IDs.themodal).html() != null) {
                $("#"+IDs.themodal).remove();
            }
            var closeovrl = true;
            if(p.checkOnUpdate && p.jqModal && !p.modal) {
                closeovrl = false;
            }
            if ( $("#"+IDs.themodal).html() != null ) {
                $(".ui-jqdialog-title","#"+IDs.modalhead).html(p.caption);
                $("#FormError","#"+frmtb).hide();
                if(onBeforeInit) { onBeforeInit($("#"+frmgr)); }
                // filldata
                fillData(rowid,$t,frmgr);
                ///
                if(rowid=="_empty") { $("#pData, #nData","#"+frmtb+"_2").hide(); } else { $("#pData, #nData","#"+frmtb+"_2").show(); }
                if(p.processing===true) {
                    p.processing=false;
                    $("#sData", "#"+frmtb).removeClass('ui-state-active');
                }
                if($("#"+frmgr).data("disabled")===true) {
                    $(".confirm","#"+IDs.themodal).hide();
                    $("#"+frmgr).data("disabled",false);
                }
                if(onBeforeShow) { onBeforeShow($("#"+frmgr)); }
                $("#"+IDs.themodal).data("onClose",rp_ge.onClose);
                viewModal("#"+IDs.themodal,{gbox:"#gbox_"+gID,jqm:p.jqModal, jqM: false, closeoverlay: closeovrl, modal:p.modal});
                if(!closeovrl) {
                    $(".jqmOverlay").click(function(){
                        if(!checkUpdates()) return false;
                        hideModal("#"+IDs.themodal,{gb:"#gbox_"+gID,jqm:p.jqModal, onClose: rp_ge.onClose});
                        return false;
                    });
                }
                if(onAfterShow) { onAfterShow($("#"+frmgr)); }
            } else {
                $($t.p.colModel).each( function(i) {
                    var fmto = this.formoptions;
                    maxCols = Math.max(maxCols, fmto ? fmto.colpos || 0 : 0 );
                    maxRows = Math.max(maxRows, fmto ? fmto.rowpos || 0 : 0 );
                });
                var dh = isNaN(p.dataheight) ? p.dataheight : p.dataheight+"px";
                var flr, frm = $("<form name='FormPost' id='"+frmgr+"' class='FormGrid' style='width:100%;overflow:auto;position:relative;height:"+dh+";'></form>").data("disabled",false),
                tbl =$("<table id='"+frmtb+"' class='EditTable' cellspacing='0' cellpading='0' border='0'><tbody></tbody></table>");
                $(frm).append(tbl);
                flr = $("<tr id='FormError' style='display:none'><td class='ui-state-error' colspan='"+(maxCols*2)+"'></td></tr>");
                flr[0].rp = 0;
                $(tbl).append(flr);
                if(rp_ge.topinfo) {
                    flr = $("<tr><td class='topinfo' colspan='"+(maxCols*2)+"'>"+rp_ge.topinfo+"</td></tr>");
                    flr[0].rp = 0;
                    $(tbl).append(flr);
                }
                // set the id.
                // use carefull only to change here colproperties.
                if(onBeforeInit) { onBeforeInit($("#"+frmgr)); }
                // create data
                var valref = createData(rowid,$t,tbl,maxCols),
                // buttons at footer
                bP = "<a href='javascript:void(0)' id='pData' class='fm-button ui-state-default ui-corner-left'><span class='ui-icon ui-icon-triangle-1-w'></span></div>",
                bN = "<a href='javascript:void(0)' id='nData' class='fm-button ui-state-default ui-corner-right'><span class='ui-icon ui-icon-triangle-1-e'></span></div>",
                bS  ="<a href='javascript:void(0)' id='sData' class='fm-button ui-state-default ui-corner-all'>"+p.bSubmit+"</a>",
                bC  ="<a href='javascript:void(0)' id='cData' class='fm-button ui-state-default ui-corner-all'>"+p.bCancel+"</a>";
                var bt = "<table border='0' class='EditTable' id='"+frmtb+"_2'><tbody><tr id='Act_Buttons'><td class='navButton ui-widget-content'>"+bP+bN+"</td><td class='EditButton ui-widget-content'>"+bS+"&nbsp;"+bC+"</td></tr>";
                if(rp_ge.bottominfo) {
                    bt += "<tr><td class='bottominfo' colspan='2'>"+rp_ge.bottominfo+"</td></tr>";
                }
                bt += "</tbody></table>";
                if(maxRows >  0) {
                    var sd=[];
                    $.each($(tbl)[0].rows,function(i,r){
                        sd[i] = r;
                    });
                    sd.sort(function(a,b){
                        if(a.rp > b.rp) {return 1;}
                        if(a.rp < b.rp) {return -1;}
                        return 0;
                    });
                    $.each(sd, function(index, row) {
                        $('tbody',tbl).append(row);
                    });
                }
                p.gbox = "#gbox_"+gID;
                var cle = false;
                if(p.closeOnEscape===true){
                    p.closeOnEscape = false;
                    cle = true;
                }
                var tms = $("<span></span>").append(frm).append(bt);
                createModal(IDs,tms,p,"#gview_"+$t.p.id,$("#gview_"+$t.p.id)[0]);
                tms = null; bt=null;
                jQuery("#"+IDs.themodal).keydown( function( e ) {
                    if ($("#"+frmgr).data("disabled")===true ) return false; //??
                    if(rp_ge.savekey[0] === true && e.which == rp_ge.savekey[1]) { // save
                        $("#sData", "#"+frmtb+"_2").trigger("click");
                        return false;
                    }
                    if(e.which === 27) {
                        if(!checkUpdates()) return false;
                        if(cle) hideModal(this,{gb:p.gbox,jqm:p.jqModal, onClose: rp_ge.onClose});
                        return false;
                    }
                    if(rp_ge.navkeys[0]===true) {
                        if($("#id_g","#"+frmtb).val() == "_empty") return true;
                        if(e.which == rp_ge.navkeys[1]){ //up
                            $("#pData", "#"+frmtb+"_2").trigger("click");
                            return false;
                        }
                        if(e.which == rp_ge.navkeys[2]){ //down
                            $("#nData", "#"+frmtb+"_2").trigger("click");
                            return false;
                        }
                    }
                });
                if(p.checkOnUpdate) {
                    $("a.ui-jqdialog-titlebar-close span","#"+IDs.themodal).removeClass("jqmClose");
                    $("a.ui-jqdialog-titlebar-close","#"+IDs.themodal).unbind("click")
                    .click(function(){
                        if(!checkUpdates()) return false;
                        hideModal("#"+IDs.themodal,{gb:"#gbox_"+gID,jqm:p.jqModal,onClose: rp_ge.onClose});
                        return false;
                    });
                }
                p.saveicon = $.extend([true,"left","ui-icon-disk"],p.saveicon);
                p.closeicon = $.extend([true,"left","ui-icon-close"],p.closeicon);
                // beforeinitdata after creation of the form
                if(p.saveicon[0]==true) {
                    $("#sData","#"+frmtb+"_2").addClass(p.saveicon[1] == "right" ? 'fm-button-icon-right' : 'fm-button-icon-left')
                    .append("<span class='ui-icon "+p.saveicon[2]+"'></span>");
                }
                if(p.closeicon[0]==true) {
                    $("#cData","#"+frmtb+"_2").addClass(p.closeicon[1] == "right" ? 'fm-button-icon-right' : 'fm-button-icon-left')
                    .append("<span class='ui-icon "+p.closeicon[2]+"'></span>");
                }
                if(rp_ge.checkOnSubmit || rp_ge.checkOnUpdate) {
                    bS  ="<a href='javascript:void(0)' id='sNew' class='fm-button ui-state-default ui-corner-all' style='z-index:1002'>"+p.bYes+"</a>";
                    bN  ="<a href='javascript:void(0)' id='nNew' class='fm-button ui-state-default ui-corner-all' style='z-index:1002'>"+p.bNo+"</a>";
                    bC  ="<a href='javascript:void(0)' id='cNew' class='fm-button ui-state-default ui-corner-all' style='z-index:1002'>"+p.bExit+"</a>";
                    var ii, zI = p.zIndex  || 999; zI ++;
                    if ($.browser.msie && $.browser.version ==6) {
                        ii = '<iframe style="display:block;position:absolute;z-index:-1;filter:Alpha(Opacity=\'0\');" src="javascript:false;"></iframe>';
                    } else { ii="";}
                    $("<div class='ui-widget-overlay jqgrid-overlay confirm' style='z-index:"+zI+";display:none;'>&nbsp;"+ii+"</div><div class='confirm ui-widget-content ui-jqconfirm' style='z-index:"+(zI+1)+"'>"+p.saveData+"<br/><br/>"+bS+bN+bC+"</div>").insertAfter("#"+frmgr);
                    $("#sNew","#"+IDs.themodal).click(function(){
                        postIt([true,"",""]);
                        $("#"+frmgr).data("disabled",false);
                        $(".confirm","#"+IDs.themodal).hide();
                        return false;
                    });
                    $("#nNew","#"+IDs.themodal).click(function(){
                        $(".confirm","#"+IDs.themodal).hide();
                        $("#"+frmgr).data("disabled",false);
                        setTimeout(function(){$(":input","#"+frmgr)[0].focus();},0);
                        return false;
                    });
                    $("#cNew","#"+IDs.themodal).click(function(){
                        $(".confirm","#"+IDs.themodal).hide();
                        $("#"+frmgr).data("disabled",false);
                        hideModal("#"+IDs.themodal,{gb:"#gbox_"+gID,jqm:p.jqModal,onClose: rp_ge.onClose});
                        return false;
                    });
                }
                // here initform - only once
                if(onInitializeForm) { onInitializeForm($("#"+frmgr)); }
                if(rowid=="_empty") { $("#pData,#nData","#"+frmtb+"_2").hide(); } else { $("#pData,#nData","#"+frmtb+"_2").show(); }
                if(onBeforeShow) { onBeforeShow($("#"+frmgr)); }
                $("#"+IDs.themodal).data("onClose",rp_ge.onClose);
                viewModal("#"+IDs.themodal,{gbox:"#gbox_"+gID,jqm:p.jqModal,closeoverlay:closeovrl,modal:p.modal});
                if(!closeovrl) {
                    $(".jqmOverlay").click(function(){
                        if(!checkUpdates()) return false;
                        hideModal("#"+IDs.themodal,{gb:"#gbox_"+gID,jqm:p.jqModal, onClose: rp_ge.onClose});
                        return false;
                    });
                }
                if(onAfterShow) { onAfterShow($("#"+frmgr)); }
                $(".fm-button","#"+IDs.themodal).hover(
                   function(){$(this).addClass('ui-state-hover');},
                   function(){$(this).removeClass('ui-state-hover');}
                );
                $("#sData", "#"+frmtb+"_2").click(function(e){
                    postdata = {}; extpost={};
                    $("#FormError","#"+frmtb).hide();
                    // all depend on ret array
                    //ret[0] - succes
                    //ret[1] - msg if not succes
                    //ret[2] - the id  that will be set if reload after submit false
                    getFormData();
                    if(postdata.id == "_empty") postIt();
                    else if(p.checkOnSubmit===true ) {
                        newData = $.extend({},postdata,extpost);
                        diff = compareData(newData,rp_ge._savedData);
                        if(diff) {
                            $("#"+frmgr).data("disabled",true);
                            $(".confirm","#"+IDs.themodal).show();
                        } else {
                            postIt();
                        }
                    } else {
                        postIt();
                    }
                    return false;
                });
                $("#cData", "#"+frmtb+"_2").click(function(e){
                    if(!checkUpdates()) return false;
                    hideModal("#"+IDs.themodal,{gb:"#gbox_"+gID,jqm:p.jqModal,onClose: rp_ge.onClose});
                    return false;
                });
                $("#nData", "#"+frmtb+"_2").click(function(e){
                    if(!checkUpdates()) return false;
                    $("#FormError","#"+frmtb).hide();
                    var npos = getCurrPos();
                    npos[0] = parseInt(npos[0]);
                    if(npos[0] != -1 && npos[1][npos[0]+1]) {
                        if($.isFunction(p.onclickPgButtons)) {
                            p.onclickPgButtons('next',$("#"+frmgr),npos[1][npos[0]]);
                        }
                        fillData(npos[1][npos[0]+1],$t,frmgr);
                        $($t).jqGrid("setSelection",npos[1][npos[0]+1]);
                        if($.isFunction(p.afterclickPgButtons)) {
                            p.afterclickPgButtons('next',$("#"+frmgr),npos[1][npos[0]+1]);
                        }
                        updateNav(npos[0]+1,npos[1].length-1);
                    };
                    return false;
                });
                $("#pData", "#"+frmtb+"_2").click(function(e){
                    if(!checkUpdates()) return false;
                    $("#FormError","#"+frmtb).hide();
                    var ppos = getCurrPos();
                    if(ppos[0] != -1 && ppos[1][ppos[0]-1]) {
                        if($.isFunction(p.onclickPgButtons)) {
                            p.onclickPgButtons('prev',$("#"+frmgr),ppos[1][ppos[0]]);
                        }
                        fillData(ppos[1][ppos[0]-1],$t,frmgr);
                        $($t).jqGrid("setSelection",ppos[1][ppos[0]-1]);
                        if($.isFunction(p.afterclickPgButtons)) {
                            p.afterclickPgButtons('prev',$("#"+frmgr),ppos[1][ppos[0]-1]);
                        }
                        updateNav(ppos[0]-1,ppos[1].length-1);
                    };
                    return false;
                });
            }
            var posInit =getCurrPos();
            updateNav(posInit[0],posInit[1].length-1);
            function updateNav(cr,totr,rid){
                if (cr==0) { $("#pData","#"+frmtb+"_2").addClass('ui-state-disabled'); } else { $("#pData","#"+frmtb+"_2").removeClass('ui-state-disabled'); }
                if (cr==totr) { $("#nData","#"+frmtb+"_2").addClass('ui-state-disabled'); } else { $("#nData","#"+frmtb+"_2").removeClass('ui-state-disabled'); }
            }
            function getCurrPos() {
                var rowsInGrid = $($t).jqGrid("getDataIDs"),
                selrow = $("#id_g","#"+frmtb).val(),
                pos = $.inArray(selrow,rowsInGrid);
                return [pos,rowsInGrid];
            }
            function checkUpdates () {
                var stat = true;
                $("#FormError","#"+frmtb).hide();
                if(rp_ge.checkOnUpdate) {
                    postdata = {}; extpost={};
                    getFormData();
                    newData = $.extend({},postdata,extpost);
                    diff = compareData(newData,rp_ge._savedData);
                    if(diff) {
                        $("#"+frmgr).data("disabled",true);
                        $(".confirm","#"+IDs.themodal).show();
                        stat = false;
                    }
                }
                return stat;
            }
            function getFormData(){
                $(".FormElement", "#"+frmtb).each(function(i){
                    switch ($(this).get(0).type) {
                        case "checkbox":
                            if($(this).attr("checked")) {
                                postdata[this.name]= $(this).val();
                            }else {
                                var ofv = $(this).attr("offval");
                                postdata[this.name]= ofv;
                            }
                        break;
                        case "select-one":
                            postdata[this.name]= $("option:selected",this).val();
                            extpost[this.name]= $("option:selected",this).text();
                        break;
                        case "select-multiple":
                            postdata[this.name]= $(this).val();
                            if(postdata[this.name]) postdata[this.name] = postdata[this.name].join(",");
                            else postdata[this.name] ="";
                            var selectedText = [];
                            $("option:selected",this).each(
                                function(i,selected){
                                    selectedText[i] = $(selected).text();
                                }
                            );
                            extpost[this.name]= selectedText.join(",");
                        break;
                        case "password":
                        case "text":
                        case "textarea":
                        case "button":
                            postdata[this.name] = $(this).val();
                            postdata[this.name] = !$t.p.autoencode ? postdata[this.name] : $.jgrid.htmlEncode(postdata[this.name]);
                        break;
                    }
                });
                return true;
            }
            function createData(rowid,obj,tb,maxcols){
                var nm, hc,trdata, cnt=0,tmp, dc,elc, retpos=[], ind=false, rp,cp,
                tdtmpl = "<td class='CaptionTD ui-widget-content'>&nbsp;</td><td class='DataTD ui-widget-content' style='white-space:pre'>&nbsp;</td>", tmpl=""; //*2
                for (var i =1;i<=maxcols;i++) {
                    tmpl += tdtmpl;
                }
                if(rowid != '_empty') {
                    ind = $(obj).jqGrid("getInd",rowid);
                }
                $(obj.p.colModel).each( function(i) {
                    nm = this.name;
                    // hidden fields are included in the form
                    if(this.editrules && this.editrules.edithidden == true) {
                        hc = false;
                    } else {
                        hc = this.hidden === true ? true : false;
                    }
                    dc = hc ? "style='display:none'" : "";
                    if ( nm !== 'cb' && nm !== 'subgrid' && this.editable===true && nm !== 'rn') {
                        if(ind === false) {
                            tmp = "";
                        } else {
                            if(nm == obj.p.ExpandColumn && obj.p.treeGrid === true) {
                                tmp = $("td:eq("+i+")",obj.rows[ind]).text();
                            } else {
                                try {
                                    tmp =  $.unformat($("td:eq("+i+")",obj.rows[ind]),{colModel:this},i);
                                } catch (_) {
                                    tmp = $("td:eq("+i+")",obj.rows[ind]).html();
                                }
                            }
                        }
                        var opt = $.extend({}, this.editoptions || {} ,{id:nm,name:nm});
                        frmopt = $.extend({}, {elmprefix:'',elmsuffix:'',rowabove:false,rowcontent:''}, this.formoptions || {}),
                        rp = parseInt(frmopt.rowpos) || cnt+1,
                        cp = parseInt((parseInt(frmopt.colpos) || 1)*2);
                        if(rowid == "_empty" && opt.defaultValue ) {
                            tmp = $.isFunction(opt.defaultValue) ? opt.defaultValue() : opt.defaultValue;
                        }
                        if(!this.edittype) this.edittype = "text";
                        elc = createEl(this.edittype,opt,tmp);
                        if(tmp == "" && this.edittype == "checkbox") {tmp = $(elc).attr("offval");}
                        if(rp_ge.checkOnSubmit || rp_ge.checkOnUpdate) rp_ge._savedData[nm] = tmp;
                        $(elc).addClass("FormElement");
                        trdata = $(tb).find("tr[rowpos="+rp+"]");
                        if(frmopt.rowabove) {
                            var newdata = $("<tr><td class='contentinfo' colspan='"+(maxcols*2)+"'>"+frmopt.rowcontent+"</td></tr>");
                            $(tb).append(newdata);
                            newdata[0].rp = rp;
                        }
                        if ( trdata.length==0 ) {
                            trdata = $("<tr "+dc+" rowpos='"+rp+"'></tr>").addClass("FormData").attr("id","tr_"+nm);
                            $(trdata).append(tmpl);
                            $(tb).append(trdata);
                            trdata[0].rp = rp;
                        }
                        $("td:eq("+(cp-2)+")",trdata[0]).html( typeof frmopt.label === 'undefined' ? obj.p.colNames[i]: frmopt.label);
                        $("td:eq("+(cp-1)+")",trdata[0]).append(frmopt.elmprefix).append(elc).append(frmopt.elmsuffix);
                        retpos[cnt] = i;
                        cnt++;
                    };
                });
                if( cnt > 0) {
                    var idrow = $("<tr class='FormData' style='display:none'><td class='CaptionTD'></td><td colspan='"+ (maxcols*2-1)+"' class='DataTD'><input class='FormElement' id='id_g' type='text' name='id' value='"+rowid+"'/></td></tr>");
                    idrow[0].rp = cnt+999;
                    $(tb).append(idrow);
                    if(rp_ge.checkOnSubmit || rp_ge.checkOnUpdate) rp_ge._savedData.id = rowid;
                }
                return retpos;
            }
            function fillData(rowid,obj,fmid){
                var nm, hc,cnt=0,tmp, fld,opt,vl,vlc;
                if(rp_ge.checkOnSubmit || rp_ge.checkOnUpdate) {rp_ge._savedData = {};rp_ge._savedData.id=rowid;}
                var cm = obj.p.colModel;
                if(rowid == '_empty') {
                    $(cm).each(function(i){
                        nm = this.name;
                        opt = $.extend({}, this.editoptions || {} );
                        fld = $("#"+$.jgrid.jqID(nm),"#"+fmid);
                        if(fld[0] != null) {
                            vl = "";
                            if(opt.defaultValue ) {
                                vl = $.isFunction(opt.defaultValue) ? opt.defaultValue() : opt.defaultValue;
                                if(fld[0].type=='checkbox') {
                                    vlc = vl.toLowerCase();
                                    if(vlc.search(/(false|0|no|off|undefined)/i)<0 && vlc!=="") {
                                        fld[0].checked = true;
                                        fld[0].defaultChecked = true;
                                        fld[0].value = vl;
                                    } else {
                                        fld.attr({checked:"",defaultChecked:""});
                                    }
                                } else {fld.val(vl); }
                            } else {
                                if( fld[0].type=='checkbox' ) {
                                    fld[0].checked = false;
                                    fld[0].defaultChecked = false;
                                    vl = $(fld).attr("offval");
                                } else if (fld[0].type.substr(0,6)=='select') {
                                    fld[0].selectedIndex = 0;
                                } else {
                                    fld.val(vl);
                                }
                            }
                            if(rp_ge.checkOnSubmit===true || rp_ge.checkOnUpdate) rp_ge._savedData[nm] = vl;
                        }
                    });
                    $("#id_g","#"+fmid).val("_empty");
                    return;
                }
                var tre = $(obj).jqGrid("getInd",rowid,true);
                if(!tre) return;
                $('td',tre).each( function(i) {
                    nm = cm[i].name;
                    // hidden fields are included in the form
                    if(cm[i].editrules && cm[i].editrules.edithidden === true) {
                        hc = false;
                    } else {
                        hc = cm[i].hidden === true ? true : false;
                    }
                    if ( nm !== 'cb' && nm !== 'subgrid' && cm[i].editable===true) {
                        if(nm == obj.p.ExpandColumn && obj.p.treeGrid === true) {
                            tmp = $(this).text();
                        } else {
                            try {
                                tmp =  $.unformat(this,{colModel:cm[i]},i);
                            } catch (_) {
                                tmp = $(this).html();
                            }
                        }
                        if(rp_ge.checkOnSubmit===true || rp_ge.checkOnUpdate) rp_ge._savedData[nm] = tmp;
                        nm = $.jgrid.jqID(nm);
                        switch (cm[i].edittype) {
                            case "password":
                            case "text":
                            case "button" :
                            case "image":
                                tmp = $.jgrid.htmlDecode(tmp);
                                $("#"+nm,"#"+fmid).val(tmp);
                                break;
                            case "textarea":
                                if(tmp == "&nbsp;" || tmp == "&#160;" || (tmp.length==1 && tmp.charCodeAt(0)==160) ) {tmp='';}
                                $("#"+nm,"#"+fmid).val(tmp);
                                break;
                            case "select":
                                $("#"+nm+" option","#"+fmid).each(function(j){
                                    if (!cm[i].editoptions.multiple && (tmp == $(this).text() || tmp == $(this).val()) ){
                                        this.selected= true;
                                    } else if (cm[i].editoptions.multiple){
                                        if(  $.inArray($(this).text(), tmp.split(",") ) > -1 || $.inArray($(this).val(), tmp.split(",") ) > -1  ){
                                            this.selected = true;
                                        }else{
                                            this.selected = false;
                                        }
                                    } else {
                                        this.selected = false;
                                    }
                                });
                                break;
                            case "checkbox":
                                tmp = tmp+"";
                                tmp = tmp.toLowerCase();
                                if(tmp.search(/(false|0|no|off|undefined)/i)<0 && tmp!=="") {
                                    $("#"+nm,"#"+fmid).attr("checked",true);
                                    $("#"+nm,"#"+fmid).attr("defaultChecked",true); //ie
                                } else {
                                    $("#"+nm,"#"+fmid).attr("checked",false);
                                    $("#"+nm,"#"+fmid).attr("defaultChecked",""); //ie
                                }
                                break;
                        }
                        cnt++;
                    }
                });
                if(cnt>0) { $("#id_g","#"+frmtb).val(rowid); }
            }
            function postIt() {
                var copydata, ret=[true,"",""], onCS = {};
                for( var key in postdata ){
                    ret = checkValues(postdata[key],key,$t);
                    if(ret[0] == false) break;
                }
                if(ret[0]) {
                    if( $.isFunction( rp_ge.onclickSubmit)) { onCS = rp_ge.onclickSubmit(rp_ge,postdata) || {}; }
                    if( $.isFunction(rp_ge.beforeSubmit))  { ret = rp_ge.beforeSubmit(postdata,$("#"+frmgr)); }
                }
                gurl = rp_ge.url ? rp_ge.url : $t.p.editurl;
                if(ret[0]) {
                    if(!gurl) { ret[0]=false; ret[1] += " "+$.jgrid.errors.nourl; }
                }
                if(ret[0] === false) {
                    $("#FormError>td","#"+frmtb).html(ret[1]);
                    $("#FormError","#"+frmtb).show();
                    return;
                }
                if(!p.processing) {
                    p.processing = true;
                    $("#sData", "#"+frmtb+"_2").addClass('ui-state-active');
                    // we add to pos data array the action - the name is oper
                    postdata.oper = postdata.id == "_empty" ? "add" : "edit";
                    postdata = $.extend(postdata,rp_ge.editData,onCS);
                    $.ajax({
                        url:gurl,
                        type: rp_ge.mtype,
                        data:postdata,
                        complete:function(data,Status){
                            if(Status != "success") {
                                ret[0] = false;
                                if ($.isFunction(rp_ge.errorTextFormat)) {
                                    ret[1] = rp_ge.errorTextFormat(data);
                                } else {
                                    ret[1] = Status + " Status: '" + data.statusText + "'. Error code: " + data.status;
                                }
                            } else {
                                // data is posted successful
                                // execute aftersubmit with the returned data from server
                                if( $.isFunction(rp_ge.afterSubmit) ) {
                                    ret = rp_ge.afterSubmit(data,postdata);
                                }
                            }
                            if(ret[0] === false) {
                                $("#FormError>td","#"+frmtb).html(ret[1]);
                                $("#FormError","#"+frmtb).show();
                            } else {
                                // remove some values if formattaer select or checkbox
                                $.each($t.p.colModel, function(i,n){
                                    if(extpost[this.name] && this.formatter && this.formatter=='select') {
                                        try {delete extpost[this.name]} catch (e) {}
                                    }
                                })
                                postdata = $.extend(postdata,extpost);
                                // the action is add
                                if(postdata.id=="_empty" ) {
                                    //id processing
                                    // user not set the id ret[2]
                                    if(!ret[2]) { ret[2] = parseInt($t.p.records)+1; }
                                    postdata.id = ret[2];
                                    if(rp_ge.closeAfterAdd) {
                                        if(rp_ge.reloadAfterSubmit) { $($t).trigger("reloadGrid"); }
                                        else {
                                            $($t).jqGrid("addRowData",ret[2],postdata,p.addedrow);
                                            $($t).jqGrid("setSelection",ret[2]);
                                        }
                                        hideModal("#"+IDs.themodal,{gb:"#gbox_"+gID,jqm:p.jqModal,onClose: rp_ge.onClose});
                                    } else if (rp_ge.clearAfterAdd) {
                                        if(rp_ge.reloadAfterSubmit) { $($t).trigger("reloadGrid"); }
                                        else { $($t).jqGrid("addRowData",ret[2],postdata,p.addedrow); }
                                        fillData("_empty",$t,frmgr);
                                    } else {
                                        if(rp_ge.reloadAfterSubmit) { $($t).trigger("reloadGrid"); }
                                        else { $($t).jqGrid("addRowData",ret[2],postdata,p.addedrow); }
                                    }
                                } else {
                                    // the action is update
                                    if(rp_ge.reloadAfterSubmit) {
                                        $($t).trigger("reloadGrid");
                                        if( !rp_ge.closeAfterEdit ) { setTimeout(function(){$($t).jqGrid("setSelection",postdata.id);},1000); }
                                    } else {
                                        if($t.p.treeGrid === true) {
                                            $($t).jqGrid("setTreeRow",postdata.id,postdata);
                                        } else {
                                            $($t).jqGrid("setRowData",postdata.id,postdata);
                                        }
                                    }
                                    if(rp_ge.closeAfterEdit) { hideModal("#"+IDs.themodal,{gb:"#gbox_"+gID,jqm:p.jqModal,onClose: rp_ge.onClose}); }
                                }
                                if($.isFunction(rp_ge.afterComplete)) {
                                    copydata = data;
                                    setTimeout(function(){rp_ge.afterComplete(copydata,postdata,$("#"+frmgr));copydata=null;},500);
                                }
                            }
                            p.processing=false;
                            if(rp_ge.checkOnSubmit || rp_ge.checkOnUpdate) {
                                $("#"+frmgr).data("disabled",false);
                                if(rp_ge._savedData.id !="_empty") rp_ge._savedData = postdata;
                            }
                            $("#sData", "#"+frmtb+"_2").removeClass('ui-state-active');
                            try{$(':input:visible',"#"+frmgr)[0].focus();} catch (e){}
                        },
                        error:function(xhr,st,err){
                            $("#FormError>td","#"+frmtb).html(st+ " : "+err);
                            $("#FormError","#"+frmtb).show();
                            p.processing=false;
                            $("#"+frmgr).data("disabled",false);
                            $("#sData", "#"+frmtb+"_2").removeClass('ui-state-active');
                        }
                    });
                }

            }
            function compareData(nObj, oObj ) {
                var ret = false,key;
                for (key in nObj) {
                    if(nObj[key] != oObj[key]) {
                        ret = true;
                        break;
                    }
                }
                return ret;
            }
        });
    },
    viewGridRow : function(rowid, p){
        p = $.extend({
            top : 0,
            left: 0,
            width: 0,
            height: 'auto',
            dataheight: 'auto',
            modal: false,
            drag: true,
            resize: true,
            jqModal: true,
            closeOnEscape : false,
            labelswidth: '30%',
            closeicon: [],
            navkeys: [false,38,40],
            onClose: null
        }, $.jgrid.view, p || {});
        return this.each(function(){
            var $t = this;
            if (!$t.grid || !rowid) { return; }
            if(!p.imgpath) { p.imgpath= $t.p.imgpath; }
            // I hate to rewrite code, but ...
            var gID = $t.p.id,
            frmgr = "ViewGrid_"+gID , frmtb = "ViewTbl_"+gID,
            IDs = {themodal:'viewmod'+gID,modalhead:'viewhd'+gID,modalcontent:'viewcnt'+gID, scrollelm : frmgr},
            maxCols = 1, maxRows=0;
            if ( $("#"+IDs.themodal).html() != null ) {
                $(".ui-jqdialog-title","#"+IDs.modalhead).html(p.caption);
                $("#FormError","#"+frmtb).hide();
                fillData(rowid,$t);
                viewModal("#"+IDs.themodal,{gbox:"#gbox_"+gID,jqm:p.jqModal, jqM: false, modal:p.modal});
                focusaref();
            } else {
                $($t.p.colModel).each( function(i) {
                    var fmto = this.formoptions;
                    maxCols = Math.max(maxCols, fmto ? fmto.colpos || 0 : 0 );
                    maxRows = Math.max(maxRows, fmto ? fmto.rowpos || 0 : 0 );
                });
                var dh = isNaN(p.dataheight) ? p.dataheight : p.dataheight+"px";
                var flr, frm = $("<form name='FormPost' id='"+frmgr+"' class='FormGrid' style='width:100%;overflow:auto;position:relative;height:"+dh+";'></form>"),
                tbl =$("<table id='"+frmtb+"' class='EditTable' cellspacing='1' cellpading='2' border='0' style='table-layout:fixed'><tbody></tbody></table>");
                // set the id.
                $(frm).append(tbl);
                var valref = createData(rowid, $t, tbl, maxCols),
                // buttons at footer
                bP = "<a href='javascript:void(0)' id='pData' class='fm-button ui-state-default ui-corner-left'><span class='ui-icon ui-icon-triangle-1-w'></span></div>",
                bN = "<a href='javascript:void(0)' id='nData' class='fm-button ui-state-default ui-corner-right'><span class='ui-icon ui-icon-triangle-1-e'></span></div>",
                bC  ="<a href='javascript:void(0)' id='cData' class='fm-button ui-state-default ui-corner-all'>"+p.bClose+"</a>";
                if(maxRows >  0) {
                    var sd=[];
                    $.each($(tbl)[0].rows,function(i,r){
                        sd[i] = r;
                    });
                    sd.sort(function(a,b){
                        if(a.rp > b.rp) {return 1;}
                        if(a.rp < b.rp) {return -1;}
                        return 0;
                    });
                    $.each(sd, function(index, row) {
                        $('tbody',tbl).append(row);
                    });
                }
                p.gbox = "#gbox_"+gID;
                var cle = false;
                if(p.closeOnEscape===true){
                    p.closeOnEscape = false;
                    cle = true;
                }
                var bt = $("<span></span>").append(frm).append("<table border='0' class='EditTable' id='"+frmtb+"_2'><tbody><tr id='Act_Buttons'><td class='navButton ui-widget-content' width='"+p.labelswidth+"'>"+bP+bN+"</td><td class='EditButton ui-widget-content'>"+bC+"</td></tr></tbody></table>");
                createModal(IDs,bt,p,"#gview_"+$t.p.id,$("#gview_"+$t.p.id)[0]);
                bt = null;
                jQuery("#"+IDs.themodal).keydown( function( e ) {
                    if(e.which === 27) {
                        if(cle) hideModal(this,{gb:p.gbox,jqm:p.jqModal, onClose: p.onClose});
                        return false;
                    }
                    if(p.navkeys[0]===true) {
                        if(e.which === p.navkeys[1]){ //up
                            $("#pData", "#"+frmtb+"_2").trigger("click");
                            return false;
                        }
                        if(e.which === p.navkeys[2]){ //down
                            $("#nData", "#"+frmtb+"_2").trigger("click");
                            return false;
                        }
                    }
                });
                p.closeicon = $.extend([true,"left","ui-icon-close"],p.closeicon);
                if(p.closeicon[0]==true) {
                    $("#cData","#"+frmtb+"_2").addClass(p.closeicon[1] == "right" ? 'fm-button-icon-right' : 'fm-button-icon-left')
                    .append("<span class='ui-icon "+p.closeicon[2]+"'></span>");
                }
                viewModal("#"+IDs.themodal,{gbox:"#gbox_"+gID,jqm:p.jqModal, modal:p.modal});
                $(".fm-button:not(.ui-state-disabled)","#"+frmtb+"_2").hover(
                   function(){$(this).addClass('ui-state-hover');},
                   function(){$(this).removeClass('ui-state-hover');}
                );
                focusaref();
                $("#cData", "#"+frmtb+"_2").click(function(e){
                    hideModal("#"+IDs.themodal,{gb:"#gbox_"+gID,jqm:p.jqModal, onClose: p.onClose});
                    return false;
                });
                $("#nData", "#"+frmtb+"_2").click(function(e){
                    $("#FormError","#"+frmtb).hide();
                    var npos = getCurrPos();
                    npos[0] = parseInt(npos[0]);
                    if(npos[0] != -1 && npos[1][npos[0]+1]) {
                        if($.isFunction(p.onclickPgButtons)) {
                            p.onclickPgButtons('next',$("#"+frmgr),npos[1][npos[0]]);
                        }
                        fillData(npos[1][npos[0]+1],$t);
                        $($t).jqGrid("setSelection",npos[1][npos[0]+1]);
                        if($.isFunction(p.afterclickPgButtons)) {
                            p.afterclickPgButtons('next',$("#"+frmgr),npos[1][npos[0]+1]);
                        }
                        updateNav(npos[0]+1,npos[1].length-1);
                    };
                    focusaref();
                    return false;
                });
                $("#pData", "#"+frmtb+"_2").click(function(e){
                    $("#FormError","#"+frmtb).hide();
                    var ppos = getCurrPos();
                    if(ppos[0] != -1 && ppos[1][ppos[0]-1]) {
                        if($.isFunction(p.onclickPgButtons)) {
                            p.onclickPgButtons('prev',$("#"+frmgr),ppos[1][ppos[0]]);
                        }
                        fillData(ppos[1][ppos[0]-1],$t);
                        $($t).jqGrid("setSelection",ppos[1][ppos[0]-1]);
                        if($.isFunction(p.afterclickPgButtons)) {
                            p.afterclickPgButtons('prev',$("#"+frmgr),ppos[1][ppos[0]-1]);
                        }
                        updateNav(ppos[0]-1,ppos[1].length-1);
                    };
                    focusaref();
                    return false;
                });
            };
            function focusaref(){ //Sfari 3 issues
                if(p.closeOnEscape===true || p.navkeys[0]===true) {
                    setTimeout(function(){$(".ui-jqdialog-titlebar-close","#"+IDs.modalhead).focus()},0);
                }
            }
            var posInit =getCurrPos();
            updateNav(posInit[0],posInit[1].length-1);
            function updateNav(cr,totr,rid){
                if (cr==0) { $("#pData","#"+frmtb+"_2").addClass('ui-state-disabled'); } else { $("#pData","#"+frmtb+"_2").removeClass('ui-state-disabled'); }
                if (cr==totr) { $("#nData","#"+frmtb+"_2").addClass('ui-state-disabled'); } else { $("#nData","#"+frmtb+"_2").removeClass('ui-state-disabled'); }
            }
            function getCurrPos() {
                var rowsInGrid = $($t).jqGrid("getDataIDs"),
                selrow = $("#id_g","#"+frmtb).val(),
                pos = $.inArray(selrow,rowsInGrid);
                return [pos,rowsInGrid];
            }
            function createData(rowid,obj,tb,maxcols){
                var nm, hc,trdata, tdl, tde, cnt=0,tmp, dc, retpos=[], ind=false,
                tdtmpl = "<td class='CaptionTD ui-widget-content' width='"+p.labelswidth+"'>&nbsp;</td><td class='DataTD ui-helper-reset ui-widget-content' style='white-space:pre;'>&nbsp;</td>", tmpl="",
                tdtmpl2 = "<td class='CaptionTD ui-widget-content'>&nbsp;</td><td class='DataTD ui-widget-content' style='white-space:pre;'>&nbsp;</td>",
                fmtnum = ['integer','number','currency'],max1 =0, max2=0 ,maxw,setme;
                for (var i =1;i<=maxcols;i++) {
                    tmpl += i == 1 ? tdtmpl : tdtmpl2;
                }
                // find max number align rigth with property formatter
                $(obj.p.colModel).each( function(i) {
                    if(this.editrules && this.editrules.edithidden === true) {
                        hc = false;
                    } else {
                        hc = this.hidden === true ? true : false;
                    }
                    if(!hc && this.align==='right') {
                        if(this.formatter && $.inArray(this.formatter,fmtnum) !== -1 ) {
                            max1 = Math.max(max1,parseInt(this.width,10));
                        } else {
                            max2 = Math.max(max2,parseInt(this.width,10));
                        }
                    }
                });
                maxw  = max1 !==0 ? max1 : max2 !==0 ? max2 : 0;
                ind = $(obj).jqGrid("getInd",rowid);
                $(obj.p.colModel).each( function(i) {
                    nm = this.name;
                    setme = false;
                    // hidden fields are included in the form
                    if(this.editrules && this.editrules.edithidden === true) {
                        hc = false;
                    } else {
                        hc = this.hidden === true ? true : false;
                    }
                    dc = hc ? "style='display:none'" : "";
                    if ( nm !== 'cb' && nm !== 'subgrid' && this.editable===true) {
                        if(ind === false) {
                            tmp = "";
                        } else {
                            if(nm == obj.p.ExpandColumn && obj.p.treeGrid === true) {
                                tmp = $("td:eq("+i+")",obj.rows[ind]).text();
                            } else {
                                tmp = $("td:eq("+i+")",obj.rows[ind]).html();
                            }
                        }
                        setme = this.align === 'right' && maxw !==0 ? true : false;
                        var opt = $.extend({}, this.editoptions || {} ,{id:nm,name:nm}),
                        frmopt = $.extend({},{rowabove:false,rowcontent:''}, this.formoptions || {}),
                        rp = parseInt(frmopt.rowpos) || cnt+1,
                        cp = parseInt((parseInt(frmopt.colpos) || 1)*2);
                        if(frmopt.rowabove) {
                            var newdata = $("<tr><td class='contentinfo' colspan='"+(maxcols*2)+"'>"+frmopt.rowcontent+"</td></tr>");
                            $(tb).append(newdata);
                            newdata[0].rp = rp;
                        }
                        trdata = $(tb).find("tr[rowpos="+rp+"]");
                        if ( trdata.length==0 ) {
                            trdata = $("<tr "+dc+" rowpos='"+rp+"'></tr>").addClass("FormData").attr("id","trv_"+nm);
                            $(trdata).append(tmpl);
                            $(tb).append(trdata);
                            trdata[0].rp = rp;
                        }
                        $("td:eq("+(cp-2)+")",trdata[0]).html('<b>'+ (typeof frmopt.label === 'undefined' ? obj.p.colNames[i]: frmopt.label)+'</b>');
                        $("td:eq("+(cp-1)+")",trdata[0]).append("<span>"+tmp+"</span>").attr("id","v_"+nm);
                        if(setme){
                            $("td:eq("+(cp-1)+") span",trdata[0]).css({'text-align':'right',width:maxw+"px"});
                        }
                        retpos[cnt] = i;
                        cnt++;
                    };
                });
                if( cnt > 0) {
                    var idrow = $("<tr class='FormData' style='display:none'><td class='CaptionTD'></td><td colspan='"+ (maxcols*2-1)+"' class='DataTD'><input class='FormElement' id='id_g' type='text' name='id' value='"+rowid+"'/></td></tr>");
                    idrow[0].rp = cnt+99;
                    $(tb).append(idrow);
                }
                return retpos;
            };
            function fillData(rowid,obj){
                var nm, hc,cnt=0,tmp, opt,trv;
                trv = $(obj).jqGrid("getInd",rowid,true);
                if(!trv) return;
                $('td',trv).each( function(i) {
                    nm = obj.p.colModel[i].name;
                    // hidden fields are included in the form
                    if(obj.p.colModel[i].editrules && obj.p.colModel[i].editrules.edithidden === true) {
                        hc = false;
                    } else {
                        hc = obj.p.colModel[i].hidden === true ? true : false;
                    }
                    if ( nm !== 'cb' && nm !== 'subgrid' && obj.p.colModel[i].editable===true) {
                        if(nm == obj.p.ExpandColumn && obj.p.treeGrid === true) {
                            tmp = $(this).text();
                        } else {
                            tmp = $(this).html();
                        }
                        opt = $.extend({},obj.p.colModel[i].editoptions || {});
                        nm = $.jgrid.jqID("v_"+nm);
                        $("#"+nm+" span","#"+frmtb).html(tmp);
                        if (hc) { $("#"+nm,"#"+frmtb).parents("tr:first").hide(); }
                        cnt++;
                    }
                });
                if(cnt>0) { $("#id_g","#"+frmtb).val(rowid); }
            };
        });
    },
    delGridRow : function(rowids,p) {
        p = $.extend({
            top : 0,
            left: 0,
            width: 240,
            height: 'auto',
            dataheight : 'auto',
            modal: false,
            drag: true,
            resize: true,
            url : '',
            mtype : "POST",
            reloadAfterSubmit: true,
            beforeShowForm: null,
            afterShowForm: null,
            beforeSubmit: null,
            onclickSubmit: null,
            afterSubmit: null,
            jqModal : true,
            closeOnEscape : false,
            delData: {},
            delicon : [],
            cancelicon : [],
            onClose : null
        }, $.jgrid.del, p ||{});
        rp_ge = p;
        return this.each(function(){
            var $t = this;
            if (!$t.grid ) { return; }
            if(!rowids) { return; }
            var onBeforeShow = typeof p.beforeShowForm === 'function' ? true: false,
            onAfterShow = typeof p.afterShowForm === 'function' ? true: false,
            gID = $t.p.id, onCS = {},
            dtbl = "DelTbl_"+gID,
            IDs = {themodal:'delmod'+gID,modalhead:'delhd'+gID,modalcontent:'delcnt'+gID, scrollelm: dtbl};
            if (isArray(rowids)) { rowids = rowids.join(); }
            if ( $("#"+IDs.themodal).html() != null ) {
                $("#DelData>td","#"+dtbl).text(rowids);
                $("#DelError","#"+dtbl).hide();
                if( p.processing === true) {
                    p.processing=false;
                    $("#dData", "#"+dtbl).removeClass('ui-state-active');
                }
                if(onBeforeShow) { p.beforeShowForm($("#"+dtbl)); }
                viewModal("#"+IDs.themodal,{gbox:"#gbox_"+gID,jqm:p.jqModal,jqM: false, modal:p.modal});
                if(onAfterShow) { p.afterShowForm($("#"+dtbl)); }
            } else {
                var dh = isNaN(p.dataheight) ? p.dataheight : p.dataheight+"px";
                var tbl = "<div id='"+dtbl+"' class='formdata' style='width:100%;overflow:auto;position:relative;height:"+dh+";'>";
                tbl += "<table class='DelTable'><tbody>";
                // error data
                tbl += "<tr id='DelError' style='display:none'><td class='ui-state-error'></td></tr>";
                tbl += "<tr id='DelData' style='display:none'><td >"+rowids+"</td></tr>";
                tbl += "<tr><td class=\"delmsg\" style=\"white-space:pre;\">"+p.msg+"</td></tr><tr><td >&nbsp;</td></tr>";
                // buttons at footer
                tbl += "</tbody></table></div>"
                var bS  = "<a href='javascript:void(0)' id='dData' class='fm-button ui-state-default ui-corner-all'>"+p.bSubmit+"</a>",
                bC  = "<a href='javascript:void(0)' id='eData' class='fm-button ui-state-default ui-corner-all'>"+p.bCancel+"</a>";
                tbl += "<table cellspacing='0' cellpadding='0' border='0' class='EditTable' id='"+dtbl+"_2'><tbody><tr><td class='DataTD ui-widget-content'></td></tr><tr style='display:block;height:3px;'><td></td></tr><tr><td class='DelButton EditButton'>"+bS+"&nbsp;"+bC+"</td></tr></tbody></table>";
                p.gbox = "#gbox_"+gID;
                createModal(IDs,tbl,p,"#gview_"+$t.p.id,$("#gview_"+$t.p.id)[0]);
                $(".fm-button","#"+dtbl+"_2").hover(
                   function(){$(this).addClass('ui-state-hover');},
                   function(){$(this).removeClass('ui-state-hover');}
                );
                p.delicon = $.extend([true,"left","ui-icon-scissors"],p.delicon);
                p.cancelicon = $.extend([true,"left","ui-icon-cancel"],p.cancelicon);
                if(p.delicon[0]==true) {
                    $("#dData","#"+dtbl+"_2").addClass(p.delicon[1] == "right" ? 'fm-button-icon-right' : 'fm-button-icon-left')
                    .append("<span class='ui-icon "+p.delicon[2]+"'></span>");
                }
                if(p.cancelicon[0]==true) {
                    $("#eData","#"+dtbl+"_2").addClass(p.cancelicon[1] == "right" ? 'fm-button-icon-right' : 'fm-button-icon-left')
                    .append("<span class='ui-icon "+p.cancelicon[2]+"'></span>");
                }
                $("#dData","#"+dtbl+"_2").click(function(e){
                    var ret=[true,""]; onCS = {};
                    var postdata = $("#DelData>td","#"+dtbl).text(); //the pair is name=val1,val2,...
                    if( typeof p.onclickSubmit === 'function' ) { onCS = p.onclickSubmit(rp_ge) || {}; }
                    if( typeof p.beforeSubmit === 'function' ) { ret = p.beforeSubmit(postdata); }
                    if(ret[0]){
                        var gurl = rp_ge.url ? rp_ge.url : $t.p.editurl;
                        if(!gurl) { ret[0]=false;ret[1] += " "+$.jgrid.errors.nourl;}
                    }
                    if(ret[0] === false) {
                        $("#DelError>td","#"+dtbl).html(ret[1]);
                        $("#DelError","#"+dtbl).show();
                    } else {
                        if(!p.processing) {
                            p.processing = true;
                            $(this).addClass('ui-state-active');
                            var postd = $.extend({oper:"del", id:postdata},p.delData, onCS);
                            $.ajax({
                                url:gurl,
                                type: p.mtype,
                                data:postd,
                                complete:function(data,Status){
                                    if(Status != "success") {
                                        ret[0] = false;
                                        if ($.isFunction(rp_ge.errorTextFormat)) {
                                            ret[1] = rp_ge.errorTextFormat(data);
                                        } else {
                                            ret[1] = Status + " Status: '" + data.statusText + "'. Error code: " + data.status;
                                        }
                                    } else {
                                        // data is posted successful
                                        // execute aftersubmit with the returned data from server
                                        if( typeof rp_ge.afterSubmit === 'function' ) {
                                            ret = rp_ge.afterSubmit(data,postdata);
                                        }
                                    }
                                    if(ret[0] === false) {
                                        $("#DelError>td","#"+dtbl).html(ret[1]);
                                        $("#DelError","#"+dtbl).show();
                                    } else {
                                        if(rp_ge.reloadAfterSubmit) {
                                            if($t.p.treeGrid) {
                                                $($t).jqGrid("setGridParam",{treeANode:0,datatype:$t.p.treedatatype});
                                            }
                                            $($t).trigger("reloadGrid");
                                        } else {
                                            var toarr = [];
                                            toarr = postdata.split(",");
                                            if($t.p.treeGrid===true){
                                                try {$($t).jqGrid("delTreeNode",toarr[0])} catch(e){}
                                            } else {
                                                for(var i=0;i<toarr.length;i++) {
                                                    $($t).jqGrid("delRowData",toarr[i]);
                                                }
                                            }
                                            $t.p.selrow = null;
                                            $t.p.selarrrow = [];
                                        }
                                        if($.isFunction(rp_ge.afterComplete)) {
                                            setTimeout(function(){rp_ge.afterComplete(data,postdata);},500);
                                        }
                                    }
                                    p.processing=false;
                                    $("#dData", "#"+dtbl+"_2").removeClass('ui-state-active');
                                    if(ret[0]) { hideModal("#"+IDs.themodal,{gb:"#gbox_"+gID,jqm:p.jqModal, onClose: rp_ge.onClose}); }
                                },
                                error:function(xhr,st,err){
                                    $("#DelError>td","#"+dtbl).html(st+ " : "+err);
                                    $("#DelError","#"+dtbl).show();
                                    p.processing=false;
                                    $("#dData", "#"+dtbl+"_2").removeClass('ui-state-active');;
                                }
                            });
                        }
                    }
                    return false;
                });
                $("#eData", "#"+dtbl+"_2").click(function(e){
                    hideModal("#"+IDs.themodal,{gb:"#gbox_"+gID,jqm:p.jqModal, onClose: rp_ge.onClose});
                    return false;
                });
                if(onBeforeShow) { p.beforeShowForm($("#"+dtbl)); }
                viewModal("#"+IDs.themodal,{gbox:"#gbox_"+gID,jqm:p.jqModal,modal:p.modal});
                if(onAfterShow) { p.afterShowForm($("#"+dtbl)); }
            }
            if(p.closeOnEscape===true) {
                setTimeout(function(){$(".ui-jqdialog-titlebar-close","#"+IDs.modalhead).focus()},0);
            }
        });
    },
    navGrid : function (elem, o, pEdit,pAdd,pDel,pSearch, pView) {
        o = $.extend({
            edit: true,
            editicon: "ui-icon-pencil",
            add: true,
            addicon:"ui-icon-plus",
            del: true,
            delicon:"ui-icon-trash",
            search: true,
            searchicon:"ui-icon-search",
            refresh: true,
            refreshicon:"ui-icon-refresh",
            refreshstate: 'firstpage',
            view: false,
            viewicon : "ui-icon-document",
            position : "left",
            closeOnEscape : true,
            afterRefresh : null
        }, $.jgrid.nav, o ||{});
        return this.each(function() {
            var alertIDs = {themodal:'alertmod',modalhead:'alerthd',modalcontent:'alertcnt'},
            $t = this, vwidth, vheight, twd, tdw;
            if(!$t.grid) { return; }
            if ($("#"+alertIDs.themodal).html() == null) {
                if (typeof window.innerWidth != 'undefined') {
                    vwidth = window.innerWidth,
                    vheight = window.innerHeight
                } else if (typeof document.documentElement != 'undefined' && typeof document.documentElement.clientWidth != 'undefined' && document.documentElement.clientWidth != 0) {
                    vwidth = document.documentElement.clientWidth,
                    vheight = document.documentElement.clientHeight
                } else {
                    vwidth=1024;
                    vheight=768;
                }
                createModal(alertIDs,"<div>"+o.alerttext+"</div><span tabindex='0'><span tabindex='-1' id='jqg_alrt'></span></span>",{gbox:"#gbox_"+$t.p.id,jqModal:true,drag:true,resize:true,caption:o.alertcap,top:vheight/2-25,left:vwidth/2-100,width:200,height:'auto',closeOnEscape:o.closeOnEscape},"","",true);
            }
            var tbd,
            navtbl = $("<table cellspacing='0' cellpadding='0' border='0' class='ui-pg-table navtable' style='float:left;table-layout:auto;'><tbody><tr></tr></tbody></table>"),
            sep = "<td class='ui-pg-button ui-state-disabled' style='width:4px;'><span class='ui-separator'></span></td>",
            pgid = $($t.p.pager).attr("id") || 'pager';
            if (o.add) {
                pAdd = pAdd || {};
                tbd = $("<td class='ui-pg-button ui-corner-all'></td>");
                $(tbd).append("<div class='ui-pg-div'><span class='ui-icon "+o.addicon+"'></span>"+o.addtext+"</div>");
                $("tr",navtbl).append(tbd);
                $(tbd,navtbl)
                .attr({"title":o.addtitle || "",id : pAdd.id || "add_"+$t.p.id})
                .click(function(){
                    if (typeof o.addfunc == 'function') {
                        o.addfunc();
                    } else {
                        $($t).jqGrid("editGridRow","new",pAdd);
                    }
                    return false;
                }).hover(function () {$(this).addClass("ui-state-hover");},
                    function () {$(this).removeClass("ui-state-hover");}
                );
                tbd = null;
            }
            if (o.edit) {
                tbd = $("<td class='ui-pg-button ui-corner-all'></td>");
                pEdit = pEdit || {};
                $(tbd).append("<div class='ui-pg-div'><span class='ui-icon "+o.editicon+"'></span>"+o.edittext+"</div>");
                $("tr",navtbl).append(tbd);
                $(tbd,navtbl)
                .attr({"title":o.edittitle || "",id: pEdit.id || "edit_"+$t.p.id})
                .click(function(){
                    var sr = $t.p.selrow;
                    if (sr) {
                        if(typeof o.editfunc == 'function') {
                            o.editfunc(sr);
                        } else {
                            $($t).jqGrid("editGridRow",sr,pEdit);
                        }
                    } else {
                        viewModal("#"+alertIDs.themodal,{gbox:"#gbox_"+$t.p.id,jqm:true});
                        $("#jqg_alrt").focus();
                    }
                    return false;
                }).hover( function () {$(this).addClass("ui-state-hover");},
                    function () {$(this).removeClass("ui-state-hover");}
                );
                tbd = null;
            }
            if (o.view) {
                tbd = $("<td class='ui-pg-button ui-corner-all'></td>");
                pView = pView || {};
                $(tbd).append("<div class='ui-pg-div'><span class='ui-icon "+o.viewicon+"'></span>"+o.viewtext+"</div>");
                $("tr",navtbl).append(tbd);
                $(tbd,navtbl)
                .attr({"title":o.viewtitle || "",id: pView.id || "view_"+$t.p.id})
                .click(function(){
                    var sr = $t.p.selrow;
                    if (sr) {
                        $($t).jqGrid("viewGridRow",sr,pView);
                    } else {
                        viewModal("#"+alertIDs.themodal,{gbox:"#gbox_"+$t.p.id,jqm:true});
                        $("#jqg_alrt").focus();
                    }
                    return false;
                }).hover( function () {$(this).addClass("ui-state-hover");},
                    function () {$(this).removeClass("ui-state-hover");}
                );
                tbd = null;
            }
            if (o.del) {
                tbd = $("<td class='ui-pg-button ui-corner-all'></td>");
                pDel = pDel || {};
                $(tbd).append("<div class='ui-pg-div'><span class='ui-icon "+o.delicon+"'></span>"+o.deltext+"</div>");
                $("tr",navtbl).append(tbd);
                $(tbd,navtbl)
                .attr({"title":o.deltitle || "",id: pDel.id || "del_"+$t.p.id})
                .click(function(){
                    var dr;
                    if($t.p.multiselect) {
                        dr = $t.p.selarrrow;
                        if(dr.length==0) { dr = null; }
                    } else {
                        dr = $t.p.selrow;
                    }
                    if (dr) { $($t).jqGrid("delGridRow",dr,pDel); }
                    else  {viewModal("#"+alertIDs.themodal,{gbox:"#gbox_"+$t.p.id,jqm:true}); $("#jqg_alrt").focus(); }
                    return false;
                }).hover(function () {$(this).addClass("ui-state-hover");},
                    function () {$(this).removeClass("ui-state-hover");}
                );
                tbd = null;
            }
            if(o.add || o.edit || o.del || o.view) { $("tr",navtbl).append(sep); }
            if (o.search) {
                tbd = $("<td class='ui-pg-button ui-corner-all'></td>");
                pSearch = pSearch || {};
                $(tbd).append("<div class='ui-pg-div'><span class='ui-icon "+o.searchicon+"'></span>"+o.searchtext+"</div>");
                $("tr",navtbl).append(tbd);
                $(tbd,navtbl)
                .attr({"title":o.searchtitle  || "",id:pSearch.id || "search_"+$t.p.id})
                .click(function(){
                    $($t).jqGrid("searchGrid",pSearch);
                    return false;
                }).hover(function () {$(this).addClass("ui-state-hover");},
                    function () {$(this).removeClass("ui-state-hover");}
                );
                tbd = null;
            }
            if (o.refresh) {
                tbd = $("<td class='ui-pg-button ui-corner-all'></td>");
                $(tbd).append("<div class='ui-pg-div'><span class='ui-icon "+o.refreshicon+"'></span>"+o.refreshtext+"</div>");
                $("tr",navtbl).append(tbd);
                $(tbd,navtbl)
                .attr({"title":o.refreshtitle  || "",id: "refresh_"+$t.p.id})
                .click(function(){
                    $t.p.search = false;
                    try {
                        var gID = $t.p.id;
                        $("#fbox_"+gID).searchFilter().reset();
                    } catch (e) {}
                    switch (o.refreshstate) {
                        case 'firstpage':
                            $t.p.page=1;
                            $($t).trigger("reloadGrid");
                            break;
                        case 'current':
                            var sr = $t.p.multiselect===true ? $t.p.selarrrow : $t.p.selrow;
                            $($t).trigger("reloadGrid");
                            setTimeout(function(){
                                if($t.p.multiselect===true) {
                                    if(sr.length>0) {
                                        for(var i=0;i<sr.length;i++){
                                            $($t).jqGrid("setSelection",sr[i],false);
                                        }
                                    }
                                } else {
                                    if(sr) {
                                        $($t).jqGrid("setSelection",sr,false);
                                    }
                                }
                            },1000);
                            break;
                    }
                    if($.isFunction(o.afterRefresh)) o.afterRefresh();
                    return false;
                }).hover(function () {$(this).addClass("ui-state-hover");},
                    function () {$(this).removeClass("ui-state-hover");}
                );
                tbd = null;
            }
            tdw = $(".ui-jqgrid").css("font-size") || "11px";
            $('body').append("<div id='testpg2' class='ui-jqgrid ui-widget ui-widget-content' style='font-size:"+tdw+";visibility:hidden;' ></div>");
            twd = $(navtbl).clone().appendTo("#testpg2").width();
            $("#testpg2").remove();
            $("#"+pgid+"_"+o.position,"#"+pgid).append(navtbl);
            if($t.p._nvtd) {
                if(twd > $t.p._nvtd[0] ) {
                    $("#"+pgid+"_"+o.position,"#"+pgid).width(twd);
                    $t.p._nvtd[0] = twd;
                }
                $t.p._nvtd[1] = twd;
            }
        });
    },
    navButtonAdd : function (elem, p) {
        p = $.extend({
            caption : "newButton",
            title: '',
            buttonicon : 'ui-icon-newwin',
            onClickButton: null,
            position : "last",
            cursor : 'pointer'
        }, p ||{});
        return this.each(function() {
            if( !this.grid)  { return; }
            if( elem.indexOf("#") != 0) { elem = "#"+elem; }
            var findnav = $(".navtable",elem)[0];
            if (findnav) {
                var tbd = $("<td></td>");
                $(tbd).addClass('ui-pg-button ui-corner-all').append("<div class='ui-pg-div'><span class='ui-icon "+p.buttonicon+"'></span>"+p.caption+"</div>");
                if(p.id) {$(tbd).attr("id",p.id);}
                if(p.position=='first'){
                    if(findnav.rows[0].cells.length ===0 ) {
                        $("tr",findnav).append(tbd);
                    } else {
                        $("tr td:eq(0)",findnav).before(tbd);
                    }
                } else {
                    $("tr",findnav).append(tbd);
                }
                $(tbd,findnav)
                .attr("title",p.title  || "")
                .click(function(e){
                    if ($.isFunction(p.onClickButton) ) { p.onClickButton(); }
                    return false;
                })
                .hover(
                    function () {$(this).addClass("ui-state-hover");},
                    function () {$(this).removeClass("ui-state-hover");}
                )
                .css("cursor",p.cursor ? p.cursor : "normal");
            }
        });
    },
    navSeparatorAdd:function (elem,p) {
        p = $.extend({
            sepclass : "ui-separator",
            sepcontent: ''
        }, p ||{});
        return this.each(function() {
            if( !this.grid)  { return; }
            if( elem.indexOf("#") != 0) { elem = "#"+elem; }
            var findnav = $(".navtable",elem)[0];
            if(findnav) {
                var sep = "<td class='ui-pg-button ui-state-disabled' style='width:4px;'><span class='"+p.sepclass+"'></span>"+p.sepcontent+"</td>";
                $("tr",findnav).append(sep);
            }
        });
    },
    GridToForm : function( rowid, formid ) {
        return this.each(function(){
            var $t = this;
            if (!$t.grid) { return; }
            var rowdata = $($t).jqGrid("getRowData",rowid);
            if (rowdata) {
                for(var i in rowdata) {
                    if ( $("[name="+i+"]",formid).is("input:radio") || $("[name="+i+"]",formid).is("input:checkbox"))  {
                        $("[name="+i+"]",formid).each( function() {
                            if( $(this).val() == rowdata[i] ) {
                                $(this).attr("checked","checked");
                            } else {
                                $(this).attr("checked","");
                            }
                        });
                    } else {
                    // this is very slow on big table and form.
                        $("[name="+i+"]",formid).val(rowdata[i]);
                    }
                }
            }
        });
    },
    FormToGrid : function(rowid, formid, mode, position){
        return this.each(function() {
            var $t = this;
            if(!$t.grid) { return; }
            if(!mode) mode = 'set';
            if(!position) position = 'first';
            var fields = $(formid).serializeArray();
            var griddata = {};
            $.each(fields, function(i, field){
                griddata[field.name] = field.value;
            });
            if(mode=='add') $($t).jqGrid("addRowData",rowid,griddata, position);
            else if(mode=='set') $($t).jqGrid("setRowData",rowid,griddata);
        });
    }
});
})(jQuery);
;(function($){
/*
 * jqGrid extension for constructing Grid Data from external file
 * Tony Tomov tony@trirand.com
 * http://trirand.com/blog/
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
**/
    $.jgrid.extend({
        jqGridImport : function(o) {
            o = $.extend({
                imptype : "xml", // xml, json, xmlstring, jsonstring
                impstring: "",
                impurl: "",
                mtype: "GET",
                impData : {},
                xmlGrid :{
                    config : "roots>grid",
                    data: "roots>rows"
                },
                jsonGrid :{
                    config : "grid",
                    data: "data"
                }
            }, o || {});
            return this.each(function(){
                var $t = this;
                var XmlConvert = function (xml,o) {
                    var cnfg = $(o.xmlGrid.config,xml)[0];
                    var xmldata = $(o.xmlGrid.data,xml)[0];
                    if(xmlJsonClass.xml2json && $.jgrid.parse) {
                        var jstr = xmlJsonClass.xml2json(cnfg," ");
                        var jstr = $.jgrid.parse(jstr);
                        for(var key in jstr) { var jstr1=jstr[key];}
                        if(xmldata) {
                        // save the datatype
                            var svdatatype = jstr.grid.datatype;
                            jstr.grid.datatype = 'xmlstring';
                            jstr.grid.datastr = xml;
                            $($t).jqGrid( jstr1 ).jqGrid("setGridParam",{datatype:svdatatype});
                        } else {
                            $($t).jqGrid( jstr1 );
                        }
                        jstr = null;jstr1=null;
                    } else {
                        alert("xml2json or parse are not present");
                    }
                };
                var JsonConvert = function (jsonstr,o){
                    if (jsonstr && typeof jsonstr == 'string') {
                        var json = $.jgrid.parse(jsonstr);
                        var gprm = json[o.jsonGrid.config];
                        var jdata = json[o.jsonGrid.data];
                        if(jdata) {
                            var svdatatype = gprm.datatype;
                            gprm.datatype = 'jsonstring';
                            gprm.datastr = jdata;
                            $($t).jqGrid( gprm ).jqGrid("setGridParam",{datatype:svdatatype});
                        } else {
                            $($t).jqGrid( gprm );
                        }
                    }
                };
                switch (o.imptype){
                    case 'xml':
                        $.ajax({
                            url:o.impurl,
                            type:o.mtype,
                            data: o.impData,
                            dataType:"xml",
                            complete: function(xml,stat) {
                                if(stat == 'success') {
                                    XmlConvert(xml.responseXML,o);
                                    if($.isFunction(o.importComplete)) {
                                        o.importComplete(xml);
                                    }
                                }
                                xml=null;
                            }
                        });
                        break;
                    case 'xmlstring' :
                        // we need to make just the conversion and use the same code as xml
                        if(o.impstring && typeof o.impstring == 'string') {
                            var xmld = $.jgrid.stringToDoc(o.impstring);
                            if(xmld) {
                                XmlConvert(xmld,o);
                                if($.isFunction(o.importComplete)) {
                                    o.importComplete(xmld);
                                }
                                o.impstring = null;
                            }
                            xmld = null;
                        }
                        break;
                    case 'json':
                        $.ajax({
                            url:o.impurl,
                            type:o.mtype,
                            data: o.impData,
                            dataType:"json",
                            complete: function(json,stat) {
                                if(stat == 'success') {
                                    JsonConvert(json.responseText,o );
                                    if($.isFunction(o.importComplete)) {
                                        o.importComplete(json);
                                    }
                                }
                                json=null;
                            }
                        });
                        break;
                    case 'jsonstring' :
                        if(o.impstring && typeof o.impstring == 'string') {
                            JsonConvert(o.impstring,o );
                            if($.isFunction(o.importComplete)) {
                                o.importComplete(o.impstring);
                            }
                            o.impstring = null;
                        }
                        break;
                }
            });
        },
        jqGridExport : function(o) {
            o = $.extend({
                exptype : "xmlstring",
                root: "grid",
                ident: "\t"
            }, o || {});
            var ret = null;
            this.each(function () {
                if(!this.grid) { return;}
                var gprm = $(this).jqGrid("getGridParam");
                // we need to check for:
                // 1.multiselect, 2.subgrid  3. treegrid and remove the unneded columns from colNames
                if(gprm.rownumbers) {
                    gprm.colNames.splice(0);
                    gprm.colModel.splice(0);
                }
                if(gprm.multiselect) {
                    gprm.colNames.splice(0);
                    gprm.colModel.splice(0);
                }
                if(gprm.subgrid) {
                    gprm.colNames.splice(0);
                    gprm.colModel.splice(0);
                }
                if(gprm.treeGrid) {
                    for (var key in gprm.treeReader) {
                        gprm.colNames.splice(gprm.colNames.length-1);
                        gprm.colModel.splice(gprm.colModel.length-1);
                    }
                }
                switch (o.exptype) {
                    case 'xmlstring' :
                        ret = "<"+o.root+">"+xmlJsonClass.json2xml(gprm,o.ident)+"</"+o.root+">";
                        break;
                    case 'jsonstring' :
                        ret = "{"+ xmlJsonClass.toJson(gprm,o.root,o.ident)+"}";
                        break;
                }
            });
            return ret;
        }
    });
})(jQuery);;(function($){
/**
 * jqGrid extension for manipulating Grid Data
 * Tony Tomov tony@trirand.com
 * http://trirand.com/blog/
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
**/
$.jgrid.extend({
//Editing
    editRow : function(rowid,keys,oneditfunc,succesfunc, url, extraparam, aftersavefunc,errorfunc, afterrestorefunc) {
        return this.each(function(){
            var $t = this, nm, tmp, editable, cnt=0, focus=null, svr={}, ind,cm;
            if (!$t.grid ) { return; }
            ind = $($t).jqGrid("getInd",rowid,true);
            if( ind == false ) {return;}
            editable = $(ind).attr("editable") || "0";
            if (editable == "0") {
                cm = $t.p.colModel;
                $('td',ind).each( function(i) {
                    nm = cm[i].name;
                    var treeg = $t.p.treeGrid===true && nm == $t.p.ExpandColumn;
                    if(treeg) tmp = $("span:first",this).html();
                    else {
                        try {
                            tmp =  $.unformat(this,{colModel:cm[i]},i);
                        } catch (_) {
                            tmp = $(this).html();
                        }
                    }
                    if ( nm != 'cb' && nm != 'subgrid' && nm != 'rn') {
                        svr[nm]=tmp;
                        if(cm[i].editable===true) {
                            if(focus===null) { focus = i; }
                            if (treeg) $("span:first",this).html("");
                            else $(this).html("");
                            var opt = $.extend({},cm[i].editoptions || {},{id:rowid+"_"+nm,name:nm});
                            if(!cm[i].edittype) { cm[i].edittype = "text"; }
                            var elc = createEl(cm[i].edittype,opt,tmp,true);
                            $(elc).addClass("editable");
                            if(treeg) $("span:first",this).append(elc);
                            else $(this).append(elc);
                            //Again IE
                            if(cm[i].edittype == "select" && cm[i].editoptions.multiple===true && $.browser.msie) {
                                $(elc).width($(elc).width());
                            }
                            cnt++;
                        }
                    }
                });
                if(cnt > 0) {
                    svr['id'] = rowid; $t.p.savedRow.push(svr);
                    $(ind).attr("editable","1");
                    $("td:eq("+focus+") input",ind).focus();
                    if(keys===true) {
                        $(ind).bind("keydown",function(e) {
                            if (e.keyCode === 27) {$($t).jqGrid("restoreRow",rowid, afterrestorefunc);}
                            if (e.keyCode === 13) {
                                $($t).jqGrid("saveRow",rowid,succesfunc, url, extraparam, aftersavefunc,errorfunc, afterrestorefunc );
                                return false;
                            }
                            e.stopPropagation();
                        });
                    }
                    if( $.isFunction(oneditfunc)) { oneditfunc(rowid); }
                }
            }
        });
    },
    saveRow : function(rowid, succesfunc, url, extraparam, aftersavefunc,errorfunc, afterrestorefunc) {
        return this.each(function(){
        var $t = this, nm, tmp={}, tmp2={}, editable, fr, cv, ind;
        if (!$t.grid ) { return; }
        ind = $($t).jqGrid("getInd",rowid,true);
        if(ind == false) {return;}
        editable = $(ind).attr("editable");
        url = url ? url : $t.p.editurl;
        if (editable==="1" && url) {
            var cm;
            $("td",ind).each(function(i) {
                cm = $t.p.colModel[i];
                nm = cm.name;
                if ( nm != 'cb' && nm != 'subgrid' && cm.editable===true && nm != 'rn') {
                    switch (cm.edittype) {
                        case "checkbox":
                            var cbv = ["Yes","No"];
                            if(cm.editoptions ) {
                                cbv = cm.editoptions.value.split(":");
                            }
                            tmp[nm]=  $("input",this).attr("checked") ? cbv[0] : cbv[1];
                            break;
                        case 'text':
                        case 'password':
                        case 'textarea':
                        case "button" :
                            tmp[nm]= !$t.p.autoencode ? $("input, textarea",this).val() : $.jgrid.htmlEncode($("input, textarea",this).val());
                            break;
                        case 'select':
                            if(!cm.editoptions.multiple) {
                                tmp[nm] = $("select>option:selected",this).val();
                                tmp2[nm] = $("select>option:selected", this).text();
                            } else {
                                var sel = $("select",this), selectedText = [];
                                tmp[nm] = $(sel).val();
                                if(tmp[nm]) tmp[nm]= tmp[nm].join(","); else tmp[nm] ="";
                                $("select > option:selected",this).each(
                                    function(i,selected){
                                        selectedText[i] = $(selected).text();
                                    }
                                );
                                tmp2[nm] = selectedText.join(",");
                            }
                            if(cm.formatter && cm.formatter == 'select') tmp2={};
                            break;
                    }
                    cv = checkValues(tmp[nm],i,$t);
                    if(cv[0] === false) {
                        cv[1] = tmp[nm] + " " + cv[1];
                        return false;
                    }
                }
            });
            if (cv[0] === false){
                try {
                    info_dialog($.jgrid.errors.errcap,cv[1],$.jgrid.edit.bClose);
                } catch (e) {
                    alert(cv[1]);
                }
                return;
            }
            if(tmp) { tmp["id"] = rowid; if(extraparam) { tmp = $.extend({},tmp,extraparam);} }
            if(!$t.grid.hDiv.loading) {
                $t.grid.hDiv.loading = true;
                $("div.loading",$t.grid.hDiv).fadeIn("fast");
                if (url == 'clientArray') {
                    tmp = $.extend({},tmp, tmp2);
                    var resp = $($t).jqGrid("setRowData",rowid,tmp);
                    $(ind).attr("editable","0");
                    for( var k=0;k<$t.p.savedRow.length;k++) {
                        if( $t.p.savedRow[k].id == rowid) {fr = k; break;}
                    }
                    if(fr >= 0) { $t.p.savedRow.splice(fr,1); }
                    if( $.isFunction(aftersavefunc) ) { aftersavefunc(rowid,resp); }
                } else {
                    $.ajax({url:url,
                        data: tmp,
                        type: "POST",
                        complete: function(res,stat){
                            if (stat === "success"){
                                var ret;
                                if( $.isFunction(succesfunc)) { ret = succesfunc(res);}
                                else ret = true;
                                if (ret===true) {
                                    tmp = $.extend({},tmp, tmp2);
                                    $($t).jqGrid("setRowData",rowid,tmp);
                                    $(ind).attr("editable","0");
                                    for( var k=0;k<$t.p.savedRow.length;k++) {
                                        if( $t.p.savedRow[k].id == rowid) {fr = k; break;}
                                    };
                                    if(fr >= 0) { $t.p.savedRow.splice(fr,1); }
                                    if( $.isFunction(aftersavefunc) ) { aftersavefunc(rowid,res.responseText); }
                                } else { $($t).jqGrid("restoreRow",rowid, afterrestorefunc); }
                            }
                        },
                        error:function(res,stat){
                            if($.isFunction(errorfunc) ) {
                                errorfunc(rowid, res, stat);
                            } else {
                                alert("Error Row: "+rowid+" Result: " +res.status+":"+res.statusText+" Status: "+stat);
                            }
                        }
                    });
                }
                $t.grid.hDiv.loading = false;
                $("div.loading",$t.grid.hDiv).fadeOut("fast");
                $(ind).unbind("keydown");
            }
        }
        });
    },
    restoreRow : function(rowid, afterrestorefunc) {
        return this.each(function(){
            var $t= this, fr, ind;
            if (!$t.grid ) { return; }
            ind = $($t).jqGrid("getInd",rowid,true);
            if(ind == false) {return;}
            for( var k=0;k<$t.p.savedRow.length;k++) {
                if( $t.p.savedRow[k].id == rowid) {fr = k; break;}
            }
            if(fr >= 0) {
                if($.isFunction($.fn['datepicker'])) {
                    try {
                        $("input.hasDatepicker","#"+ind.id).datepicker('hide');
                    } catch (e) {}
                }
                $($t).jqGrid("setRowData",rowid,$t.p.savedRow[fr]);
                $(ind).attr("editable","0");
                $t.p.savedRow.splice(fr,1);
            }
            if ($.isFunction(afterrestorefunc))
            {
                afterrestorefunc(rowid);
            }
        });
    }
//end inline edit
});
})(jQuery);
;(function($){
/*
**
 * jqGrid addons using jQuery UI
 * Author: Mark Williams
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 * depends on jQuery UI sortable
**/
if ($.browser.msie && $.browser.version==8) {
    $.expr[":"].hidden = function(elem) {
        return elem.offsetWidth === 0 || elem.offsetHeight === 0 ||
            elem.style.display == "none";
    }
}

if ($.ui.multiselect && $.ui.multiselect.prototype._setSelected) {
    var setSelected = $.ui.multiselect.prototype._setSelected;
    $.ui.multiselect.prototype._setSelected = function(item,selected) {
        var ret = setSelected.call(this,item,selected);
        if (selected && this.selectedList) {
            var elt = this.element;
            this.selectedList.find('li').each(function() {
                if ($(this).data('optionLink'))
                    $(this).data('optionLink').remove().appendTo(elt);
            });
        }
        return ret;
    }
}

$.jgrid.extend({
    sortableColumns : function (tblrow)
    {
        return this.each(function (){
            ts = this;
            function start() {ts.p.disableClick = true;};
            var sortable_opts = {
                "tolerance" : "pointer",
                "axis" : "x",
                "items": '>th:not(:has(#jqgh_cb,#jqgh_rn,#jqgh_subgrid),:hidden)',
                "placeholder": {
                    element: function(item) {
                        var el = $(document.createElement(item[0].nodeName))
                        .addClass(item[0].className+" ui-sortable-placeholder ui-state-highlight")
                        .removeClass("ui-sortable-helper")[0];
                        return el;
                    },
                    update: function(self, p) {
                        p.height(self.currentItem.innerHeight() - parseInt(self.currentItem.css('paddingTop')||0, 10) - parseInt(self.currentItem.css('paddingBottom')||0, 10));
                        p.width(self.currentItem.innerWidth() - parseInt(self.currentItem.css('paddingLeft')||0, 10) - parseInt(self.currentItem.css('paddingRight')||0, 10));
                    }
                },
                "update": function(event, ui) {
                    var p = $(ui.item).parent();
                    var th = $(">th", p);
                    var colModel = ts.p.colModel;
                    var cmMap = {};
                    $.each(colModel, function(i) { cmMap[this.name]=i });
                    var permutation = [];
                    th.each(function(i) {
                        var id = $(">div", this).get(0).id.replace(/^jqgh_/, "");
                            if (id in cmMap) {
                                permutation.push(cmMap[id]);
                            }
                    });

                    $(ts).jqGrid("remapColumns",permutation, true, true);
                    if ($.isFunction(ts.p.sortable.update)) {
                        ts.p.sortable.update(permutation);
                    }
                    setTimeout(function(){ts.p.disableClick=false}, 50);
                }
            };
            if (ts.p.sortable.options) {
                $.extend(sortable_opts, ts.p.sortable.options);
            } else if ($.isFunction(ts.p.sortable)) {
                ts.p.sortable = { "update" : ts.p.sortable };
            }
            if (sortable_opts.start) {
                var s = sortable_opts.start;
                sortable_opts.start = function(e,ui) {
                    start();
                    s.call(this,e,ui);
                }
            } else {
                sortable_opts.start = start;
            }
            if (ts.p.sortable.exclude) {
                sortable_opts.items += ":not("+ts.p.sortable.exclude+")";
            }
            tblrow.sortable(sortable_opts).data("sortable").floating = true;
        });
    },
    columnChooser : function(opts) {
        var self = this;
        var selector = $('<div style="position:relative;overflow:hidden"><div><select multiple="multiple"></select></div></div>');
        var select = $('select', selector);

        opts = $.extend({
            "title" : "Select columns",
            "width" : 420,
            "height" : 240,
            "classname" : null,
            "done" : function(perm) { if (perm) self.jqGrid("remapColumns", perm, true) },
            "ok" : "Ok",
            "cancel" : "Cancel",
            /* msel is either the name of a ui widget class that
               extends a multiselect, or a function that supports
               creating a multiselect object (with no argument,
               or when passed an object), and destroying it (when
               passed the string "destroy"). */
            "msel" : "multiselect",
            /* "msel_opts" : {}, */

            /* dlog is either the name of a ui widget class that
               behaves in a dialog-like way, or a function, that
               supports creating a dialog (when passed dlog_opts)
               or destroying a dialog (when passed the string
               "destroy")
               */
            "dlog" : "dialog",

            /* dlog_opts is either an option object to be passed
               to "dlog", or (more likely) a function that creates
               the options object.
               The default produces a suitable options object for
               ui.dialog */
            "dlog_opts" : function(opts) {
                var buttons = {};
                buttons[opts.ok] = function() {
                    opts.apply_perm();
                    opts.cleanup(false);
                };
                buttons[opts.cancel] = function() {
                    opts.cleanup(true);
                };
                return {
                    "buttons": buttons,
                    "close": function() {
                        opts.cleanup(true);
                    },
                    "resizable": false,
                    "width": opts.width+20
                };
            },
            /* Function to get the permutation array, and pass it to the
               "done" function */
            "apply_perm" : function() {
                $('option',select).each(function(i) {
                    if (this.selected) {
                        self.jqGrid("showCol", colModel[this.value].name);
                    } else {
                        self.jqGrid("hideCol", colModel[this.value].name);
                    }
                });

                var perm = fixedCols.slice(0);
                $('option[selected]',select).each(function() { perm.push(parseInt(this.value)) });
                $.each(perm, function() { delete colMap[colModel[this].name] });
                $.each(colMap, function() { perm.push(this) });
                if (opts.done) {
                    opts.done.call(self, perm);
                }
            },
            /* Function to cleanup the dialog, and select. Also calls the
               done function with no permutation (to indicate that the
               columnChooser was aborted */
            "cleanup" : function(calldone) {
                call(opts.dlog, selector, 'destroy');
                call(opts.msel, select, 'destroy');
                selector.remove();
                if (calldone && opts.done) {
                    opts.done.call(self);
                }
            }
        }, opts || {});

        if (opts.title) {
            selector.attr("title", opts.title);
        }
        if (opts.classname) {
            selector.addClass(classname);
            select.addClass(classname);
        }
        if (opts.width) {
            $(">div",selector).css({"width": opts.width,"margin":"0 auto"});
            select.css("width", opts.width);
        }
        if (opts.height) {
            $(">div",selector).css("height", opts.height);
            select.css("height", opts.height - 10);
        }
        var colModel = self.jqGrid("getGridParam", "colModel");
        var colNames = self.jqGrid("getGridParam", "colNames");
        var colMap = {}, fixedCols = [];

        select.empty();
        $.each(colModel, function(i) {
            colMap[this.name] = i;
            if (this.hidedlg) {
                if (!this.hidden) {
                    fixedCols.push(i);
                }
                return;
            }

            select.append("<option value='"+i+"' "+
                          (this.hidden?"":"selected='selected'")+">"+colNames[i]+"</option>");
        });
        function call(fn, obj) {
            if (!fn) return;
            if (typeof fn == 'string') {
                if ($.fn[fn]) {
                    $.fn[fn].apply(obj, $.makeArray(arguments).slice(2));
                }
            } else if ($.isFunction(fn)) {
                fn.apply(obj, $.makeArray(arguments).slice(2));
            }
        }

        var dopts = $.isFunction(opts.dlog_opts) ? opts.dlog_opts.call(self, opts) : opts.dlog_opts;
        call(opts.dlog, selector, dopts);
        var mopts = $.isFunction(opts.msel_opts) ? opts.msel_opts.call(self, opts) : opts.msel_opts;
        call(opts.msel, select, opts.msel_opts);
    }
})
})(jQuery);;(function($){
/**
 * jqGrid extension
 * Paul Tiseo ptiseo@wasteconsultants.com
 *
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
**/
$.jgrid.extend({
    getPostData : function(){
        var $t = this[0];
        if(!$t.grid) { return; }
        return $t.p.postData;
    },
    setPostData : function( newdata ) {
        var $t = this[0];
        if(!$t.grid) { return; }
        // check if newdata is correct type
        if ( typeof(newdata) === 'object' ) {
            $t.p.postData = newdata;
        }
        else {
            alert("Error: cannot add a non-object postData value. postData unchanged.");
        }
    },
    appendPostData : function( newdata ) {
        var $t = this[0];
        if(!$t.grid) { return; }
        // check if newdata is correct type
        if ( typeof(newdata) === 'object' ) {
            $.extend($t.p.postData, newdata);
        }
        else {
            alert("Error: cannot append a non-object postData value. postData unchanged.");
        }
    },
    setPostDataItem : function( key, val ) {
        var $t = this[0];
        if(!$t.grid) { return; }
        $t.p.postData[key] = val;
    },
    getPostDataItem : function( key ) {
        var $t = this[0];
        if(!$t.grid) { return; }
        return $t.p.postData[key];
    },
    removePostDataItem : function( key ) {
        var $t = this[0];
        if(!$t.grid) { return; }
        delete $t.p.postData[key];
    },
    getUserData : function(){
        var $t = this[0];
        if(!$t.grid) { return; }
        return $t.p.userData;
    },
    getUserDataItem : function( key ) {
        var $t = this[0];
        if(!$t.grid) { return; }
        return $t.p.userData[key];
    }
});
})(jQuery);;(function($){
/**
 * jqGrid extension for manipulating columns properties
 * Piotr Roznicki roznicki@o2.pl
 * http://www.roznicki.prv.pl
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
**/
$.jgrid.extend({
    setColumns : function(p) {
        p = $.extend({
            top : 0,
            left: 0,
            width: 200,
            height: 'auto',
            dataheight: 'auto',
            modal: false,
            drag: true,
            beforeShowForm: null,
            afterShowForm: null,
            afterSubmitForm: null,
            closeOnEscape : true,
            ShrinkToFit : false,
            jqModal : false,
            saveicon: [true,"left","ui-icon-disk"],
            closeicon: [true,"left","ui-icon-close"],
            onClose : null,
            colnameview : true,
            closeAfterSubmit : true,
            updateAfterCheck : false
        }, $.jgrid.col, p ||{});
        return this.each(function(){
            var $t = this;
            if (!$t.grid ) { return; }
            var onBeforeShow = typeof p.beforeShowForm === 'function' ? true: false;
            var onAfterShow = typeof p.afterShowForm === 'function' ? true: false;
            var onAfterSubmit = typeof p.afterSubmitForm === 'function' ? true: false;
            if(!p.imgpath) { p.imgpath= $t.p.imgpath; } // Added From Tony Tomov
            var gID = $t.p.id,
            dtbl = "ColTbl_"+gID,
            IDs = {themodal:'colmod'+gID,modalhead:'colhd'+gID,modalcontent:'colcnt'+gID, scrollelm: dtbl};
            if ( $("#"+IDs.themodal).html() != null ) {
                if(onBeforeShow) { p.beforeShowForm($("#"+dtbl)); }
                viewModal("#"+IDs.themodal,{gbox:"#gbox_"+gID,jqm:p.jqModal, jqM:false, modal:p.modal});
                if(onAfterShow) { p.afterShowForm($("#"+dtbl)); }
            } else {
                var dh = isNaN(p.dataheight) ? p.dataheight : p.dataheight+"px";
                var formdata = "<div id='"+dtbl+"' class='formdata' style='width:100%;overflow:auto;position:relative;height:"+dh+";'>";
                formdata += "<table class='ColTable' cellspacing='1' cellpading='2' border='0'><tbody>";
                for(i=0;i<this.p.colNames.length;i++){
                    if(!$t.p.colModel[i].hidedlg) { // added from T. Tomov
                        formdata += "<tr><td style='white-space: pre;'><input type='checkbox' style='margin-right:5px;' id='col_" + this.p.colModel[i].name + "' class='cbox' value='T' " +
                        ((this.p.colModel[i].hidden===false)?"checked":"") + "/>" +  "<label for='col_" + this.p.colModel[i].name + "'>" + this.p.colNames[i] + ((p.colnameview) ? " (" + this.p.colModel[i].name + ")" : "" )+ "</label></td></tr>";
                    }
                }
                formdata += "</tbody></table></div>"
                var bS  = !p.updateAfterCheck ? "<a href='javascript:void(0)' id='dData' class='fm-button ui-state-default ui-corner-all'>"+p.bSubmit+"</a>" : "",
                bC  ="<a href='javascript:void(0)' id='eData' class='fm-button ui-state-default ui-corner-all'>"+p.bCancel+"</a>";
                formdata += "<table border='0' class='EditTable' id='"+dtbl+"_2'><tbody><tr style='display:block;height:3px;'><td></td></tr><tr><td class='DataTD ui-widget-content'></td></tr><tr><td class='ColButton EditButton'>"+bS+"&nbsp;"+bC+"</td></tr></tbody></table>";
                p.gbox = "#gbox_"+gID;
                createModal(IDs,formdata,p,"#gview_"+$t.p.id,$("#gview_"+$t.p.id)[0]);
                if(p.saveicon[0]==true) {
                    $("#dData","#"+dtbl+"_2").addClass(p.saveicon[1] == "right" ? 'fm-button-icon-right' : 'fm-button-icon-left')
                    .append("<span class='ui-icon "+p.saveicon[2]+"'></span>");
                }
                if(p.closeicon[0]==true) {
                    $("#eData","#"+dtbl+"_2").addClass(p.closeicon[1] == "right" ? 'fm-button-icon-right' : 'fm-button-icon-left')
                    .append("<span class='ui-icon "+p.closeicon[2]+"'></span>");
                }
                if(!p.updateAfterCheck) {
                    $("#dData","#"+dtbl+"_2").click(function(e){
                        for(i=0;i<$t.p.colModel.length;i++){
                            if(!$t.p.colModel[i].hidedlg) { // added from T. Tomov
                                var nm = $t.p.colModel[i].name.replace(".", "\\.");
                                if($("#col_" + nm,"#"+dtbl).attr("checked")) {
                                    $($t).jqGrid("showCol",$t.p.colModel[i].name);
                                    $("#col_" + nm,"#"+dtbl).attr("defaultChecked",true); // Added from T. Tomov IE BUG
                                } else {
                                    $($t).jqGrid("hideCol",$t.p.colModel[i].name);
                                    $("#col_" + nm,"#"+dtbl).attr("defaultChecked",""); // Added from T. Tomov IE BUG
                                }
                            }
                        }
                        if(p.ShrinkToFit===true) {
                            $($t).jqGrid("setGridWidth",$t.grid.width-0.001,true);
                        }
                        if(p.closeAfterSubmit) hideModal("#"+IDs.themodal,{gb:"#gbox_"+gID,jqm:p.jqModal, onClose: p.onClose});
                        if (onAfterSubmit) { p.afterSubmitForm($("#"+dtbl)); }
                        return false;
                    });
                } else {
                    $(":input","#"+dtbl).click(function(e){
                        var cn = this.id.substr(4);
                        if(cn){
                            if(this.checked) {
                                $($t).jqGrid("showCol",cn);
                            } else {
                                $($t).jqGrid("hideCol",cn);
                            }
                            if(p.ShrinkToFit===true) {
                                $($t).jqGrid("setGridWidth",$t.grid.width-0.001,true);
                            }
                        }
                        return this;
                    });
                }
                $("#eData", "#"+dtbl+"_2").click(function(e){
                    hideModal("#"+IDs.themodal,{gb:"#gbox_"+gID,jqm:p.jqModal, onClose: p.onClose});
                    return false;
                });
                $("#dData, #eData","#"+dtbl+"_2").hover(
                   function(){$(this).addClass('ui-state-hover');},
                   function(){$(this).removeClass('ui-state-hover');}
                );
                if(onBeforeShow) { p.beforeShowForm($("#"+dtbl)); }
                viewModal("#"+IDs.themodal,{gbox:"#gbox_"+gID,jqm:p.jqModal, jqM: true, modal:p.modal});
                if(onAfterShow) { p.afterShowForm($("#"+dtbl)); }
            }
        });
    }
});
})(jQuery);;(function($){
/**
 * jqGrid extension for SubGrid Data
 * Tony Tomov tony@trirand.com
 * http://trirand.com/blog/
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
**/
$.jgrid.extend({
setSubGrid : function () {
    return this.each(function (){
        var $t = this, cm;
        $t.p.colNames.unshift("");
        $t.p.colModel.unshift({name:'subgrid',width: $.browser.safari ?  $t.p.subGridWidth+$t.p.cellLayout : $t.p.subGridWidth,sortable: false,resizable:false,hidedlg:true,search:false});
        cm = $t.p.subGridModel;
        if(cm[0]) {
            cm[0].align = $.extend([],cm[0].align || []);
            for(i=0;i<cm[0].name.length;i++) { cm[0].align[i] = cm[0].align[i] || 'left';}
        }
    });
},
addSubGridCell :function (pos,iRow) {
    var prp='',gv;
    this.each(function(){
        prp = this.formatCol(pos,iRow);
        gv = this.p.gridview;
    });
    if( gv === false ){
        return "<td role='grid' class='ui-sgcollapsed sgcollapsed' "+prp+"><a href='javascript:void(0);'><span class='ui-icon ui-icon-plus'></span></a></td>";
    } else  {
        return "<td role='grid' " +prp +"></td>";
    }
},
addSubGrid : function(t,pos) {
    return this.each(function(){
        var ts = this;
        if (!ts.grid ) { return; }
        var res,_id, pID,atd, nhc, subdata, bfsc;
        $("td:eq("+pos+")",t).click( function(e) {
            if($(this).hasClass("sgcollapsed")) {
                pID = ts.p.id;
                res = $(this).parent();
                atd = pos >=1 ? "<td colspan='"+pos+"'>&nbsp;</td>":"";
                _id = $(res).attr("id");
                bfsc =true;
                if($.isFunction(ts.p.subGridBeforeExpand)) {
                    bfsc = ts.p.subGridBeforeExpand(pID+"_"+_id,_id);
                }
                if(bfsc === false) {return false;}
                nhc = 0;
                $.each(ts.p.colModel,function(i,v){
                    if(this.hidden === true || this.name == 'rn' || this.name == 'cb') {nhc++;}
                });
                subdata = "<tr role='row' class='ui-subgrid'>"+atd+"<td><span class='ui-icon ui-icon-carat-1-sw'/></td><td colspan='"+parseInt(ts.p.colNames.length-1-nhc)+"' class='ui-widget-content subgrid-data'><div id="+pID+"_"+_id+" class='tablediv'>";
                $(this).parent().after( subdata+ "</div></td></tr>" );
                if( $.isFunction(ts.p.subGridRowExpanded)) {
                    ts.p.subGridRowExpanded(pID+"_"+ _id,_id);
                } else {
                    populatesubgrid(res);
                }
                $(this).html("<a href='javascript:void(0);'><span class='ui-icon ui-icon-minus'></span></a>").removeClass("sgcollapsed").addClass("sgexpanded");
            } else if($(this).hasClass("sgexpanded")) {
                bfsc = true;
                if( $.isFunction(ts.p.subGridRowColapsed)) {
                    res = $(this).parent();
                    _id = $(res).attr("id");
                    bfsc = ts.p.subGridRowColapsed(pID+"_"+_id,_id );
                };
                if(bfsc===false) {return false;}
                $(this).parent().next().remove(".ui-subgrid");
                $(this).html("<a href='javascript:void(0);'><span class='ui-icon ui-icon-plus'></span></a>").removeClass("sgexpanded").addClass("sgcollapsed");
            }
            return false;
        });
        //-------------------------
        var populatesubgrid = function( rd ) {
            var res,sid,dp, i, j;
            sid = $(rd).attr("id");
            dp = {id:sid, nd_: (new Date().getTime())};
            if(!ts.p.subGridModel[0]) { return false; }
            if(ts.p.subGridModel[0].params) {
                for(j=0; j < ts.p.subGridModel[0].params.length; j++) {
                    for(i=0; i<ts.p.colModel.length; i++) {
                        if(ts.p.colModel[i].name == ts.p.subGridModel[0].params[j]) {
                            dp[ts.p.colModel[i].name]= $("td:eq("+i+")",rd).text().replace(/\&nbsp\;/ig,'');
                        }
                    }
                }
            }
            if(!ts.grid.hDiv.loading) {
                ts.grid.hDiv.loading = true;
                $("#load_"+ts.p.id).show();
                if(!ts.p.subgridtype) ts.p.subgridtype = ts.p.datatype;
                if($.isFunction(ts.p.subgridtype)) {ts.p.subgridtype(dp);}
                switch(ts.p.subgridtype) {
                    case "xml":
                    $.ajax({type:ts.p.mtype, url: ts.p.subGridUrl, dataType:"xml",data: dp, complete: function(sxml) { subGridXml(sxml.responseXML, sid); sxml=null; } });
                    break;
                    case "json":
                    $.ajax({type:ts.p.mtype, url: ts.p.subGridUrl, dataType:"text",data: dp, complete: function(json) { subGridJson($.jgrid.parse(json.responseText),sid); json = null;} });
                    break;
                }
            }
            return false;
        };
        var subGridCell = function(trdiv,cell,pos){
            var tddiv = $("<td align='"+ts.p.subGridModel[0].align[pos]+"'></td>").html(cell);
            $(trdiv).append(tddiv);
        };
        var subGridXml = function(sjxml, sbid){
            var tddiv, i, cur, sgmap,
            dummy = $("<table cellspacing='0' cellpadding='0' border='0'><tbody></tbody></table>"),
            trdiv = $("<tr></tr>");
            for (i = 0; i<ts.p.subGridModel[0].name.length; i++) {
                tddiv = $("<th class='ui-state-default ui-th-column'></th>");
                $(tddiv).html(ts.p.subGridModel[0].name[i]);
                $(tddiv).width( ts.p.subGridModel[0].width[i]);
                $(trdiv).append(tddiv);
            }
            $(dummy).append(trdiv);
            if (sjxml){
                sgmap = ts.p.xmlReader.subgrid;
                $(sgmap.root+" "+sgmap.row, sjxml).each( function(){
                    trdiv = $("<tr class='ui-widget-content ui-subtblcell'></tr>");
                    if(sgmap.repeatitems === true) {
                        $(sgmap.cell,this).each( function(i) {
                            subGridCell(trdiv, $(this).text() || '&nbsp;',i);
                        });
                    } else {
                        var f = ts.p.subGridModel[0].mapping || ts.p.subGridModel[0].name;
                        if (f) {
                            for (i=0;i<f.length;i++) {
                                subGridCell(trdiv, $(f[i],this).text() || '&nbsp;',i);
                            }
                        }
                    }
                    $(dummy).append(trdiv);
                });
            }
            var pID = $("table:first",ts.grid.bDiv).attr("id")+"_";
            $("#"+pID+sbid).append(dummy);
            ts.grid.hDiv.loading = false;
            $("#load_"+ts.p.id).hide();
            return false;
        };
        var subGridJson = function(sjxml, sbid){
            var tddiv,result , i,cur, sgmap,
            dummy = $("<table cellspacing='0' cellpadding='0' border='0'><tbody></tbody></table>"),
            trdiv = $("<tr></tr>");
            for (i = 0; i<ts.p.subGridModel[0].name.length; i++) {
                tddiv = $("<th class='ui-state-default ui-th-column'></th>");
                $(tddiv).html(ts.p.subGridModel[0].name[i]);
                $(tddiv).width( ts.p.subGridModel[0].width[i]);
                $(trdiv).append(tddiv);
            }
            $(dummy).append(trdiv);
            if (sjxml){
                sgmap = ts.p.jsonReader.subgrid;
                result = sjxml[sgmap.root];
                if ( typeof result !== 'undefined' ) {
                    for (i=0;i<result.length;i++) {
                        cur = result[i];
                        trdiv = $("<tr class='ui-widget-content ui-subtblcell'></tr>");
                        if(sgmap.repeatitems === true) {
                            if(sgmap.cell) { cur=cur[sgmap.cell]; }
                            for (var j=0;j<cur.length;j++) {
                                subGridCell(trdiv, cur[j] || '&nbsp;',j);
                            }
                        } else {
                            var f = ts.p.subGridModel[0].mapping || ts.p.subGridModel[0].name;
                            if(f.length) {
                                for (var j=0;j<f.length;j++) {
                                    subGridCell(trdiv, cur[f[j]] || '&nbsp;',j);
                                }
                            }
                        }
                        $(dummy).append(trdiv);
                    }
                }
            }
            var pID = $("table:first",ts.grid.bDiv).attr("id")+"_";
            $("#"+pID+sbid).append(dummy);
            ts.grid.hDiv.loading = false;
            $("#load_"+ts.p.id).hide();
            return false;
        };
        ts.subGridXml = function(xml,sid) {subGridXml(xml,sid);};
        ts.subGridJson = function(json,sid) {subGridJson(json,sid);};
    });
},
expandSubGridRow : function(rowid) {
    return this.each(function () {
        var $t = this;
        if(!$t.grid && !rowid) {return;}
        if($t.p.subGrid===true) {
            var rc = $(this).jqGrid("getInd",rowid,true);
            if(rc) {
                var sgc = $("td.sgcollapsed",rc)[0];
                if(sgc) {
                    $(sgc).trigger("click");
                }
            }
        }
    });
},
collapseSubGridRow : function(rowid) {
    return this.each(function () {
        var $t = this;
        if(!$t.grid && !rowid) {return;}
        if($t.p.subGrid===true) {
            var rc = $(this).jqGrid("getInd",rowid,true);
            if(rc) {
                var sgc = $("td.sgexpanded",rc)[0];
                if(sgc) {
                    $(sgc).trigger("click");
                }
            }
        }
    });
},
toggleSubGridRow : function(rowid) {
    return this.each(function () {
        var $t = this;
        if(!$t.grid && !rowid) {return;}
        if($t.p.subGrid===true) {
            var rc = $(this).jqGrid("getInd",rowid,true);
            if(rc) {
                var sgc = $("td.sgcollapsed",rc)[0];
                if(sgc) {
                    $(sgc).trigger("click");
                } else {
                    sgc = $("td.sgexpanded",rc)[0];
                    if(sgc) {
                        $(sgc).trigger("click");
                    }
                }
            }
        }
    });
}
});
})(jQuery);
/*
 Transform a table to a jqGrid.
 Peter Romianowski <peter.romianowski@optivo.de>
 If the first column of the table contains checkboxes or
 radiobuttons then the jqGrid is made selectable.
*/
// Addition - selector can be a class or id
function tableToGrid(selector, options) {
$(selector).each(function() {
    if(this.grid) {return;} //Adedd from Tony Tomov
    // This is a small "hack" to make the width of the jqGrid 100%
    $(this).width("99%");
    var w = $(this).width();

    // Text whether we have single or multi select
    var inputCheckbox = $('input[type=checkbox]:first', $(this));
    var inputRadio = $('input[type=radio]:first', $(this));
    var selectMultiple = inputCheckbox.length > 0;
    var selectSingle = !selectMultiple && inputRadio.length > 0;
    var selectable = selectMultiple || selectSingle;
    var inputName = inputCheckbox.attr("name") || inputRadio.attr("name");

    // Build up the columnModel and the data
    var colModel = [];
    var colNames = [];
    $('th', $(this)).each(function() {
        if (colModel.length == 0 && selectable) {
            colModel.push({
                name: '__selection__',
                index: '__selection__',
                width: 0,
                hidden: true
            });
            colNames.push('__selection__');
        } else {
            colModel.push({
                name: $(this).attr("id") || $(this).html(),
                index: $(this).attr("id") || $(this).html(),
                width: $(this).width() || 150
            });
            colNames.push($(this).html());
        }
    });
    var data = [];
    var rowIds = [];
    var rowChecked = [];
    $('tbody > tr', $(this)).each(function() {
        var row = {};
        var rowPos = 0;
        $('td', $(this)).each(function() {
            if (rowPos == 0 && selectable) {
                var input = $('input', $(this));
                var rowId = input.attr("value");
                rowIds.push(rowId || data.length);
                if (input.attr("checked")) {
                    rowChecked.push(rowId);
                }
                row[colModel[rowPos].name] = input.attr("value");
            } else {
                row[colModel[rowPos].name] = $(this).html();
            }
            rowPos++;
        });
        if(rowPos >0) data.push(row);
    });

    // Clear the original HTML table
    $(this).empty();

    // Mark it as jqGrid
    $(this).addClass("scroll");

    $(this).jqGrid($.extend({
        datatype: "local",
        width: w,
        colNames: colNames,
        colModel: colModel,
        multiselect: selectMultiple
        //inputName: inputName,
        //inputValueCol: imputName != null ? "__selection__" : null
    }, options || {}));

    // Add data
    for (var a = 0; a < data.length; a++) {
        var id = null;
        if (rowIds.length > 0) {
            id = rowIds[a];
            if (id && id.replace) {
                // We have to do this since the value of a checkbox
                // or radio button can be anything
                id = encodeURIComponent(id).replace(/[.\-%]/g, "_");
            }
        }
        if (id == null) {
            id = a + 1;
        }
        $(this).jqGrid("addRowData",id, data[a]);
    }

    // Set the selection
    for (var a = 0; a < rowChecked.length; a++) {
        $(this).jqGrid("setSelection",rowChecked[a]);
    }
});
};
;(function($) {
/*
**
 * jqGrid extension - Tree Grid
 * Tony Tomov tony@trirand.com
 * http://trirand.com/blog/
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
**/
$.jgrid.extend({
    setTreeNode : function(rd, row){
        return this.each(function(){
            var $t = this;
            if( !$t.grid || !$t.p.treeGrid ) { return; }
            var expCol = $t.p.expColInd;
            var expanded = $t.p.treeReader.expanded_field;
            var isLeaf = $t.p.treeReader.leaf_field;
            var level = $t.p.treeReader.level_field;
            row.level = rd[level];

            if($t.p.treeGridModel == 'nested') {
                row.lft = rd[$t.p.treeReader.left_field];
                row.rgt = rd[$t.p.treeReader.right_field];
                if(!rd[isLeaf]) {
                // NS Model
                    rd[isLeaf] = (parseInt(row.rgt,10) === parseInt(row.lft,10)+1) ? 'true' : 'false';
                }
            } else {
                row.parent_id = rd[$t.p.treeReader.parent_id_field];
            }
            var curLevel = parseInt(row.level,10), ident,lftpos;
            if($t.p.tree_root_level === 0) {
                ident = curLevel+1;
                lftpos = curLevel;
            } else {
                ident = curLevel;
                lftpos = curLevel -1;
            }
            var twrap = "<div class='tree-wrap' style='width:"+(ident*18)+"px;'>";
            twrap += "<div style='left:"+(lftpos*18)+"px;' class='ui-icon ";

            if(rd[isLeaf] == "true" || rd[isLeaf] ==true) {
                twrap += $t.p.treeIcons.leaf+" tree-leaf'";
                row.isLeaf = true;
            } else {
                if(rd[expanded] == "true" || rd[expanded] == true) {
                    twrap += $t.p.treeIcons.minus+" tree-minus treeclick'";
                    row.expanded = true;
                } else {
                    twrap += $t.p.treeIcons.plus+" tree-plus treeclick'";
                    row.expanded = false;
                }
                row.isLeaf = false;
            }
            twrap += "</div></div>";
            if(parseInt(rd[level],10) !== parseInt($t.p.tree_root_level,10)) {
                if(!$($t).jqGrid("isVisibleNode",row)){
                    $(row).css("display","none");
                }
            }
            $("td:eq("+expCol+")",row).wrapInner("<span></span>").prepend(twrap);
            $(".treeclick",row).bind("click",function(e){
                var target = e.target || e.srcElement;
                var ind =$(target,$t.rows).parents("tr.jqgrow")[0].rowIndex;
                if(!$t.rows[ind].isLeaf){
                    if($t.rows[ind].expanded){
                        $($t).jqGrid("collapseRow",$t.rows[ind]);
                        $($t).jqGrid("collapseNode",$t.rows[ind]);
                    } else {
                        $($t).jqGrid("expandRow",$t.rows[ind]);
                        $($t).jqGrid("expandNode",$t.rows[ind]);
                    }
                }
                return false;
            });
            if($t.p.ExpandColClick === true) {
            $("span", row).css("cursor","pointer").bind("click",function(e){
                var target = e.target || e.srcElement;
                var ind =$(target,$t.rows).parents("tr.jqgrow")[0].rowIndex;
                if(!$t.rows[ind].isLeaf){
                    if($t.rows[ind].expanded){
                        $($t).jqGrid("collapseRow",$t.rows[ind]);
                        $($t).jqGrid("collapseNode",$t.rows[ind]);
                    } else {
                        $($t).jqGrid("expandRow",$t.rows[ind]);
                        $($t).jqGrid("expandNode",$t.rows[ind]);
                    }
                }
                $($t).jqGrid("setSelection",$t.rows[ind].id);
                return false;
            });
            }
        });
    },
    setTreeGrid : function() {
        return this.each(function (){
            var $t = this, i=0;
            if(!$t.p.treeGrid) { return; }
            if(!$t.p.treedatatype ) $.extend($t.p,{treedatatype: $t.p.datatype});
            $t.p.subGrid = false; $t.p.altRows =false;
            $t.p.pgbuttons = false; $t.p.pginput = false;
            $t.p.multiselect = false; $t.p.rowList = [];
            $t.p.treeIcons = $.extend({plus:'ui-icon-triangle-1-e',minus:'ui-icon-triangle-1-s',leaf:'ui-icon-radio-off'},$t.p.treeIcons || {});
            if($t.p.treeGridModel == 'nested') {
                $t.p.treeReader = $.extend({
                    level_field: "level",
                    left_field:"lft",
                    right_field: "rgt",
                    leaf_field: "isLeaf",
                    expanded_field: "expanded"
                },$t.p.treeReader);
            } else
                if($t.p.treeGridModel == 'adjacency') {
                $t.p.treeReader = $.extend({
                        level_field: "level",
                        parent_id_field: "parent",
                        leaf_field: "isLeaf",
                        expanded_field: "expanded"
                },$t.p.treeReader );
            }
            for (var key in $t.p.colModel){
                if($t.p.colModel[key].name == $t.p.ExpandColumn) {
                    $t.p.expColInd = i;
                    break;
                }
                i++;
            }
            if(!$t.p.expColInd) $t.p.expColInd =0;
            $.each($t.p.treeReader,function(i,n){
                if(n){
                    $t.p.colNames.push(n);
                    $t.p.colModel.push({name:n,width:1,hidden:true,sortable:false,resizable:false,hidedlg:true,editable:true,search:false});
                }
            });
        });
    },
    expandRow: function (record){
        this.each(function(){
            var $t = this;
            if(!$t.grid || !$t.p.treeGrid) { return; }
            var childern = $($t).jqGrid("getNodeChildren",record);
            //if ($($t).jqGrid("isVisibleNode",record)) {
            $(childern).each(function(i){
                $(this).css("display","");
                if(this.expanded) {
                    $($t).jqGrid("expandRow",this);
                }
            });
            //}
        });
    },
    collapseRow : function (record) {
        this.each(function(){
            var $t = this;
            if(!$t.grid || !$t.p.treeGrid) { return; }
            var childern = $($t).jqGrid("getNodeChildren",record);
            $(childern).each(function(i){
                $(this).css("display","none");
                $($t).jqGrid("collapseRow",this);
            });
        });
    },
    // NS ,adjacency models
    getRootNodes : function() {
        var result = [];
        this.each(function(){
            var $t = this;
            if(!$t.grid || !$t.p.treeGrid) { return; }
            switch ($t.p.treeGridModel) {
                case 'nested' :
                    var level = $t.p.treeReader.level_field;
                    $($t.rows).each(function(i){
                        if(parseInt(this[level],10) === parseInt($t.p.tree_root_level,10)) {
                            result.push(this);
                        }
                    });
                    break;
                case 'adjacency' :
                    $($t.rows).each(function(i){
                        if(this.parent_id == null || this.parent_id.toLowerCase() == "null") {
                            result.push(this);
                        }
                    });
                    break;
            }
        });
        return result;
    },
    getNodeDepth : function(rc) {
        var ret = null;
        this.each(function(){
            var $t = this;
            if(!this.grid || !this.p.treeGrid) { return; }
            switch ($t.p.treeGridModel) {
                case 'nested' :
                    ret = parseInt(rc.level,10) - parseInt(this.p.tree_root_level,10);
                    break;
                case 'adjacency' :
                    ret = $($t).jqGrid("getNodeAncestors",rc).length;
                    break;
            }
        });
        return ret;
    },
    getNodeParent : function(rc) {
        var result = null;
        this.each(function(){
            var $t = this;
            if(!$t.grid || !$t.p.treeGrid) { return; }
            switch ($t.p.treeGridModel) {
                case 'nested' :
                    var lft = parseInt(rc.lft,10), rgt = parseInt(rc.rgt,10), level = parseInt(rc.level,10);
                    $(this.rows).each(function(){
                        if(parseInt(this.level,10) === level-1 && parseInt(this.lft) < lft && parseInt(this.rgt) > rgt) {
                            result = this;
                            return false;
                        }
                    });
                    break;
                case 'adjacency' :
                    $(this.rows).each(function(){
                        if(this.id == rc.parent_id ) {
                            result = this;
                            return false;
                        }
                    });
                    break;
            }
        });
        return result;
    },
    getNodeChildren : function(rc) {
        var result = [];
        this.each(function(){
            var $t = this;
            if(!$t.grid || !$t.p.treeGrid) { return; }
            switch ($t.p.treeGridModel) {
                case 'nested' :
                    var lft = parseInt(rc.lft,10), rgt = parseInt(rc.rgt,10), level = parseInt(rc.level,10);
                    $(this.rows).each(function(i){
                        if(parseInt(this.level,10) === level+1 && parseInt(this.lft,10) > lft && parseInt(this.rgt,10) < rgt) {
                            result.push(this);
                        }
                    });
                    break;
                case 'adjacency' :
                    $(this.rows).each(function(i){
                        if(this.parent_id == rc.id) {
                            result.push(this);
                        }
                    });
                    break;
            }
        });
        return result;
    },
    getFullTreeNode : function(rc) {
        var result = [];
        this.each(function(){
            var $t = this;
            if(!$t.grid || !$t.p.treeGrid) { return; }
            switch ($t.p.treeGridModel) {
                case 'nested' :
                    var lft = parseInt(rc.lft,10), rgt = parseInt(rc.rgt,10), level = parseInt(rc.level,10);
                    $(this.rows).each(function(i){
                        if(parseInt(this.level,10) >= level && parseInt(this.lft,10) >= lft && parseInt(this.lft,10) <= rgt) {
                            result.push(this);
                        }
                    });
                    break;
                case 'adjacency' :
                    result.push(rc);
                    $(this.rows).each(function(i){
                        len = result.length;
                        for (i = 0; i < len; i++) {
                            if (result[i].id == this.parent_id) {
                                result.push(this);
                                break;
                            }
                        }
                    });
                    break;
            }
        });
        return result;
    },
    // End NS, adjacency Model
    getNodeAncestors : function(rc) {
        var ancestors = [];
        this.each(function(){
            if(!this.grid || !this.p.treeGrid) { return; }
            var parent = $(this).jqGrid("getNodeParent",rc);
            while (parent) {
                ancestors.push(parent);
                parent = $(this).jqGrid("getNodeParent",parent);
            }
        });
        return ancestors;
    },
    isVisibleNode : function(rc) {
        var result = true;
        this.each(function(){
            var $t = this;
            if(!$t.grid || !$t.p.treeGrid) { return; }
            var ancestors = $($t).jqGrid("getNodeAncestors",rc);
            $(ancestors).each(function(){
                result = result && this.expanded;
                if(!result) {return false;}
            });
        });
        return result;
    },
    isNodeLoaded : function(rc) {
        var result;
        this.each(function(){
            var $t = this;
            if(!$t.grid || !$t.p.treeGrid) { return; }
            if(rc.loaded !== undefined) {
                result = rc.loaded;
            } else if( rc.isLeaf || $($t).jqGrid("getNodeChildren",rc).length > 0){
                result = true;
            } else {
                result = false;
            }
        });
        return result;
    },
    expandNode : function(rc) {
        return this.each(function(){
            if(!this.grid || !this.p.treeGrid) { return; }
            if(!rc.expanded) {
                if( $(this).jqGrid("isNodeLoaded",rc) ) {
                    rc.expanded = true;
                    $("div.treeclick",rc).removeClass(this.p.treeIcons.plus+" tree-plus").addClass(this.p.treeIcons.minus+" tree-minus");
                } else {
                    rc.expanded = true;
                    $("div.treeclick",rc).removeClass(this.p.treeIcons.plus+" tree-plus").addClass(this.p.treeIcons.minus+" tree-minus");
                    this.p.treeANode = rc.rowIndex;
                    this.p.datatype = this.p.treedatatype;
                    if(this.p.treeGridModel == 'nested') {
                        $(this).jqGrid("setGridParam",{postData:{nodeid:rc.id,n_left:rc.lft,n_right:rc.rgt,n_level:rc.level}});
                    } else {
                        $(this).jqGrid("setGridParam",{postData:{nodeid:rc.id,parentid:rc.parent_id,n_level:rc.level}});
                    }
                    $(this).trigger("reloadGrid");
                    if(this.p.treeGridModel == 'nested') {
                        $(this).jqGrid("setGridParam",{postData:{nodeid:'',n_left:'',n_right:'',n_level:''}});
                    } else {
                        $(this).jqGrid("setGridParam",{postData:{nodeid:'',parentid:'',n_level:''}});
                    }
                }
            }
        });
    },
    collapseNode : function(rc) {
        return this.each(function(){
            if(!this.grid || !this.p.treeGrid) { return; }
            if(rc.expanded) {
                rc.expanded = false;
                $("div.treeclick",rc).removeClass(this.p.treeIcons.minus+" tree-minus").addClass(this.p.treeIcons.plus+" tree-plus");
            }
        });
    },
    SortTree : function( newDir) {
        return this.each(function(){
            if(!this.grid || !this.p.treeGrid) { return; }
            var i, len,
            rec, records = [], $t = this,
            roots = $(this).jqGrid("getRootNodes");
            // Sorting roots
            roots.sort(function(a, b) {
                if (a.sortKey < b.sortKey) {return -newDir;}
                if (a.sortKey > b.sortKey) {return newDir;}
                return 0;
            });
            if(roots[0]){
                $("td",roots[0]).each( function( k ) {
                    $(this).css("width",$t.grid.headers[k].width+"px");
                });
                $t.grid.cols = roots[0].cells;
            }
            // Sorting children
            for (i = 0, len = roots.length; i < len; i++) {
                rec = roots[i];
                records.push(rec);
                $(this).jqGrid("collectChildrenSortTree",records, rec, newDir);
            }
            $.each(records, function(index, row) {
                $('tbody',$t.grid.bDiv).append(row);
                row.sortKey = null;
            });
        });
    },
    collectChildrenSortTree : function(records, rec, newDir) {
        return this.each(function(){
            if(!this.grid || !this.p.treeGrid) { return; }
            var i, len,
            child,
            children = $(this).jqGrid("getNodeChildren",rec);
            children.sort(function(a, b) {
                if (a.sortKey < b.sortKey) {return -newDir;}
                if (a.sortKey > b.sortKey) {return newDir;}
                return 0;
            });
            for (i = 0, len = children.length; i < len; i++) {
                child = children[i];
                records.push(child);
                $(this).jqGrid("collectChildrenSortTree",records, child,newDir);
            }
        });
    },
    // experimental
    setTreeRow : function(rowid, data) {
        var nm, success=false;
        this.each(function(){
            var t = this;
            if(!t.grid || !t.p.treeGrid) { return; }
            success = $(t).jqGrid("setRowData",rowid,data);
        });
        return success;
    },
    delTreeNode : function (rowid) {
        return this.each(function () {
            var $t = this;
            if(!$t.grid || !$t.p.treeGrid) { return; }
            var rc = $($t).jqGrid("getInd",rowid,true);
            if (rc) {
                var dr = $($t).jqGrid("getNodeChildren",rc);
                if(dr.length>0){
                    for (var i=0;i<dr.length;i++){
                        $($t).jqGrid("delRowData",dr[i].id);
                    }
                }
                $($t).jqGrid("delRowData",rc.id);
            }
        });
    }
});
})(jQuery);/*
 * jqDnR - Minimalistic Drag'n'Resize for jQuery.
 *
 * Copyright (c) 2007 Brice Burgess <bhb@iceburg.net>, http://www.iceburg.net
 * Licensed under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * $Version: 2007.08.19 +r2
 */

(function($){
$.fn.jqDrag=function(h){return i(this,h,'d');};
$.fn.jqResize=function(h,ar){return i(this,h,'r',ar);};
$.jqDnR={
    dnr:{},
    e:0,
    drag:function(v){
        if(M.k == 'd')E.css({left:M.X+v.pageX-M.pX,top:M.Y+v.pageY-M.pY});
        else {
            E.css({width:Math.max(v.pageX-M.pX+M.W,0),height:Math.max(v.pageY-M.pY+M.H,0)});
            if(M1){E1.css({width:Math.max(v.pageX-M1.pX+M1.W,0),height:Math.max(v.pageY-M1.pY+M1.H,0)});}
        }
        return false;
    },
    stop:function(){
        //E.css('opacity',M.o);
        $().unbind('mousemove',J.drag).unbind('mouseup',J.stop);
    }
};
var J=$.jqDnR,M=J.dnr,E=J.e,E1,
i=function(e,h,k,aR){
    return e.each(function(){
        h=(h)?$(h,e):e;
        h.bind('mousedown',{e:e,k:k},function(v){
            var d=v.data,p={};E=d.e;E1 = aR ? $(aR) : false;
            // attempt utilization of dimensions plugin to fix IE issues
            if(E.css('position') != 'relative'){try{E.position(p);}catch(e){}}
            M={
                X:p.left||f('left')||0,
                Y:p.top||f('top')||0,
                W:f('width')||E[0].scrollWidth||0,
                H:f('height')||E[0].scrollHeight||0,
                pX:v.pageX,
                pY:v.pageY,
                k:d.k
                //o:E.css('opacity')
            };
            // also resize
            if(E1 && d.k != 'd'){
                M1={
                    X:p.left||f1('left')||0,
                    Y:p.top||f1('top')||0,
                    W:E1[0].offsetWidth||f1('width')||0,
                    H:E1[0].offsetHeight||f1('height')||0,
                    pX:v.pageX,
                    pY:v.pageY,
                    k:d.k
                };
            } else {M1 = false;}
            //E.css({opacity:0.8});
            $().mousemove($.jqDnR.drag).mouseup($.jqDnR.stop);
            return false;
        });
    });
},
f=function(k){return parseInt(E.css(k))||false;};
f1=function(k){ return parseInt(E1.css(k))||false;};
})(jQuery);/*
 * jqModal - Minimalist Modaling with jQuery
 *   (http://dev.iceburg.net/jquery/jqmodal/)
 *
 * Copyright (c) 2007,2008 Brice Burgess <bhb@iceburg.net>
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * $Version: 07/06/2008 +r13
 */
(function($) {
$.fn.jqm=function(o){
var p={
overlay: 50,
closeoverlay : true,
overlayClass: 'jqmOverlay',
closeClass: 'jqmClose',
trigger: '.jqModal',
ajax: F,
ajaxText: '',
target: F,
modal: F,
toTop: F,
onShow: F,
onHide: F,
onLoad: F
};
return this.each(function(){if(this._jqm)return H[this._jqm].c=$.extend({},H[this._jqm].c,o);s++;this._jqm=s;
H[s]={c:$.extend(p,$.jqm.params,o),a:F,w:$(this).addClass('jqmID'+s),s:s};
if(p.trigger)$(this).jqmAddTrigger(p.trigger);
});};

$.fn.jqmAddClose=function(e){return hs(this,e,'jqmHide');};
$.fn.jqmAddTrigger=function(e){return hs(this,e,'jqmShow');};
$.fn.jqmShow=function(t){return this.each(function(){$.jqm.open(this._jqm,t);});};
$.fn.jqmHide=function(t){return this.each(function(){$.jqm.close(this._jqm,t)});};

$.jqm = {
hash:{},
open:function(s,t){var h=H[s],c=h.c,cc='.'+c.closeClass,z=(parseInt(h.w.css('z-index')));z=(z>0)?z:3000;var o=$('<div></div>').css({height:'100%',width:'100%',position:'fixed',left:0,top:0,'z-index':z-1,opacity:c.overlay/100});if(h.a)return F;h.t=t;h.a=true;h.w.css('z-index',z);
 if(c.modal) {if(!A[0])setTimeout(function(){L('bind');},1);A.push(s);}
 else if(c.overlay > 0) {if(c.closeoverlay) h.w.jqmAddClose(o);}
 else o=F;

 h.o=(o)?o.addClass(c.overlayClass).prependTo('body'):F;
 if(ie6){$('html,body').css({height:'100%',width:'100%'});if(o){o=o.css({position:'absolute'})[0];for(var y in {Top:1,Left:1})o.style.setExpression(y.toLowerCase(),"(_=(document.documentElement.scroll"+y+" || document.body.scroll"+y+"))+'px'");}}

 if(c.ajax) {var r=c.target||h.w,u=c.ajax;r=(typeof r == 'string')?$(r,h.w):$(r);u=(u.substr(0,1) == '@')?$(t).attr(u.substring(1)):u;
  r.html(c.ajaxText).load(u,function(){if(c.onLoad)c.onLoad.call(this,h);if(cc)h.w.jqmAddClose($(cc,h.w));e(h);});}
 else if(cc)h.w.jqmAddClose($(cc,h.w));

 if(c.toTop&&h.o)h.w.before('<span id="jqmP'+h.w[0]._jqm+'"></span>').insertAfter(h.o);
 (c.onShow)?c.onShow(h):h.w.show();e(h);return F;
},
close:function(s){var h=H[s];if(!h.a)return F;h.a=F;
 if(A[0]){A.pop();if(!A[0])L('unbind');}
 if(h.c.toTop&&h.o)$('#jqmP'+h.w[0]._jqm).after(h.w).remove();
 if(h.c.onHide)h.c.onHide(h);else{h.w.hide();if(h.o)h.o.remove();} return F;
},
params:{}};
var s=0,H=$.jqm.hash,A=[],ie6=$.browser.msie&&($.browser.version == "6.0"),F=false,
e=function(h){var i=$('<iframe src="javascript:false;document.write(\'\');" class="jqm"></iframe>').css({opacity:0});if(ie6)if(h.o)h.o.html('<p style="width:100%;height:100%"/>').prepend(i);else if(!$('iframe.jqm',h.w)[0])h.w.prepend(i); f(h);},
f=function(h){try{$(':input:visible',h.w)[0].focus();}catch(_){}},
L=function(t){$()[t]("keypress",m)[t]("keydown",m)[t]("mousedown",m);},
m=function(e){var h=H[A[A.length-1]],r=(!$(e.target).parents('.jqmID'+h.s)[0]);if(r)f(h);return !r;},
hs=function(w,t,c){return w.each(function(){var s=this._jqm;$(t).each(function() {
 if(!this[c]){this[c]=[];$(this).click(function(){for(var i in {jqmShow:1,jqmHide:1})for(var s in this[i])if(H[this[i][s]])H[this[i][s]].w[i](this);return F;});}this[c].push(s);});});};
})(jQuery);/*
**
 * formatter for values but most of the values if for jqGrid
 * Some of this was inspired and based on how YUI does the table datagrid but in jQuery fashion
 * we are trying to keep it as light as possible
 * Joshua Burnett josh@9ci.com
 * http://www.greenbill.com
 *
 * Changes from Tony Tomov tony@trirand.com
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
**/

;(function($) {
    $.fmatter = {};
    //opts can be id:row id for the row, rowdata:the data for the row, colmodel:the column model for this column
    //example {id:1234,}
    $.fn.fmatter = function(formatType, cellval, opts, rwd, act) {
        //debug(this);
        //debug(cellval);
        // build main options before element iteration
        opts = $.extend({}, $.jgrid.formatter, opts);
        return fireFormatter(formatType,cellval, opts, rwd, act);
    };
    $.fmatter.util = {
        // Taken from YAHOO utils
        NumberFormat : function(nData,opts) {
            if(!isNumber(nData)) {
                nData *= 1;
            }
            if(isNumber(nData)) {
                var bNegative = (nData < 0);
                var sOutput = nData + "";
                var sDecimalSeparator = (opts.decimalSeparator) ? opts.decimalSeparator : ".";
                var nDotIndex;
                if(isNumber(opts.decimalPlaces)) {
                    // Round to the correct decimal place
                    var nDecimalPlaces = opts.decimalPlaces;
                    var nDecimal = Math.pow(10, nDecimalPlaces);
                    sOutput = Math.round(nData*nDecimal)/nDecimal + "";
                    nDotIndex = sOutput.lastIndexOf(".");
                    if(nDecimalPlaces > 0) {
                    // Add the decimal separator
                        if(nDotIndex < 0) {
                            sOutput += sDecimalSeparator;
                            nDotIndex = sOutput.length-1;
                        }
                        // Replace the "."
                        else if(sDecimalSeparator !== "."){
                            sOutput = sOutput.replace(".",sDecimalSeparator);
                        }
                    // Add missing zeros
                        while((sOutput.length - 1 - nDotIndex) < nDecimalPlaces) {
                            sOutput += "0";
                        }
                    }
                }
                if(opts.thousandsSeparator) {
                    var sThousandsSeparator = opts.thousandsSeparator;
                    nDotIndex = sOutput.lastIndexOf(sDecimalSeparator);
                    nDotIndex = (nDotIndex > -1) ? nDotIndex : sOutput.length;
                    var sNewOutput = sOutput.substring(nDotIndex);
                    var nCount = -1;
                    for (var i=nDotIndex; i>0; i--) {
                        nCount++;
                        if ((nCount%3 === 0) && (i !== nDotIndex) && (!bNegative || (i > 1))) {
                            sNewOutput = sThousandsSeparator + sNewOutput;
                        }
                        sNewOutput = sOutput.charAt(i-1) + sNewOutput;
                    }
                    sOutput = sNewOutput;
                }
                // Prepend prefix
                sOutput = (opts.prefix) ? opts.prefix + sOutput : sOutput;
                // Append suffix
                sOutput = (opts.suffix) ? sOutput + opts.suffix : sOutput;
                return sOutput;

            } else {
                return nData;
            }
        },
        // Tony Tomov
        // PHP implementation. Sorry not all options are supported.
        // Feel free to add them if you want
        DateFormat : function (format, date, newformat, opts)  {
            var token = /\\.|[dDjlNSwzWFmMntLoYyaABgGhHisueIOPTZcrU]/g,
            timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
            timezoneClip = /[^-+\dA-Z]/g,
            pad = function (value, length) {
                value = String(value);
                length = parseInt(length) || 2;
                while (value.length < length) value = '0' + value;
                return value;
            },
            ts = {m : 1, d : 1, y : 1970, h : 0, i : 0, s : 0},
            timestamp=0, dM, k,hl,
            dateFormat=["i18n"];
            // Internationalization strings
            dateFormat["i18n"] = {
                dayNames:   opts.dayNames,
                monthNames: opts.monthNames
            };
            if( format in opts.masks ) format = opts.masks[format];
            date = date.split(/[\\\/:_;.\t\T\s-]/);
            format = format.split(/[\\\/:_;.\t\T\s-]/);
            // parsing for month names
            for(k=0,hl=format.length;k<hl;k++){
                if(format[k] == 'M') {
                    dM = $.inArray(date[k],dateFormat.i18n.monthNames);
                    if(dM !== -1 && dM < 12){date[k] = dM+1;}
                }
                if(format[k] == 'F') {
                    dM = $.inArray(date[k],dateFormat.i18n.monthNames);
                    if(dM !== -1 && dM > 11){date[k] = dM+1-12;}
                }
                ts[format[k].toLowerCase()] = parseInt(date[k],10);
            }
            ts.m = parseInt(ts.m)-1;
            var ty = ts.y;
            if (ty >= 70 && ty <= 99) ts.y = 1900+ts.y;
            else if (ty >=0 && ty <=69) ts.y= 2000+ts.y;
            timestamp = new Date(ts.y, ts.m, ts.d, ts.h, ts.i, ts.s,0);
            if( newformat in opts.masks )  {
                newformat = opts.masks[newformat];
            } else if ( !newformat ) {
                newformat = 'Y-m-d';
            }
            var
                G = timestamp.getHours(),
                i = timestamp.getMinutes(),
                j = timestamp.getDate(),
                n = timestamp.getMonth() + 1,
                o = timestamp.getTimezoneOffset(),
                s = timestamp.getSeconds(),
                u = timestamp.getMilliseconds(),
                w = timestamp.getDay(),
                Y = timestamp.getFullYear(),
                N = (w + 6) % 7 + 1,
                z = (new Date(Y, n - 1, j) - new Date(Y, 0, 1)) / 86400000,
                flags = {
                    // Day
                    d: pad(j),
                    D: dateFormat.i18n.dayNames[w],
                    j: j,
                    l: dateFormat.i18n.dayNames[w + 7],
                    N: N,
                    S: opts.S(j),
                    //j < 11 || j > 13 ? ['st', 'nd', 'rd', 'th'][Math.min((j - 1) % 10, 3)] : 'th',
                    w: w,
                    z: z,
                    // Week
                    W: N < 5 ? Math.floor((z + N - 1) / 7) + 1 : Math.floor((z + N - 1) / 7) || ((new Date(Y - 1, 0, 1).getDay() + 6) % 7 < 4 ? 53 : 52),
                    // Month
                    F: dateFormat.i18n.monthNames[n - 1 + 12],
                    m: pad(n),
                    M: dateFormat.i18n.monthNames[n - 1],
                    n: n,
                    t: '?',
                    // Year
                    L: '?',
                    o: '?',
                    Y: Y,
                    y: String(Y).substring(2),
                    // Time
                    a: G < 12 ? opts.AmPm[0] : opts.AmPm[1],
                    A: G < 12 ? opts.AmPm[2] : opts.AmPm[3],
                    B: '?',
                    g: G % 12 || 12,
                    G: G,
                    h: pad(G % 12 || 12),
                    H: pad(G),
                    i: pad(i),
                    s: pad(s),
                    u: u,
                    // Timezone
                    e: '?',
                    I: '?',
                    O: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                    P: '?',
                    T: (String(timestamp).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                    Z: '?',
                    // Full Date/Time
                    c: '?',
                    r: '?',
                    U: Math.floor(timestamp / 1000)
                };
            return newformat.replace(token, function ($0) {
                return $0 in flags ? flags[$0] : $0.substring(1);
            });
        }
    };
    $.fn.fmatter.defaultFormat = function(cellval, opts) {
        return (isValue(cellval) && cellval!=="" ) ?  cellval : opts.defaultValue ? opts.defaultValue : "&#160;";
    };
    $.fn.fmatter.email = function(cellval, opts) {
        if(!isEmpty(cellval)) {
            return "<a href=\"mailto:" + cellval + "\">" + cellval + "</a>";
        }else {
            return $.fn.fmatter.defaultFormat(cellval,opts );
        }
    };
    $.fn.fmatter.checkbox =function(cval, opts) {
        var op = $.extend({},opts.checkbox), ds;
        if(!isUndefined(opts.colModel.formatoptions)) {
            op = $.extend({},op,opts.colModel.formatoptions);
        }
        if(op.disabled===true) {ds = "disabled";} else {ds="";}
        cval=cval+""; cval=cval.toLowerCase();
        var bchk = cval.search(/(false|0|no|off)/i)<0 ? " checked='checked' " : "";
        return "<input type=\"checkbox\" " + bchk  + " value=\""+ cval+"\" offval=\"no\" "+ds+ "/>";
    },
    $.fn.fmatter.link = function(cellval, opts) {
        var op = {target:opts.target };
        var target = "";
        if(!isUndefined(opts.colModel.formatoptions)) {
            op = $.extend({},op,opts.colModel.formatoptions);
        }
        if(op.target) {target = 'target=' + op.target;}
        if(!isEmpty(cellval)) {
            return "<a "+target+" href=\"" + cellval + "\">" + cellval + "</a>";
        }else {
            return $.fn.fmatter.defaultFormat(cellval,opts);
        }
    };
    $.fn.fmatter.showlink = function(cellval, opts) {
        var op = {baseLinkUrl: opts.baseLinkUrl,showAction:opts.showAction, addParam: opts.addParam || "", target: opts.target, idName: opts.idName },
        target = "";
        if(!isUndefined(opts.colModel.formatoptions)) {
            op = $.extend({},op,opts.colModel.formatoptions);
        }
        if(op.target) {target = 'target=' + op.target;}
        idUrl = op.baseLinkUrl+op.showAction + '?'+ op.idName+'='+opts.rowId+op.addParam;
        if(isString(cellval)) { //add this one even if its blank string
            return "<a "+target+" href=\"" + idUrl + "\">" + cellval + "</a>";
        }else {
            return $.fn.fmatter.defaultFormat(cellval,opts);
        }
    };
    $.fn.fmatter.integer = function(cellval, opts) {
        var op = $.extend({},opts.integer);
        if(!isUndefined(opts.colModel.formatoptions)) {
            op = $.extend({},op,opts.colModel.formatoptions);
        }
        if(isEmpty(cellval)) {
            return op.defaultValue;
        }
        return $.fmatter.util.NumberFormat(cellval,op);
    };
    $.fn.fmatter.number = function (cellval, opts) {
        var op = $.extend({},opts.number);
        if(!isUndefined(opts.colModel.formatoptions)) {
            op = $.extend({},op,opts.colModel.formatoptions);
        }
        if(isEmpty(cellval)) {
            return op.defaultValue;
        }
        return $.fmatter.util.NumberFormat(cellval,op);
    };
    $.fn.fmatter.currency = function (cellval, opts) {
        var op = $.extend({},opts.currency);
        if(!isUndefined(opts.colModel.formatoptions)) {
            op = $.extend({},op,opts.colModel.formatoptions);
        }
        if(isEmpty(cellval)) {
            return op.defaultValue;
        }
        return $.fmatter.util.NumberFormat(cellval,op);
    };
    $.fn.fmatter.date = function (cellval, opts, act) {
        var op = $.extend({},opts.date);
        if(!isUndefined(opts.colModel.formatoptions)) {
            op = $.extend({},op,opts.colModel.formatoptions);
        }
        if(!op.reformatAfterEdit && act=='edit'){
            return $.fn.fmatter.defaultFormat(cellval, opts);
        } else if(!isEmpty(cellval)) {
            return  $.fmatter.util.DateFormat(op.srcformat,cellval,op.newformat,op);
        } else {
            return $.fn.fmatter.defaultFormat(cellval, opts);
        }
    };
    $.fn.fmatter.select = function (cellval,opts, act) {
        // jqGrid specific
        if (!cellval)  cellval = "";
        var oSelect = false;
        if(!isUndefined(opts.colModel.editoptions)){
            oSelect= opts.colModel.editoptions.value;
        }
        if (oSelect) {
            var ret = [],
            msl =  opts.colModel.editoptions.multiple === true ? true : false,
            scell = [], sv;
            if(msl) { scell = cellval.split(","); scell = $.map(scell,function(n){return $.trim(n);})}
            if (isString(oSelect)) {
                // mybe here we can use some caching with care ????
                var so = oSelect.split(";"), j=0;
                for(var i=0; i<so.length;i++){
                    sv = so[i].split(":");
                    if(msl) {
                        if(jQuery.inArray(sv[0],scell)>-1) {
                            ret[j] = sv[1];
                            j++;
                        }
                    } else if($.trim(sv[0])==$.trim(cellval)) {
                        ret[0] = sv[1];
                        break;
                    }
                }
            } else if(isObject(oSelect)) {
                // this is quicker
                if(msl) {
                    ret = jQuery.map(scell, function(n, i){
                        return oSelect[n];
                    });
                } else {
                    ret[0] = oSelect[cellval] || "";
                }
            }
            return ret.join(", ");
        }
    };
    $.unformat = function (cellval,options,pos,cnt) {
        // specific for jqGrid only
        var ret, formatType = options.colModel.formatter,
        op =options.colModel.formatoptions || {}, sep,
        re = /([\.\*\_\'\(\)\{\}\+\?\\])/g;
        unformatFunc = options.colModel.unformat||($.fn.fmatter[formatType] && $.fn.fmatter[formatType].unformat);
        if(typeof unformatFunc !== 'undefined' && isFunction(unformatFunc) ) {
            ret = unformatFunc($(cellval).text(), options);
        } else if(typeof formatType !== 'undefined' && isString(formatType) ) {
            var opts = $.jgrid.formatter || {}, stripTag;
            switch(formatType) {
                case 'integer' :
                    op = $.extend({},opts.integer,op);
                    sep = op.thousandsSeparator.replace(re,"\\$1");
                    stripTag = new RegExp(sep, "g");
                    ret = $(cellval).text().replace(stripTag,'');
                    break;
                case 'number' :
                    op = $.extend({},opts.number,op);
                    sep = op.thousandsSeparator.replace(re,"\\$1");
                    stripTag = new RegExp(sep, "g");
                    ret = $(cellval).text().replace(op.decimalSeparator,'.').replace(stripTag,"");
                    break;
                case 'currency':
                    op = $.extend({},opts.currency,op);
                    sep = op.thousandsSeparator.replace(re,"\\$1");
                    stripTag = new RegExp(sep, "g");
                    ret = $(cellval).text().replace(op.decimalSeparator,'.').replace(op.prefix,'').replace(op.suffix,'').replace(stripTag,'');
                    break;
                case 'checkbox' :
                    var cbv = (options.colModel.editoptions) ? options.colModel.editoptions.value.split(":") : ["Yes","No"];
                    ret = $('input',cellval).attr("checked") ? cbv[0] : cbv[1];
                    break;
                case 'select' :
                    ret = $.unformat.select(cellval,options,pos,cnt);
                    break;
                default:
                    ret= $(cellval).text();
                    break;
            }
        }
        return ret ? ret : cnt===true ? $(cellval).text() : $.jgrid.htmlDecode($(cellval).html());
    };
    $.unformat.select = function (cellval,options,pos,cnt) {
        // Spacial case when we have local data and perform a sort
        // cnt is set to true only in sortDataArray
        var ret = [];
        var cell = $(cellval).text();
        if(cnt==true) return cell;
        var op = $.extend({},options.colModel.editoptions);
        if(op.value){
            var oSelect = op.value,
            msl =  op.multiple === true ? true : false,
            scell = [], sv;
            if(msl) { scell = cell.split(","); scell = $.map(scell,function(n){return $.trim(n);})}
            if (isString(oSelect)) {
                var so = oSelect.split(";"), j=0;
                for(var i=0; i<so.length;i++){
                    sv = so[i].split(":");
                    if(msl) {
                        if(jQuery.inArray(sv[1],scell)>-1) {
                            ret[j] = sv[0];
                            j++;
                        }
                    } else if($.trim(sv[1])==$.trim(cell)) {
                        ret[0] = sv[0];
                        break;
                    }
                }
            } else if(isObject(oSelect)) {
                if(!msl) scell[0] =  cell;
                ret = jQuery.map(scell, function(n){
                    var rv;
                    $.each(oSelect, function(i,val){
                        if (val == n) {
                            rv = i;
                            return false;
                        }
                    });
                    if( rv) return rv;
                });
            }
            return ret.join(", ");
        } else {
            return cell || "";
        }
    };
    function fireFormatter(formatType,cellval, opts, rwd, act) {
        formatType = formatType.toLowerCase();
        var v=cellval;

        if ($.fn.fmatter[formatType]){
            v = $.fn.fmatter[formatType](cellval, opts, act);
        }

        return v;
    };
    //private methods and data
    function debug($obj) {
        if (window.console && window.console.log) window.console.log($obj);
    };
    /**
     * A convenience method for detecting a legitimate non-null value.
     * Returns false for null/undefined/NaN, true for other values,
     * including 0/false/''
     *  --taken from the yui.lang
     */
    isValue= function(o) {
        return (isObject(o) || isString(o) || isNumber(o) || isBoolean(o));
    };
    isBoolean= function(o) {
        return typeof o === 'boolean';
    };
    isNull= function(o) {
        return o === null;
    };
    isNumber= function(o) {
        return typeof o === 'number' && isFinite(o);
    };
    isString= function(o) {
        return typeof o === 'string';
    };
    /**
    * check if its empty trim it and replace \&nbsp and \&#160 with '' and check if its empty ===""
    * if its is not a string but has a value then it returns false, Returns true for null/undefined/NaN
    essentailly this provdes a way to see if it has any value to format for things like links
    */
    isEmpty= function(o) {
        if(!isString(o) && isValue(o)) {
            return false;
        }else if (!isValue(o)){
            return true;
        }
        o = $.trim(o).replace(/\&nbsp\;/ig,'').replace(/\&#160\;/ig,'');
        return o==="";

    };
    isUndefined= function(o) {
        return typeof o === 'undefined';
    };
    isObject= function(o) {
        return (o && (typeof o === 'object' || isFunction(o))) || false;
    };
    isFunction= function(o) {
        return typeof o === 'function';
    };

})(jQuery);
/* Plugin:      searchFilter v1.2.9
 * Author:      Kasey Speakman (kasey@cornerspeed.com)
 * License:     Dual Licensed, MIT and GPL v2 (http://www.gnu.org/copyleft/gpl.html)
 *
 * REQUIREMENTS:
 *    jQuery 1.3+           (http://jquery.com/)
 *    A Themeroller Theme   (http://jqueryui.com/themeroller/)
 *
 * SECURITY WARNING
 *    You should always implement server-side checking to ensure that
 *    the query will fail when forged/invalid data is received.
 *    Clever users can send any value they want through JavaScript and HTTP POST/GET.
 *
 * THEMES
 *    Simply include the CSS file for your Themeroller theme.
 *
 * DESCRIPTION
 *     This plugin creates a new searchFilter object in the specified container
 *
 * INPUT TYPE
 *     fields:  an array of field objects. each object has the following properties:
 *              text: a string containing the display name of the field (e.g. "Field 1")
 *              value: a string containing the actual field name (e.g. "field1")
 *              optional properties:
 *                  ops: an array of operators in the same format as jQuery.fn.searchFilter.defaults.operators
 *                       that is: [ { op: 'gt', text: 'greater than'}, { op:'lt', text: 'less than'}, ... ]
 *                       if not specified, the passed-in options used, and failting that, jQuery.fn.searchFilter.defaults.operators will be used
 *                  *** NOTE ***
 *                  Specifying a dataUrl or dataValues property means that a <select ...> (drop-down-list) will be generated
 *                  instead of a text input <input type='text'.../> where the user would normally type in their search data
 *                  ************
 *                  dataUrl: a url that will return the html select for this field, this url will only be called once for this field
 *                  dataValues: the possible values for this field in the form [ { text: 'Data Display Text', value: 'data_actual_value' }, { ... } ]
 *                  dataInit: a function that you can use to initialize the data field. this function is passed the jQuery-fied data element
 *                  dataEvents: list of events to apply to the data element. uses $("#id").bind(type, [data], fn) to bind events to data element
 *              *** JSON of this object could look like this: ***
 *               var fields = [
 *                 {
 *                   text: 'Field Display Name',
 *                   value: 'field_actual_name',
 *                   // below this are optional values
 *                   ops: [ // this format is the same as jQuery.fn.searchFilter.defaults.operators
 *                     { op: 'gt', text: 'greater than' },
 *                     { op: 'lt', text: 'less than' }
 *                   ],
 *                   dataUrl: 'http://server/path/script.php?propName=propValue', // using this creates a select for the data input instead of an input type='text'
 *                   dataValues: [ // using this creates a select for the data input instead of an input type='text'
 *                     { text: 'Data Value Display Name', value: 'data_actual_value' },
 *                     { ... }
 *                   ],
 *                   dataInit: function(jElem) { jElem.datepicker(options); },
 *                   dataEvents: [ // these are the same options that you pass to $("#id").bind(type, [data], fn)
 *                     { type: 'click', data: { i: 7 }, fn: function(e) { console.log(e.data.i); } },
 *                     { type: 'keypress', fn: function(e) { console.log('keypress'); } }
 *                   ]
 *                 },
 *                 { ... }
 *               ]
 *     options: name:value properties containing various creation options
 *              see jQuery.fn.searchFilter.defaults for the overridable options
 *
 * RETURN TYPE: This plugin returns a SearchFilter object, which has additional SearchFilter methods:
 *     Methods
 *         add:    Adds a filter. added to the end of the list unless a jQuery event object or valid row number is passed.
 *         del:    Removes a filter. removed from the end of the list unless a jQuery event object or valid row number is passed.
 *         reset:  resets filters back to original state (only one blank filter), and calls onReset
 *         search: puts the search rules into an object and calls onSearch with it
 *         close:  calls the onClose event handler
 *
 * USAGE
 *     HTML
 *         <head>
 *             ...
 *             <script src="path/to/jquery.min.js" type="text/javascript"></script>
 *             <link href="path/to/themeroller.css" rel="Stylesheet" type="text/css" />
 *             <script src="path/to/jquery.searchFilter.js" type="text/javascript"></script>
 *             <link href="path/to/jquery.searchFilter.css" rel="Stylesheet" type="text/css" />
 *             ...
 *         </head>
 *         <body>
 *             ...
 *             <div id='mySearch'></div>
 *             ...
 *         </body>
 *     JQUERY
 *         Methods
 *             initializing: $("#mySearch").searchFilter([{text: "Field 1", value: "field1"},{text: "Field 2", value: "field2"}], {onSearch: myFilterRuleReceiverFn, onReset: myFilterResetFn });
 *         Manual Methods (there's no need to call these methods unless you are trying to manipulate searchFilter with script)
 *             add:          $("#mySearch").searchFilter().add();     // appends a blank filter
 *                           $("#mySearch").searchFilter().add(0);    // copies the first filter as second
 *             del:          $("#mySearch").searchFilter().del();     // removes the bottom filter
 *                           $("#mySearch").searchFilter().del(1);    // removes the second filter
 *             search:       $("#mySearch").searchFilter().search();  // invokes onSearch, passing it a ruleGroup object
 *             reset:        $("#mySearch").searchFilter().reset();   // resets rules and invokes onReset
 *             close:        $("#mySearch").searchFilter().close();   // without an onClose handler, equivalent to $("#mySearch").hide();
 *
 * NOTE: You can get the jQuery object back from the SearchFilter object by chaining .$
 *     Example
 *         $("#mySearch").searchFilter().add().add().reset().$.hide();
 *     Verbose Example
 *         $("#mySearch")      // gets jQuery object for the HTML element with id="mySearch"
 *             .searchFilter() // gets the SearchFilter object for an existing search filter
 *             .add()          // adds a new filter to the end of the list
 *             .add()          // adds another new filter to the end of the list
 *             .reset()        // resets filters back to original state, triggers onReset
 *             .$              // returns jQuery object for $("#mySearch")
 *             .hide();        // equivalent to $("#mySearch").hide();
 */

jQuery.fn.searchFilter = function(fields, options) {

    function SearchFilter(jQ, fields, options) {


        //---------------------------------------------------------------
        // PUBLIC VARS
        //---------------------------------------------------------------

        this.$ = jQ; // makes the jQuery object available as .$ from the return value


        //---------------------------------------------------------------
        // PUBLIC FUNCTIONS
        //---------------------------------------------------------------

        this.add = function(i) {
            if (i == null) jQ.find(".ui-add-last").click();
            else jQ.find(".sf:eq(" + i + ") .ui-add").click();
            return this;
        };

        this.del = function(i) {
            if (i == null) jQ.find(".sf:last .ui-del").click();
            else jQ.find(".sf:eq(" + i + ") .ui-del").click();
            return this;
        };

        this.search = function(e) {
            jQ.find(".ui-search").click();
            return this;
        };

        this.reset = function(e) {
            jQ.find(".ui-reset").click();
            return this;
        };

        this.close = function() {
            jQ.find(".ui-closer").click();
            return this;
        };


        //---------------------------------------------------------------
        // "CONSTRUCTOR" (in air quotes)
        //---------------------------------------------------------------

        if (fields != null) { // type coercion matches undefined as well as null


            //---------------------------------------------------------------
            // UTILITY FUNCTIONS
            //---------------------------------------------------------------

            function hover() {
                jQuery(this).toggleClass("ui-state-hover");
                return false;
            }

            function active(e) {
                jQuery(this).toggleClass("ui-state-active", (e.type == "mousedown"));
                return false;
            }

            function buildOpt(value, text) {
                return "<option value='" + value + "'>" + text + "</option>";
            }

            function buildSel(className, options, isHidden) {
                return "<select class='" + className + "'" + (isHidden ? " style='display:none;'" : "") + ">" + options + "</select>";
            }

            function initData(selector, fn) {
                var jElem = jQ.find("tr.sf td.data " + selector);
                if (jElem[0] != null)
                    fn(jElem);
            }

            function bindDataEvents(selector, events) {
                var jElem = jQ.find("tr.sf td.data " + selector);
                if (jElem[0] != null) {
                    jQuery.each(events, function() {
                        if (this.data != null)
                            jElem.bind(this.type, this.data, this.fn);
                        else
                            jElem.bind(this.type, this.fn);
                    });
                }
            }


            //---------------------------------------------------------------
            // SUPER IMPORTANT PRIVATE VARS
            //---------------------------------------------------------------

            // copies jQuery.fn.searchFilter.defaults.options properties onto an empty object, then options onto that
            var opts = jQuery.extend({}, jQuery.fn.searchFilter.defaults, options);

            // this is keeps track of the last asynchronous setup
            var highest_late_setup = -1;


            //---------------------------------------------------------------
            // CREATION PROCESS STARTS
            //---------------------------------------------------------------

            // generate the global ops
            var gOps_html = "";
            jQuery.each(opts.groupOps, function() { gOps_html += buildOpt(this.op, this.text); });
            gOps_html = "<select name='groupOp'>" + gOps_html + "</select>";

            /* original content - doesn't minify very well
            jQ
            .html("") // clear any old content
            .addClass("ui-searchFilter") // add classes
            .append( // add content
            "\
            <div class='ui-widget-overlay' style='z-index: -1'>&nbsp;</div>\
            <table class='ui-widget-content ui-corner-all'>\
            <thead>\
            <tr>\
            <td colspan='5' class='ui-widget-header ui-corner-all' style='line-height: 18px;'>\
            <div class='ui-closer ui-state-default ui-corner-all ui-helper-clearfix' style='float: right;'>\
            <span class='ui-icon ui-icon-close'></span>\
            </div>\
            " + opts.windowTitle + "\
            </td>\
            </tr>\
            </thead>\
            <tbody>\
            <tr class='sf'>\
            <td class='fields'></td>\
            <td class='ops'></td>\
            <td class='data'></td>\
            <td><div class='ui-del ui-state-default ui-corner-all'><span class='ui-icon ui-icon-minus'></span></div></td>\
            <td><div class='ui-add ui-state-default ui-corner-all'><span class='ui-icon ui-icon-plus'></span></div></td>\
            </tr>\
            <tr>\
            <td colspan='5' class='divider'><div>&nbsp;</div></td>\
            </tr>\
            </tbody>\
            <tfoot>\
            <tr>\
            <td colspan='3'>\
            <span class='ui-reset ui-state-default ui-corner-all' style='display: inline-block; float: left;'><span class='ui-icon ui-icon-arrowreturnthick-1-w' style='float: left;'></span><span style='line-height: 18px; padding: 0 7px 0 3px;'>" + opts.resetText + "</span></span>\
            <span class='ui-search ui-state-default ui-corner-all' style='display: inline-block; float: right;'><span class='ui-icon ui-icon-search' style='float: left;'></span><span style='line-height: 18px; padding: 0 7px 0 3px;'>" + opts.searchText + "</span></span>\
            <span class='matchText'>" + opts.matchText + "</span> \
            " + gOps_html + " \
            <span class='rulesText'>" + opts.rulesText + "</span>\
            </td>\
            <td>&nbsp;</td>\
            <td><div class='ui-add-last ui-state-default ui-corner-all'><span class='ui-icon ui-icon-plusthick'></span></div></td>\
            </tr>\
            </tfoot>\
            </table>\
            ");
            /* end hard-to-minify code */
            /* begin easier to minify code */
            jQ.html("").addClass("ui-searchFilter").append("<div class='ui-widget-overlay' style='z-index: -1'>&nbsp;</div><table class='ui-widget-content ui-corner-all'><thead><tr><td colspan='5' class='ui-widget-header ui-corner-all' style='line-height: 18px;'><div class='ui-closer ui-state-default ui-corner-all ui-helper-clearfix' style='float: right;'><span class='ui-icon ui-icon-close'></span></div>" + opts.windowTitle + "</td></tr></thead><tbody><tr class='sf'><td class='fields'></td><td class='ops'></td><td class='data'></td><td><div class='ui-del ui-state-default ui-corner-all'><span class='ui-icon ui-icon-minus'></span></div></td><td><div class='ui-add ui-state-default ui-corner-all'><span class='ui-icon ui-icon-plus'></span></div></td></tr><tr><td colspan='5' class='divider'><div>&nbsp;</div></td></tr></tbody><tfoot><tr><td colspan='3'><span class='ui-reset ui-state-default ui-corner-all' style='display: inline-block; float: left;'><span class='ui-icon ui-icon-arrowreturnthick-1-w' style='float: left;'></span><span style='line-height: 18px; padding: 0 7px 0 3px;'>" + opts.resetText + "</span></span><span class='ui-search ui-state-default ui-corner-all' style='display: inline-block; float: right;'><span class='ui-icon ui-icon-search' style='float: left;'></span><span style='line-height: 18px; padding: 0 7px 0 3px;'>" + opts.searchText + "</span></span><span class='matchText'>" + opts.matchText + "</span> " + gOps_html + " <span class='rulesText'>" + opts.rulesText + "</span></td><td>&nbsp;</td><td><div class='ui-add-last ui-state-default ui-corner-all'><span class='ui-icon ui-icon-plusthick'></span></div></td></tr></tfoot></table>");
            /* end easier-to-minify code */

            var jRow = jQ.find("tr.sf");
            var jFields = jRow.find("td.fields");
            var jOps = jRow.find("td.ops");
            var jData = jRow.find("td.data");

            // generate the defaults
            var default_ops_html = "";
            jQuery.each(opts.operators, function() { default_ops_html += buildOpt(this.op, this.text); });
            default_ops_html = buildSel("default", default_ops_html, true);
            jOps.append(default_ops_html);
            var default_data_html = "<input type='text' class='default' style='display:none;' />";
            jData.append(default_data_html);

            // generate the field list as a string
            var fields_html = "";
            var has_custom_ops = false;
            var has_custom_data = false;
            jQuery.each(fields, function(i) {
                var field_num = i;
                fields_html += buildOpt(this.value, this.text);
                // add custom ops if they exist
                if (this.ops != null) {
                    has_custom_ops = true;
                    var custom_ops = "";
                    jQuery.each(this.ops, function() { custom_ops += buildOpt(this.op, this.text); });
                    custom_ops = buildSel("field" + field_num, custom_ops, true);
                    jOps.append(custom_ops);
                }
                // add custom data if it is given
                if (this.dataUrl != null) {
                    if (i > highest_late_setup) highest_late_setup = i;
                    has_custom_data = true;
                    var dEvents = this.dataEvents;
                    var iEvent = this.dataInit;
                    jQuery.get(this.dataUrl, function(data) {
                        var $d = jQuery("<div />").append(data);
                        $d.find("select").addClass("field" + field_num).hide();
                        jData.append($d.html());
                        if (iEvent) initData(".field" + i, iEvent);
                        if (dEvents) bindDataEvents(".field" + i, dEvents);
                        if (i == highest_late_setup) { // change should get called no more than twice when this searchFilter is constructed
                            jQ.find("tr.sf td.fields select[name='field']").change();
                        }
                    });
                } else if (this.dataValues != null) {
                    has_custom_data = true;
                    var custom_data = "";
                    jQuery.each(this.dataValues, function() { custom_data += buildOpt(this.value, this.text); });
                    custom_data = buildSel("field" + field_num, custom_data, true);
                    jData.append(custom_data);
                } else if (this.dataEvents != null || this.dataInit != null) {
                    has_custom_data = true;
                    var custom_data = "<input type='text' class='field" + field_num + "' />";
                    jData.append(custom_data);
                }
                // attach events to data if they exist
                if (this.dataInit != null && i != highest_late_setup)
                    initData(".field" + i, this.dataInit);
                if (this.dataEvents != null && i != highest_late_setup)
                    bindDataEvents(".field" + i, this.dataEvents);
            });
            fields_html = "<select name='field'>" + fields_html + "</select>";
            jFields.append(fields_html);

            // setup the field select with an on-change event if there are custom ops or data
            var jFSelect = jFields.find("select[name='field']");
            if (has_custom_ops) jFSelect.change(function(e) {
                var index = e.target.selectedIndex;
                var td = jQuery(e.target).parents("tr.sf").find("td.ops");
                td.find("select").removeAttr("name").hide(); // disown and hide all elements
                var jElem = td.find(".field" + index);
                if (jElem[0] == null) jElem = td.find(".default"); // if there's not an element for that field, use the default one
                jElem.attr("name", "op").show();

            });
            else jOps.find(".default").attr("name", "op").show();
            if (has_custom_data) jFSelect.change(function(e) {
                var index = e.target.selectedIndex;
                var td = jQuery(e.target).parents("tr.sf").find("td.data");
                td.find("select,input").removeClass("vdata").hide(); // disown and hide all elements
                var jElem = td.find(".field" + index);
                if (jElem[0] == null) jElem = td.find(".default"); // if there's not an element for that field, use the default one
                jElem.show().addClass("vdata");
            });
            else jData.find(".default").show().addClass("vdata");
            // go ahead and call the change event and setup the ops and data values
            if (has_custom_ops || has_custom_data) jFSelect.change();

            // bind events
            jQ.find(".ui-state-default").hover(hover, hover).mousedown(active).mouseup(active); // add hover/active effects to all buttons
            jQ.find(".ui-closer").click(function(e) {
                opts.onClose(jQuery(jQ.selector));
                return false;
            });
            jQ.find(".ui-del").click(function(e) {
                var row = jQuery(e.target).parents(".sf");
                if (row.siblings(".sf").length > 0) { // doesn't remove if there's only one filter left
                    if (opts.datepickerFix === true && jQuery.fn.datepicker !== undefined)
                        row.find(".hasDatepicker").datepicker("destroy"); // clean up datepicker's $.data mess
                    row.remove(); // also unbinds
                } else { // resets the filter if it's the last one
                    row.find("select[name='field']")[0].selectedIndex = 0;
                    row.find("select[name='op']")[0].selectedIndex = 0;
                    row.find(".data input").val(""); // blank all input values
                    row.find(".data select").each(function() { this.selectedIndex = 0; }); // select first option on all selects
                    row.find("select[name='field']").change(); // trigger any change events
                }
                return false;
            });
            jQ.find(".ui-add").click(function(e) {
                var row = jQuery(e.target).parents(".sf");
                var newRow = row.clone(true).insertAfter(row);
                newRow.find(".ui-state-default").removeClass("ui-state-hover ui-state-active");
                if (opts.clone) {
                    newRow.find("select[name='field']")[0].selectedIndex = row.find("select[name='field']")[0].selectedIndex;
                    var stupid_browser = (newRow.find("select[name='op']")[0] == null); // true for IE6
                    if (!stupid_browser)
                        newRow.find("select[name='op']").focus()[0].selectedIndex = row.find("select[name='op']")[0].selectedIndex;
                    var jElem = newRow.find("select.vdata");
                    if (jElem[0] != null) // select doesn't copy it's selected index when cloned
                        jElem[0].selectedIndex = row.find("select.vdata")[0].selectedIndex;
                } else {
                    newRow.find(".data input").val(""); // blank all input values
                    newRow.find("select[name='field']").focus();
                }
                if (opts.datepickerFix === true && jQuery.fn.datepicker !== undefined) { // using $.data to associate data with document elements is Not Good
                    row.find(".hasDatepicker").each(function() {
                        var settings = jQuery.data(this, "datepicker").settings;
                        newRow.find("#" + this.id).unbind().removeAttr("id").removeClass("hasDatepicker").datepicker(settings);
                    });
                }
                newRow.find("select[name='field']").change();
                return false;
            });
            jQ.find(".ui-search").click(function(e) {
                var ui = jQuery(jQ.selector);
                var ruleGroup;
                var group_op = ui.find("select[name='groupOp'] :selected").val();
                if (!opts.stringResult) {
                    ruleGroup = {
                        groupOp: group_op,
                        rules: []
                    };
                } else {
                    ruleGroup = "{\"groupOp\":\"" + group_op + "\",\"rules\":[";
                }
                ui.find(".sf").each(function(i) {
                    var tField = jQuery(this).find("select[name='field'] :selected").val();
                    var tOp = jQuery(this).find("select[name='op'] :selected").val();
                    var tData = jQuery(this).find("input.vdata,select.vdata :selected").val();
                    if (!opts.stringResult) {
                        ruleGroup.rules.push({
                            field: tField,
                            op: tOp,
                            data: tData
                        });
                    } else {
                        if (i > 0) ruleGroup += ",";
                        ruleGroup += "{\"field\":\"" + tField + "\",";
                        ruleGroup += "\"op\":\"" + tOp + "\",";
                        ruleGroup += "\"data\":\"" + tData + "\"}";
                    }
                });
                if (opts.stringResult) ruleGroup += "]}";
                opts.onSearch(ruleGroup);
                return false;
            });
            jQ.find(".ui-reset").click(function(e) {
                var ui = jQuery(jQ.selector);
                ui.find(".ui-del").click(); // removes all filters, resets the last one
                ui.find("select[name='groupOp']")[0].selectedIndex = 0; // changes the op back to the default one
                opts.onReset();
                return false;
            });
            jQ.find(".ui-add-last").click(function() {
                var row = jQuery(jQ.selector + " .sf:last");
                var newRow = row.clone(true).insertAfter(row);
                newRow.find(".ui-state-default").removeClass("ui-state-hover ui-state-active");
                newRow.find(".data input").val(""); // blank all input values
                newRow.find("select[name='field']").focus();
                if (opts.datepickerFix === true && jQuery.fn.datepicker !== undefined) { // using $.data to associate data with document elements is Not Good
                    row.find(".hasDatepicker").each(function() {
                        var settings = jQuery.data(this, "datepicker").settings;
                        newRow.find("#" + this.id).unbind().removeAttr("id").removeClass("hasDatepicker").datepicker(settings);
                    });
                }
                newRow.find("select[name='field']").change();
                return false;
            });
        }
    }

    return new SearchFilter(this, fields, options);
};

jQuery.fn.searchFilter.version = '1.2.9';

/* This property contains the default options */
jQuery.fn.searchFilter.defaults = {

    /*
     * PROPERTY
     * TYPE:        boolean
     * DESCRIPTION: clone a row if it is added from an existing row
     *              when false, any new added rows will be blank.
     */
    clone: true,

    /*
     * PROPERTY
     * TYPE:        boolean
     * DESCRIPTION: current version of datepicker uses a data store,
     *              which is incompatible with $().clone(true)
     */
    datepickerFix: true,

    /*
     * FUNCTION
     * DESCRIPTION: the function that will be called when the user clicks Reset
     * INPUT TYPE:  JS object if stringResult is false, otherwise is JSON string
     */
    onReset: function(data) { alert("Reset Clicked. Data Returned: " + data) },

    /*
     * FUNCTION
     * DESCRIPTION: the function that will be called when the user clicks Search
     * INPUT TYPE:  JS object if stringResult is false, otherwise is JSON string
     */
    onSearch: function(data) { alert("Search Clicked. Data Returned: " + data) },

    /*
     * FUNCTION
     * DESCRIPTION: the function that will be called when the user clicks the Closer icon
     *              or the close() function is called
     *              if left null, it simply does a .hide() on the searchFilter
     * INPUT TYPE:  a jQuery object for the searchFilter
     */
    onClose: function(jElem) { jElem.hide(); },

    /*
     * PROPERTY
     * TYPE:        array of objects, each object has the properties op and text
     * DESCRIPTION: the selectable operators that are applied between rules
     *              e.g. for {op:"AND", text:"all"}
     *                  the search filter box will say: match all rules
     *                  the server should interpret this as putting the AND op between each rule:
     *                      rule1 AND rule2 AND rule3
     *              text will be the option text, and op will be the option value
     */
    groupOps: [
        { op: "AND", text: "all" },
        { op: "OR",  text: "any" }
    ],


    /*
     * PROPERTY
     * TYPE:        array of objects, each object has the properties op and text
     * DESCRIPTION: the operators that will appear as drop-down options
     *              text will be the option text, and op will be the option value
     */
    operators: [
        { op: "eq", text: "is equal to" },
        { op: "ne", text: "is not equal to" },
        { op: "lt", text: "is less than" },
        { op: "le", text: "is less or equal to" },
        { op: "gt", text: "is greater than" },
        { op: "ge", text: "is greater or equal to" },
        { op: "in", text: "is in" },
        { op: "ni", text: "is not in" },
        { op: "bw", text: "begins with" },
        { op: "bn", text: "does not begin with" },
        { op: "ew", text: "ends with" },
        { op: "en", text: "does not end with" },
        { op: "cn", text: "contains" },
        { op: "nc", text: "does not contain" }
    ],

    /*
     * PROPERTY
     * TYPE:        string
     * DESCRIPTION: part of the phrase: _match_ ANY/ALL rules
     */
    matchText: "match",

    /*
     * PROPERTY
     * TYPE:        string
     * DESCRIPTION: part of the phrase: match ANY/ALL _rules_
     */
    rulesText: "rules",

    /*
     * PROPERTY
     * TYPE:        string
     * DESCRIPTION: the text that will be displayed in the reset button
     */
    resetText: "Reset",

    /*
     * PROPERTY
     * TYPE:        string
     * DESCRIPTION: the text that will be displayed in the search button
     */
    searchText: "Search",

    /*
     * PROPERTY
     * TYPE:        boolean
     * DESCRIPTION: a flag that, when set, will make the onSearch and onReset return strings instead of objects
     */
    stringResult: true,

    /*
     * PROPERTY
     * TYPE:        string
     * DESCRIPTION: the title of the searchFilter window
     */
    windowTitle: "Search Rules"
}; /* end of searchFilter */