const http = require('http');

async function test() {
  try {
    console.log('Registering user...');
    const regRes = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hello' + Math.random() + '@test.com', password: 'password123' })
    });
    const regData = await regRes.json();
    console.log('Register Response:', regData);

    const token = regData.token;
    if (!token) throw new Error('No token received');

    console.log('Creating Record...');
    const recRes = await fetch('http://localhost:4000/api/records', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ amount: 1500, type: 'INCOME', category: 'Freelance', notes: 'First income record!' })
    });
    const recData = await recRes.json();
    console.log('Record Response:', recData);

    console.log('Getting Dashboard Summary...');
    const sumRes = await fetch('http://localhost:4000/api/dashboard/summary', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const sumData = await sumRes.json();
    console.log('Summary Response:', sumData);

  } catch(e) {
    console.error('Test failed:', e);
  }
}

test();
