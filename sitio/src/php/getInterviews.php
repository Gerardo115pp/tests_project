<?php
    $interviewer_id = filter_var($_POST['id'],FILTER_SANITIZE_STRING);
    include 'connect.php';
    $sql = "SELECT id,nombre,path_to_results FROM entrevistados WHERE interviewed_by=?";

    $conn = GetConnection();
    $stmt = $conn->stmt_init();
    
    $response = array();

    if(mysqli_stmt_prepare($stmt,$sql))
    {
        mysqli_stmt_bind_param($stmt,'d',$interviewer_id);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        
        while($row = $result->fetch_object())
        {
            $json_data = json_decode(file_get_contents($row->path_to_results),true);
            $content_data = array('results'=>$json_data,'name'=>$row->nombre);
            $response['interviews'][$row->id] = $content_data;
        }
        echo json_encode($response);
    }
    else 
    {
        echo json_encode(array('response'=>'no hay resultados par interviewer: $interviewer_id'));
    }

?>