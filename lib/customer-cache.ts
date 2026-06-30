import { Customer } from './types';

const DB_NAME = 'indigo-customer-cache';
const DB_VERSION = 1;
const STORE_NAME = 'customers';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function isIndexedDBAvailable() {
    return typeof indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase | null> {
    if (!isIndexedDBAvailable()) return Promise.resolve(null);

    if (!dbPromise) {
        dbPromise = new Promise<IDBDatabase | null>((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error ?? new Error('Failed to open customer cache'));
        }).catch((error) => {
            dbPromise = null;
            throw error;
        });
    }

    return dbPromise;
}

async function runWriteTransaction(action: (store: IDBObjectStore) => void) {
    const db = await openDatabase();
    if (!db) return;

    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        action(store);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('Customer cache write failed'));
        tx.onabort = () => reject(tx.error ?? new Error('Customer cache write aborted'));
    });
}

export async function replaceCustomerCache(customers: Customer[]) {
    await runWriteTransaction((store) => {
        store.clear();
        customers.forEach((customer) => store.put(customer));
    });
}

export async function upsertCustomerCache(customer: Customer) {
    await runWriteTransaction((store) => {
        store.put(customer);
    });
}

export async function deleteCustomerFromCache(customerId: string) {
    await runWriteTransaction((store) => {
        store.delete(customerId);
    });
}

export async function getCachedCustomers(): Promise<Customer[]> {
    const db = await openDatabase();
    if (!db) return [];

    return new Promise<Customer[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve((request.result as Customer[]) || []);
        request.onerror = () => reject(request.error ?? new Error('Failed to read customer cache'));
    });
}
