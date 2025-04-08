// Create a database setup script
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a connection pool to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupDatabase() {
  const client = await pool.connect();
  try {
    console.log('Connected to database. Setting up schema...');

    // Drop existing tables if they exist
    await client.query(`
      DROP TABLE IF EXISTS sales CASCADE;
      DROP TABLE IF EXISTS customers CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS stores CASCADE;
    `);
    console.log('Dropped existing tables');

    // Create customers table
    await client.query(`
      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        location VARCHAR(100),
        age INT,
        joined_date DATE
      );
    `);
    console.log('Created customers table');

    // Create products table
    await client.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        cost DECIMAL(10, 2) NOT NULL,
        stock INT DEFAULT 0
      );
    `);
    console.log('Created products table');

    // Create stores table
    await client.query(`
      CREATE TABLE stores (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(100) NOT NULL,
        size INT,
        opened_date DATE
      );
    `);
    console.log('Created stores table');

    // Create sales table
    await client.query(`
      CREATE TABLE sales (
        id SERIAL PRIMARY KEY,
        customer_id INT REFERENCES customers(id),
        product_id INT REFERENCES products(id),
        store_id INT REFERENCES stores(id),
        quantity INT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        sale_date DATE NOT NULL
      );
    `);
    console.log('Created sales table');

    // Insert sample data for customers
    await client.query(`
      INSERT INTO customers (name, email, location, age, joined_date) VALUES
      ('John Smith', 'john.smith@example.com', 'New York', 35, '2022-01-15'),
      ('Emma Johnson', 'emma.johnson@example.com', 'Los Angeles', 28, '2022-03-22'),
      ('Michael Brown', 'michael.brown@example.com', 'Chicago', 42, '2021-11-05'),
      ('Sophia Williams', 'sophia.williams@example.com', 'Houston', 31, '2023-02-18'),
      ('William Davis', 'william.davis@example.com', 'Phoenix', 45, '2021-08-30'),
      ('Olivia Miller', 'olivia.miller@example.com', 'Philadelphia', 27, '2023-04-12'),
      ('James Wilson', 'james.wilson@example.com', 'San Antonio', 39, '2022-06-25'),
      ('Isabella Moore', 'isabella.moore@example.com', 'San Diego', 33, '2022-09-08'),
      ('Benjamin Taylor', 'benjamin.taylor@example.com', 'Dallas', 29, '2023-01-19'),
      ('Mia Anderson', 'mia.anderson@example.com', 'San Jose', 36, '2021-12-11');
    `);
    console.log('Inserted sample customers');

    // Insert sample data for products
    await client.query(`
      INSERT INTO products (name, category, price, cost, stock) VALUES
      ('Laptop Pro', 'Electronics', 1299.99, 899.99, 50),
      ('Smartphone X', 'Electronics', 899.99, 599.99, 75),
      ('Coffee Maker', 'Home Appliances', 79.99, 45.99, 100),
      ('Running Shoes', 'Footwear', 129.99, 65.99, 120),
      ('Wireless Headphones', 'Electronics', 149.99, 89.99, 90),
      ('Blender Max', 'Home Appliances', 59.99, 32.99, 85),
      ('Desk Chair', 'Furniture', 199.99, 109.99, 40),
      ('Fitness Tracker', 'Electronics', 89.99, 49.99, 110),
      ('Winter Jacket', 'Clothing', 179.99, 95.99, 70),
      ('Bookshelf', 'Furniture', 149.99, 79.99, 30);
    `);
    console.log('Inserted sample products');

    // Insert sample data for stores
    await client.query(`
      INSERT INTO stores (name, location, size, opened_date) VALUES
      ('Downtown Store', 'New York', 5000, '2020-03-15'),
      ('Westfield Mall', 'Los Angeles', 7500, '2019-11-20'),
      ('City Center', 'Chicago', 6000, '2021-05-10'),
      ('Galleria', 'Houston', 8000, '2018-09-25'),
      ('Desert Plaza', 'Phoenix', 4500, '2022-02-18');
    `);
    console.log('Inserted sample stores');

    // Insert sample data for sales
    // Generate sales for the last 12 months
    const statements = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 12); // Go back 12 months

    for (let i = 0; i < 1000; i++) {
      const customer_id = Math.floor(Math.random() * 10) + 1;
      const product_id = Math.floor(Math.random() * 10) + 1;
      const store_id = Math.floor(Math.random() * 5) + 1;
      const quantity = Math.floor(Math.random() * 5) + 1;
      
      // Random date between start date and today
      const randomDate = new Date(startDate.getTime() + Math.random() * (today.getTime() - startDate.getTime()));
      const sale_date = randomDate.toISOString().split('T')[0];
      
      // Calculate total amount based on product price and quantity
      const product = await client.query('SELECT price FROM products WHERE id = $1', [product_id]);
      const total_amount = (product.rows[0].price * quantity).toFixed(2);
      
      statements.push(`(${customer_id}, ${product_id}, ${store_id}, ${quantity}, ${total_amount}, '${sale_date}')`);
    }

    await client.query(`
      INSERT INTO sales (customer_id, product_id, store_id, quantity, total_amount, sale_date) VALUES
      ${statements.join(',\n')}
    `);
    console.log('Inserted sample sales data');

    console.log('Database setup completed successfully!');

  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    // Release the client back to the pool
    client.release();
    await pool.end();
  }
}

setupDatabase();