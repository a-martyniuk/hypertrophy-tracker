
const fetch = require('node-fetch');

async function verify() {
    const url = 'https://fojnenjfdndtnwlzsnzy.supabase.co';
    const key = 'sb_publishable_2TGNI3VeU0xflpXd3fSA8A_mZ4xUMDB'; // Taking this from .env literal

    console.log('--- DB Verification ---');
    console.log('Querying body_records...');

    try {
        const response = await fetch(`${url}/rest/v1/body_records?select=*`, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}` // Usually anon key works as bearer for anon selects if allowed
            }
        });

        if (!response.ok) {
            const body = await response.text();
            console.error(`Error ${response.status}: ${body}`);
            return;
        }

        const data = await response.json();
        console.log(`Total records found: ${data.length}`);
        if (data.length > 0) {
            console.log('Latest record:', data[0]);
        }
    } catch (err) {
        console.error('Fatal error:', err);
    }
}

verify();
