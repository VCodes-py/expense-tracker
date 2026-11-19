<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

session_start();
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->username) && !empty($data->email) && !empty($data->password)) {
    // Check if user exists
    $check_query = "SELECT id FROM users WHERE email = :email OR username = :username";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(':email', $data->email);
    $check_stmt->bindParam(':username', $data->username);
    $check_stmt->execute();

    if($check_stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(array("message" => "User with that email or username already exists."));
        exit;
    }

    $query = "INSERT INTO users SET username=:username, email=:email, password_hash=:password_hash";
    $stmt = $db->prepare($query);

    $username = htmlspecialchars(strip_tags($data->username));
    $email = htmlspecialchars(strip_tags($data->email));
    $password_hash = password_hash($data->password, PASSWORD_BCRYPT);

    $stmt->bindParam(":username", $username);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":password_hash", $password_hash);

    if($stmt->execute()) {
        $user_id = $db->lastInsertId();
        $_SESSION['user_id'] = $user_id;
        $_SESSION['username'] = $username;
        $_SESSION['email'] = $email;

        http_response_code(201);
        echo json_encode(array(
            "message" => "User was registered.",
            "user" => array(
                "id" => $user_id,
                "username" => $username,
                "email" => $email
            )
        ));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to register user."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to register user. Data is incomplete."));
}
?>
