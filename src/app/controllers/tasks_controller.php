<?php

class TasksController extends AppController
{
    var $uses = array('User', 'Project', 'Task');
    var $helpers = array('Ajax', 'Javascript');

    function index() {}

    function get_task($id)
    {
        $ret = $this->Task->get_task($id, $this->params['url']);

        $this->set('data', $ret);
        $this->_render(JSON);
    }

    function add()
    {
        $user_id = $this->Auth->user('id');
        $ret = $this->Task->add($user_id, $this->params['form']);
        $this->set('data', ($ret) ? "true" : "false");
        $this->_render(JSON);
    }

    function edit()
    {
        $ret = $this->Task->edit($this->params['form']);
        $this->set('data', ($ret) ? "true" : "false");
        $this->_render(JSON);
    }

    function del()
    {
        $ret = $this->Task->delete($this->params['form']);
        $this->set('data', ($ret) ? "true" : "false");
        $this->_render(JSON);
    }
}
