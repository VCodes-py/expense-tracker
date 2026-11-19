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
$user_id = $_SESSION['user_id'];

// Get total expenses this month
$queryTotal = "SELECT SUM(amount) as total FROM expenses WHERE MONTH(date) = MONTH(CURRENT_DATE()) AND YEAR(date) = YEAR(CURRENT_DATE()) AND user_id = :user_id";
$stmtTotal = $db->prepare($queryTotal);
$stmtTotal->bindParam(':user_id', $user_id);
$stmtTotal->execute();
$rowTotal = $stmtTotal->fetch(PDO::FETCH_ASSOC);
$total_this_month = $rowTotal['total'] ?? 0;

// Get expenses grouped by category for the pie chart
$queryCategory = "SELECT c.name, c.color, SUM(e.amount) as total 
                  FROM expenses e 
                  JOIN categories c ON e.category_id = c.id 
                  WHERE e.user_id = :user_id
                  GROUP BY c.id 
                  ORDER BY total DESC";
$stmtCategory = $db->prepare($queryCategory);
$stmtCategory->bindParam(':user_id', $user_id);
$stmtCategory->execute();

$category_breakdown = array();
while ($row = $stmtCategory->fetch(PDO::FETCH_ASSOC)) {
    array_push($category_breakdown, array(
        "category" => $row['name'],
        "color" => $row['color'],
        "total" => $row['total']
    ));
}

// Get daily expenses for the last 30 days for the line chart
$queryDaily = "SELECT date, SUM(amount) as total 
               FROM expenses 
               WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) AND user_id = :user_id
               GROUP BY date 
               ORDER BY date ASC";
$stmtDaily = $db->prepare($queryDaily);
$stmtDaily->bindParam(':user_id', $user_id);
$stmtDaily->execute();

$daily_trend = array();
while ($row = $stmtDaily->fetch(PDO::FETCH_ASSOC)) {
    array_push($daily_trend, array(
        "date" => $row['date'],
        "total" => $row['total']
    ));
}

// Get largest expense
$queryLargest = "SELECT amount, description, date FROM expenses WHERE user_id = :user_id ORDER BY amount DESC LIMIT 1";
$stmtLargest = $db->prepare($queryLargest);
$stmtLargest->bindParam(':user_id', $user_id);
$stmtLargest->execute();
$largest_expense = $stmtLargest->fetch(PDO::FETCH_ASSOC);

// Get sub-distribution (group by category and description)
$querySub = "SELECT c.name as category, e.description, SUM(e.amount) as total 
             FROM expenses e 
             JOIN categories c ON e.category_id = c.id 
             WHERE e.user_id = :user_id
             GROUP BY c.id, e.description 
             ORDER BY c.name ASC, total DESC";
$stmtSub = $db->prepare($querySub);
$stmtSub->bindParam(':user_id', $user_id);
$stmtSub->execute();

$sub_distribution = array();
while ($row = $stmtSub->fetch(PDO::FETCH_ASSOC)) {
    $cat = $row['category'];
    if (!isset($sub_distribution[$cat])) {
        $sub_distribution[$cat] = array();
    }
    array_push($sub_distribution[$cat], array(
        "description" => $row['description'] ? $row['description'] : 'General',
        "total" => $row['total']
    ));
}

$insights = array(
    "total_this_month" => $total_this_month,
    "category_breakdown" => $category_breakdown,
    "daily_trend" => $daily_trend,
    "largest_expense" => $largest_expense,
    "sub_distribution" => $sub_distribution
);

http_response_code(200);
echo json_encode($insights);
?>
