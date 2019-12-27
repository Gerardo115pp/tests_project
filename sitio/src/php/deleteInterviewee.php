<?php
    $id = filter_var($_POST['id'],FILTER_SANITIZE_STRING);
    $file = "../interviews/$id.json";
    if(file_exists($file) and $id!=='*')
    {
        include 'connect.php';
        $conn = GetConnection();

        $stmt = $conn->stmt_init();
        $sql = 'DELETE FROM entrevistados WHERE id=? LIMIT 1';

        if(mysqli_stmt_prepare($stmt,$sql))
        {
            mysqli_stmt_bind_param($stmt,'s',$id);
            mysqli_stmt_execute($stmt);
            $conn->close();
            unlink($file);
            echo json_encode(array('response'=>'ok'));
        }
    }
    else{
        echo file_exists($file);
    }
?>