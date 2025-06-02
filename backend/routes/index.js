import express from 'express';
import * as PageController from '../controller/PageController.js';
// Ganti alias impor
import * as BookController from '../controller/BookController.js';
import * as UserController from '../controller/UserController.js';
import * as GenreController from '../controller/GenreController.js'; // Ganti alias

const router = express.Router();

// Rute publik (login, halaman utama berita/buku)
router.get("/login", PageController.login);
router.get("/", PageController.index); // Ini mungkin menampilkan daftar buku sekarang
router.get("/books", PageController.index); // Ganti /news menjadi /books
router.get('/books/:id', PageController.detail); // Ganti /news menjadi /books, pastikan PageController.detail bisa handle detail buku

// Rute halaman Admin
router.get('/admin', PageController.dashboard);
router.get('/admin/dashboard', PageController.dashboard);

// Rute admin untuk Buku
router.get('/admin/books', BookController.index); // Ganti /news dan controller. Fungsi index di BookController harus meredirect ke halaman admin buku
router.get('/admin/books/create', BookController.create); // Ganti /news dan controller
router.get('/admin/books/edit/:id', BookController.edit); // Ganti /news dan controller

// Rute admin untuk User (sepertinya sudah oke)
router.get('/admin/users', UserController.index);

// Rute admin untuk Genre
router.get('/admin/genres', GenreController.index); // Ganti /categories dan controller

export default router;