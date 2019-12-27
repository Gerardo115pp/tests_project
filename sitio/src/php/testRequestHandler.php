<?php
    if(isset($_POST['test']))
    {
        $test = filter_var($_POST['test'],FILTER_SANITIZE_STRING);
        $json_directorys = file_get_contents('./testLocations.json');
        $json_directorys = json_decode($json_directorys,true);
        if(isset($json_directorys[$test]))
        {
            $test_json = file_get_contents($json_directorys[$test]);
            $test_json = json_decode($test_json,true);
            echo json_encode($test_json);
        }
        else {
            echo 'unable to find "'.$test.'" in test locations';
        }
    }
    else {
        echo 'No var not there';
    }
?>