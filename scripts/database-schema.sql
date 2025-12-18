-- Database schema for appointment booking system
-- Run this script when setting up a real database

-- Services table
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    rating DECIMAL(2,1) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    image VARCHAR(255),
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff table
CREATE TABLE staff (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    specialties TEXT[], -- array of service categories
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service-Staff relationship table
CREATE TABLE service_staff (
    service_id INTEGER REFERENCES services(id),
    staff_id VARCHAR(50) REFERENCES staff(id),
    PRIMARY KEY (service_id, staff_id)
);

-- Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES services(id),
    customer_id INTEGER REFERENCES customers(id),
    staff_id VARCHAR(50) REFERENCES staff(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    price INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in-progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_staff ON appointments(staff_id);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_customers_phone ON customers(phone);

-- Insert sample data
INSERT INTO services (name, category, description, price, duration, rating, review_count, is_popular) VALUES
('Cắt tóc nam cơ bản', 'hair', 'Cắt tóc nam theo yêu cầu với kỹ thuật chuyên nghiệp', 150000, 60, 4.8, 124, true),
('Nhuộm tóc thời trang', 'hair', 'Nhuộm màu tóc theo xu hướng với sản phẩm cao cấp', 350000, 120, 4.9, 89, true),
('Chăm sóc da mặt cơ bản', 'skin', 'Làm sạch sâu, tẩy tế bào chết và dưỡng ẩm cho da', 200000, 90, 4.7, 156, false),
('Massage toàn thân thư giãn', 'massage', 'Massage toàn thân giúp thư giãn và giảm căng thẳng', 300000, 75, 4.9, 203, true);

INSERT INTO staff (id, name, specialties) VALUES
('mai', 'Nguyễn Thị Mai', ARRAY['hair']),
('hoa', 'Lê Thị Hoa', ARRAY['skin']),
('duc', 'Trần Văn Đức', ARRAY['massage']),
('lan', 'Phạm Thị Lan', ARRAY['nails']);

INSERT INTO service_staff (service_id, staff_id) VALUES
(1, 'mai'),
(2, 'mai'),
(3, 'hoa'),
(4, 'duc');
