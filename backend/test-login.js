const http = require('http');

async function test() {
  try {
    const ts = Date.now();
    const email = 'login_test_' + ts + '@example.com';
    const username = 'testuser_' + ts;
    const password = 'StrongPassword123';
    
    console.log('Registering...', email, username);
    const regRes = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const regData = await regRes.json();
    console.log('Register output:', regRes.status, regData);

    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    console.log('Login output:', loginRes.status, loginData);

  } catch(e) {
    console.error('Test failed:', e);
  }
}

test();
