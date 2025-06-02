// backend/controller/BorrowController.js
import Borrow from '../model/Borrow.js';
import Book from '../model/Book.js';
import User from '../model/User.js';
import db from '../config/database.js';

// Fungsi untuk membuat catatan peminjaman baru (meminjam buku)
export const createBorrow = async (req, res) => {
    const user_id = req.user.userId; 
    const { book_id, due_date } = req.body;

    if (!book_id || !due_date) {
        return res.status(400).json({ status: "Error", message: "Book ID dan tanggal jatuh tempo wajib diisi" });
    }
    // Validasi format due_date (sederhana, bisa lebih kompleks jika perlu)
    if (isNaN(new Date(due_date).getTime())) {
        return res.status(400).json({ status: "Error", message: "Format tanggal jatuh tempo tidak valid" });
    }

    const t = await db.transaction();

    try {
        const book = await Book.findByPk(parseInt(book_id, 10), { transaction: t, lock: t.LOCK.UPDATE }); // Tambahkan lock untuk mencegah race condition

        if (!book) {
            await t.rollback();
            return res.status(404).json({ status: "Error", message: "Buku tidak ditemukan" });
        }

        if (book.quantity_available < 1) {
            await t.rollback();
            return res.status(400).json({ status: "Error", message: "Stok buku habis" });
        }

        book.quantity_available -= 1;
        await book.save({ transaction: t });

        const newBorrow = await Borrow.create({
            user_id,
            book_id: parseInt(book_id, 10),
            borrow_date: new Date(),
            due_date: new Date(due_date),
            status: 'borrowed'
        }, { transaction: t });

        await t.commit();

        const borrowWithDetails = await Borrow.findByPk(newBorrow.id, {
            include: [
                { model: User, attributes: ['id', 'username', 'name', 'email'] },
                { model: Book, attributes: ['id', 'title', 'author', 'cover_image_url'] }
            ]
        });

        res.status(201).json({ status: "Success", message: "Buku berhasil dipinjam", data: borrowWithDetails });

    } catch (error) {
        if (t && !t.finished) {
             try { await t.rollback(); } catch (rbError) { console.error("Error rolling back transaction in createBorrow:", rbError); }
        }
        console.error("Error borrowing book:", error);
        res.status(500).json({ status: "Error", message: "Gagal meminjam buku", error: error.message });
    }
};

// Fungsi untuk mendapatkan semua catatan peminjaman (biasanya untuk admin)
export const getAllBorrows = async (req, res) => {
    try {
        if (req.user.role !== 'admin') { // Pastikan hanya admin
            return res.status(403).json({ status: "Error", message: "Anda tidak memiliki hak akses." });
        }
        const borrows = await Borrow.findAll({ 
            include: [
                { model: User, attributes: ['id', 'username', 'name', 'email'] },
                { model: Book, attributes: ['id', 'title', 'author', 'cover_image_url', 'isbn'] }
            ],
            order: [['borrow_date', 'DESC']] 
        });
        res.status(200).json(borrows);
    } catch (error) {
        console.error("Error fetching all borrows:", error);
        res.status(500).json({ status: "Error", message: "Gagal mengambil semua data peminjaman", error: error.message });
    }
};

// Fungsi untuk mendapatkan peminjaman milik user yang sedang login (status 'borrowed')
export const getMyBorrows = async (req, res) => {
    const userId = req.user.userId;
    if (!userId) {
        return res.status(400).json({ status: "Error", message: "User ID tidak ditemukan dari token." });
    }
    try {
        const borrows = await Borrow.findAll({
            where: { 
                user_id: userId,
                status: 'borrowed'
            },
            include: [
                { 
                    model: Book, 
                    attributes: ['id', 'title', 'author', 'cover_image_url', 'isbn', 'published_year'] 
                }
            ],
            order: [['due_date', 'ASC']]
        });
        console.log(`[DEBUG BorrowController] Borrows for user ${userId} (status 'borrowed'):`, JSON.stringify(borrows, null, 2));
        res.status(200).json(borrows);
    } catch (error) {
        console.error(`[DEBUG BorrowController] Error fetching user's ${userId} current borrows:`, error);
        res.status(500).json({ status: "Error", message: "Gagal mengambil data peminjaman Anda", error: error.message });
    }
};

// Fungsi untuk mendapatkan detail satu catatan peminjaman berdasarkan ID
export const getBorrowById = async (req, res) => {
    try {
        const { id } = req.params;
        const numericId = parseInt(id, 10);
        if(isNaN(numericId)){
            return res.status(400).json({ status: "Error", message: "ID Peminjaman tidak valid"});
        }

        const borrow = await Borrow.findByPk(numericId, { 
            include: [
                { model: User, attributes: ['id', 'username', 'name', 'email'] },
                { model: Book, attributes: ['id', 'title', 'author', 'cover_image_url'] }
            ] 
        });

        if (!borrow) {
            return res.status(404).json({ status: "Error", message: "Catatan peminjaman tidak ditemukan" });
        }
        
        if (req.user.role !== 'admin' && req.user.userId !== borrow.user_id) {
            return res.status(403).json({ status: "Error", message: "Anda tidak berhak melihat detail peminjaman ini" });
        }
        res.status(200).json(borrow);
    } catch (error) {
        console.error("Error fetching borrow by ID:", error);
        res.status(500).json({ status: "Error", message: "Gagal mengambil detail catatan peminjaman", error: error.message });
    }
};

// Fungsi untuk mengembalikan buku
export const returnBook = async (req, res) => {
    const { id } = req.params; 
    const t = await db.transaction();

    try {
        const borrowRecord = await Borrow.findByPk(id, { transaction: t });

        if (!borrowRecord) {
            await t.rollback();
            return res.status(404).json({ status: "Error", message: "Catatan peminjaman tidak ditemukan" });
        }

        if (borrowRecord.status === 'returned') {
            await t.rollback();
            return res.status(400).json({ status: "Error", message: "Buku ini sudah dikembalikan sebelumnya" });
        }

        if (req.user.role !== 'admin' && req.user.userId !== borrowRecord.user_id) {
            await t.rollback();
            return res.status(403).json({ status: "Error", message: "Anda tidak berhak mengembalikan buku ini" });
        }

        borrowRecord.status = 'returned';
        borrowRecord.return_date = new Date();
        await borrowRecord.save({ transaction: t });

        const book = await Book.findByPk(borrowRecord.book_id, { transaction: t, lock: t.LOCK.UPDATE }); // Tambahkan lock
        if (book) {
            book.quantity_available += 1;
            await book.save({ transaction: t });
        } else {
            await t.rollback();
            console.error(`Error: Buku dengan ID ${borrowRecord.book_id} tidak ditemukan saat proses pengembalian untuk borrow ID ${id}.`);
            return res.status(500).json({ status: "Error", message: "Kesalahan internal: Data buku terkait peminjaman tidak ditemukan" });
        }

        await t.commit();

        const updatedBorrowRecord = await Borrow.findByPk(id, {
            include: [
                { model: User, attributes: ['id', 'username', 'name', 'email'] },
                { model: Book, attributes: ['id', 'title', 'author', 'cover_image_url'] }
            ]
        });

        res.status(200).json({ status: "Success", message: "Buku berhasil dikembalikan", data: updatedBorrowRecord });

    } catch (error) {
        if (t && !t.finished) {
            try { await t.rollback(); } catch (rbError) { console.error("Error rolling back transaction in returnBook:", rbError); }
        }
        console.error("Error returning book:", error);
        res.status(500).json({ status: "Error", message: "Gagal mengembalikan buku", error: error.message });
    }
};