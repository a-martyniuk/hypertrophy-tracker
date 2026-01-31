
const { createClient } = require('@supabase/supabase-js');

async function debugSession() {
    const url = 'https://fojnenjfdndtnwlzsnzy.supabase.co';
    const anonKey = 'sb_publishable_2TGNI3VeU0xflpXd3fSA8A_mZ4xUMDB';

    const supabase = createClient(url, anonKey);

    console.log('--- Diagnosis Start ---');

    // 1. Check if we can see ANY records anonymously (should be 0 because of RLS)
    const { data: anonData, count } = await supabase
        .from('body_records')
        .select('*', { count: 'exact' });

    console.log('Anon visible records:', anonData?.length || 0);

    // 2. Check table existence and row count (using a trick or just checking metadata)
    // Actually, we can't check count without a service role or a valid user.

    console.log('Advice: Please run the following in Supabase SQL Editor to see who owns the data:');
    console.log(`
    SELECT 'body_records' as table_name, user_id, count(*) 
    FROM body_records 
    GROUP BY user_id;
    
    SELECT 'body_measurements' as table_name, count(*) 
    FROM body_measurements;
  `);

    console.log('--- Diagnosis End ---');
}

debugSession();
