<?php
// バリデーション正規表現
define('VALID_TEL_NO',  '/(^$|^0[0-9]{1,3}-[0-9]{2,4}-[0-9]{4}$)/');
define('VALID_ZIP',     '/(^$|^[0-9]{3}-[0-9]{4}$)/');

/**
 * モデル基底クラス
 *
 *
 */
class AppModel extends Model
{
    var $_withFieldName = false;

    var $_error_messages = array();

    var $actsAs = array('SoftDeletable');

    // アップロード許可画像タイプ（拡張子）
    var $IMAGE_TYPES = array(
        'image/jpeg'  => array('jpg', 'jpeg'),
        'image/pjpeg' => array('jpg', 'jpeg'),
        'image/png'   => array('png'),
    );


    function begin()
    {
        $db =& ConnectionManager::getDataSource($this->useDbConfig);
        $db->begin($this);
    }

    function commit()
    {
        $db =& ConnectionManager::getDataSource($this->useDbConfig);
        $db->commit($this);
    }

    function rollback()
    {
        $db =& ConnectionManager::getDataSource($this->useDbConfig);
        $db->rollback($this);
    }

    /**
     * バリデーションメッセージ国際化対応
     *
     */
    function invalizdate($field, $value = null)
    {
        return parent::invalidate($field, __($value, true));
    }

    /**
     * 国際化
     */
    function _getDefaultErrorMessagesI18n(){
        $default_validation_messages = Configure::read('default_validation_messages');
        $default_error_messages = array();
        foreach($default_validation_messages as $key => $value) {
            $default_error_messages[$key] = __($value, true);
        };

        return $default_error_messages;
    }

    function setErrorMessageI18n( $add_error_message = null, $all_change_flag=false ) {

        $default_error_messages = $this->_getDefaultErrorMessagesI18n();
        if( !empty( $add_error_message ) && is_array( $add_error_message ) ){
            if( $all_change_flag ){
                $default_error_messages = $add_error_message;
            }else{
                $default_error_messages = array_merge( $default_error_messages, $add_error_message );
            }
            $this->_error_messages = $default_error_messages;
        }elseif( empty($this->_error_messages)  ){
            $this->_error_messages = $default_error_messages;
        }

    }

    function _getErrorMessageI18n(){
        return $this->_error_messages;
    }

    /**
     * エラーメッセージ国際化
     */
    function replaceValidationErrorMessagesI18n(){
        $this->setErrorMessageI18n();
        foreach( $this->validate as $fieldname => $ruleSet ){
            foreach( $ruleSet as $rule => $rule_info ){
                $rule_option = array();
                if(!empty($this->validate[$fieldname][$rule]['rule'])) {
                    $rule_option = $this->validate[$fieldname][$rule]['rule'];
                }
                $error_message_list = $this->_getErrorMessageI18n();
                $error_message = ( array_key_exists($rule, $error_message_list ) ? $error_message_list[$rule] : null ) ;
                if( !empty( $error_message ) ) {
                    $this->validate[$fieldname][$rule]['message'] = vsprintf($error_message, $rule_option);
                }elseif( !empty($this->validate[$fieldname][$rule]['message']) ){
                    $this->validate[$fieldname][$rule]['message'] =
                        __( $this->validate[$fieldname][$rule]['message'], true);
                }

                if( $this->_withFieldName && !empty($this->validate[$fieldname][$rule]['message']) ){
                    $this->validate[$fieldname][$rule]['message'] =
                        __( $fieldname ,true) . ' : ' . $this->validate[$fieldname][$rule]['message'];

                }
            }
        }
    }

    function beforeValidate(){
        $this->replaceValidationErrorMessagesI18n();
        return true;
    }

    function _rand($length = 8)
    {
        srand((double) microtime() * 1000000);
        $seed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
        $pass = "";
        while($length--) {
            $pos = rand(0, 61);
            $pass .= $seed[$pos];
        }
        return $pass;

    }

	function convert($data, $count, $limit, $offset)
	{
        return array(
            'page'    => $offset,
            'total'   => ceil($count/$limit),
            'records' => $count,
            'rows'    => $data,
        );
	}
}

?>
