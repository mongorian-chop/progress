$(function(){
  $('#main').append(
    $('<ul>', {'id':'action'})
    .append($('<li>', {'class':'button'}).text('Add').click(function() {
      $('<p>Add</p>').dialog()
    }))
    .append($('<li>', {'class':'button'}).text('Edit').click(function() {
      var project = $('.selected').data()
      $('<form>')
      .append($('<label>').text('name'))
      .append($('<input>').val(project['name']))
      .append($('<label>').text('start_on'))
      .append($('<input>').val(project['start_on']))
      .append($('<label>').text('end_on'))
      .append($('<input>').val(project['end_on']))
      .append($('<label>').text('description'))
      .append($('<textarea>').val(project['description']))
      .append($('<input>', {'type':'submit'}).text('description'))
      .dialog({'title':'Edit'})
    }))
    .append($('<li>', {'class':'button'}).text('Delete').click(function() {
      $('<p>Are you sure?</p>').dialog()
    }))
  )

  var table = $('<table>', {'class':'projects tablesorter'})
  .append($('<thead>')
    .append($('<tr>')
      .append($('<th>').text('name'))
      .append($('<th>').text('start_on'))
      .append($('<th>').text('end_on'))
      .append($('<th>').text('description'))
    )
  )
  var tbody = $('<tbody>')
  table.append(tbody)

  $.getJSON('/projects', function(projects) {
    $('#main').append(table)
    for (var i = 0; i < projects.length; i++) {
      var project = projects[i]
      tbody.append(
        $('<tr>', {'class':'project'}).data(project).click(function() {
          $(this).siblings().removeClass('selected')
          .end().toggleClass('selected')
        })
        .append($('<td>', {'class':'name'}).text(project['name']))
        .append($('<td>', {'class':'start_on'}).text(project['start_on']))
        .append($('<td>', {'class':'end_on'}).text(project['end_on']))
        .append($('<td>', {'class':'description'}).text(project['description']))
      )
    }

    $(table).tablesorter()
  })
})
