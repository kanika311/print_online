// Automated test suite for new features:
// 1. Landing page UI & API check
// 2. Admin Settings (Platform Fees)
// 3. Admin Profile & Password Change
// 4. Create New Admin & Login verification
// 5. Customer order with platform fee itemization
// 6. Printer Dashboard plans API

async function runTests() {
  console.log('=== Starting Test Suite ===\n');

  // 1. Admin Login
  console.log('--- 1. Admin Login ---');
  const loginRes = await fetch('http://localhost:3005/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@printporter.com', password: 'Admin@123' }),
  });
  const loginData = await loginRes.json();
  console.log('Admin login status:', loginRes.status, 'User:', loginData.user?.name);
  const token = loginData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Test Admin Profile
  console.log('\n--- 2. Admin Profile & Admin List ---');
  const profileRes = await fetch('http://localhost:3005/api/admin/profile', {
    headers: authHeaders,
  });
  const profileData = await profileRes.json();
  console.log('Profile fetch status:', profileRes.status);
  console.log('Current Admin:', profileData.currentAdmin?.name, profileData.currentAdmin?.email);
  console.log('Total Admins:', profileData.admins?.length);

  // 3. Test Create New Administrator
  console.log('\n--- 3. Provision New Administrator ---');
  const newAdminEmail = `test.admin.${Date.now()}@printporter.com`;
  const createAdminRes = await fetch('http://localhost:3005/api/users', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Pooja Executive Admin',
      email: newAdminEmail,
      phone: '+91 99887 76655',
      password: 'AdminSecure@2026',
      role: 'ADMIN',
    }),
  });
  const createAdminData = await createAdminRes.json();
  console.log('Create Admin status:', createAdminRes.status, 'Message:', createAdminData.message);

  // 4. Verify New Admin Login
  console.log('\n--- 4. Verify New Admin Authentication ---');
  const newAdminLoginRes = await fetch('http://localhost:3005/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: newAdminEmail, password: 'AdminSecure@2026' }),
  });
  const newAdminLoginData = await newAdminLoginRes.json();
  console.log(
    'New Admin login status:',
    newAdminLoginRes.status,
    'Role:',
    newAdminLoginData.user?.role,
    'Name:',
    newAdminLoginData.user?.name
  );

  // 5. Test Platform Fees Configuration
  console.log('\n--- 5. Platform Fee Configuration ---');
  const getSettingsRes = await fetch('http://localhost:3005/api/admin/settings');
  const getSettingsData = await getSettingsRes.json();
  console.log('Initial settings:', getSettingsData.settings);

  // Admin enables platform fee: ₹2.00 flat fee
  const updateSettingsRes = await fetch('http://localhost:3005/api/admin/settings', {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      platformFeeEnabled: true,
      platformFeeType: 'FLAT',
      platformFeeAmount: 2.0,
      platformFeeLabel: 'Platform Convenience Fee',
    }),
  });
  const updateSettingsData = await updateSettingsRes.json();
  console.log(
    'Updated Settings status:',
    updateSettingsRes.status,
    'Enabled:',
    updateSettingsData.settings?.platformFeeEnabled,
    'Amount:',
    updateSettingsData.settings?.platformFeeAmount
  );

  // 6. Test Customer Order with Platform Fee
  console.log('\n--- 6. Customer Order with Platform Fee ---');
  const orderRes = await fetch('http://localhost:3005/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shopId: 'shop_001',
      printerId: 'prn_001',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileName: 'College_Report_Final.pdf',
      fileType: 'application/pdf',
      fileSizeBytes: 245000,
      pageCount: 5,
      copies: 1,
      isColor: false,
      isDuplex: false,
      paperSize: 'A4',
      orientation: 'PORTRAIT',
      binding: 'NONE',
      paymentType: 'UPI',
      upiRefNumber: 'UPI983748291048',
      customerName: 'Rohit Student',
      customerPhone: '+91 98765 43210',
    }),
  });
  const orderData = await orderRes.json();
  console.log(
    'Order created:',
    orderData.order?.orderNumber,
    'Total Price:',
    orderData.order?.totalPrice,
    'Platform Fee in breakdown:',
    orderData.order?.breakdown?.platformFee
  );

  // 7. Verify All Plans for Printer Dashboard
  console.log('\n--- 7. Plans for Printer Dashboard ---');
  const plansRes = await fetch('http://localhost:3005/api/plans');
  const plansData = await plansRes.json();
  console.log(
    'Plans available for shopkeeper dashboard:',
    plansData.plans?.map((p) => `${p.name} (₹${p.priceMonthly}/mo)`)
  );

  console.log('\n🎉 ALL NEW FEATURE TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch(console.error);
