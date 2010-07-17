$(function(){
  var columns = ['login', 'last_name', 'first_name', 'email', 'company', 'unit', 'phone_number', 'last_login_at']
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
      var o = $('.selected').data()
      $('<form>')
      .append($('<label>').text(L['activerecord']['attributes']['user']['last_name']))
      .append($('<input>').val(o['last_name']))
      .append($('<label>').text(L['activerecord']['attributes']['user']['first_name']))
      .append($('<input>').val(o['first_name']))
      .append($('<label>').text(L['activerecord']['attributes']['user']['email']))
      .append($('<input>').val(o['email']))
      .append($('<label>').text(L['activerecord']['attributes']['user']['company']))
      .append($('<input>').val(o['company']))
      .append($('<label>').text(L['activerecord']['attributes']['user']['unit']))
      .append($('<input>').val(o['unit']))
      .append($('<label>').text(L['activerecord']['attributes']['user']['phone_number']))
      .append($('<input>').val(o['phone_number']))
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
  $('#main').load_table_from_json('user', 'users', columns)
})
