<?php

class UsersController extends AppController
{
    var $uses = array('User');
    var $helpers = array('Ajax', 'Javascript');

    function index()
    {
    }

    function login()
    {
    }

    function logout()
    {
        $this->Auth->logout();
        $this->redirect('/');
    }

    function get_user()
    {
        $conditions = array(
            'conditions' => array(
            ),
            'order' => 'User.id ASC',
        );
        $list = $this->User->find('all', $conditions);
        $data = array();
        $cell = "";
        foreach($list as $_record) {
            $cell = $_record['User']['id'].':'.$_record['User']['name'];
            array_push($data, $cell);
        }
        $ret = implode(";", $data);
        $this->set('data', array('value' => $ret));
        $this->_render(JSON);
    }

    function change_password()
    {
        $user_id = $this->Auth->user('id');
        $ret = $this->User->changePassword($user_id, $this->params['form']);
        $this->set('data', ($ret) ? "true" : "false");
        $this->_render(JSON);
    }

    function admin_login() {
    }

    function admin_index()
    {
        $conditions = array(
            'order' => 'User.id',
        );
        $list = $this->User->find('all', $conditions);
        $this->set('list', $list);
    }

    function admin_edit($id = null)
    {
        if(!empty($this->data)) {
            if(array_key_exists('do_save_user', $this->params['form'])) {
                if($this->data['User']['id'] == '_new') {
                    if($this->User->add($this->data['User'])) {
                        $this->Session->setFlash('ユーザー情報を登録しました。');
                        $this->flash('ユーザー情報を登録しました。', 'index');
                        return;
                    }else{
                        $this->Session->setFlash('ユーザー情報の登録に失敗しました。');
                        $this->flash('ユーザー情報の登録に失敗しました。', 'index');
                    }
                }else{
                    if($this->User->edit($this->data['User'])) {
                        $this->Session->setFlash('ユーザー情報を変更しました。');
                        $this->flash('ユーザー情報を変更しました。', 'index');
                        return;
                    }else{
                        $this->Session->setFlash('ユーザー情報の変更に失敗しました。');
                        $this->flash('ユーザー情報の変更に失敗しました。', 'index');
                    }
                }
            }elseif(array_key_exists('do_cancel', $this->params['form'])) {
                $this->redirect('/admin/users/index');
            }
        }else{
            if(!empty($id)) {
                $this->data = $this->User->findById($id);
            }else{
                $this->data = array(
                    'User' => array(
                        'id' => '_new'
                    ),
                );
            }
        }
    }

    function admin_del($id = null)
    {
        if($this->User->delete($id)) {
            $this->Session->setFlash('ユーザーを削除しました。');
            $this->flash('ユーザーを削除しました。', 'index');
        }else{
            $this->Session->setFlash('ユーザーを削除できませんでした。');
            $this->flash('ユーザーを削除できませんでした。', 'index');
        }
    }

    function admin_change_password($id = null)
    {
        if(!empty($this->data)) {
            if(array_key_exists('do_save_user', $this->params['form'])) {
                if($this->User->change_password($this->data['User'])) {
                    $this->Session->setFlash('ユーザー情報を変更しました。');
                    $this->flash('ユーザー情報を変更しました。', 'index');
                    return;
                }else{
                    $this->Session->setFlash('ユーザー情報の変更に失敗しました。');
                    $this->flash('ユーザー情報の変更に失敗しました。', 'index');
                }
            }elseif(array_key_exists('do_cancel', $this->params['form'])) {
                $this->redirect('/admin/users/index');
            }
        }else{
            $this->data = $this->User->findById($id);
        }
    }

    function admin_logout()
    {
        $this->Auth->logout();
        $this->redirect('/admin');
    }
}
