<?php

App::import('Core', 'Security');

class User extends AppModel
{
    var $name = 'User';
    var $actsAs = array('SoftDeletable');

    var $validate = array(
        'corporation'       => array(
            'maxLengthJp' => array('rule' => array('maxLengthJp', 50), 'allowEmpty' => true),
        ),
        'name'            => array(
            'notEmpty'    => array('rule' => 'notEmpty'),
            'maxLengthJp' => array('rule' => array('maxLengthJp', 50)),
        ),
        'name_ruby'       => array(
            'notEmpty'    => array('rule' => 'notEmpty'),
            'maxLengthJp' => array('rule' => array('maxLengthJp', 50)),
        ),
        'mail_address'    => array(
            'email'       => array('rule' => 'email'),
            'maxLength'   => array('rule' => array('maxLength', 200)),
        ),
        'password'        => array(
            'notEmpty'    => array('rule' => 'notEmpty'),
        ),
        'tel'             => array(
            'notEmpty'    => array('rule' => 'notEmpty'),
            'tel'         => array('rule' => VALID_TEL_NO),
            'between'     => array('rule' => array('between', 12, 13)),
        ),
        'unit'            => array(
            'maxLength'   => array('rule' => array('maxLengthJp', 50)),
        ),
    );

    var $hasMany = array(
        'Project' => array(
            'className'     => 'Project',
            'foreignKey'    => 'user_id',
            'dependent'     => false,
            'conditions'    => '',
            'fields'        => '',
            'order'         => '',
            'limit'         => '',
            'offset'        => '',
            'exclusive'     => '',
            'finderQuery'   => '',
            'counterQuery'  => ''
        ),
        'Task' => array(
            'className'     => 'Task',
            'foreignKey'    => 'user_id',
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

    function _hashPassword($password)
    {
        return Security::hash($password, null, true);
    }

    function changePassword($id = null, $params)
    {
        $user = $this->find('all',
            array(
                'conditions' => array(
                    'User.id'       => $id,
                    'User.password' => $this->_hashPassword($params['old_password']),
                )
            )
        );

        if(count($user) == 1) {
            $data = array('User' => array(
                'id' => $id,
                'password' => $this->_hashPassword($params['new_password']),
            ));
            $this->create($data);
            return $this->save();
        }

        return false;
    }

    function add($form)
    {
        if(!empty($form) && !empty($form['id'])) {
            $data = array(
                'User' => array(
                    'corporation'   => $form['corporation'],
                    'name'          => $form['name'],
                    'name_ruby'     => $form['name_ruby'],
                    'mail_address'  => $form['mail_address'],
                    'password'      => $this->_hashPassword($form['password']),
                    'tel'           => $form['tel'],
                    'unit'          => $form['unit'],
                    'admin'         => $form['admin'],
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
                'User' => array(
                    'id'            => $form['id'],
                    'corporation'   => $form['corporation'],
                    'name'          => $form['name'],
                    'name_ruby'     => $form['name_ruby'],
                    'mail_address'  => $form['mail_address'],
                    'tel'           => $form['tel'],
                    'unit'          => $form['unit'],
                    'admin'         => $form['admin'],
                )
            );
            return $this->save($data);
        }
        return false;
    }

    function delete($id)
    {
        if(!empty($id)) {
            $this->del($id);
            $ret = $this->find('count', array('conditions' => array('User.id' => $id)));
            return ($ret == 0) ? true : false;
        }
        return false;
    }

    function change_password($form)
    {
        if(!empty($form) && !empty($form['id'])) {
            $data = array(
                'User' => array(
                    'id'        => $form['id'],
                    'password'  => $this->_hashPassword($form['password']),
                )
            );
            return $this->save($data);
        }
        return false;
    }
}

?>
