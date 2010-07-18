$(function() {
  $('#logout').click(function(){ location.href = '/logout' }).button()
  $('#tabs').tabs()

  var ganttData = [
    {id: 1, name: "タスク1", start: new Date(2010,01,02), end: new Date(2010,01,06), days: 3},
    {id: 2, name: "タスク2", start: new Date(2010,01,05), end: new Date(2010,01,09), days: 4, depends: [1]},
    {id: 3, name: "タスク3", start: new Date(2010,01,08), end: new Date(2010,01,12), days: 2},
    {id: 4, name: "タスク4", start: new Date(2010,01,04), end: new Date(2010,01,09), days: 4},
    {id: 5, name: "タスク5", start: new Date(2010,01,11), end: new Date(2010,01,15), days: 5, depends: [2, 4]}
  ]
  $("#gantt").ganttView({
    data: ganttData,
    cellWidth: 21,
    start: new Date(2010,01,01),
    end: new Date(2010,05,15),
    slideWidth: 500,
    blockClick: function() {
      console.log("click");
    },
    itemClick: function(data) {
        console.log(data.id);
    },
    change: function(o,s,m) {
//        console.log(o.data('block-data').id);
    }
  })

  $('#project').append(
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
  $('#project').load_table_from_json('project', ['name', 'start_on', 'end_on', 'description'])

  $('#user').append(
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
  $('#user').load_table_from_json('user', ['login', 'last_name', 'first_name', 'email', 'company', 'unit', 'phone_number', 'last_login_at'])
})
