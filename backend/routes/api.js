// backend/routes/api.js
import express from 'express';

// Impor semua fungsi yang dibutuhkan dari masing-masing controller
import { 
    // Fungsi untuk render halaman admin dari BookController (jika ada dan masih dipakai)
    // index as BookAdminIndex, 
    // create as BookAdminCreate, 
    // edit as BookAdminEdit,
    createBook, 
    getAllBooks, 
    getRecentBooks, 
    getBookById, 
    updateBook, 
    deleteBook, 
    countBooks 
} from '../controller/BookController.js';

import { 
    // index as UserAdminIndex, // Asumsi ada fungsi index di UserController untuk halaman admin
    createUser, 
    getAllUsers, 
    getUserById, 
    deleteUser, 
    login, 
    getLoggedInUser, 
    countUsers, 
    logout 
} from '../controller/UserController.js';

import { 
    // index as GenreAdminIndex, // Asumsi ada fungsi index di GenreController untuk halaman admin
    createGenre, 
    getAllGenres, 
    getGenreById, 
    updateGenre, 
    deleteGenre, 
    countGenres 
} from '../controller/GenreController.js';

import { 
    createBorrow, 
    getAllBorrows, 
    getBorrowById, 
    returnBook,
    getMyBorrows // Tambahkan ini jika kamu membuat fungsi getMyBorrows di BorrowController
} from '../controller/BorrowController.js';

import { verifyToken } from '../middleware/verifyToken.js';
// import { getAccessToken } from '../controller/TokenController.js'; // Komentari jika TokenController.js atau getAccessToken belum ada/dipakai
import { uploadImage } from '../utils/uploadImage.js';

const router = express.Router();

// --- Log untuk Debug Impor (Bisa dihapus setelah server berjalan normal) ---
console.log('[API Routes DEBUG] typeof getBookById (BookController):', typeof getBookById);
console.log('[API Routes DEBUG] typeof login (UserController):', typeof login);
console.log('[API Routes DEBUG] typeof createGenre (GenreController):', typeof createGenre);
console.log('[API Routes DEBUG] typeof createBorrow (BorrowController):', typeof createBorrow);
console.log('[API Routes DEBUG] typeof returnBook (BorrowController):', typeof returnBook);
console.log('[API Routes DEBUG] typeof getMyBorrows (BorrowController):', typeof getMyBorrows); // Cek impor ini
// --- Akhir Log Debug ---

// Auth routes
router.post('/login', login); 
router.get('/logout', logout); // Pastikan UserController.logout sudah ada dan diekspor
router.get('/get-logged-in-user', verifyToken, getLoggedInUser);

// User routes
router.get('/users', verifyToken, getAllUsers); // Biasanya perlu role admin
router.get('/users/count', verifyToken, countUsers); // Biasanya perlu role admin
router.get('/users/:id', verifyToken, getUserById); // Biasanya perlu role admin atau user ybs
router.post('/users', createUser); // Untuk registrasi publik, tanpa verifyToken
router.delete('/users/:id', verifyToken, deleteUser); // Biasanya perlu role admin

// Genre routes
router.get('/genres', getAllGenres); // Bisa publik atau verifyToken
router.get('/genres/count', verifyToken, countGenres); // Biasanya admin
router.get('/genres/:id', getGenreById); // Bisa publik atau verifyToken
router.post('/genres', verifyToken, createGenre); // Biasanya admin
router.put('/genres/:id', verifyToken, updateGenre); // Biasanya admin
router.delete('/genres/:id', verifyToken, deleteGenre); // Biasanya admin

// Book routes
router.get('/books', getAllBooks); // Ini menangani ?search=X dan ?genreId=Y. Bisa publik atau verifyToken.
router.get('/books/recent', getRecentBooks); // Bisa publik
router.get('/books/count', verifyToken, countBooks); // Biasanya admin
// Rute '/books/genre/:genreId' tidak diperlukan jika getAllBooks sudah menangani ?genreId=Y
router.get('/books/:id', getBookById); 
router.post('/books', verifyToken, uploadImage.single('cover_image_file'), createBook); // Biasanya admin
router.put('/books/:id', verifyToken, uploadImage.single('cover_image_file'), updateBook); // Biasanya admin
router.delete('/books/:id', verifyToken, deleteBook); // Biasanya admin

// Borrow routes
router.post('/borrows', verifyToken, createBorrow); // User yang login bisa meminjam
router.get('/borrows/my', verifyToken, getMyBorrows); // Rute baru untuk peminjaman user saat ini
router.get('/borrows', verifyToken, getAllBorrows); // Admin melihat semua, atau user melihat miliknya (tergantung logika di controller)
router.get('/borrows/:id', verifyToken, getBorrowById); // Detail peminjaman
router.put('/borrows/:id/return', verifyToken, returnBook); // User mengembalikan buku


export default router;