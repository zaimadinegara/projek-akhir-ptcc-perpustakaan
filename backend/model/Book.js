import Sequelize from 'sequelize';
import db from '../config/database.js'; // Pastikan path ini benar

const Book = db.define('books', { // Nama tabel di database akan menjadi 'books'
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: { // Judul buku
        type: Sequelize.STRING,
        allowNull: false,
    },
    author: { // Penulis buku
        type: Sequelize.STRING,
        allowNull: false,
    },
    isbn: { // ISBN buku (opsional, bisa unik)
        type: Sequelize.STRING,
        allowNull: true, // Bisa jadi ada buku tanpa ISBN
        unique: true,    // Jika ada, harus unik
    },
    published_year: { // Tahun terbit
        type: Sequelize.INTEGER, // Atau Sequelize.YEAR jika didukung penuh oleh dialek DB
        allowNull: true,
    },
    quantity_total: { // Jumlah total buku ini yang dimiliki
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    quantity_available: { // Jumlah buku yang tersedia untuk dipinjam
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    cover_image_url: { // URL gambar sampul (dari Cloud Storage)
        type: Sequelize.STRING, // Menyimpan URL sebagai string
        allowNull: true, // Sampul bisa jadi opsional
    },
    // 'date' dari News.js kita hapus karena tidak relevan untuk buku,
    // createdAt dan updatedAt akan di-handle oleh timestamps: true
}, {
    timestamps: true, // Ini akan otomatis membuat kolom createdAt dan updatedAt
});

export default Book;