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

$query = "SELECT e.id, e.amount, e.date, e.description, e.category_id, c.name as category_name, c.color as category_color, c.icon as category_icon 
          FROM expenses e 
          LEFT JOIN categories c ON e.category_id = c.id 
          WHERE e.user_id = :user_id
          ORDER BY e.date DESC, e.created_at DESC";

$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $_SESSION['user_id']);
$stmt->execute();

$num = $stmt->rowCount();

$expenses_arr = array();
$expenses_arr["records"] = array();

if($num > 0) {
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        $expense_item = array(
            "id" => $id,
            "amount" => $amount,
            "date" => $date,
            "description" => $description,
            "category" => array(
                "id" => $category_id,
                "name" => $category_name,
                "color" => $category_color,
                "icon" => $category_icon
            )
        );
        array_push($expenses_arr["records"], $expense_item);
    }
}
http_response_code(200);
echo json_encode($expenses_arr);
?>
