const fs = require('fs');
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Happypeng%4098lol@db.lwblnkrbqfvzselxbzjv.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function restore() {
  try {
    await client.connect();
    console.log('Connected to the database.');
    
    const sql = fs.readFileSync('c:\\Users\\naval\\Downloads\\db_cluster_dump.sql', 'utf8');
    console.log('Executing SQL dump...');
    
    // We can execute the whole dump at once
    await client.query(sql);
    console.log('Restore completed successfully!');
  } catch (err) {
    console.error('Error during restore:', err);
  } finally {
    await client.end();
  }
}

restore();
