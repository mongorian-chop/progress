<?php

App::import('Core', 'Security');

class Project extends AppModel
{
    var $name = 'Project';
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
        'user_id'         => array(
            'notEmpty'    => array('rule' => 'notEmpty'),
        ),
    );
    var $hasMany = array(
        'Task' => array(
            'className'     => 'Task',
            'foreignKey'    => 'project_id',
            'dependent'     => false,
            'conditions'    => '',
            'fields'        => '',
            'order'         => '',
            'limit'         => '',
            'offset'        => '',
            'exclusive'     => '',
            'finderQuery'   => '',
            'counterQuery'  => ''
        )
    );

    var $belongsTo = array(
        'User'        => array(
            'className'   => 'User',
            'foreignKey'  => 'user_id',
            'conditions'  => '',
            'fields'      => '',
            'order'       => ''
        ),
    );

    function get_all()
    {
        return $this->find('all');
    }

    function get_project_list()
    {
        $conditions = array(
            'conditions' => array(
            ),
            'order' => 'Project.id ASC',
        );
        $list = $this->find('all', $conditions);
        $data = array();
        $cell = "";
        foreach($list as $_record) {
            $cell = $_record['Project']['id'].':'.$_record['Project']['title'];
            array_push($data, $cell);
        }
        return implode(";", $data);
    }

    function get_project()
    {
        $conditions = array(
            'conditions' => array(
                //'Project.id' => $project_list,
            ),
            'order' => 'Project.id ASC',
        );
        $list = $this->find('all', $conditions);
        $data = array(array(
            'id' => "0",
            'cell' => array(
                "0","ALL","","","","0","1","10","true","false"
            )
        ));
        foreach($list as $_record) {
            $id   = $_record['Project']['id'];
            $cell = array(
                $_record['Project']['id'],
                $_record['Project']['title'],
                $_record['Project']['description'],
                $_record['Project']['start_dt'],
                $_record['Project']['end_dt'],
                "0","1","10","true","false"
            );
            array_push($data, array('id' => $id, 'cell' => $cell));
        }
        return array(
            'page'    => 1,
            'total'   => 1,
            'records' => count($data),
            'rows'    => $data,
        );
    }

    function add($user_id, $form)
    {
        if(!empty($user_id) && !empty($form)) {
            $data = array(
                'Project' => array(
                    'title'         => $form['title'],
                    'description'   => $form['description'],
                    'start_dt'      => $form['start_dt'],
                    'end_dt'        => $form['end_dt'],
                    'user_id'       => $user_id
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
                'Project' => array(
                    'id'            => $form['id'],
                    'title'         => $form['title'],
                    'description'   => $form['description'],
                    'start_dt'      => $form['start_dt'],
                    'end_dt'        => $form['end_dt'],
                )
            );
            return $this->save($data);
        }
        return false;
    }

    function delete($form)
    {
        if(!empty($form['id'])) {
            $id = $form['id'];
            $this->del($form['id']);
            $ret = $this->find('count', array('conditions' => array('Project.id' => $id)));
            return ($ret == 0) ? true : false;
        }
        return false;
    }
}

?>
