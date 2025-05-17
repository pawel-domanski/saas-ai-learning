-- Migration: Add birth details to users table
ALTER TABLE users 
  ADD COLUMN birth_date DATE NOT NULL,
  ADD COLUMN birth_time TEXT NOT NULL,
  ADD COLUMN birth_city VARCHAR(100) NOT NULL,
  ADD COLUMN birth_country VARCHAR(100) NOT NULL; 