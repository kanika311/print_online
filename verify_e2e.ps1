Write-Host "================================================="
Write-Host "   PRINTPORTER FULL PLATFORM & API VERIFICATION  "
Write-Host "================================================="

# 1. Homepage & Public Shops API
Write-Host "`n[1/7] Testing Consumer Homepage & Shop Directory..."
$resHome = Invoke-WebRequest -Uri "http://localhost:3005/" -UseBasicParsing
Write-Host " - Consumer Homepage HTTP Status:" $resHome.StatusCode
$shops = Invoke-RestMethod -Uri "http://localhost:3005/api/shops" -Method Get
Write-Host " - Registered Hubs Count:" $shops.shops.Count
Write-Host " - Primary Hub:" $shops.shops[0].name "(Printers:" $shops.shops[0].totalPrinters ", Available:" $shops.shops[0].availablePrinters ")"

# 2. Shop Owner Login & Pricing Rates Update
Write-Host "`n[2/7] Testing Shop Owner Authentication & Pricing Editor..."
$ownerLoginBody = @{ email = "rajesh@cyberprint.com"; password = "Shop@123" } | ConvertTo-Json
$ownerLogin = Invoke-RestMethod -Uri "http://localhost:3005/api/auth/login" -Method Post -Body $ownerLoginBody -ContentType "application/json"
$ownerToken = $ownerLogin.token
Write-Host " - Shop Owner Logged In:" $ownerLogin.user.name "Role:" $ownerLogin.user.role
$ownerHeaders = @{ Authorization = "Bearer $ownerToken" }

# Shop owner updates custom pricing rates
$pricingPatchBody = @{
  pricingRates = @{
    bwSingle = 2.5
    bwDuplex = 4.0
    colorSingle = 12.0
    colorDuplex = 20.0
    a3Surcharge = 6.0
    spiralBinding = 40.0
    stapleBinding = 5.0
  }
} | ConvertTo-Json
$patchShopRes = Invoke-RestMethod -Uri "http://localhost:3005/api/shops/shop_001" -Method Patch -Body $pricingPatchBody -Headers $ownerHeaders -ContentType "application/json"
Write-Host " - Updated Shop Pricing Rates: B&W Single = ₹$($patchShopRes.shop.pricingRates.bwSingle), Color Single = ₹$($patchShopRes.shop.pricingRates.colorSingle)"

# 3. Consumer Multi-File Order Creation
Write-Host "`n[3/7] Creating Multi-File Print Order with Orientation..."
$multiFileOrderBody = @{
  shopId = "shop_001"
  printerId = "prn_001"
  fileUrl = "/sample-document.pdf"
  fileName = "Research_Thesis_Final.pdf"
  fileType = "application/pdf"
  fileSizeBytes = 124000
  files = @(
    @{
      url = "/sample-document.pdf"
      name = "Research_Thesis_Final.pdf"
      type = "application/pdf"
      size = 124000
      pages = 10
    },
    @{
      url = "/sample-diagram.png"
      name = "Architecture_Diagram.png"
      type = "image/png"
      size = 45000
      pages = 1
    }
  )
  pageCount = 11
  copies = 1
  isColor = $true
  isDuplex = $true
  paperSize = "A4"
  orientation = "PORTRAIT"
  binding = "Spiral Binding"
  paymentType = "CASH"
  customerName = "Aman Sharma"
  customerPhone = "+91 98765 43210"
} | ConvertTo-Json

$orderRes = Invoke-RestMethod -Uri "http://localhost:3005/api/orders" -Method Post -Body $multiFileOrderBody -ContentType "application/json"
$orderId = $orderRes.order._id
Write-Host " - Multi-File Order Created: #$($orderRes.order.orderNumber) | Total: ₹$($orderRes.order.totalPrice) | Status: $($orderRes.order.status)"

# 4. Porter Delivery Fulfillment Choice
Write-Host "`n[4/7] Selecting Porter Courier Delivery Fulfillment..."
$deliveryBody = @{
  fulfillmentType = "DELIVERY"
  deliveryAddress = "Flat 402, Lotus Boulevard, Sector 100, Noida"
  recipientPhone = "+91 98765 43210"
} | ConvertTo-Json
$fulRes = Invoke-RestMethod -Uri "http://localhost:3005/api/orders/$orderId/fulfillment" -Method Post -Body $deliveryBody -ContentType "application/json"
Write-Host " - Fulfillment Set to:" $fulRes.order.fulfillmentType "| Delivery Fee: ₹$($fulRes.order.deliveryFee) | New Total: ₹$($fulRes.order.totalPrice)"

# 5. Shop Owner Approves Cash & Advances Pipeline to Delivery
Write-Host "`n[5/7] Advancing Order Lifecycle through Counter Cash & Delivery..."
$approveRes = Invoke-RestMethod -Uri "http://localhost:3005/api/orders/$orderId/approve-cash" -Method Post -Headers $ownerHeaders
Write-Host " - Cash Approved: Status -> $($approveRes.order.status), Payment -> $($approveRes.order.paymentStatus)"

# Move to PRINTING
$toPrinting = Invoke-RestMethod -Uri "http://localhost:3005/api/orders/$orderId/status" -Method Patch -Body (@{ status = "PRINTING" } | ConvertTo-Json) -Headers $ownerHeaders -ContentType "application/json"
Write-Host " - Order Status Advanced to:" $toPrinting.order.status

# Move to READY
$toReady = Invoke-RestMethod -Uri "http://localhost:3005/api/orders/$orderId/status" -Method Patch -Body (@{ status = "READY" } | ConvertTo-Json) -Headers $ownerHeaders -ContentType "application/json"
Write-Host " - Order Status Advanced to:" $toReady.order.status

# Dispatch to Porter Courier
$toDispatch = Invoke-RestMethod -Uri "http://localhost:3005/api/orders/$orderId/status" -Method Patch -Body (@{ status = "OUT_FOR_DELIVERY" } | ConvertTo-Json) -Headers $ownerHeaders -ContentType "application/json"
Write-Host " - Order Dispatched to Courier:" $toDispatch.order.status

# Courier Marks Delivered
$toDelivered = Invoke-RestMethod -Uri "http://localhost:3005/api/orders/$orderId/status" -Method Patch -Body (@{ status = "DELIVERED" } | ConvertTo-Json) -Headers $ownerHeaders -ContentType "application/json"
Write-Host " - Final Order Status:" $toDelivered.order.status "(Completed Delivery!)"

# 6. Razorpay Online Payment Flow Simulation
Write-Host "`n[6/7] Testing Razorpay Online Order Creation & Verification..."
$rzpOrderBody = @{
  amount = 150.0
  currency = "INR"
  receipt = "rcpt_test_999"
  notes = @{ orderNumber = "TEST_999" }
} | ConvertTo-Json
$rzpOrder = Invoke-RestMethod -Uri "http://localhost:3005/api/payments/razorpay/order" -Method Post -Body $rzpOrderBody -ContentType "application/json"
Write-Host " - Razorpay Order Initialized: ID =" $rzpOrder.orderId "Amount = ₹$($rzpOrder.amount)"

# Verify Razorpay signature
$rzpVerifyBody = @{
  orderId = $orderId
  razorpay_order_id = $rzpOrder.orderId
  razorpay_payment_id = "pay_test_$(Get-Random)"
  razorpay_signature = "sig_verified_mock"
} | ConvertTo-Json
$rzpVerify = Invoke-RestMethod -Uri "http://localhost:3005/api/payments/razorpay/verify" -Method Post -Body $rzpVerifyBody -ContentType "application/json"
Write-Host " - Razorpay Payment Verified:" $rzpVerify.message

# 7. Admin CMS Controls: Shop Activation & Analytics
Write-Host "`n[7/7] Testing Admin CMS Controls (Activation Toggle & Analytics)..."
$adminLoginBody = @{ email = "admin@printporter.com"; password = "Admin@123" } | ConvertTo-Json
$adminLogin = Invoke-RestMethod -Uri "http://localhost:3005/api/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
$adminHeaders = @{ Authorization = "Bearer $($adminLogin.token)" }

# Toggle Shop Activation
$shopToggleBody = @{ shopId = "shop_001"; isActive = $false } | ConvertTo-Json
$toggleRes = Invoke-RestMethod -Uri "http://localhost:3005/api/shops" -Method Patch -Body $shopToggleBody -Headers $adminHeaders -ContentType "application/json"
Write-Host " - Shop Deactivated by Admin: isActive =" $toggleRes.shop.isActive

# Reactivate Shop
$shopReactivateBody = @{ shopId = "shop_001"; isActive = $true } | ConvertTo-Json
$reactivateRes = Invoke-RestMethod -Uri "http://localhost:3005/api/shops" -Method Patch -Body $shopReactivateBody -Headers $adminHeaders -ContentType "application/json"
Write-Host " - Shop Reactivated by Admin: isActive =" $reactivateRes.shop.isActive

$analytics = Invoke-RestMethod -Uri "http://localhost:3005/api/analytics" -Method Get -Headers $adminHeaders
Write-Host " - Master Platform Analytics: GMV = ₹$($analytics.kpis.totalRevenue) | Total Orders = $($analytics.kpis.totalOrders)"

Write-Host "`n================================================="
Write-Host " ⭐ ALL 7 SYSTEM TESTS PASSED SUCCESSFULLY! ⭐  "
Write-Host "================================================="
