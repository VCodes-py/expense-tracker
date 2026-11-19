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
    !empty($data->amount) &&
    !empty($data->date) &&
    !empty($data->category_id)
) {
    $query = "INSERT INTO expenses SET user_id=:user_id, amount=:amount, date=:date, description=:description, category_id=:category_id";
    $stmt = $db->prepare($query);

    // sanitize
    $user_id = $_SESSION['user_id'];
    $amount = htmlspecialchars(strip_tags($data->amount));
    $date = htmlspecialchars(strip_tags($data->date));
    $description = htmlspecialchars(strip_tags($data->description ?? ''));
    $category_id = htmlspecialchars(strip_tags($data->category_id));

    // bind
    $stmt->bindParam(":user_id", $user_id);
    $stmt->bindParam(":amount", $amount);
    $stmt->bindParam(":date", $date);
    $stmt->bindParam(":description", $description);
    $stmt->bindParam(":category_id", $category_id);

    if($stmt->execute()) {
        http_response_code(201);
        echo json_encode(array("message" => "Expense was created."));
    } else {
        http_response_code(503);
        echo json_encode(array("message" => "Unable to create expense."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Unable to create expense. Data is incomplete."));
}
?>
