// Comprehensive automated test for Printer Shop Counter Desk Standee & UPI Hub
const BASE_URL = 'http://localhost:3005';

async function runTests() {
  console.log('--- Testing Printer Shop Counter Desk Standee & UPI Hub ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      failed++;
    }
  }

  try {
    // 1. Check Dashboard Route
    const dashRes = await fetch(`${BASE_URL}/printer/dashboard`);
    assert(dashRes.status === 200, 'Printer Dashboard route loads (HTTP 200)');

    // 2. Check Logo Asset
    const logoRes = await fetch(`${BASE_URL}/logo.png`);
    assert(logoRes.status === 200, '3D Logo asset is accessible (HTTP 200)');

    // 3. Check Shop Detail & Initial UPI
    const shopRes = await fetch(`${BASE_URL}/api/shops/shop_001`);
    assert(shopRes.status === 200, 'Shop detail API returns shop_001 data');
    const shopData = await shopRes.json();
    assert(shopData.shop && shopData.shop.name, `Shop name is "${shopData.shop?.name}"`);

    // 4. Shop Owner Login to get auth token
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rajesh@cyberprint.com',
        password: 'Shop@123',
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.token, 'Shop owner login succeeded and token received');

    // 5. Test Updating Shop UPI Settings (PUT /api/shops/shop_001)
    const testUpiId = 'apexprint@okaxis';
    const updateUpiRes = await fetch(`${BASE_URL}/api/shops/shop_001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginData.token}`,
      },
      body: JSON.stringify({
        upiId: testUpiId,
        upiQrUrl: '',
      }),
    });
    assert(updateUpiRes.status === 200, 'Shop UPI settings updated successfully (HTTP 200)');
    const updateData = await updateUpiRes.json();
    assert(updateData.shop && updateData.shop.upiId === testUpiId, `Updated UPI ID matches: ${updateData.shop?.upiId}`);

    // 6. Test Customer Portal Order Page for this shop
    const customerPortalRes = await fetch(`${BASE_URL}/shop/shop_001`);
    assert(customerPortalRes.status === 200, 'Customer walk-in ordering portal loads (HTTP 200)');

    // 7. Verify All Dashboard Routes
    const routes = [
      '/',
      '/login',
      '/printer/dashboard',
      '/khushi-admin',
      '/shop/shop_001',
    ];
    for (const route of routes) {
      const res = await fetch(`${BASE_URL}${route}`);
      assert(res.status === 200, `Route ${route} is active (HTTP 200)`);
    }

    console.log(`\nResults: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test run encountered error:', err);
    process.exit(1);
  }
}

runTests();
