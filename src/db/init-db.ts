import 'dotenv/config';
import { pool } from "./db.js"; 

async function createTables(){
    
    await pool.query(`DROP TABLE IF EXISTS notifications;`);
    await pool.query(`DROP TABLE IF EXISTS reviews;`);
    await pool.query(`DROP TABLE IF EXISTS comments;`);
    await pool.query(`DROP TABLE IF EXISTS submissions;`);
    await pool.query(`DROP TABLE IF EXISTS project_members;`);
    await pool.query(`DROP TABLE IF EXISTS projects;`);
    await pool.query(`DROP TABLE IF EXISTS users;`);

    
    await pool.query(`
     CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        email VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL, 
        display_picture VARCHAR(255),
        role VARCHAR(20) NOT NULL DEFAULT 'submitter',
          CHECK (role IN ('submitter', 'reviewer')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
   `);

   await pool.query(`
     CREATE TABLE projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        description TEXT,
        owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
   `);

   await pool.query(`
     CREATE TABLE project_members (
       id SERIAL PRIMARY KEY,
       project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
       user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE
     );
   `);

   await pool.query(`
     CREATE TABLE submissions (
       id SERIAL PRIMARY KEY,
       project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE, 
       submitter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
       title VARCHAR(60),
       filename VARCHAR(60),
       language VARCHAR(60),
       code TEXT NOT NULL,
       status VARCHAR(60) NOT NULL DEFAULT 'pending',
        CHECK (status IN ('pending','in_review','approved','changes_requested')),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
   `);

   await pool.query(`
     CREATE TABLE comments (
      id SERIAL PRIMARY KEY,
      submission_id INT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      author_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      line_number INT,
      body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
   `);

   await pool.query(`
     CREATE TABLE reviews (
       id SERIAL PRIMARY KEY,
       submission_id INT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
       reviewer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       status VARCHAR(30) NOT NULL,
       comment TEXT,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
   `);

   await pool.query(`
     CREATE TABLE notifications (
       id SERIAL PRIMARY KEY,
       user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       message TEXT NOT NULL,
       is_read BOOLEAN DEFAULT FALSE,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
   `);

   console.log("Tables created successfully!");
   await pool.end();
}

createTables().catch((err) => {
    console.error("Failed to create tables:", err);
    process.exit(1);
});
