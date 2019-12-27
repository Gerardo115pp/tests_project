<?php
    $key = filter_var($_POST["key"],FILTER_SANITIZE_STRING);
    $results = $_POST['results'];
    $results = str_replace('&#34;','"',$results);
    $file_path = '../interviews/'.$key.'.json';
    if(file_exists($file_path))
    {
        $file_stream = fopen($file_path,'w');
        fwrite($file_stream,$results);
        fclose($file_stream);
        $res = array('response'=>'ok');
    }    
    else 
    {
        $res = array('response'=>'invalid key');
    }
    echo json_encode($res); 
    // $json = json_decode($results);
?>