import multer from "multer";
import fs from "fs";
import path from "path";

// Pastikan folder uploads/ selalu ada
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Ekstensi gambar yang diizinkan
const IMAGE_TYPES = /jpeg|jpg|png|gif/i;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (IMAGE_TYPES.test(ext)) return cb(null, true);
  cb(new Error("Hanya file gambar (jpg, jpeg, png, gif) yang diizinkan"));
};

export const uploadImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter,
});