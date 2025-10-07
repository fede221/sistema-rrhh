const db = require('./config/db');
const bcrypt = require('bcrypt');

async function createAdminUser() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const insertQuery = `
            INSERT INTO usuarios (legajo, dni, nombre, apellido, correo, password, rol, fecha_ingreso)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const adminData = [
            'ADMIN001',
            '88888888',
            'Admin',
            'Test',
            'admin@test.com',
            hashedPassword,
            'superadmin',
            '2023-01-01'
        ];
        
        db.query(insertQuery, adminData, (err, result) => {
            if (err) {
                console.error('Error creating admin user:', err.message);
            } else {
                console.log('✅ Admin user created with ID:', result.insertId);
                console.log('Login credentials: DNI: 88888888, Password: admin123');
            }
            process.exit(0);
        });
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createAdminUser();
