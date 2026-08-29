import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getPendingSyncActions, enqueueSyncAction } from './offlineSyncQueue';

describe('offlineSyncQueue', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('enqueues sync action and persists to localStorage', () => {
        expect(getPendingSyncActions()).toEqual([]);

        enqueueSyncAction('SAVE_RECORD', 'user_123', { id: 'rec_1', date: '2026-08-29' });

        const pending = getPendingSyncActions();
        expect(pending.length).toBe(1);
        expect(pending[0].type).toBe('SAVE_RECORD');
        expect(pending[0].userId).toBe('user_123');
        expect(pending[0].payload.id).toBe('rec_1');
    });

    it('replaces duplicate record actions cleanly', () => {
        enqueueSyncAction('SAVE_RECORD', 'user_123', { id: 'rec_1', date: '2026-08-29', val: 1 });
        enqueueSyncAction('SAVE_RECORD', 'user_123', { id: 'rec_1', date: '2026-08-29', val: 2 });

        const pending = getPendingSyncActions();
        expect(pending.length).toBe(1);
        expect(pending[0].payload.val).toBe(2);
    });
});
