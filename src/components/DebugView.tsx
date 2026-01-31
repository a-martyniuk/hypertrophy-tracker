import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function DebugView() {
    const [logs, setLogs] = useState<string[]>([]);
    const [authInfo, setAuthInfo] = useState<any>(null);

    const log = (msg: string, data?: any) => {
        const line = `[${new Date().toLocaleTimeString()}] ${msg} ${data ? JSON.stringify(data) : ''}`;
        setLogs(prev => [...prev, line]);
        console.log(msg, data);
    };

    const runDiagnostics = async () => {
        setLogs([]);
        log('--- DIAGNOSTICS START ---');

        // 1. Check Env
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        log(`Env URL: ${url ? url.substring(0, 15) + '...' : 'MISSING'}`);
        log(`Env Key: ${key ? key.substring(0, 5) + '...' : 'MISSING'}`);

        // 2. Check Auth
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) log('Session Error:', sessionError);

        if (session) {
            setAuthInfo(session.user);
            log(`User ID: ${session.user.id}`);
            log(`Email: ${session.user.email}`);
            log(`Role: ${session.user.role}`);
        } else {
            log('NO ACTIVE SESSION');
        }

        // 3. Raw Query (SDK)
        try {
            log('Attempting SDK Query on body_records...');
            const { data, error } = await supabase
                .from('body_records')
                .select('*', { count: 'exact' });

            if (error) {
                log('SDK SELECT Error:', error);
            } else {
                log(`SDK returned ${data?.length} records.`);
                if (data && data.length > 0) {
                    log('Sample ID:', data[0].id);
                    log('Sample UserID:', data[0].user_id);
                }
            }
        } catch (e) {
            log('SDK Exception:', e);
        }

        // 4. Raw REST Fetch
        if (session && url && key) {
            try {
                log('Attempting Raw REST Fetch...');
                const res = await fetch(`${url}/rest/v1/body_records?select=*`, {
                    headers: {
                        'apikey': key,
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                log(`REST Status: ${res.status}`);
                if (res.ok) {
                    const json = await res.json();
                    log(`REST returned ${json.length} records.`);
                } else {
                    const text = await res.text();
                    log(`REST Error Body: ${text}`);
                }
            } catch (e) {
                log('REST Exception:', e);
            }
        }

        log('--- DIAGNOSTICS END ---');
    };

    useEffect(() => {
        runDiagnostics();
    }, []);

    return (
        <div style={{ padding: '20px', background: '#111', color: '#0f0', fontFamily: 'monospace', minHeight: '100vh', position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 9999, overflow: 'auto' }}>
            <h2>🛠️ PANEL DE DIAGNÓSTICO NUCLEAR</h2>
            <button onClick={runDiagnostics} style={{ padding: '10px', background: '#333', color: '#fff', border: '1px solid #555', cursor: 'pointer', marginBottom: '20px' }}>
                RE-EJECUTAR PRUEBAS
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                    <h3>Consola de Logs</h3>
                    <div style={{ background: '#000', padding: '10px', border: '1px solid #333' }}>
                        {logs.map((l, i) => <div key={i} style={{ marginBottom: '5px', borderBottom: '1px solid #222' }}>{l}</div>)}
                    </div>
                </div>
                <div>
                    <h3>Info de Sesión</h3>
                    <pre>{JSON.stringify(authInfo, null, 2)}</pre>
                </div>
            </div>
            <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px', background: 'red', color: 'white' }}>
                CERRAR (Refrescar)
            </button>
        </div>
    );
}
