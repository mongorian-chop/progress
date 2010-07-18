(function($){
  /*
   * Example:
   *   $('#main').load_table_from_json('project', ['id', 'name', 'description'])
   * Params:
   *   name    = 'project'
   *   columns = ['id', 'name', 'description']
   * Return:
   *   $(this)
   */
  $.fn.load_table_from_json = function(name, columns) {
    var src = $(this)
    var table = $('<table>', {'class':name.pluralize()+' tablesorter'})
    .append($('<thead>').append($('<tr>'))).append($('<tbody>'))
    for (var i = 0; i < columns.length; ++i) {
      $('thead tr', table).append($('<th>').text(L['activerecord']['attributes'][name][columns[i]]))
    }
    $.getJSON('/'+name.pluralize(), function(objects) {
      src.append(table)
      for (var i = 0; i < objects.length; i++) {
        var o = objects[i]
        $('tbody', table).append($('<tr>', {'class':name}).data(o).click(function() {
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
