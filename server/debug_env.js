const path = require('path');
require('dotenv').config();

console.log('CWD:', process.cwd());
console.log('PORT from env:', process.env.PORT);
console.log('OPENROUTER_API_KEY from env:', process.env.OPENROUTER_API_KEY ? 'Present' : 'Missing');
console.log('__dirname:', __dirname);
console.log('.env path:', path.resolve(process.cwd(), '.env'));
