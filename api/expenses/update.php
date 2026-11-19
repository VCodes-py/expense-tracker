<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT, POST");
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

if (!empty($data->id) && !empty($data->amount) && !empty($data->category_id) && !empty($data->date)) {
    $query = "UPDATE expenses 
              SET amount = :amount, category_id = :category_id, date = :date, description = :description 
              WHERE id = :id AND user_id = :user_id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $_SESSION['user_id']);

    $stmt->bindParam(':id', $data->id);
    $stmt->bindParam(':amount', $data->amount);
    $stmt->bindParam(':category_id', $data->category_id);
    $stmt->bindParam(':date', $data->date);
    $stmt->bindParam(':description', $data->description);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(array("message" => "Expense was updated."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to update expense."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Incomplete data."));
}
?>
