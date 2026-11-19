<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

session_start();
if(!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized"]);
    exit;
}

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$query = "SELECT id, name, color, icon FROM categories WHERE user_id IS NULL OR user_id = :user_id ORDER BY name ASC";
$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $_SESSION['user_id']);
$stmt->execute();

$num = $stmt->rowCount();

if($num > 0) {
    $categories_arr = array();
    $categories_arr["records"] = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        $category_item = array(
            "id" => $id,
            "name" => $name,
            "color" => $color,
            "icon" => $icon
        );
        array_push($categories_arr["records"], $category_item);
    }
    http_response_code(200);
    echo json_encode($categories_arr);
} else {
    http_response_code(404);
    echo json_encode(array("message" => "No categories found."));
}
?>
