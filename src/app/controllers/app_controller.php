<?php

class AppController extends Controller
{
    var $components = array("Auth", 'Security', 'RequestHandler');
    var $ext = '.html';
    var $auth = null;

    var $pageTitle = "Progress";

    var $userScope      = array();
    var $loginRedirect  = array('controller' => 'tasks',  'action' => 'index');
    var $logoutRedirect = array('controller' => 'tasks',  'action' => 'index');
    var $loginAction    = '/users/login';

    function beforeFilter()
    {
        $this->_logger("START");
        $this->Security->blackHoleCallback = "_redirect";
        $admin = false;
        if(Configure::read('Routing.admin') && !empty($this->params['prefix'])){
            $this->layout = 'admin';
            $admin = true;
        }
        $this->_auth($admin);

        if(!empty($this->isSSL)) $this->_doSSL();
        if($this->RequestHandler->isAjax()) {
            Configure::write('debug', 0);
            $this->RequestHandler->setContent('json');
            $this->RequestHandler->respondAs('application/json; charset=UTF-8');
        }
        $this->set('action', $this->name);
    }

    function beforeRender()
    {
    }

    function afterFilter()
    {
        $this->_logger("END");
    }

    /**
     * 認証関連設定
     *  認証コンポーネントに必要な設定をする
     */
    function _auth($admin = false)
    {
        $this->Auth->fields = array(
            'username' => 'mail_address',
            'password' => 'password',
        );
        if(!empty($this->userModel)) {
            $this->Auth->userModel = $this->userModel;
        }
        if($admin) {
            $this->Auth->userScope      = array('User.admin' => IS_ADMIN);
            $this->Auth->loginRedirect  = array('controller' => 'users',  'action' => 'index');
            $this->Auth->logoutRedirect = array('controller' => 'users',  'action' => 'index');
            $this->Auth->loginAction    = '/admin/users/login';
        }else{
            $this->Auth->userScope      = $this->userScope;
            $this->Auth->loginRedirect  = $this->loginRedirect;
            $this->Auth->logoutRedirect = $this->logoutRedirect;
            $this->Auth->loginAction    = $this->loginAction;
        }
//        $this->Auth->ajaxLogin      = 'ajax_login';
    }

    /**
     * SSLページにアクセスしたときにリダイレクトする
     */
    function _doSSL()
    {
        if(!$this->Auth->RequestHandler->isSSL()) {
            if(is_array($this->isSSL) && in_array($this->action, $this->isSSL)) {
                $this->_redirect(IS_SSL);
            }else if($this->action === $this->nonSSL) {
                $this->_redirect(IS_SSL);
            }
        }
    }

    /**
     * リダイレクトメソッド
     *   SSL必須ページに非SSLでアクセスした場合に使用する
     *   SSL不要ページにSSLでアクセスした場合に使用する
     */
    function _redirect($error)
    {
        if($error === "secure") {
            if($this->name == SITE_TOP_CONTROLLER && $this->action == SITE_TOP_ACTION) {
                $url = HTTPS.SITE_DOMAIN.$this->webroot;
            }else{
                $url = HTTPS.SITE_DOMAIN.$this->webroot.strtolower($this->name)."/".$this->action;
            }
            $this->redirect($url);
        }else if($error === IS_SSL) {
            if($this->name == SITE_TOP_CONTROLLER && $this->action == SITE_TOP_ACTION) {
                $url = HTTPS.SITE_DOMAIN.$this->webroot;
            }else{
                //$url = HTTP.SITE_DOMAIN.$this->webroot.strtolower($this->name)."/".$this->action;
                $url = HTTPS.SITE_DOMAIN.$this->webroot.$this->params['url']['url'];
            }
            $this->redirect($url);
        }
    }

    /**
     * 検索
     */
    function _search($columns, $model = 'Site')
    {
        if(
            !empty($this->data[$model]['search']) &&
            (array_key_exists('do_search', $this->params['form']) ||
            array_key_exists('do_search_x', $this->params['form']))

        ) {
            $word = $this->data[$model]['search'];
            $word = trim(urldecode($word));
            $this->searchWord = array('searchWord' => trim(urlencode($word)));
        }elseif(!empty($this->passedArgs['searchWord'])){
            $word = $this->passedArgs['searchWord'];
            $word = trim(urldecode($word));
            $this->searchWord = array('searchWord' => trim($word));
            $this->data = array('Site' => array('search' => trim($word)));
        }else{

            return false;
        }

        if(!$this->Search->generate($word, $columns)) {
            return false;
        }

        $this->set('searchWord', $this->searchWord);
        $this->set('list', $this->paginate($model, $this->Search->getParams(), null));
        return true;
    }

    /*
     * ロギング
     *  CakePHPロガーのラップ
     *  コントローラとアクションを必ず出力するよう修正
     */
    function _logger($msg = null, $type = LOG_DEBUG)
    {
        switch ($msg) {
        case 'START':
            $msg = "START Controller:$this->name Action:$this->action";
            break;
        case 'END':
            $msg = "END   Controller:$this->name Action:$this->action";
            break;
        default:
            if(!is_string($msg)) {
                $msg = print_r($msg, true);
            }
            break;
        }

        $this->log($msg, LOG_DEBUG);
    }


    function _render($type = 'xml')
    {
        switch($type)
        {
            case XML:
                $this->ext = '.'.XML;
                $this->layout = XML;
                $this->render(DS.XML.DS.$this->action);
                break;
            case JSON:
                $this->ext = '.'.JSON;
                $this->layout = JSON;
                $this->render(DS.JSON.DS.JSON);
                break;
            case HTML:
                $this->render(DS.$this->name.DS.$this->action);
                break;
            default:
                $this->render(DS.XML.DS.$this->action);
                break;
        }
    }
    /**
     * バックトレース
     *  デバッグ用
     */
    function _backtrace()
    {
        $backtrace = debug_backtrace();
        foreach($backtrace as $trace) {
            $this->_logger(
                "TRACE ".$trace['file'].'('.$trace['line'].") \n".
                "                                 ".$trace['class']."::".$trace['function'].'()'
            );
        }
    }

}
