import Sequelize from 'sequelize';
import db from '../config/database.js';

const Borrow = db.define('borrows', { // Nama tabel 'borrows'
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // user_id dan book_id akan didefinisikan sebagai foreign key melalui asosiasi
    // Jika ORM tidak otomatis menambahkannya berdasarkan asosiasi,
    // kamu bisa definisikan di sini juga:
    // user_id: {
    //     type: Sequelize.INTEGER,
    //     allowNull: false,
    // },
    // book_id: {
    //     type: Sequelize.INTEGER,
    //     allowNull: false,
    // },
    borrow_date: { // Tanggal peminjaman
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
    },
    due_date: { // Tanggal jatuh tempo pengembalian
        type: Sequelize.DATE,
        allowNull: false,
    },
    return_date: { // Tanggal buku dikembalikan (bisa null jika belum kembali)
        type: Sequelize.DATE,
        allowNull: true,
    },
    status: { // Status peminjaman
        type: Sequelize.ENUM('borrowed', 'returned', 'overdue'),
        allowNull: false,
        defaultValue: 'borrowed',
    },
}, {
    timestamps: true,
});

export default Borrow;