import { Client } from 'pg';

const connectionString = "postgresql://postgres:HMiq3wPxA8fnkrpP@db.jagnxjcnzphdoydapere.supabase.co:5432/postgres";

console.log("Testing connection to:", connectionString);

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function test() {
    try {
        await client.connect();
        console.log("Connected successfully!");
        const res = await client.query('SELECT count(*) FROM services');
        console.log("Service count:", res.rows[0].count);
        await client.end();
    } catch (err) {
        console.error("Connection failed:", err);
    }
}

test();
