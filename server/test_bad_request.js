const axios = require('axios');
require('dotenv').config();

async function testAI() {
    const key = process.env.OPENROUTER_API_KEY;
    const systemPrompt = {
        role: 'user',
        content: `Instructions: You are IDLE Assistant...`
    };

    const conversationMessages = [
        { role: 'user', content: 'Hello' }
    ];

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemma-3-4b-it:free',
            messages: [systemPrompt, ...conversationMessages],
            temperature: 0.6,
            max_tokens: 1000
        }, {
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Status:', response.status);
        console.log('Response:', response.data.choices[0].message.content);
    } catch (err) {
        console.error('ERROR:', err.response?.status, JSON.stringify(err.response?.data, null, 2) || err.message);
    }
}

testAI();
