import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { InspectionEnvironment } from '@/types';

interface ImobCheckDB extends DBSchema {
    drafts: {
        key: string;
        value: {
            id: string;
            tenantId: string;
            agencyId?: string; // NOVO
            propertyId?: string; // NOVO
            clientId?: string; // NOVO
            landlordId?: string; // NOVO
            type?: string; // NOVO
            date?: string; // NOVO
            environments: InspectionEnvironment[];
            updatedAt: number;
            meters?: { light: string, water: string, gas: string };
            keys?: { description: string, quantity: number }[];
            agreement?: string;
            signatures?: { tenant: boolean; landlord: boolean; inspector: boolean }; // NOVO
            startTime?: string; // NOVO
            createdAt?: number; // NOVO
        };
        indexes: { 'by-date': number };
    };
    blobs: {
        key: string;
        value: Blob;
    };
}

const DB_NAME = 'imobcheck-db';
const DB_VERSION = 2;

export async function initDB(): Promise<IDBPDatabase<ImobCheckDB>> {
    return openDB<ImobCheckDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
            if (oldVersion < 1) {
                const draftStore = db.createObjectStore('drafts', {
                    keyPath: 'id',
                });
                draftStore.createIndex('by-date', 'updatedAt');
            }
            if (oldVersion < 2) {
                db.createObjectStore('blobs');
            }
        },
    });
}

export async function saveDraft(
    id: string, 
    tenantId: string, 
    environments: InspectionEnvironment[], 
    metadata?: { meters?: any, keys?: any, agreement?: any }
) {
    const db = await initDB();
    await db.put('drafts', {
        id,
        tenantId,
        environments,
        updatedAt: Date.now(),
        ...metadata
    });
}

export async function getDraft(id: string) {
    const db = await initDB();
    return db.get('drafts', id);
}

export async function deleteDraft(id: string) {
    const db = await initDB();
    await db.delete('drafts', id);
}

export async function listDrafts(tenantId: string) {
    const db = await initDB();
    const drafts = await db.getAll('drafts');
    return drafts.filter(d => d.tenantId === tenantId);
}

export async function saveBlob(key: string, blob: Blob) {
    const db = await initDB();
    await db.put('blobs', blob, key);
}

export async function getBlob(key: string) {
    const db = await initDB();
    return db.get('blobs', key);
}

/**
 * Purge drafts older than 30 days.
 */
export async function purgeOldDrafts() {
    const db = await initDB();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const tx = db.transaction('drafts', 'readwrite');
    const index = tx.store.index('by-date');
    let cursor = await index.openCursor(IDBKeyRange.upperBound(thirtyDaysAgo));

    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }
    await tx.done;
}
