-- Campus Bus Tracker Database Schema
CREATE DATABASE IF NOT EXISTS campus_bus_tracker;
USE campus_bus_tracker;

CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_name VARCHAR(100) NOT NULL,
  start_point VARCHAR(150) NOT NULL,
  end_point VARCHAR(150) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT NOT NULL,
  stop_name VARCHAR(150) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  stop_order INT NOT NULL,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
);

CREATE TABLE buses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bus_number VARCHAR(20) NOT NULL UNIQUE,
  driver_id INT,
  route_id INT,
  capacity INT DEFAULT 40,
  status ENUM('active','inactive','on_trip') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL
);

CREATE TABLE trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bus_id INT NOT NULL,
  route_id INT NOT NULL,
  driver_id INT NOT NULL,
  start_time DATETIME,
  end_time DATETIME,
  distance DECIMAL(8,2) DEFAULT 0,
  status ENUM('scheduled','active','completed','cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bus_id) REFERENCES buses(id),
  FOREIGN KEY (route_id) REFERENCES routes(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

CREATE TABLE bus_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bus_id INT NOT NULL,
  trip_id INT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5,2) DEFAULT 0,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bus_id) REFERENCES buses(id),
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);

-- Seed admin
INSERT INTO admins (username, email, password) VALUES
('admin', 'admin@campus.edu', '$2b$10$placeholder_will_be_set_on_first_run');

-- Seed sample route
INSERT INTO routes (route_name, start_point, end_point) VALUES
('Route A', 'College Gate', 'City Bus Stand'),
('Route B', 'College Gate', 'Railway Station');

INSERT INTO stops (route_id, stop_name, latitude, longitude, stop_order) VALUES
(1, 'College Gate', 17.385044, 78.486671, 1),
(1, 'Main Market', 17.390000, 78.490000, 2),
(1, 'City Bus Stand', 17.400000, 78.500000, 3),
(2, 'College Gate', 17.385044, 78.486671, 1),
(2, 'Central Park', 17.392000, 78.480000, 2),
(2, 'Railway Station', 17.405000, 78.475000, 3);
