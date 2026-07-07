const axios = require('axios');
const API = 'http://localhost:5001/api/v1';

async function run() {
  try {
    // 1. Register Citizen A
    const aRes = await axios.post(`${API}/auth/register`, {
      firstName: 'Cit', lastName: 'A', email: `cita_${Date.now()}@example.com`,
      phone: `99${Date.now().toString().slice(-8)}`, password: 'Password123', role: 'citizen'
    });
    const tokenA = aRes.data.data.tokens.accessToken;

    // 2. Register Citizen B
    const bRes = await axios.post(`${API}/auth/register`, {
      firstName: 'Cit', lastName: 'B', email: `citb_${Date.now()}@example.com`,
      phone: `88${Date.now().toString().slice(-8)}`, password: 'Password123', role: 'citizen'
    });
    const tokenB = bRes.data.data.tokens.accessToken;

    // 3. Citizen A creates a request (needs a valid service ID, let's fetch one)
    const servicesRes = await axios.get(`${API}/services?limit=1`);
    const serviceId = servicesRes.data.data.services[0]._id;

    const reqRes = await axios.post(`${API}/requests`, {
      serviceId, status: 'draft', applicationData: {}
    }, { headers: { Authorization: `Bearer ${tokenA}` } });
    const requestId = reqRes.data.data.request._id;

    console.log(`Citizen A created request: ${requestId}`);

    // 4. Citizen B tries to GET the request
    try {
      await axios.get(`${API}/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      console.error('FAIL: Citizen B was able to fetch Citizen A request!');
    } catch (e) {
      console.log(`Citizen B fetching Citizen A request failed as expected: ${e.response?.status} - ${e.response?.data?.message}`);
    }

    // 5. Citizen B tries to SUBMIT the request
    try {
      await axios.patch(`${API}/requests/${requestId}/submit`, {}, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      console.error('FAIL: Citizen B was able to submit Citizen A request!');
    } catch (e) {
      console.log(`Citizen B submitting Citizen A request failed as expected: ${e.response?.status} - ${e.response?.data?.message}`);
    }

  } catch (err) {
    console.error('Test error:', err.response?.data || err.message);
  }
}

run();
