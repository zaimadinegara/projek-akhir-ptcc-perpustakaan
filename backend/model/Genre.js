import Sequelize from 'sequelize';
import db from '../config/database.js'; // Pastikan path ini benar

const Genre = db.define('genres', { // Nama tabel di database akan menjadi 'genres'
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: { // Nama genre, misalnya "Fiksi", "Sains", "Sejarah"
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, // Nama genre sebaiknya unik
    },
}, {
    timestamps: true, // Otomatis createdAt dan updatedAt
});

export default Genre;