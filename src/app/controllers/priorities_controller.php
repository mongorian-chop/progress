<?php

class PrioritiesController extends AppController
{
    var $uses = array('Priority');
    var $helpers = array('Ajax', 'Javascript');

    function get_priority()
    {
        $conditions = array(
            'conditions' => array(
            ),
            'order' => 'Priority.display_order ASC',
        );
        $list = $this->Priority->find('all', $conditions);
        $data = array();
        $cell = "";
        foreach($list as $_record) {
            $cell = $_record['Priority']['id'].':'.$_record['Priority']['name'];
            array_push($data, $cell);
        }
        $ret = implode(";", $data);
        $this->set('data', array('value' => $ret));
        $this->_render(JSON);
    }


    /**
     * 管理者機能
     */
    function admin_index()
    {
        $conditions = array(
            'conditions' => array(
            ),
            'order' => 'Priority.display_order ASC',
        );
        $list = $this->Priority->find('all', $conditions);
        $this->set('list', $list);

        if(!empty($this->data)) {
            if(array_key_exists('do_order', $this->params['form'])) {
                if($this->Priority->reOrder($this->data['Priority'])) {
                    $this->Session->setFlash('優先度の表示順を変更しました。');
                    $this->flash('優先度の表示順を変更しました。', 'index');
                    return;
                }
            }
        }

    }

    function admin_edit($id = null)
    {
        if(!empty($this->data)) {
            if(array_key_exists('do_save_user', $this->params['form'])) {
                if($this->data['Priority']['id'] == '_new') {
                    if($this->Priority->add($this->data['Priority'])) {
                        $this->Session->setFlash('優先度を登録しました。');
                        $this->flash('優先度を登録しました。', 'index');
                        return;
                    }else{
                        $this->Session->setFlash('優先度の登録に失敗しました。');
                        $this->flash('優先度の登録に失敗しました。', 'index');
                    }
                }else{
                    if($this->Priority->edit($this->data['Priority'])) {
                        $this->Session->setFlash('優先度を変更しました。');
                        $this->flash('優先度を変更しました。', 'index');
                        return;
                    }else{
                        $this->Session->setFlash('優先度の変更に失敗しました。');
                        $this->flash('優先度の変更に失敗しました。', 'index');
                    }
                }
            }elseif(array_key_exists('do_cancel', $this->params['form'])) {
                $this->redirect('/admin/priorities/index');
            }
        }else{
            if(!empty($id)) {
                $this->data = $this->Priority->findById($id);
            }else{
                $this->data = array(
                    'Priority' => array(
                        'id' => '_new'
                    ),
                );
            }
        }
    }

    function admin_del($id = null)
    {
        if($this->Priority->delete($id)) {
            $this->Session->setFlash('優先度を削除しました。');
            $this->flash('優先度を削除しました。', 'index');
        }else{
            $this->Session->setFlash('優先度を削除できませんでした。');
            $this->flash('優先度を削除できませんでした。', 'index');
        }
    }
}
