<?php
$ch = curl_init('http://localhost/expense_tracker/api/auth/register.php');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['username'=>'tester1', 'email'=>'tester1@test.com', 'password'=>'pass123']));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
echo curl_exec($ch);
?>
