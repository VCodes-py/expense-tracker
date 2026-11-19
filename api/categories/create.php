<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

session_start();
if(!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized"]);
    exit;
}

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->name) &&
    !empty($data->color) &&
    !empty($data->icon)
) {
    $query = "INSERT INTO categories SET user_id=:user_id, name=:name, color=:color, icon=:icon";
    $stmt = $db->prepare($query);
    
    $stmt->bindParam(':user_id', $_SESSION['user_id']);

    // sanitize
    $name = htmlspecialchars(strip_tags($data->name));
    $color = htmlspecialchars(strip_tags($data->color));
    $icon = htmlspecialchars(strip_tags($data->icon));

    // bind
    $stmt->bindParam(":name", $name);
    $stmt->bindParam(":color", $color);
    $stmt->bindParam(":icon", $icon);

    if($stmt->execute()) {
        http_response_code(201);
        echo json_encode(array(
            "message" => "Category was created.",
            "id" => $db->lastInsertId()
        ));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to create category."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to create category. Data is incomplete."));
}
?>
