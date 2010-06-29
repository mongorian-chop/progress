<?php

App::import('Core', 'Security');

class Status extends AppModel
{
    var $name = 'Status';
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
            'foreignKey'    => 'status_id',
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
            if(count($new_order = explode(',', $data['order'])) > 1){
                $_count = 1;
                $this->begin();
                foreach($new_order as $tmp){
                    if(!empty($tmp) && $this->findById((int)$tmp)){
                        echo "v";
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
                'Status' => array(
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
                'Status' => array(
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
            $ret = $this->find('count', array('conditions' => array('Status.id' => $id)));
            return ($ret == 0) ? true : false;
        }
        return false;
    }
}

?>
