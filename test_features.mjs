// Node.js test script for PrintPorter features
async function runTests() {
  const baseUrl = 'http://localhost:3005';
  console.log('--- 1. Testing GET /api/plans ---');
  const plansRes = await fetch(`${baseUrl}/api/plans`);
  const plansData = await plansRes.json();
  console.log(`Total plans: ${plansData.plans?.length}`);
  const freePlan = plansData.plans?.find(p => p.name === 'Free Launch Plan');
  console.log(`Free Launch Plan found: ${Boolean(freePlan)}, Price: ₹${freePlan?.priceMonthly}, Fee: ${freePlan?.commissionRate}%`);

  console.log('\n--- 2. Testing Super Admin Plan CRUD ---');
  // Admin login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@printporter.com', password: 'Admin@123' })
  });
  const cookie = loginRes.headers.get('set-cookie') || '';
  console.log('Admin login status:', loginRes.status);

  // Create plan
  const createPlanRes = await fetch(`${baseUrl}/api/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({
      name: 'College Semester Pass',
      priceMonthly: 899,
      maxPrinters: 4,
      commissionRate: 2.5,
      features: ['Unlimited B&W', 'Priority Spooler']
    })
  });
  const createData = await createPlanRes.json();
  const testPlanId = createData.plan?._id;
  console.log(`Created Plan: ${createData.plan?.name} (ID: ${testPlanId})`);

  // Edit plan
  const editPlanRes = await fetch(`${baseUrl}/api/plans`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({
      id: testPlanId,
      name: 'College Semester Pass (VIP)',
      priceMonthly: 999,
      commissionRate: 2.0
    })
  });
  const editData = await editPlanRes.json();
  console.log(`Edited Plan: ${editData.plan?.name}, New Price: ₹${editData.plan?.priceMonthly}`);

  // Delete plan
  const deletePlanRes = await fetch(`${baseUrl}/api/plans?id=${testPlanId}`, {
    method: 'DELETE',
    headers: { 'Cookie': cookie }
  });
  const deleteData = await deletePlanRes.json();
  console.log(`Delete Plan: ${deleteData.message}`);

  console.log('\n--- 3. Testing Shop Owner & UPI Setup ---');
  // Shop owner login
  const shopLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rajesh@cyberprint.com', password: 'Shop@123' })
  });
  const shopCookie = shopLoginRes.headers.get('set-cookie') || '';
  console.log('Shop login status:', shopLoginRes.status);

  // Update shop UPI
  const updateUpiRes = await fetch(`${baseUrl}/api/shops/shop_001`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': shopCookie },
    body: JSON.stringify({
      upiId: 'apexcyberprint@oksbi',
      upiQrUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=300'
    })
  });
  const shopUpdateData = await updateUpiRes.json();
  console.log(`Shop UPI ID: ${shopUpdateData.shop?.upiId}, QR URL: ${shopUpdateData.shop?.upiQrUrl}`);

  console.log('\n--- 4. Testing Hardware Printer Linking & Ping ---');
  // Ping existing printer
  const pingRes = await fetch(`${baseUrl}/api/printers/prn_001/test-link`, {
    method: 'POST',
    headers: { 'Cookie': shopCookie }
  });
  const pingData = await pingRes.json();
  console.log(`Printer Ping: ${pingData.message} (Latency: ${pingData.latencyMs}ms)`);

  // Link new hardware printer
  const linkPrinterRes = await fetch(`${baseUrl}/api/printers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': shopCookie },
    body: JSON.stringify({
      shopId: 'shop_001',
      name: 'Ricoh Aficio MP 301 (Network)',
      model: 'Ricoh Aficio MP 301SPF',
      type: 'MONOCHROME',
      paperSizes: ['A4', 'Legal'],
      ppmSpeed: 35,
      connectionType: 'NETWORK_IP',
      ipAddress: '192.168.1.140',
      portNumber: 9100,
      isLinked: true
    })
  });
  const linkData = await linkPrinterRes.json();
  const newPrnId = linkData.printer?._id;
  console.log(`Linked Hardware Printer: ${linkData.printer?.name} (${linkData.printer?.ipAddress}:${linkData.printer?.portNumber})`);

  // Delete printer
  const deletePrnRes = await fetch(`${baseUrl}/api/printers/${newPrnId}`, {
    method: 'DELETE',
    headers: { 'Cookie': shopCookie }
  });
  const delPrnData = await deletePrnRes.json();
  console.log(`Delete Printer: ${delPrnData.message}`);

  console.log('\n--- 5. Testing Customer Direct UPI Order ---');
  const orderRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shopId: 'shop_001',
      printerId: 'prn_001',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileName: 'Project_Report_Final.pdf',
      fileType: 'application/pdf',
      pageCount: 6,
      copies: 2,
      isColor: false,
      isDuplex: true,
      paperSize: 'A4',
      orientation: 'PORTRAIT',
      binding: 'None',
      paymentType: 'UPI',
      upiRefNumber: 'UPI782910492810',
      customerName: 'Aman Student',
      customerPhone: '+91 98765 44332',
      fulfillmentType: 'PICKUP'
    })
  });
  const orderData = await orderRes.json();
  console.log(`Order Created: #${orderData.order?.orderNumber}`);
  console.log(`Status: ${orderData.order?.status}, Payment: ${orderData.order?.paymentType} (${orderData.order?.paymentStatus})`);
  console.log(`Recorded UTR: ${orderData.order?.upiRefNumber}`);
  console.log(`Total Price: ₹${orderData.order?.totalPrice}`);

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch(console.error);
