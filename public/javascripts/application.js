(function($){
  /*
   * Example:
   *   $('#main').load_table_from_json('project', 'projects', ['id', 'name', 'description'])
   * Params:
   *   singleName = 'project'
   *   pluralName = 'projects'
   *   columns    = ['id', 'name', 'description']
   * Return:
   *   $(this)
   */
  $.fn.load_table_from_json = function(singleName, pluralName, columns) {
    var src = $(this)
    var table = $('<table>', {'class':pluralName+' tablesorter'})
    .append($('<thead>').append($('<tr>'))).append($('<tbody>'))
    for (var i = 0; i < columns.length; ++i) {
      $('thead tr', table).append($('<th>').text(L['activerecord']['attributes'][singleName][columns[i]]))
    }
    $.getJSON('/'+pluralName, function(objects) {
      src.append(table)
      for (var i = 0; i < objects.length; i++) {
        var o = objects[i]
        $('tbody', table).append($('<tr>', {'class':singleName}).data(o).click(function() {
          $(this).siblings().removeClass('selected')
          .end().toggleClass('selected')
        }))
        for (var j = 0; j < columns.length; ++j) {
          $('tbody tr:last', table).append($('<td>', {'class':columns[j]}).text(o[columns[j]] || ''))
        } 
      }
      $(table).tablesorter()
    })
    return $(this)
  }
})(jQuery)
