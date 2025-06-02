// backend/config/assoc_db.js

import User from '../model/User.js';    // Pastikan User.js ada dan benar
import Book from '../model/Book.js';    // Ganti dari News.js
import Genre from '../model/Genre.js';   // Ganti dari Category.js
import Borrow from '../model/Borrow.js'; // Model baru untuk peminjaman

// Jika kamu membuat model junction eksplisit untuk BookGenres (misalnya dari CategoryNews.js)
// import BookGenre from '../model/BookGenre.js'; // Ganti dari CategoryNews.js

function applyAssociations() {
    // ... (kode asosiasi yang sudah kita modifikasi sebelumnya, pastikan menggunakan User, Book, Genre, Borrow) ...

    // Contoh untuk Book dan Genre jika menggunakan tabel junction 'BookGenres' (Sequelize buat otomatis)
    Book.belongsToMany(Genre, {
        through: 'BookGenres', 
        foreignKey: 'book_id',
        otherKey: 'genre_id',
        timestamps: true 
    });
    Genre.belongsToMany(Book, {
        through: 'BookGenres',
        foreignKey: 'genre_id',
        otherKey: 'book_id',
        timestamps: true
    });

    // Relasi untuk User dan Borrow
    User.hasMany(Borrow, { foreignKey: 'user_id', allowNull: false });
    Borrow.belongsTo(User, { foreignKey: 'user_id', allowNull: false });

    // Relasi untuk Book dan Borrow
    Book.hasMany(Borrow, { foreignKey: 'book_id', allowNull: false });
    Borrow.belongsTo(Book, { foreignKey: 'book_id', allowNull: false });
}

export default applyAssociations;