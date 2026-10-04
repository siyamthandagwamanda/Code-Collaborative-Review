import { pool } from "./db";

async function test(){
    const result = await pool.query("SELECT NOW()");
    console.log("DB connected:", result.rows[0]);
    await pool.end();
}

test().catch(console.error);