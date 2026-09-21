async function testBackend() {
  const tokenRes = await fetch('http://10.0.229.20:30008/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin', password: 'Asdqwe@123' })
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.data?.token;
  console.log('Got token on 30008:', Boolean(token));

  // Search with provinceId=77 (Bà Rịa - Vũng Tàu)
  const searchRes = await fetch('http://10.0.229.20:30008/api/v1/stations/inmarsat?provinceId=77&size=20', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const searchData = await searchRes.json();
  const items = searchData.data?.content || searchData.content || searchData.items || [];
  console.log('Results with provinceId=77: count =', items.length);
  for (const item of items) {
    console.log(`- ${item.code} | ${item.name} | provinceId = ${item.provinceId} | provinceName = ${item.provinceName}`);
  }

  // Also search without provinceId
  const allRes = await fetch('http://10.0.229.20:30008/api/v1/stations/inmarsat?size=20', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const allData = await allRes.json();
  const allItems = allData.data?.content || allData.content || allData.items || [];
  console.log('Results without provinceId: count =', allItems.length);
}

testBackend().catch(console.error);
