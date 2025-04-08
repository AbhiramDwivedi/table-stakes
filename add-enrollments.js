// Create an enrollments table and add recent enrollment data
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' });

// Create a connection pool to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addEnrollmentsData() {
  const client = await pool.connect();
  try {
    console.log('Connected to database. Adding enrollments data...');

    // Create enrollments table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        student_name VARCHAR(100) NOT NULL,
        student_email VARCHAR(100) UNIQUE NOT NULL,
        course_name VARCHAR(100) NOT NULL,
        course_id VARCHAR(50) NOT NULL,
        enrollment_date TIMESTAMP NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        payment_amount DECIMAL(10, 2)
      );
    `);
    console.log('Created enrollments table');

    // Calculate date range for the past week
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    
    // Format date for SQL query (YYYY-MM-DD)
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    // Delete existing enrollment data for the past week to avoid duplicates
    await client.query(`
      DELETE FROM enrollments 
      WHERE enrollment_date >= '${formatDate(oneWeekAgo)}';
    `);

    // Course options
    const courses = [
      { name: 'Introduction to Data Science', id: 'DS101', price: 299.99 },
      { name: 'Advanced Machine Learning', id: 'ML202', price: 399.99 },
      { name: 'Web Development with React', id: 'WD150', price: 249.99 },
      { name: 'Python for Beginners', id: 'PY100', price: 199.99 },
      { name: 'Database Design and SQL', id: 'DB110', price: 249.99 },
      { name: 'Cloud Computing Fundamentals', id: 'CC130', price: 349.99 },
      { name: 'Cybersecurity Basics', id: 'SEC120', price: 299.99 },
      { name: 'Mobile App Development', id: 'MOB140', price: 349.99 }
    ];

    // Generate 20 enrollments in the past week
    const enrollmentValues = [];
    const names = [
      'Alex Johnson', 'Taylor Smith', 'Jordan Williams', 'Casey Brown', 'Morgan Davis',
      'Riley Martinez', 'Jamie Garcia', 'Avery Rodriguez', 'Quinn Wilson', 'Dakota Moore',
      'Skyler Anderson', 'Reese Thomas', 'Finley Jackson', 'Harper White', 'Rowan Harris',
      'Emerson Martin', 'Charlie Thompson', 'Drew Garcia', 'Parker Lewis', 'Jordan Green'
    ];

    // Generate 20 enrollments, with 15 in the past week (recent) and 5 older ones
    for (let i = 0; i < 20; i++) {
      const name = names[i];
      const email = name.toLowerCase().replace(' ', '.') + '@example.com';
      const courseIndex = Math.floor(Math.random() * courses.length);
      const course = courses[courseIndex];
      
      // Create enrollment date - 15 recent (past week), 5 older
      let enrollmentDate;
      if (i < 15) {
        // Past week enrollments (recent)
        const daysAgo = Math.floor(Math.random() * 7); // 0-6 days ago
        enrollmentDate = new Date(today);
        enrollmentDate.setDate(today.getDate() - daysAgo);
        // Add random hours
        enrollmentDate.setHours(Math.floor(Math.random() * 24));
        enrollmentDate.setMinutes(Math.floor(Math.random() * 60));
      } else {
        // Older enrollments (8-30 days ago)
        const daysAgo = 8 + Math.floor(Math.random() * 23); // 8-30 days ago
        enrollmentDate = new Date(today);
        enrollmentDate.setDate(today.getDate() - daysAgo);
        // Add random hours
        enrollmentDate.setHours(Math.floor(Math.random() * 24));
        enrollmentDate.setMinutes(Math.floor(Math.random() * 60));
      }
      
      const formattedDate = enrollmentDate.toISOString().slice(0, 19).replace('T', ' ');
      
      enrollmentValues.push(`('${name}', '${email}', '${course.name}', '${course.id}', '${formattedDate}', 'active', ${course.price})`);
    }

    // Insert the enrollment data
    await client.query(`
      INSERT INTO enrollments (student_name, student_email, course_name, course_id, enrollment_date, status, payment_amount) VALUES
      ${enrollmentValues.join(',\n')}
    `);
    
    console.log('Inserted enrollment data including 15 enrollments in the past week');

    // Log total enrollments in the past week
    const result = await client.query(`
      SELECT COUNT(*) FROM enrollments 
      WHERE enrollment_date >= '${formatDate(oneWeekAgo)}';
    `);
    console.log(`Total enrollments in the past week: ${result.rows[0].count}`);

    console.log('Enrollment data addition completed successfully!');

  } catch (error) {
    console.error('Error setting up enrollments data:', error);
  } finally {
    // Release the client back to the pool
    client.release();
    await pool.end();
  }
}

addEnrollmentsData();