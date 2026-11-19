<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

session_start();

if(isset($_SESSION['user_id'])) {
    http_response_code(200);
    echo json_encode(array(
        "authenticated" => true,
        "user" => array(
            "id" => $_SESSION['user_id'],
            "username" => $_SESSION['username'],
            "email" => $_SESSION['email']
        )
    ));
} else {
    http_response_code(401);
    echo json_encode(array(
        "authenticated" => false,
        "message" => "Not authenticated."
    ));
}
?>
