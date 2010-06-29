<?php

class StatusesController extends AppController
{
    var $uses = array('Status');
    var $helpers = array('Ajax', 'Javascript');

    function get_status()
    {
        $conditions = array(
            'conditions' => array(
            ),
            'order' => 'Status.display_order ASC',
        );
        $list = $this->Status->find('all', $conditions);
        $data = array();
        $cell = "";
        foreach($list as $_record) {
            $cell = $_record['Status']['id'].':'.$_record['Status']['name'];
            array_push($data, $cell);
        }
        $ret = implode(";", $data);
        $this->set('data', array('value' => $ret));
        $this->_render(JSON);
    }

    function admin_index()
    {
        $conditions = array(
            'conditions' => array(
            ),
            'order' => 'Status.display_order ASC',
        );
        $list = $this->Status->find('all', $conditions);
        $this->set('list', $list);

        if(!empty($this->data)) {
            if(array_key_exists('do_order', $this->params['form'])) {
                if($this->Status->reOrder($this->data['Status'])) {
                    $this->Session->setFlash('ステータスの表示順を変更しました。');
                    $this->flash('ステータスの表示順を変更しました。', 'index');
                    return;
                }
            }
        }

    }


    /**
     * 管理者機能
     */
    function admin_edit($id = null)
    {
        if(!empty($this->data)) {
            if(array_key_exists('do_save_user', $this->params['form'])) {
                if($this->data['Status']['id'] == '_new') {
                    if($this->Status->add($this->data['Status'])) {
                        $this->Session->setFlash('優先度を登録しました。');
                        $this->flash('優先度を登録しました。', 'index');
                        return;
                    }else{
                        $this->Session->setFlash('優先度の登録に失敗しました。');
                        $this->flash('優先度の登録に失敗しました。', 'index');
                    }
                }else{
                    if($this->Status->edit($this->data['Status'])) {
                        $this->Session->setFlash('優先度を変更しました。');
                        $this->flash('優先度を変更しました。', 'index');
                        return;
                    }else{
                        $this->Session->setFlash('優先度の変更に失敗しました。');
                        $this->flash('優先度の変更に失敗しました。', 'index');
                    }
                }
            }elseif(array_key_exists('do_cancel', $this->params['form'])) {
                $this->redirect('/admin/statuses/index');
            }
        }else{
            if(!empty($id)) {
                $this->data = $this->Status->findById($id);
            }else{
                $this->data = array(
                    'Status' => array(
                        'id' => '_new'
                    ),
                );
            }
        }
    }

    function admin_del($id = null)
    {
        if($this->Status->delete($id)) {
            $this->Session->setFlash('優先度を削除しました。');
            $this->flash('優先度を削除しました。', 'index');
        }else{
            $this->Session->setFlash('優先度を削除できませんでした。');
            $this->flash('優先度を削除できませんでした。', 'index');
        }
    }
}
