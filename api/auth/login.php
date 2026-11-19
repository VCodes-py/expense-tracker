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

if(!empty($data->email) && !empty($data->password)) {
    $query = "SELECT id, username, email, password_hash FROM users WHERE email = :email LIMIT 0,1";
    $stmt = $db->prepare($query);

    $email = htmlspecialchars(strip_tags($data->email));
    $stmt->bindParam(":email", $email);
    $stmt->execute();

    if($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if(password_verify($data->password, $row['password_hash'])) {
            $_SESSION['user_id'] = $row['id'];
            $_SESSION['username'] = $row['username'];
            $_SESSION['email'] = $row['email'];

            http_response_code(200);
            echo json_encode(array(
                "message" => "Successful login.",
                "user" => array(
                    "id" => $row['id'],
                    "username" => $row['username'],
                    "email" => $row['email']
                )
            ));
        } else {
            http_response_code(401);
            echo json_encode(array("message" => "Login failed. Password is incorrect."));
        }
    } else {
        http_response_code(401);
        echo json_encode(array("message" => "Login failed. User not found."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to login. Data is incomplete."));
}
?>
