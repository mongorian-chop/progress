$(function(){
  $('#main').append(
    $('<div>', {'class':'action'})
    .append($('<button>').text(L['Add']).click(function() {
      $('<p>Add</p>').dialog({
        title: L['Add'],
        resizable: false,
        draggable: false,
        modal: true,
        buttons: {
          'Add': function() {
            $(this).dialog('close')
          },
          'Cancel': function() {
            $(this).dialog('close')
          }
        }
      })
    }).button())
    .append($('<button>').text(L['Edit']).click(function() {
      var project = $('.selected').data()
      $('<form>')
      .append($('<label>').text(L['activerecord']['attributes']['project']['name']))
      .append($('<input>').val(project['name']))
      .append($('<label>').text(L['activerecord']['attributes']['project']['start_on']))
      .append($('<input>').val(project['start_on']))
      .append($('<label>').text(L['activerecord']['attributes']['project']['end_on']))
      .append($('<input>').val(project['end_on']))
      .append($('<label>').text(L['activerecord']['attributes']['project']['description']))
      .append($('<textarea>').val(project['description']))
      .dialog({
        title: L['Edit'],
        resizable: false,
        draggable: false,
        modal: true,
        buttons: {
          'Edit': function() {
            $(this).dialog('close')
          },
          'Cancel': function() {
            $(this).dialog('close')
          }
        }
      })
    }).button())
    .append($('<button>').text(L['Delete']).click(function() {
      $('<p>'+L['Are you sure']+'</p>').dialog({
        title: L['Delete'],
        resizable: false,
        draggable: false,
        modal: true,
        buttons: {
          'Delete': function() {
            $(this).dialog('close')
          },
          'Cancel': function() {
            $(this).dialog('close')
          }
        }
      })
    }).button())
  )
  $('#main').load_table_from_json('project', ['name', 'start_on', 'end_on', 'description'])
})
