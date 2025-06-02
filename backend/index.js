import express from 'express';
import cors from 'cors';
import path from "path";
import { fileURLToPath } from 'url';
import route from './routes/index.js';
import api from './routes/api.js';
import db from './config/database.js';
import applyAssociations from './config/assoc_db.js';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import User from './model/User.js'; // Pastikan model User sudah diimpor
import bcrypt from 'bcrypt';
dotenv.config(); // Baris ini memuat variabel dari .env

// ===== BARIS DEBUG DITAMBAHKAN DI SINI =====
console.log('[DEBUG] Nilai JWT_SECRET dari .env:', process.env.JWT_SECRET);
console.log('[DEBUG] Nilai SEEDER_PASSWORD dari .env:', process.env.SEEDER_PASSWORD);
console.log('[DEBUG] Nilai PORT dari .env:', process.env.PORT);
console.log('[DEBUG] Nilai DB_NAME dari .env:', process.env.DB_NAME);
console.log('[DEBUG] Nilai REFRESH_TOKEN_SECRET dari .env:', process.env.REFRESH_TOKEN_SECRET); // Tambahkan ini untuk cek
// ============================================

const SEEDER_PASSWORD = process.env.SEEDER_PASSWORD; 

const app = express()
const port = process.env.PORT || 5000; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cookieParser());

// ===== MODIFIKASI BAGIAN CORS DI SINI =====
app.use(cors({
  origin: [
    "https://tcc-a01.uc.r.appspot.com", // Origin untuk frontend deployed
    "http://127.0.0.1:5500", // Tambahkan origin Live Server lokalmu (port default Live Server)
    "http://localhost:5500"  // Alternatif untuk Live Server lokalmu
    // Kamu bisa tambahkan port lain jika Live Server-mu berjalan di port berbeda
  ],
  credentials: true
}));
// ==========================================

app.use(express.json());
app.use(route); 
app.use('/api', api); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

applyAssociations(); 

// Sync DB
db.sync().then(async () => {
  console.log('Database synced');
  
  const adminUser = { 
    name: 'Admin User', 
    username: 'admin',
    email: 'zaimadinegara@gmail.com', 
    role: 'admin', 
    password: bcrypt.hashSync(SEEDER_PASSWORD, 10), 
    refresh_token: null,
  };

  await User.findOrCreate({
    where: { username: adminUser.username }, 
    defaults: adminUser, 
  }).then(([user, created]) => {
    if (created) {
      console.log('Admin user created:', user.username);
    } else {
      console.log('Admin user already exists:', user.username);
    }
  }).catch(err => {
    console.error('Error during admin user findOrCreate:', err);
  });

}).catch(err => {
  console.error('DB Sync Error:', err);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});