-- Inas Cafe - Database Schema
-- Run this in your MySQL database

CREATE DATABASE IF NOT EXISTS inas_cafe;
USE inas_cafe;

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    address TEXT,
    subscription_type ENUM('monthly', 'daily') DEFAULT 'daily',
    daily_amount DECIMAL(10, 2) DEFAULT 0,
    meal_times JSON, -- Stores array like ["breakfast", "lunch"]
    advance_amount DECIMAL(10, 2) DEFAULT 0,
    referral VARCHAR(255),
    start_date DATE,
    status ENUM('active', 'paused') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    available BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Daily Extras Entries
CREATE TABLE IF NOT EXISTS daily_extras (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50),
    menu_item_id VARCHAR(50),
    meal_type ENUM('breakfast', 'lunch', 'dinner'),
    price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
);

-- Administrators Table
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Admin (Password: admin123 - should be updated)
-- We will handle hashing on the server, this is just for schema reference.
-- 
-- INSERT INTO admins (id, name, email, password) VALUES ('adm_1', 'Inas Admin', 'admin@inas.coffee', 'hashed_pass');

