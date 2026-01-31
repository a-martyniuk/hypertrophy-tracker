
const fetch = require('node-fetch');

async function checkSchema() {
    const url = 'https://fojnenjfdndtnwlzsnzy.supabase.co';
    const key = 'sb_publishable_2TGNI3VeU0xflpXd3fSA8A_mZ4xUMDB';

    console.log('--- Schema Verification ---');

    try {
        // Try to get one record from body_measurements to see columns
        const response = await fetch(`${url}/rest/v1/body_measurements?limit=1`, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Prefer': 'return=representation'
            }
        });

        if (!response.ok) {
            const body = await response.text();
            console.error(`Error ${response.status}: ${body}`);
            return;
        }

        const data = await response.json();
        console.log('Sample body_measurements data:', data);
    } catch (err) {
        console.error('Fatal error:', err);
    }
}

checkSchema();
