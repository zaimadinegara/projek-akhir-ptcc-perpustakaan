// backend/controller/GenreController.js

import Genre from '../model/Genre.js'; // <--- DIUBAH dari Category
import Book from '../model/Book.js';   // <--- DIUBAH dari News
import dotenv from 'dotenv';
dotenv.config();

// Sesuaikan URL frontend jika perlu
const fe_url = 'https://fe-alung-ta-dot-b-01-450713.uc.r.appspot.com/src/views';

const index = (req, res) => {
  // Sesuaikan path redirect ke halaman admin untuk genre
  res.redirect(`${fe_url}/admin/genres/index.html`); // Ganti category menjadi genres
};

export const createGenre = async (req, res) => { // Ganti nama fungsi
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Genre name is required' }); // Ganti Category menjadi Genre
    }

    const existingGenre = await Genre.findOne({ where: { name } }); // Ganti Category menjadi Genre
    if (existingGenre) {
      return res.status(409).json({ message: 'Genre already exists' }); // Ganti Category menjadi Genre
    }

    const newGenre = await Genre.create({ name }); // Ganti Category menjadi Genre
    res.status(201).json({ message: 'Genre created', data: newGenre }); // Ganti Category menjadi Genre
  } catch (error) {
    res.status(500).json({ message: 'Failed to create genre', error: error.message }); // Ganti category menjadi genre
  }
};

export const getAllGenres = async (req, res) => { // Ganti nama fungsi
  try {
    const genres = await Genre.findAll(); // Ganti Category menjadi Genre
    res.status(200).json(genres);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch genres', error: error.message }); // Ganti categories menjadi genres
  }
};

export const getGenreById = async (req, res) => { // Ganti nama fungsi
  try {
    const { id } = req.params;
    const genre = await Genre.findByPk(id); // Ganti Category menjadi Genre

    if (!genre) {
      return res.status(404).json({ message: 'Genre not found' }); // Ganti Category menjadi Genre
    }

    res.status(200).json(genre);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch genre', error: error.message }); // Ganti category menjadi genre
  }
};

export const updateGenre = async (req, res) => { // Ganti nama fungsi
  try {
    const { id } = req.params;
    const { name } = req.body;

    const genre = await Genre.findByPk(id); // Ganti Category menjadi Genre

    if (!genre) {
      return res.status(404).json({ message: 'Genre not found' }); // Ganti Category menjadi Genre
    }

    genre.name = name || genre.name;
    await genre.save();

    res.status(200).json({ message: 'Genre updated', data: genre }); // Ganti Category menjadi Genre
  } catch (error) {
    res.status(500).json({ message: 'Failed to update genre', error: error.message }); // Ganti category menjadi genre
  }
};

export const deleteGenre = async (req, res) => { // Ganti nama fungsi
  try {
    const { id } = req.params;
    const genre = await Genre.findByPk(id, { // Ganti Category menjadi Genre
      include: { // Sekarang Genre berelasi dengan Book
        model: Book,   // Ganti News menjadi Book
        through: { attributes: [] }, 
      },
    });

    if (!genre) {
      return res.status(404).json({ message: 'Genre not found' }); // Ganti Category menjadi Genre
    }

    // Menggunakan 'books' (nama alias default atau sesuai yang didefinisikan di asosiasi)
    if (genre.books && genre.books.length > 0) { // Ganti category.news menjadi genre.books
      return res.status(400).json({ message: 'Cannot delete genre with associated books' }); // Ganti category dan news menjadi genre dan books
    }

    await genre.destroy();
    res.status(200).json({ message: 'Genre deleted' }); // Ganti Category menjadi Genre
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete genre', error: error.message }); // Ganti category menjadi genre
  }
};

export const countGenres = async (req, res) => { // Ganti nama fungsi
  try {
    const count = await Genre.count(); // Ganti Category menjadi Genre
    return res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to count genres', error: error.message }); // Ganti categories menjadi genres
  }
};

export { index };