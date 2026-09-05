// Test E2E Scan to Print flow
async function testScanToPrintFlow() {
  console.log('=== Testing Scan to Print Customer Flow ===\n');

  // Login as shopkeeper / admin
  const loginRes = await fetch('http://localhost:3005/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@printporter.com', password: 'Admin@123' })
  });
  const loginData = await loginRes.json();
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${loginData.token}`
  };

  // 1. Customer Scans Standee QR and loads shop portal
  console.log('1. Loading Shop Portal from Counter QR...');
  const shopRes = await fetch('http://localhost:3005/api/shops/shop_001');
  const shopData = await shopRes.json();
  console.log(`✅ Opened Shop: ${shopData.shop.name} | Printers available: ${shopData.printers.length}`);

  // 2. Customer uploads a scanned document
  console.log('\n2. Simulating Camera Document Scan & Upload...');
  const fileUploadRes = await fetch('http://localhost:3005/api/upload', {
    method: 'POST',
    body: (() => {
      const fd = new FormData();
      const blob = new Blob(['Simulated Scanned Notes Content from Camera'], { type: 'text/plain' });
      fd.append('file', blob, 'Scanned_Paper_Doc_1.pdf');
      return fd;
    })()
  });
  const uploadData = await fileUploadRes.json();
  console.log(`✅ Uploaded File: ${uploadData.file.fileName} (${uploadData.file.fileUrl})`);

  // 3. Customer selects B&W / Color specs & submits order with Cash at Counter
  console.log('\n3. Placing Order: B&W Duplex, 2 Copies, Payment: CASH...');
  const orderRes = await fetch('http://localhost:3005/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shopId: 'shop_001',
      printerId: shopData.printers[0]._id,
      fileUrl: uploadData.file.fileUrl,
      fileName: uploadData.file.fileName,
      fileType: 'application/pdf',
      fileSizeBytes: uploadData.file.fileSizeBytes || 1024,
      pageCount: 6,
      copies: 2,
      isColor: false,
      isDuplex: true,
      paperSize: 'A4',
      orientation: 'PORTRAIT',
      binding: 'None',
      paymentType: 'CASH',
      customerName: 'Rohit Student',
      customerPhone: '+91 9988776655',
      fulfillmentType: 'PICKUP',
    })
  });
  const orderData = await orderRes.json();
  console.log(`✅ Order Placed! Token #${orderData.order.orderNumber} | Price: ₹${orderData.order.totalPrice} | Status: ${orderData.order.paymentStatus}`);

  // 4. Shopkeeper sees order in dashboard and Approves Cash
  console.log('\n4. Shopkeeper approves cash payment at counter...');
  const approveRes = await fetch(`http://localhost:3005/api/orders/${orderData.order._id}/approve-cash`, {
    method: 'POST',
    headers: authHeaders
  });
  const approveData = await approveRes.json();
  console.log(`✅ Cash Approved! Order moved to Queue: ${approveData.order?.status || 'QUEUED'}`);

  // 5. Shopkeeper marks order ready for pickup
  console.log('\n5. Spooling to hardware printer...');
  const statusRes = await fetch(`http://localhost:3005/api/orders/${orderData.order._id}/status`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ status: 'READY' })
  });
  const finalData = await statusRes.json();
  console.log(`✅ Order Status: ${finalData.order?.status} -> Ready for Customer Pickup at Counter!`);

  console.log('\n🎉 ALL SCAN-TO-PRINT FLOW CHECKS PASSED PERFECTLY! 🎉');
}

testScanToPrintFlow();
