<?php
    $name = filter_var($_POST['user_name'],FILTER_SANITIZE_STRING);
    $token = filter_var($_POST['token'],FILTER_SANITIZE_STRING);
    
    $valid_token = sha1($name.getUserIpAddr());
    $response = array('response'=>'');
    if ($valid_token=== $token)
    {
        $response["response"] = 'ok';
    }
    else 
    {
        $response["response"] = 'invalid';
    }
    echo json_encode($response);

    function getUserIpAddr()
    {
        if(!empty($_SERVER['HTTP_CLIENT_IP'])){
            //ip from share internet
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        }elseif(!empty($_SERVER['HTTP_X_FORWARDED_FOR'])){
            //ip pass from proxy
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        }else{
            $ip = $_SERVER['REMOTE_ADDR'];
        }
        return $ip;
    }
?>