<?php
    include 'connect.php';
    $user = filter_var($_POST['user_name'],FILTER_SANITIZE_STRING);
    $password = filter_var($_POST['password'],FILTER_SANITIZE_STRING);

    $hash = sha1($password);
    $conn = GetConnection();
    $sql = "SELECT id FROM usuarios WHERE name=? AND hsh=?";
    $stmt = $conn->stmt_init();
    if(mysqli_stmt_prepare($stmt,$sql))
    {
        mysqli_stmt_bind_param($stmt,'ss',$user,$hash);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        if($result->num_rows === 1)
        {
            $row = $result->fetch_object();
            $conn->close();
            $response = array('response'=>'ok',
                              'token'=>sha1($user.getUserIpAddr()),
                              'id'=>$row->id);
            echo json_encode($response);
        }
        else
        {
            $response = array('response' => 'wrong');
            echo json_encode($response);
        }
    }


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