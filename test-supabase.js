// Direct test of Supabase connection using Node.js
const SUPABASE_URL = 'https://srcnlbdybejvcbvvdpbk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyY25sYmR5YmVqdmNidnZkcGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0OTU3MDYsImV4cCI6MjA4NTA3MTcwNn0.qLj0ClnWgAfxbtZ1P6O2c6TELdevpqerqOnjKGqhaZ8';

// Test REST API
const url = `${SUPABASE_URL}/rest/v1/products?select=*`;
console.log('Testing REST API:', url);
console.log('Auth header:', `Bearer ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

fetch(url, {
    headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
    }
})
.then(res => {
    console.log(`Response status: ${res.status}`);
    console.log(`Response headers:`, Object.fromEntries(res.headers));
    return res.json();
})
.then(data => {
    console.log('Response data:', data);
    if (Array.isArray(data)) {
        console.log(`✓ Got ${data.length} products`);
        data.forEach(p => {
            console.log(`  - ${p.name}: $${p.price}`);
        });
    }
})
.catch(err => {
    console.error('Error:', err.message);
});
