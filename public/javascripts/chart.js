$(function() {
  $('#logout').click(function(){ location.href = '/logout' }).button()
  $('#tabs').tabs()

  // task
  $('#gantt .action .add').button().click(function() {
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
  })
  $('#gantt .action .edit').button().click(function() {
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
  })
  $('#gantt .action .delete').button().click(function() {
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
  })
  $('#gantt .action .sort')
  .append($('<option>').text('Name'))
  .append($('<option>').text('Name (DESC)'))
  .append($('<option>').text('Start On'))
  .append($('<option>').text('Start On (DESC)'))
  .append($('<option>').text('End On'))
  .append($('<option>').text('End On (DESC)'))

  $.getJSON('/projects', function(objects) {
    var p = $("#gantt .action .project")
    for (var i = 0; i < objects.length; i++) {
      p.append($('<option>').text(objects[i]['name']).val(objects[i]['id']))
    }
  })

  $.getJSON('/tasks', function(objects) {
    var ganttData = []
    for (var i = 0; i < objects.length; i++) {
      var o = objects[i]
      ganttData.push({
        id:    o['id'],
        name:  o['name'],
        start: Date.parse(o['start_on'], 'yyyy-MM-dd'),
        days:  o['days']
      })
    }

    $('#gantt .content').empty()
    $('#gantt .content').ganttView({
      data: ganttData,
      cellWidth: 21,
      start: new Date(2010,5,1),
      end: new Date(2010,12,31),
      blockClick: function() {
        console.log("click");
      },
      itemClick: function(data) {
        console.log(data.id);
      },
      change: function(o,s,m) {
      }
    })
  })

  // project
  $('#project .action .add').button().click(function() {
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
  })
  $('#project .action .edit').button().click(function() {
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
  })
  $('#project .action .delete').button().click(function() {
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
  })
  $('#project .content').load_table_from_json('project', ['name', 'start_on', 'end_on', 'description'])

  // user
  $('#user .action .add').button().click(function() {
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
  })
  $('#user .action .edit').button().click(function() {
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
  })
  $('#user .action .delete').button().click(function() {
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
  })
  $('#user .content').load_table_from_json('user', ['login', 'last_name', 'first_name', 'email', 'company', 'unit', 'phone_number', 'last_login_at'])
})
