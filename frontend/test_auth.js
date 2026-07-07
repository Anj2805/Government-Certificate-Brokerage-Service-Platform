const API = 'http://localhost:5001/api/v1';

async function run() {
  try {
    // 1. Register Citizen A
    const aRes = await fetch(`${API}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Cit', lastName: 'A', email: `cita_${Date.now()}@example.com`,
        phone: `99${Date.now().toString().slice(-8)}`, password: 'Password123', role: 'citizen'
      })
    }).then(r => r.json());
    if(!aRes.data) throw new Error("A reg failed: " + JSON.stringify(aRes));
    const tokenA = aRes.data.tokens.accessToken;

    // 2. Register Citizen B
    const bRes = await fetch(`${API}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Cit', lastName: 'B', email: `citb_${Date.now()}@example.com`,
        phone: `88${Date.now().toString().slice(-8)}`, password: 'Password123', role: 'citizen'
      })
    }).then(r => r.json());
    if(!bRes.data) throw new Error("B reg failed: " + JSON.stringify(bRes));
    const tokenB = bRes.data.tokens.accessToken;

    // 3. Citizen A creates a request
    const servicesRes = await fetch(`${API}/services?limit=1`).then(r => r.json());
    const serviceId = servicesRes.data.services[0]._id;

    const reqRes = await fetch(`${API}/requests`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ serviceId, status: 'draft', applicationData: {} })
    }).then(r => r.json());
    const requestId = reqRes.data.request._id;
    console.log(`Citizen A created request: ${requestId}`);

    // 4. Citizen B tries to GET the request
    const getRes = await fetch(`${API}/requests/${requestId}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    if (getRes.status === 200) console.error('FAIL: Citizen B was able to fetch!');
    else console.log(`Citizen B fetch failed as expected: ${getRes.status}`);

    // 5. Citizen B tries to SUBMIT the request
    const subRes = await fetch(`${API}/requests/${requestId}/submit`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${tokenB}` }
    });
    if (subRes.status === 200) console.error('FAIL: Citizen B was able to submit!');
    else console.log(`Citizen B submit failed as expected: ${subRes.status}`);

  } catch (err) {
    console.error('Test error:', err);
  }
}

run();
