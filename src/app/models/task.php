<?php

App::import('Core', 'Security');

class Task extends AppModel
{
    var $name = 'Task';
    var $actsAs = array('SoftDeletable');

    var $validate = array(
        'title'       => array(
            'notEmpty'    => array('rule' => 'notEmpty'),
            'maxLengthJp' => array('rule' => array('maxLengthJp', 50)),
        ),
        'description'            => array(
            'notEmpty'    => array('rule' => 'notEmpty'),
            'maxLengthJp' => array('rule' => array('maxLengthJp', 250)),
        ),
        'start_dt'        => array(
            'notEmpty'    => array('rule' => 'notEmpty'),
            'maxLengthJp' => array('rule' => array('maxLengthJp', 50)),
        ),
        'end_dt'    => array(
            'notEmpty'    => array('rule' => 'notEmpty'),
        ),
        'project_id'         => array(
            'notEmpty'    => array('rule' => 'notEmpty'),
        ),
        'priority_id'         => array(
            'notEmpty'    => array('rule' => 'notEmpty'),
        ),
        'user_id'         => array(
            'notEmpty'    => array('rule' => 'notEmpty'),
        ),
        'status_id'         => array(
        ),
    );

    var $belongsTo = array(
        'User'        => array(
            'className'   => 'User',
            'foreignKey'  => 'user_id',
            'conditions'  => '',
            'fields'      => '',
            'order'       => ''
        ),
        'Project'        => array(
            'className'   => 'Project',
            'foreignKey'  => 'project_id',
            'conditions'  => '',
            'fields'      => '',
            'order'       => ''
        ),
        'Priority'        => array(
            'className'   => 'Priority',
            'foreignKey'  => 'priority_id',
            'conditions'  => '',
            'fields'      => '',
            'order'       => ''
        ),
        'Status'        => array(
            'className'   => 'Status',
            'foreignKey'  => 'status_id',
            'conditions'  => '',
            'fields'      => '',
            'order'       => ''
        ),
    );

    function get_task($id, $params) {
        $query = array();
        if($id != 0) {
            $query = array(
                'Task.project_id'   => $id,
            );
        }

        $limit  = (int)$params['rows'];
        $offset = (int)$params['page'];

        if(($params['_search'] === "true") && !empty($params['_search'])) {
            switch($params['searchField']) {
            case 'title':
            case 'description':
            case 'start_dt':
            case 'end_dt':
                $target = 'Task.'.$params['searchField'];
                break;
            case 'project_id':
                $target = 'Project.'.$params['searchField'];
                break;
            case 'priority_id':
                $target = 'Priority.'.$params['searchField'];
                break;
            case 'user_id':
                $target = 'User.'.$params['searchField'];
                break;
            case 'status_id':
                $target = 'Status.'.$params['searchField'];
                break;
            }
            array_push($query, array($target.' LIKE ' => '%'.$params['searchString'].'%'));
        }
        $conditions = array(
            'conditions' => $query,
        );
        if(!empty($params['sidx'])) {
            $conditions['order'] = 'Task.'.$params['sidx']." ".$params['sord'];
        }
        $count = $this->find('count', $conditions);

        $conditions['limit'] = $limit;
        $conditions['offset'] = $limit*($offset - 1);
        $list = $this->find('all', $conditions);

        $data = array();
        foreach($list as $_record) {
            $id   = $_record['Task']['id'];
            $cell = array(
                $_record['Task']['id'],
                $_record['Task']['title'],
                $_record['Task']['description'],
                $_record['Task']['start_dt'],
                $_record['Task']['end_dt'],
                $_record['Project']['title'],
                $_record['Priority']['name'],
                $_record['User']['name'],
                $_record['Status']['name'],
                /*
                "id" => $_record['Task']['id'],
                "title" => $_record['Task']['title'],
                "description" => $_record['Task']['description'],
                "start_dt" => $_record['Task']['start_dt'],
                "end_dt" => $_record['Task']['end_dt'],
                "project_id" => $_record['Project']['title'],
                "priority_id" => $_record['Priority']['name'],
                "user_id" => $_record['User']['name'],
                "status_id" => $_record['Status']['name'],
                 */
                "0","1","10","true","false"
            );
            array_push($data, array('id' => $id, 'cell' => $cell));
        }
        return $this->convert($data, $count, $limit, $offset);
    }

    function get_project_list($user_id)
    {
        $this->unbindModel(array('belongsTo'=>array('User', 'Project', 'Priority', 'Status')));
        $conditions = array(
            'conditions' => array(
                'Task.user_id' => $user_id,
            ),
            'fields' => 'Task.project_id',
            'group' => 'Task.project_id',
        );
        $data = $this->find('all', $conditions);
        foreach($data as $_record) {
            $ret[] = $_record['Task']['project_id'];
        }
        return $ret;
    }

    function add($user_id, $form)
    {
        if(!empty($user_id) && !empty($form)) {
            $data = array(
                'Task' => array(
                    'title'         => $form['title'],
                    'description'   => $form['description'],
                    'start_dt'      => $form['start_dt'],
                    'end_dt'        => $form['end_dt'],
                    'project_id'    => $form['project_id'],
                    'priority_id'   => $form['priority_id'],
                    'user_id'       => $form['user_id'],
                    'status_id'     => $form['status_id'],
                )
            );
            return $this->save($data);
        }
        return false;
    }

    function edit($form)
    {
        if(!empty($form) && !empty($form['id'])) {
            $data = array(
                'Task' => array(
                    'id'            => $form['id'],
                    /*
                    'description'   => $form['description'],
                    'start_dt'      => $form['start_dt'],
                    'end_dt'        => $form['end_dt'],
                    'project_id'    => $form['project_id'],
                    'priority_id'   => $form['priority_id'],
                    'user_id'       => $form['user_id'],
                    'status_id'     => $form['status_id'],
                     */
                )
            );
            if(!empty($form['title'])) {
                $data['Task']['title'] = $form['title'];
            }
            if(!empty($form['description'])) {
                $data['Task']['description'] = $form['description'];
            }
            if(!empty($form['start_dt'])) {
                $data['Task']['start_dt'] = $form['start_dt'];
            }
            if(!empty($form['end_dt'])) {
                $data['Task']['end_dt'] = $form['end_dt'];
            }
            if(!empty($form['project_id'])) {
                $data['Task']['project_id'] = $form['project_id'];
            }
            if(!empty($form['priority_id'])) {
                $data['Task']['priority_id'] = $form['priority_id'];
            }
            if(!empty($form['user_id'])) {
                $data['Task']['user_id'] = $form['user_id'];
            }
            if(!empty($form['status_id'])) {
                $data['Task']['status_id'] = $form['status_id'];
            }
            return $this->save($data);
        }
        return false;
    }

    function delete($form)
    {
        if(!empty($form['id'])) {
            $id = $form['id'];
            $this->del($form['id']);
            $ret = $this->find('count', array('conditions' => array('Task.id' => $id)));
            return ($ret == 0) ? true : false;
        }
        return false;
    }

    function delete_project($form)
    {
        if(!empty($form['id'])) {
            $id = $form['id'];
            $this->deleteAll(
                array(
                    'Task.project_id' => $form['id']
                )
            );
            $ret = $this->find('count', array('conditions' => array('Task.project_id' => $id)));
            return ($ret == 0) ? true : false;
        }
        return false;
    }
}

?>
