import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config(); // Pastikan .env termuat

// Ambil kunci rahasia yang BENAR dari environment variables
const JWT_SECRET_KEY = process.env.JWT_SECRET;

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]; // atau req.headers.authorization
  const token = authHeader && authHeader.split(" ")[1]; // Mengambil token dari "Bearer <token>"

  if (token == null) {
    // Tidak ada token, kirim 401 Unauthorized
    return res.status(401).json({ status: "Error", message: "Unauthorized: No token provided" });
  }

  // Verifikasi token menggunakan kunci rahasia yang benar
  jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      // Token tidak valid (kadaluwarsa, signature salah, dll.)
      // Kesalahan verifikasi token biasanya mengarah ke 403 Forbidden atau 401 Unauthorized
      // 403 lebih cocok jika token ada tapi tidak valid untuk akses
      console.error("JWT Verification Error:", err.message);
      return res.status(403).json({ status: "Error", message: "Forbidden: Invalid token" });
    }

    // Token valid, simpan seluruh informasi user dari payload token ke req.user
    // Ini akan berisi userId, username, name, email, role (sesuai payload saat token dibuat)
    req.user = decoded; 
    
    // Teruskan ke middleware atau controller selanjutnya
    next(); 
  });
};