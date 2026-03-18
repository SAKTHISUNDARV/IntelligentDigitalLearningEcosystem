const axios = require('axios');

async function testChat() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'alice@idle.dev',
            password: 'Admin@1234'
        });
        const token = loginRes.data.token;
        console.log('Login successful. Token acquired.');

        // 2. Call Chat
        console.log('Calling /api/chat...');
        const chatRes = await axios.post('http://localhost:5000/api/chat',
            { message: 'What is React?' },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Chat response:', chatRes.data.reply);
    } catch (err) {
        console.error('ERROR:', err.response?.status, err.response?.data || err.message);
    }
}

testChat();
