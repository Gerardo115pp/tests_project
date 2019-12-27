<?php
    $tests_locations = file_get_contents('testDictyonary.json');
    $tests = json_decode($tests_locations,true);
    echo json_encode($tests);
?>