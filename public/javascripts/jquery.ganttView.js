/*
jQuery.ganttView v.0.7.2
Copyright (c) 2010 JC Grubbs - jc.grubbs@devmynd.com
MIT License Applies
*/

/*
Options
-----------------
showWeekends: boolean
data: object
start: date
end: date
cellWidth: number
cellHeight: number
slideWidth: number
};
*/
var ChartLang = {
    days: "days",
    monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
};


// points: array of [x, y] (float) representing relative break points
function BrokenLineConnector(points){ this.points = points || [] }
BrokenLineConnector.prototype = new jsPlumb.Connectors.Straight;
BrokenLineConnector.prototype.paint = function(dims, ctx){
  var sx = dims[4], sy = dims[5], tx = dims[6], ty = dims[7];
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  for(var ps = this.points, i = -1, p; p = ps[++i];)
    ctx.lineTo(sx + p[0] * (tx - sx),
               sy + p[1] * (ty - sy));
  ctx.lineTo(tx, ty);
  ctx.stroke();
};
function newDate(year ,month ,day){
    if(month>0) month -= 1
    return new Date(year,month,day)
}
(function (jQuery) {
  jQuery.fn.ganttView = function (options) {
    var els = this
    var defaults = {
      showWeekends: true,
      cellWidth: 21,
      cellHeight: 21,
      vHeaderWidth: 100,
      blockClick: null,
      itemClick: null,
      change: null
    }
    var opts = jQuery.extend(defaults, options)
    var months = Chart.getMonths(opts.start, opts.end)
    var cnopts = jQuery.extend({
       anchors: [jsPlumb.Anchors.LeftMiddle, jsPlumb.Anchors.RightMiddle],
       connector: new BrokenLineConnector([[.5, 0], [.5, 1]]),
       paintStyle: {lineWidth: 1, strokeStyle: "red"},
       endpoints: [{paint: function(){}},
                   new jsPlumb.Endpoints.Triangle({width: 8, height: 6})],
       endpointStyle: {fillStyle: "red"}
    }, options.connection);
    if(opts.chartLang){
        if(opts.chartLang.days && opts.chartLang.days.length > 0) ChartLang.days = opts.chartLang.days
        if(opts.chartLang.monthNames && opts.chartLang.monthNames.length > 0) ChartLang.monthNames = opts.chartLang.monthNames
    }
    els.each(function () {
      var container = jQuery(this)
      var div = jQuery("<div>", { "class": "ganttview" })

      Chart.addVtHeader(div, opts.data, opts.cellHeight)

      var slideDiv = jQuery("<div>", {
        "class": "ganttview-slide-container"
      })

      Chart.addHzHeader(slideDiv, months, opts.cellWidth)
      Chart.addGrid(slideDiv, opts.data, months, opts.cellWidth, opts.showWeekends)
      Chart.addBlockContainers(slideDiv, opts.data)
      Chart.addBlocks(slideDiv, opts.data, opts.cellWidth, opts.start, opts.change)

      div.append(slideDiv)
      container.append(div)

      var w = jQuery("div.ganttview-vtheader", container).outerWidth() +
        jQuery("div.ganttview-slide-container", container).outerWidth()

      Chart.applyLastClass(container)
      Chart.connectBlocks(opts.data, cnopts);

      Events.bindBlockClick(container, opts.blockClick)
      Events.bindItemClick(container, opts.itemClick)
    })

    jQuery(".ganttview-slide-container").bind("scroll", jsPlumb.repaintEverything);
    jQuery(document).bind("resize", jsPlumb.repaintEverything);
  }

  var Chart = {

    getMonths: function (start, end) {
      start = Date.parse(start); end = Date.parse(end)

      var months = []; months[start.getMonth()] = [start]
      var last = start
      while (last.compareTo(end) == -1) {
        var next = last.clone().addDays(1)
        if (!months[next.getMonth()]) { months[next.getMonth()] = []; }
        months[next.getMonth()].push(next)
        last = next
      }
      return months
    },

    addVtHeader: function (div, data, cellHeight) {
      var headerDiv = jQuery("<div>", { "class": "ganttview-vtheader" })
      for (var i = 0; i < data.length; i++) {
        var itemDiv = jQuery("<div>", {
          "class": "ganttview-vtheader-item index"+i
        })
        var itemNameDiv = jQuery("<div>", {
          "class": "ganttview-vtheader-item-name",
          "css": { "height": (cellHeight) + "px" }
        }).append(data[i].name)
        itemDiv.append(itemNameDiv)
        headerDiv.append(itemDiv)
      }
      div.append(headerDiv)
    },

    addHzHeader: function (div, months, cellWidth) {
      var headerDiv = jQuery("<div>", { "class": "ganttview-hzheader" })
      var monthsDiv = jQuery("<div>", { "class": "ganttview-hzheader-months" })
      var daysDiv = jQuery("<div>", { "class": "ganttview-hzheader-days" })
      var totalW = 0
      for (var i = 0; i < 12; i++) {
        if (months[i]) {
          var w = months[i].length * cellWidth
          totalW = totalW + w
          monthsDiv.append(jQuery("<div>", {
            "class": "ganttview-hzheader-month",
            "css": { "width": (w - 1) + "px" }
          }).append(ChartLang.monthNames[i]))
          for (var j = 0; j < months[i].length; j++) {
            daysDiv.append(jQuery("<div>", { "class": "ganttview-hzheader-day" })
            .append(months[i][j].getDate()))
          }
        }
      }
      monthsDiv.css("width", totalW + "px")
      daysDiv.css("width", totalW + "px")
      headerDiv.append(monthsDiv).append(daysDiv)
      div.append(headerDiv)
    },

    addGrid: function (div, data, months, cellWidth, showWeekends) {
      var gridDiv = jQuery("<div>", { "class": "ganttview-grid" })
      var rowDiv = jQuery("<div>", { "class": "ganttview-grid-row" })
      for (var i = 0; i < 12; i++) {
        if (months[i]) {
          for (var j = 0; j < months[i].length; j++) {
            var cellDiv = jQuery("<div>", { "class": "ganttview-grid-row-cell " })
            if (DateUtils.isWeekend(months[i][j]) && showWeekends) { cellDiv.addClass("ganttview-weekend"); }
            rowDiv.append(cellDiv)
          }
        }
      }
      var w = jQuery("div.ganttview-grid-row-cell", rowDiv).length * cellWidth
      rowDiv.css("width", w + "px")
      gridDiv.css("width", w + "px")
      for (var i = 0; i < data.length; i++) {
        gridDiv.append(rowDiv.clone())
      }
      div.append(gridDiv)
    },

    addBlockContainers: function (div, data) {
      var blocksDiv = jQuery("<div>", { "class": "ganttview-blocks" })
      for (var i = 0; i < data.length; i++) {
        blocksDiv.append(jQuery("<div>", { "class": "ganttview-block-container index"+i }))
      }
      div.append(blocksDiv)
    },

    addBlocks: function (div, data, cellWidth, start, change) {
      var rows = jQuery("div.ganttview-blocks div.ganttview-block-container", div)
      var rowIdx = 0
      for (var i = 0; i < data.length; i++) {
        var series = data[i]
        if(!series.days) {
            series.days = DateUtils.daysBetween(series.start, series.end)
        }
        if (series.days && series.days > 0) {
          if (series.days > 365) { series.days = 365; } // Keep blocks from overflowing a year
          var offset = DateUtils.daysBetween(start, series.start ,true)
          var width = DateUtils.getWidth(series.start, series.days, cellWidth)
          var blockDiv = jQuery("<div>", {
            "id": "ganttview-block-" + series.id,
            "class": "ganttview-block",
            "title": series.name + ", " + series.days + ChartLang.days,
            "css": {
              "width": width,
              "margin-left": ((offset * cellWidth) + 3) + "px"
            }
          }).data("block-data", {
            id: data[i].id,
            itemName: data[i].name,
            seriesName: series.name,
            start: Date.parse(series.start),
            end: Date.parse(series.end),
            days: series.days,
            color: series.color
          });
          if(change) this.addEvent($(blockDiv), cellWidth, change);

          if (series.color) {
            blockDiv.css("background-color", series.color)
          }
          if(series.text) {
            blockDiv.append($("<div>", { "class": "ganttview-block-text" }).text(series.text))
          }else{
            blockDiv.append($("<div>", { "class": "ganttview-block-text" }).text(series.days))
          }
          jQuery(rows[rowIdx]).append(blockDiv)
        }
        rowIdx = rowIdx + 1
      }
    },

    applyLastClass: function (div) {
      jQuery("div.ganttview-grid-row div.ganttview-grid-row-cell:last-child", div).addClass("last")
      jQuery("div.ganttview-hzheader-days div.ganttview-hzheader-day:last-child", div).addClass("last")
      jQuery("div.ganttview-hzheader-months div.ganttview-hzheader-month:last-child", div).addClass("last")
    },

    connectBlocks: function (data, options) {
      for (var i = 0; i < data.length; i++) {
        var d = data[i]
        if (!("depends" in d)) continue
        for (var j = 0; j < d.depends.length; j++) {
          var depend = d.depends[j]
          jsPlumb.connect(jQuery.extend({
            source: "ganttview-block-" + d.id,
            target: "ganttview-block-" + depend
          }, options))
        }
      }
    },

    addEvent: function(o, cellWidth, change) {
      o.draggable({
        axis: 'x',
        containment: 'parent',
        grid: [cellWidth, 0],
        stop: function(event, ui) {
          distance = ui.position.left / cellWidth
          s = $(o).data('block-data').start.clone().addDays(distance)
          e = $(o).data('block-data').end.clone().addDays(distance)
          console.debug('distance: %o, start: %o, end: %o', distance, s, e)

          days = $(o).data('block-data').days
          re = DateUtils.resize(s, days, cellWidth);
          var between =0;
          if($(o).data('block-data').start.toString() != re["start"].toString()) {
            $(o).data('block-data').start = re["start"];
            between = DateUtils.daysBetween(s, re["start"]);
          }

          m = $(o).css("margin-left").replace(/px/, "")
          n = parseInt(m)+parseInt(ui.position.left)+(parseInt(between)*cellWidth);
          console.log(re["width"]);
          $(o).css("margin-left", n+"px").css("left", "0px").css("width", re["width"]);
          ui.position.left=0
          change($(o), s, distance)
          jsPlumb.repaintEverything();
        }
      }).resizable({
        containment: 'parent',
        grid: [cellWidth, 0],
        handles: 'e',
        stop: function(event, ui) {
          $(o).css("left", "").css("top", "").css("position", "")
          rdistance = Math.ceil(ui.size.width / cellWidth)
          rs = $(o).data('block-data').start.clone().addDays(rdistance)
          re = $(o).data('block-data').end.clone().addDays(rdistance)
          console.debug('width: %o, originalSize: %o, day: %o', ui.size.width, ui.originalSize.width, rdistance)

          adds = ui.size.width-ui.originalSize.width;
          if(adds>0) {
            dif = parseInt(adds/cellWidth)+1;
          }else{
            dif = parseInt(adds/cellWidth)-1;
          }
          newDays = $(o).data('block-data').days+dif;
          re = DateUtils.resize($(o).data('block-data').start.clone(), newDays, cellWidth);
          console.debug("cnt: %o, s %o, w: %o", newDays, re["start"], re["width"]);
          $(o).data('block-data').days = newDays;
          $(o).find(".ganttview-block-text").text(newDays)
          $(o).css("width", re["width"]);

          change($(o), rs, rdistance)
          jsPlumb.repaintEverything();
        }
      });
    }
  }

  var Events = {
    bindBlockClick: function (div, callback) {
      $("div.ganttview-block").live("click", function () {
        if (callback) { callback($(this).data("block-data")) }
      })
    },

    bindItemClick: function (div, callback) {
      $(".ganttview-vtheader-item").live("click", function () {
        cls=this.className.split(" ");
        for(var i=0,len=cls.length; i < len; i++) {
          if(cls[i].match(/index.*/)) {
            obj = $("."+cls[i]+" div.ganttview-block").data("block-data");
          }
        }
        if (callback) { callback(obj) }
      })
    }
  }

  var ArrayUtils = {
    contains: function (arr, obj) {
      var has = false
      for (var i = 0; i < arr.length; i++) { if (arr[i] == obj) { has = true; } }
      return has
    }
  }

  var DateUtils = {
    daysBetween: function (start, end , offsetMode) {
      if (!start || !end) { return 0; }
      start = Date.parse(start); end = Date.parse(end)
      if (start.getYear() == 1901 || end.getYear() == 8099) { return 0; }
      var count = 0, date = start.clone()
      if(offsetMode){
          var flg = true
          while(flg) {
            if(this.isWeekend(end)) {
              end.addDays(1)
            }else{
              flg = false
            }
          }
      }
      while (date.compareTo(end) == -1) { count = count + 1; date.addDays(1); }
      return count
    },
    getWidth: function (start, days, width) {
      cnt = days;
      s2 = start.clone();
      for(var i=0; i<cnt; i++) {
        if(this.isWeekend(s2)) {
          cnt++;
        }
        s2.addDays(1);
      }
      return ((cnt * width) - 9) + "px"
    },
    isWeekend: function (date) {
      return date.getDay() % 6 == 0
    },
    resize: function(start, days, cellWidth) {
      flg = true;
      s1 = start.clone();
      while(flg) {
        if(this.isWeekend(s1)) {
          s1.addDays(1);
        }else{
          flg = false;
        }
      }
      width = this.getWidth(s1, days, cellWidth);
      return {"start":s1, "width":width}
    }
  }
})(jQuery)
