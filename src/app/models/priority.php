<?php

App::import('Core', 'Security');

class Priority extends AppModel
{
    var $name = 'Priority';
    var $actsAs = array('SoftDeletable');

    var $validate = array(
        'name'            => array(
            'notEmpty'    => array('rule' => 'notEmpty'),
            'maxLengthJp' => array('rule' => array('maxLengthJp', 50)),
        ),
        'display_order'   => array(
            'notEmpty'    => array('rule' => 'notEmpty'),
        ),
    );

    var $hasMany = array(
        'Task' => array(
            'className'     => 'Task',
            'foreignKey'    => 'priority_id',
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

    function reOrder($data)
    {
        if(!empty($data)){
            if(count(explode(',', $data['order'])) > 1){
                $new_order = explode(',', $data['order']);
                $_count = 1;
                $this->begin();
                foreach($new_order as $tmp){
                    if($this->findById((int)$tmp)){
                        $order['id'] = $tmp;
                        $order['display_order'] = $_count;
                        $_count++;
                        if(!$this->save($order)){
                            $this->rollback();
                            return false;
                        }
                    }else{
                        $this->rollback();
                        return false;
                    }
                }
                $this->commit();
                return true;
            }
            return false;
        }
        return false;
    }

    function add($form)
    {
        if(!empty($form) && !empty($form['id'])) {
            $data = array(
                'Priority' => array(
                    'name'          => $form['name'],
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
                'Priority' => array(
                    'id'            => $form['id'],
                    'name'          => $form['name'],
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
            $ret = $this->find('count', array('conditions' => array('Priority.id' => $id)));
            return ($ret == 0) ? true : false;
        }
        return false;
    }
}

?>
