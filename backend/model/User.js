import Sequelize from 'sequelize';
import db from '../config/database.js'; // Pastikan path ini benar

const User = db.define('users', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: { // Nama lengkap pengguna
        type: Sequelize.STRING,
        allowNull: false,
    },
    username: { // Username untuk login
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, // Username harus unik
    },
    email: { // Email pengguna
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, // Email harus unik
        validate: {
            isEmail: true, // Validasi format email menggunakan Sequelize
        }
    },
    password: { // Password pengguna (akan disimpan dalam bentuk hash)
        type: Sequelize.STRING,
        allowNull: false,
    },
    role: { // Peran pengguna (admin atau member)
        type: Sequelize.ENUM('admin', 'member'),
        allowNull: false,
        defaultValue: 'member', // Default role adalah member
    },
    refresh_token: { // Untuk mekanisme refresh token JWT
        type: Sequelize.TEXT,
        allowNull: true,
    },
}, {
    timestamps: true, // Otomatis membuat kolom createdAt dan updatedAt
});

export default User;