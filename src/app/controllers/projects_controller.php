<?php

class ProjectsController extends AppController
{
    var $uses = array('User', 'Project', 'Task');
    var $helpers = array('Ajax', 'Javascript');

    function get_project_list()
    {
        $list = $this->Project->get_project_list();
        $this->set('data', array('value' => $list));
        $this->_render(JSON);
    }

    function get_project()
    {
        $data = $this->Project->get_project();
        $this->set('data', $data);
        $this->_render(JSON);
    }

    function add()
    {
        $user_id = $this->Auth->user('id');
        $ret = $this->Project->add($user_id, $this->params['form']);
        $this->set('data', ($ret) ? "true" : "false");
        $this->_render(JSON);
    }

    function edit()
    {
        $ret = $this->Project->edit($this->params['form']);
        $this->set('data', ($ret) ? "true" : "false");
        $this->_render(JSON);
    }

    function del()
    {
        $ret = $this->Project->delete($this->params['form']);
        if($ret) {
            $ret = $this->Task->delete_project($this->params['form']);
        }
        $this->set('data', ($ret) ? "true" : "false");
        $this->_render(JSON);
    }
}
