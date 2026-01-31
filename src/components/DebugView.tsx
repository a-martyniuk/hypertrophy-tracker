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

        // 5. LocalStorage Inspection
        log('--- LOCAL STORAGE ---');
        if (typeof window !== 'undefined' && window.localStorage) {
            const keys = Object.keys(localStorage);
            log(`Total keys in localStorage: ${keys.length}`);
            keys.forEach(k => {
                if (k.startsWith('sb-') || k.toLowerCase().includes('supabase')) {
                    const val = localStorage.getItem(k);
                    log(`Found Key: ${k}`);
                    log(`Value Length: ${val?.length ?? 0}`);
                    if (val) {
                        try {
                            const parsed = JSON.parse(val);
                            log(`Token User ID: ${parsed.user?.id}`);
                            log(`Expires At: ${parsed.expires_at}`);
                        } catch (e) {
                            log('Value validates as non-JSON');
                        }
                    }
                }
            });
        } else {
            log('LocalStorage not available');
        }

        log('--- DIAGNOSTICS END ---');
    };

    useEffect(() => {
        runDiagnostics();
    }, []);

    const attemptManualRestore = async () => {
        log('--- ATTEMPTING MANUAL RESTORE ---');
        if (typeof window === 'undefined' || !window.localStorage) return;

        const keys = Object.keys(localStorage);
        const sbKey = keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));

        if (!sbKey) {
            log('No Supabase token found in localStorage');
            return;
        }

        const raw = localStorage.getItem(sbKey);
        if (!raw) return;

        try {
            const { access_token, refresh_token } = JSON.parse(raw);
            log('Found tokens, attempting setSession...');

            const { data, error } = await supabase.auth.setSession({
                access_token,
                refresh_token
            });

            if (error) {
                log('setSession Error:', error);
            } else {
                log('setSession Success:', data);
                log('Reloading in 2 seconds...');
                setTimeout(() => window.location.reload(), 2000);
            }
        } catch (e) {
            log('Manual Restore Exception:', e);
        }
    };

    return (
        <div style={{ padding: '20px', background: '#111', color: '#0f0', fontFamily: 'monospace', minHeight: '100vh', position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 9999, overflow: 'auto' }}>
            <h2>🛠️ PANEL DE DIAGNÓSTICO NUCLEAR</h2>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button onClick={runDiagnostics} style={{ padding: '10px', background: '#333', color: '#fff', border: '1px solid #555', cursor: 'pointer' }}>
                    RE-EJECUTAR PRUEBAS
                </button>
                <button onClick={attemptManualRestore} style={{ padding: '10px', background: '#f59e0b', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                    ⚠️ FORZAR RESTAURACIÓN DE SESIÓN (LOCALSTORAGE)
                </button>
            </div>
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
