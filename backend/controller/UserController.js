// backend/controller/UserController.js
import User from '../model/User.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config(); // Pastikan ini dipanggil agar .env termuat

const fe_url = 'https://fe-alung-ta-dot-b-01-450713.uc.r.appspot.com/src/views';

// Ambil konfigurasi dari .env
const JWT_SECRET_KEY = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET_KEY = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';


// Fungsi untuk redirect ke halaman admin user (jika ada)
export const index = (req, res) => { // Ditambahkan export
  res.redirect(`${fe_url}/admin/user/index.html`);
};

// Fungsi untuk mendapatkan semua user
export const getAllUsers = async (req, res) => { // Ditambahkan export
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'refresh_token'] },
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ status: "Error", message: 'Internal server error' });
  }
}

// Fungsi untuk mendapatkan user berdasarkan ID
export const getUserById = async (req, res) => { // Ditambahkan export
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    if(isNaN(numericId)){
        return res.status(400).json({ status: "Error", message: 'Invalid User ID format'});
    }
    const user = await User.findByPk(numericId, {
      attributes: { exclude: ['password', 'refresh_token'] },
    });

    if (!user) {
      return res.status(404).json({ status: "Error", message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({ status: "Error", message: 'Internal server error' });
  }
}

// Fungsi untuk membuat user baru (registrasi)
export const createUser = async (req, res) => { // Sudah export const
  try {
    const { name, username, password, email, role } = req.body;

    if (!name || !username || !password || !email) { 
      return res.status(400).json({ status: "Error", message: 'Name, username, email, and password are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ status: "Error", message: 'Password minimal harus 6 karakter' });
    }

    const existingUserByUsername = await User.findOne({ where: { username } });
    if (existingUserByUsername) {
      return res.status(409).json({ status: "Error", message: 'Username already exists' });
    }
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      return res.status(409).json({ status: "Error", message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      username,
      email, 
      role: role || 'member', 
      password: hashedPassword,
    });

    const { password: _, refresh_token: __, ...userData } = newUser.toJSON();

    return res.status(201).json({
      status: "Success",
      message: 'User created successfully',
      user: userData,
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ status: "Error", message: 'Internal server error', error: error.message });
  }
};

// Fungsi untuk menghitung jumlah user
export const countUsers = async (req, res) => { // Sudah export const
  try {
    const count = await User.count();
    return res.status(200).json({ count });
  } catch (error) {
    console.error('Error counting users:', error);
    res.status(500).json({ status: "Error", message: 'Failed to count users', error: error.message });
  }
};

// Fungsi untuk menghapus user
export const deleteUser = async (req, res) => { // Ditambahkan export
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    if(isNaN(numericId)){
        return res.status(400).json({ status: "Error", message: 'Invalid User ID format'});
    }
    const user = await User.findByPk(numericId);

    if (!user) {
      return res.status(404).json({ status: "Error", message: 'User not found' });
    }
    if (user.username === 'admin' && user.role === 'admin') { // Proteksi agar admin utama tidak terhapus
        return res.status(403).json({ status: "Error", message: 'Cannot delete primary admin user' });
    }

    await user.destroy();
    return res.status(200).json({ status: "Success", message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ status: "Error", message: 'Internal server error' });
  }
}

// Fungsi login
export const login = async (req, res) => { // Ditambahkan export
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      where: { username: username },
    });

    if (!user) {
      return res.status(401).json({ status: "Error", message: "Invalid username or password" });
    }

    if (!user.password) {
        console.error(`User ${username} found but has no password set.`);
        return res.status(500).json({ status: "Error", message: "User data incomplete, contact administrator." });
    }
    
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (isPasswordMatch) {
      const payload = {
            userId: user.id,
            name: user.name,
            username: user.username,
            email: user.email, 
            role: user.role    
        };
        
        console.log('[DEBUG UserController Login] JWT_SECRET_KEY:', JWT_SECRET_KEY);
        console.log('[DEBUG UserController Login] REFRESH_TOKEN_SECRET_KEY:', REFRESH_TOKEN_SECRET_KEY);
        console.log('[DEBUG UserController Login] ACCESS_TOKEN_EXPIRES_IN:', ACCESS_TOKEN_EXPIRES_IN);
        console.log('[DEBUG UserController Login] REFRESH_TOKEN_EXPIRES_IN:', REFRESH_TOKEN_EXPIRES_IN);

        if (!JWT_SECRET_KEY) {
            console.error('JWT_SECRET is not defined in environment variables!');
            return res.status(500).json({ status: "Error", message: "Server configuration error (JWT Secret missing)." });
        }
        if (!REFRESH_TOKEN_SECRET_KEY) {
            console.error('REFRESH_TOKEN_SECRET is not defined in environment variables!');
            return res.status(500).json({ status: "Error", message: "Server configuration error (Refresh Token Secret missing)." });
        }

      const accessToken = jwt.sign(
        payload,
        JWT_SECRET_KEY, 
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        payload, 
        REFRESH_TOKEN_SECRET_KEY,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
      );

      await User.update(
        { refresh_token: refreshToken },
        { where: { id: user.id } }
      );

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true, 
        sameSite: "strict", 
        maxAge: 7 * 24 * 60 * 60 * 1000, // Contoh untuk 7 hari (sesuaikan dengan REFRESH_TOKEN_EXPIRES_IN)
        secure: process.env.NODE_ENV === 'production', 
      });

      res.status(200).json({
        status: "Success",
        message: "Login Berhasil",
        accessToken,
      });
    } else {
      return res.status(401).json({ status: "Error", message: "Invalid username or password" });
    }
  } catch (error) {
    console.error('[ERROR UserController Login]', error); 
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message || "Internal server error during login",
    });
  }
}

// Fungsi untuk mendapatkan info user yang sedang login
export const getLoggedInUser = async (req, res) => { // Ditambahkan export
  try {
    const username = req.user.username; // Diambil dari req.user yang diset oleh verifyToken
    if (!username) {
        console.error('Error in getLoggedInUser: req.user.username is undefined. Token might not contain username.');
        return res.status(403).json({ status: "Error", message: 'Forbidden: User information not found in token' });
    }
    const user = await User.findOne({
      where: { username },
      attributes: { exclude: ['password', 'refresh_token'] },
    });
    if (!user) {
      return res.status(404).json({ status: "Error", message: 'User not found' });
    }
    return res.status(200).json(user);
  }
  catch (error) {
    console.error('Get logged in user error:', error);
    return res.status(500).json({ status: "Error", message: 'Internal server error' });
  }
}

// Fungsi logout
export const logout = async (req, res) => { // Ditambahkan export
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.sendStatus(204); // No content, anggap sudah logout
    }

    const user = await User.findOne({ where: { refresh_token: refreshToken } });
    if (!user) { // Jika token tidak ditemukan di user manapun
        res.clearCookie("refreshToken", { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
        return res.sendStatus(204); 
    }

    await User.update(
      { refresh_token: null }, // Hapus refresh token dari database
      { where: { id: user.id } } 
    );

    res.clearCookie("refreshToken", { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    return res.status(200).json({ status: "Success", message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ status: "Error", message: 'Internal server error' });
  }
}

// Tidak perlu blok 'export { ... }' di akhir jika semua fungsi sudah diekspor inline dengan 'export const'.