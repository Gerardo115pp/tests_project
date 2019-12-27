<?php
    function GetConnection()
    {
        $conn = new mysqli("localhost","id5632727_defalt","gogomon12!","id5632727_testsrosy");
        // $conn = new mysqli("localhost","root","","cucei_pedia");
        if($conn->connect_error)
        {
            echo $error -> $conn->connect_error;
            return null;
        }
        else
        {
            return $conn;
        }
    }
?>