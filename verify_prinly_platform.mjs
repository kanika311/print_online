// Comprehensive Verification Script for Prinly.in Platform
async function runPrinlyVerification() {
  const baseUrl = 'http://localhost:3005';
  console.log('🚀 Starting Prinly.in Platform Verification Tests on', baseUrl);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Verify CMS API
    console.log('\n--- Test 1: CMS API Configuration ---');
    const cmsRes = await fetch(`${baseUrl}/api/cms`);
    assert(cmsRes.status === 200, `GET /api/cms status is 200 (got ${cmsRes.status})`);
    const cmsData = await cmsRes.json();
    assert(cmsData.success === true, 'CMS response success is true');
    assert(Boolean(cmsData.cms?.hero), 'CMS hero configuration present');
    assert(Boolean(cmsData.cms?.roles?.userCard), 'CMS role userCard present');
    assert(Boolean(cmsData.cms?.roles?.printerCard), 'CMS role printerCard present');
    assert(Boolean(cmsData.cms?.footer?.logoText), `CMS footer logo text: "${cmsData.cms?.footer?.logoText}"`);

    // 2. Verify Legal Policy CMS Endpoints
    console.log('\n--- Test 2: Legal Policy Slug API ---');
    const termsRes = await fetch(`${baseUrl}/api/cms/terms`);
    assert(termsRes.status === 200, 'GET /api/cms/terms returns 200');
    const termsData = await termsRes.json();
    assert(termsData.title === 'Terms and Conditions', `Terms title matches: "${termsData.title}"`);
    assert(termsData.content.includes('Prinly'), 'Terms content contains Prinly');

    const privacyRes = await fetch(`${baseUrl}/api/cms/privacy-policy`);
    assert(privacyRes.status === 200, 'GET /api/cms/privacy-policy returns 200');

    const refundRes = await fetch(`${baseUrl}/api/cms/refund-policy`);
    assert(refundRes.status === 200, 'GET /api/cms/refund-policy returns 200');

    // 3. Verify Admin Authentication & CMS Modification
    console.log('\n--- Test 3: Admin Auth & Live CMS Modification ---');
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@printporter.com', password: 'Admin@123' }),
    });
    assert(adminLoginRes.status === 200, 'Admin login succeeded (200)');
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;
    assert(Boolean(adminToken), 'Admin token received');

    // Modify CMS Hero Headline
    const testHeadline = 'Printed Nearby in 2026.';
    const updateCmsRes = await fetch(`${baseUrl}/api/cms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        action: 'PUBLISH',
        cms: {
          ...cmsData.cms,
          hero: {
            ...cmsData.cms.hero,
            headlinePart2: testHeadline,
          },
        },
      }),
    });
    assert(updateCmsRes.status === 200, 'POST /api/cms publish succeeded (200)');

    // Verify published change
    const verifyCmsRes = await fetch(`${baseUrl}/api/cms`);
    const verifyCmsData = await verifyCmsRes.json();
    assert(
      verifyCmsData.cms?.hero?.headlinePart2 === testHeadline,
      `CMS live update verified: "${verifyCmsData.cms?.hero?.headlinePart2}"`
    );

    // 4. Verify Printer Owner Onboarding Wizard API
    console.log('\n--- Test 4: Printer Owner Self-Onboarding Wizard API ---');
    const rnd = Math.floor(1000 + Math.random() * 9000);
    const onboardPayload = {
      ownerName: `Suresh Hub ${rnd}`,
      ownerEmail: `suresh${rnd}@prinlytest.com`,
      ownerPhone: `98700${rnd}`,
      password: 'HubPassword@123',
      shopName: `Metro Fast Prints #${rnd}`,
      address: `Gate 1, Metro Concourse #${rnd}`,
      city: 'Delhi',
      area: 'North Campus',
      pincode: '110007',
      printerName: 'Epson EcoTank L15150',
      printerModel: 'L15150 High Speed Color',
      printerType: 'COLOR',
      bwPrice: 2.0,
      colorPrice: 10.0,
      duplexPrice: 3.5,
      supportsDuplex: true,
      paperSizes: ['A4', 'A3', 'Legal'],
      bindingAvailability: true,
    };

    const onboardRes = await fetch(`${baseUrl}/api/shops/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(onboardPayload),
    });
    assert(onboardRes.status === 200, `POST /api/shops/onboard succeeded (200)`);
    const onboardData = await onboardRes.json();
    assert(Boolean(onboardData.token), 'Printer owner auth token issued');
    assert(onboardData.user?.role === 'SHOP_OWNER', `User role is SHOP_OWNER`);
    assert(Boolean(onboardData.shop?._id), `Shop created with ID: ${onboardData.shop?._id}`);
    assert(onboardData.shop?.pricingRates?.bwSingle === 2.0, 'Shop pricing configured correctly');

    // 5. Verify Hub Page and QR Route
    console.log('\n--- Test 5: Hub Page & Shop Listing ---');
    const shopsRes = await fetch(`${baseUrl}/api/shops`);
    const shopsData = await shopsRes.json();
    const createdShopFound = shopsData.shops?.some((s) => s.name.includes(String(rnd)));
    assert(createdShopFound, `Newly onboarded hub appears in /api/shops list`);

    const hubPageRes = await fetch(`${baseUrl}/hub/${onboardData.shop?._id}`);
    assert(hubPageRes.status === 200, `GET /hub/${onboardData.shop?._id} returns status 200`);

    // 6. Verify Customer Login
    console.log('\n--- Test 6: Customer Login ---');
    const custLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aman@student.edu', password: 'User@123' }),
    });
    assert(custLoginRes.status === 200, 'Customer login succeeded (200)');
    const custData = await custLoginRes.json();
    assert(custData.user?.role === 'CUSTOMER', `Customer role confirmed: ${custData.user?.role}`);

    // Summary
    console.log('\n=======================================');
    console.log(`Verification Finished: ${passed} Passed, ${failed} Failed`);
    console.log('=======================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test script crashed:', err);
    process.exit(1);
  }
}

runPrinlyVerification();
