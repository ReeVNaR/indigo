import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
    throw new Error('Please add your MONGODB_URI to .env.local');
}

const uri = process.env.MONGODB_URI;
console.log('--- MONGODB URI CHECK ---');
console.log('URI exists:', !!uri);
if (uri) console.log('URI start:', uri.substring(0, 20));
const options = {
    connectTimeoutMS: 10000, // 10s timeout
};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
        console.log('MongoDB: Initializing new client in development mode...');
        client = new MongoClient(uri, options);
        globalWithMongo._mongoClientPromise = client.connect().then(c => {
            console.log('MongoDB: Client connected successfully in development mode.');
            return c;
        }).catch(e => {
            console.error('MongoDB: Failed to connect client in development mode:', e);
            throw e;
        });
    } else {
        console.log('MongoDB: Reusing existing client promise in development mode.');
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    console.log('MongoDB: Initializing new client in production mode...');
    client = new MongoClient(uri, options);
    clientPromise = client.connect().then(c => {
        console.log('MongoDB: Client connected successfully in production mode.');
        return c;
    }).catch(e => {
        console.error('MongoDB: Failed to connect client in production mode:', e);
        throw e;
    });
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
