<?php
    if(isset($_POST['name']))
    {
        $name = filter_var($_POST['name'],FILTER_SANITIZE_STRING);
        $needed = filter_var($_POST['needed'],FILTER_SANITIZE_STRING);
        $user_id = filter_var($_POST['user_id'],FILTER_SANITIZE_STRING);

        $interviewee_key = storeInterviewe($name,$user_id);

        $needed = str_replace('&#34;','"',$needed);
        $needed = json_decode($needed);
        $test_locations = file_get_contents('testLocations.json');
        $test_locations = json_decode($test_locations,true);
        $Res = array();
        $return_array = array('interviewee_key'=>$interviewee_key);
        foreach($needed as $test_name)
        {   
            $json_data = file_get_contents($test_locations[$test_name]);
            $json_data = json_decode($json_data,true);
            array_push($Res, $json_data);
        }
        $return_array["tests"] = $Res;
        echo json_encode($return_array);

    }

    function storeInterviewe($name,$user_id)
    {
        include 'connect.php';
        $conn = GetConnection();
        $interviewee_key = sha1($name.date('U'));
        $filepath = '../interviews/'.$interviewee_key.'.json';
        $file_hanlder =  fopen($filepath,'w') or die('cannot open file');
        fclose($file_hanlder);

        $sql = "INSERT INTO entrevistados(id,nombre,path_to_results,interviewed_by) VALUES (?,?,?,?)";
        $stmt = $conn->stmt_init();
        if(mysqli_stmt_prepare($stmt,$sql))
        {
            mysqli_stmt_bind_param($stmt,'sssd',$interviewee_key,$name,$filepath,$user_id);
            mysqli_stmt_execute($stmt);
        }
        $conn->close();
        return $interviewee_key;
    }

?>