<?php

// プロトコル関連
define('HTTP',                  'http://');
define('HTTPS',                 'https://');

// ドメイン、URL関連
define('SITE_NAME',           '進捗管理');

define("IS_SSL", "is_ssl");

define('IS_ADMIN', 1);

if(!empty($_SERVER) && !empty($_SERVER['SERVER_NAME'])) {
    $serverName = $_SERVER['SERVER_NAME'];
}else{
    $serverName = 'progress';
}
define('SITE_DOMAIN',         $serverName);
define('SITE_LOGIN_URL',      HTTPS.SITE_DOMAIN.'/users/login');
define('SITE_TOP_URL',        '/');
define('SITE_TOP_CONTROLLER', 'Index');
define('SITE_TOP_ACTION',     'index');

/**
 * 種別
 */
    // ユーザー種別
    define('SITE_USER',           1);
    define('SITE_OPERATOR',       2);
    define('SITE_ADMIN',          3);

    // ユーザーステータス
    define('SITE_USER_PREREGIST', 1);
    define('SITE_USER_ACTIVE',    2);
    define('SITE_USER_REPASS',    3);
    define('SITE_USER_DELETED',   4);
    define('SITE_USER_REJECT',    5);

    // 優先度
    define('HIGHEST',   1);
    define('HIGH',      2);
    define('MIDDLE',    3);
    define('LOW',       4);
    define('LOWEST',    5);

// Top サイト表示件数
define('TASK_LIMIT',     20);

// Layout形式
define('XML',    'xml');
define('JSON',   'json');
define('HTML',   'html');

