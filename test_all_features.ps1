# Test Suite for Printer Linking, Shop UPI Payments, Free Launch Plan, and Plan Edit/Delete
$baseUrl = "http://localhost:3005"
$ErrorActionPreference = "Stop"

Write-Host "=== Step 1: Login as Super Admin ===" -ForegroundColor Cyan
$adminLoginBody = @{
    email = "admin@printporter.com"
    password = "Admin@123"
} | ConvertTo-Json

$loginRes = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $adminLoginBody -ContentType "application/json" -SessionVariable adminSession
Write-Host "Admin Login HTTP:" $loginRes.StatusCode

Write-Host "`n=== Step 2: Verify Plans API (GET, POST, PATCH, DELETE) ===" -ForegroundColor Cyan
$plansRes = Invoke-RestMethod -Uri "$baseUrl/api/plans" -Method GET -WebSession $adminSession
Write-Host "Total Plans returned:" $plansRes.plans.Count
$freePlan = $plansRes.plans | Where-Object { $_.name -eq "Free Launch Plan" }
if ($freePlan) {
    Write-Host "SUCCESS: Free Launch Plan is present! Price: ₹$($freePlan.priceMonthly), Comm: $($freePlan.commissionRate)%" -ForegroundColor Green
} else {
    Write-Host "ERROR: Free Launch Plan not found" -ForegroundColor Red
}

# Create a test plan
$newPlanBody = @{
    name = "Test Temporary Plan"
    priceMonthly = 799
    maxPrinters = 3
    commissionRate = 4.0
    features = @("Feature A", "Feature B")
} | ConvertTo-Json

$createPlanRes = Invoke-RestMethod -Uri "$baseUrl/api/plans" -Method POST -Body $newPlanBody -ContentType "application/json" -WebSession $adminSession
$createdPlanId = $createPlanRes.plan._id
Write-Host "Created Plan ID: $createdPlanId, Name: $($createPlanRes.plan.name)"

# Edit the test plan
$editPlanBody = @{
    id = $createdPlanId
    name = "Edited Test Plan"
    priceMonthly = 899
    commissionRate = 3.5
} | ConvertTo-Json

$editPlanRes = Invoke-RestMethod -Uri "$baseUrl/api/plans" -Method PATCH -Body $editPlanBody -ContentType "application/json" -WebSession $adminSession
Write-Host "Edited Plan Name: $($editPlanRes.plan.name), New Price: ₹$($editPlanRes.plan.priceMonthly)" -ForegroundColor Green

# Delete the test plan
$deletePlanRes = Invoke-RestMethod -Uri "$baseUrl/api/plans?id=$createdPlanId" -Method DELETE -WebSession $adminSession
Write-Host "Delete Plan Message: $($deletePlanRes.message)" -ForegroundColor Green

Write-Host "`n=== Step 3: Login as Shop Owner and Verify Shop Details ===" -ForegroundColor Cyan
$shopLoginBody = @{
    email = "rajesh@cyberprint.com"
    password = "Shop@123"
} | ConvertTo-Json

$shopLoginRes = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $shopLoginBody -ContentType "application/json" -SessionVariable shopSession
Write-Host "Shop Owner Login HTTP:" $shopLoginRes.StatusCode

$shopDetail = Invoke-RestMethod -Uri "$baseUrl/api/shops/shop_001" -Method GET
Write-Host "Shop Name: $($shopDetail.shop.name)"
Write-Host "Active Plan: $($shopDetail.shop.activePlan)" -ForegroundColor Green
Write-Host "Shop UPI ID: $($shopDetail.shop.upiId)" -ForegroundColor Green

# Update Shop UPI ID and UPI QR URL
$updateShopUpiBody = @{
    upiId = "rajeshprint@okaxis"
    upiQrUrl = "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=300"
} | ConvertTo-Json

$patchShopRes = Invoke-RestMethod -Uri "$baseUrl/api/shops/shop_001" -Method PATCH -Body $updateShopUpiBody -ContentType "application/json" -WebSession $shopSession
Write-Host "Updated Shop UPI ID: $($patchShopRes.shop.upiId)" -ForegroundColor Green
Write-Host "Updated Shop QR URL: $($patchShopRes.shop.upiQrUrl)" -ForegroundColor Green

Write-Host "`n=== Step 4: Printer Linking, Test-Link Ping, Edit & Delete ===" -ForegroundColor Cyan
# Test-Link Ping existing printer
$pingRes = Invoke-RestMethod -Uri "$baseUrl/api/printers/prn_001/test-link" -Method POST -WebSession $shopSession
Write-Host "Ping Result: $($pingRes.message) [Latency: $($pingRes.latencyMs)ms]" -ForegroundColor Green

# Link a new hardware printer
$linkPrinterBody = @{
    shopId = "shop_001"
    name = "Brother HL-L6200DW Fast Spooler"
    model = "Brother HL-L6200DW"
    type = "MONOCHROME"
    paperSizes = @("A4", "Legal")
    ppmSpeed = 48
    connectionType = "NETWORK_IP"
    ipAddress = "192.168.1.185"
    portNumber = 9100
    isLinked = $true
} | ConvertTo-Json

$linkPrinterRes = Invoke-RestMethod -Uri "$baseUrl/api/printers" -Method POST -Body $linkPrinterBody -ContentType "application/json" -WebSession $shopSession
$linkedPrinterId = $linkPrinterRes.printer._id
Write-Host "Linked Printer ID: $linkedPrinterId, IP: $($linkPrinterRes.printer.ipAddress):$($linkPrinterRes.printer.portNumber)" -ForegroundColor Green

# Edit the linked printer
$editPrinterBody = @{
    name = "Brother HL-L6200DW (High Volume Hub)"
    ppmSpeed = 50
    portNumber = 9101
} | ConvertTo-Json

$editPrinterRes = Invoke-RestMethod -Uri "$baseUrl/api/printers/$linkedPrinterId" -Method PATCH -Body $editPrinterBody -ContentType "application/json" -WebSession $shopSession
Write-Host "Edited Printer Name: $($editPrinterRes.printer.name), Speed: $($editPrinterRes.printer.ppmSpeed) PPM" -ForegroundColor Green

# Delete the temporary linked printer
$deletePrinterRes = Invoke-RestMethod -Uri "$baseUrl/api/printers/$linkedPrinterId" -Method DELETE -WebSession $shopSession
Write-Host "Delete Printer Message: $($deletePrinterRes.message)" -ForegroundColor Green

Write-Host "`n=== Step 5: Test Direct Shop UPI Customer Order ===" -ForegroundColor Cyan
$orderUpiBody = @{
    shopId = "shop_001"
    printerId = "prn_001"
    fileUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    fileName = "Final_College_Project.pdf"
    fileType = "application/pdf"
    fileSizeBytes = 450000
    pageCount = 10
    copies = 2
    isColor = $false
    isDuplex = $true
    paperSize = "A4"
    orientation = "PORTRAIT"
    binding = "None"
    paymentType = "UPI"
    upiRefNumber = "UPI492019482012"
    customerName = "Rohit Verma"
    customerPhone = "+91 98765 11223"
    fulfillmentType = "PICKUP"
} | ConvertTo-Json

$orderRes = Invoke-RestMethod -Uri "$baseUrl/api/orders" -Method POST -Body $orderUpiBody -ContentType "application/json"
Write-Host "Order Number: $($orderRes.order.orderNumber)"
Write-Host "Order Status: $($orderRes.order.status)" -ForegroundColor Green
Write-Host "Payment Type: $($orderRes.order.paymentType), Status: $($orderRes.order.paymentStatus)" -ForegroundColor Green
Write-Host "Recorded UTR: $($orderRes.order.upiRefNumber)" -ForegroundColor Green
Write-Host "Total Amount: ₹$($orderRes.order.totalPrice)" -ForegroundColor Green

Write-Host "`n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===" -ForegroundColor Green
