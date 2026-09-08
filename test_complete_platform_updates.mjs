// Test script for logo, subscription plans CRUD, CMS, and page routes
const BASE_URL = 'http://localhost:3005';
let adminToken = '';

async function loginAdmin() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@printporter.com',
      password: 'Admin@123',
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(data));
  }
  adminToken = data.token;
  console.log('✓ Admin authenticated successfully.');
}

async function testLogo() {
  const res = await fetch(`${BASE_URL}/logo.png`);
  if (!res.ok) {
    throw new Error(`logo.png returned status ${res.status}`);
  }
  const contentType = res.headers.get('content-type');
  const size = (await res.arrayBuffer()).byteLength;
  console.log(`✓ logo.png is accessible (HTTP ${res.status}, ${contentType}, ${size} bytes).`);
}

async function testPlansCrud() {
  const testPlanId = `plan_test_${Date.now()}`;

  // 1. Create Plan (POST)
  const createRes = await fetch(`${BASE_URL}/api/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      id: testPlanId,
      name: 'Ultra High-Speed Campus Fleet',
      priceMonthly: 899,
      priceYearly: 8990,
      maxPrinters: 8,
      commissionRate: 2.5,
      features: ['8 High-Speed Network Printers', 'Priority Spooling', 'Direct Standee QR'],
      isPopular: true,
      isActive: true,
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData.success) {
    throw new Error('Create Plan failed: ' + JSON.stringify(createData));
  }
  console.log('✓ Plan created successfully:', createData.plan?.name);

  // 2. Edit Plan (PATCH)
  const patchRes = await fetch(`${BASE_URL}/api/plans`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      id: testPlanId,
      name: 'Ultra High-Speed Campus Fleet (PRO EDITED)',
      priceMonthly: 1099,
      priceYearly: 10990,
      maxPrinters: 12,
      commissionRate: 1.8,
      isPopular: true,
      isActive: true,
      features: ['12 High-Speed Network Printers', 'Priority Spooling', 'Dedicated Standee QR Stand'],
    }),
  });
  const patchData = await patchRes.json();
  if (!patchRes.ok || !patchData.success) {
    throw new Error('Edit Plan (PATCH) failed: ' + JSON.stringify(patchData));
  }
  console.log('✓ Plan edited (PATCH) successfully:', patchData.plan?.name, 'Price: ₹' + patchData.plan?.priceMonthly, 'Printers:', patchData.plan?.maxPrinters);

  // 3. Verify in GET /api/plans
  const getRes = await fetch(`${BASE_URL}/api/plans`);
  const getData = await getRes.json();
  const found = getData.plans?.find((p) => p._id === testPlanId || p.id === testPlanId);
  if (!found || found.priceMonthly !== 1099 || found.maxPrinters !== 12) {
    throw new Error('Verification failed: Edited plan data does not match GET /api/plans');
  }
  console.log('✓ GET /api/plans verified edited data accurately.');

  // 4. Delete Plan (DELETE)
  const delRes = await fetch(`${BASE_URL}/api/plans?id=${testPlanId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  const delData = await delRes.json();
  if (!delRes.ok || !delData.success) {
    throw new Error('Delete Plan failed: ' + JSON.stringify(delData));
  }
  console.log('✓ Plan deleted successfully.');
}

async function testCmsEndpoints() {
  // 1. Fetch CMS draft
  const res = await fetch(`${BASE_URL}/api/cms?draft=true`);
  const data = await res.json();
  if (!res.ok || !data.cms) {
    throw new Error('GET /api/cms failed: ' + JSON.stringify(data));
  }
  console.log('✓ CMS config fetched. Status:', data.cms.status, 'Hero Part 1:', data.cms.hero?.headlinePart1);

  // 2. Update CMS draft
  const updatedCms = {
    ...data.cms,
    hero: {
      ...data.cms.hero,
      badge: 'Smart Cyber Cafe Print Network • Instant Standee QR Printing',
    },
  };

  const postDraftRes = await fetch(`${BASE_URL}/api/cms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      action: 'DRAFT',
      cms: updatedCms,
    }),
  });
  const draftResult = await postDraftRes.json();
  if (!postDraftRes.ok || !draftResult.success) {
    throw new Error('Save CMS Draft failed: ' + JSON.stringify(draftResult));
  }
  console.log('✓ CMS draft saved successfully.');

  // 3. Publish CMS Live
  const publishRes = await fetch(`${BASE_URL}/api/cms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      action: 'PUBLISH',
      cms: updatedCms,
    }),
  });
  const pubResult = await publishRes.json();
  if (!publishRes.ok || !pubResult.success) {
    throw new Error('Publish CMS failed: ' + JSON.stringify(pubResult));
  }
  console.log('✓ CMS published live successfully. Message:', pubResult.message);
}

async function testPages() {
  const routes = [
    '/',
    '/login',
    '/register',
    '/user/dashboard',
    '/printer/dashboard',
    '/printer/register',
    '/khushi-admin',
  ];

  for (const route of routes) {
    const res = await fetch(`${BASE_URL}${route}`);
    if (res.status >= 500) {
      throw new Error(`Route ${route} returned server error ${res.status}`);
    }
    console.log(`✓ Route ${route} responded with HTTP ${res.status}`);
  }
}

async function run() {
  console.log('--- STARTING PLATFORM UPDATE VERIFICATION ---');
  await testLogo();
  await loginAdmin();
  await testPlansCrud();
  await testCmsEndpoints();
  await testPages();
  console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
}

run().catch((err) => {
  console.error('❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
