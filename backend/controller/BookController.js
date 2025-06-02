// backend/controller/BookController.js

import { fileURLToPath } from 'url';
import Book from '../model/Book.js';
import Genre from '../model/Genre.js';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { Op, Sequelize } from 'sequelize';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fe_url = 'https://fe-alung-ta-dot-b-01-450713.uc.r.appspot.com/src/views/';

export const index = (req, res) => {
  res.redirect(`${fe_url}admin/books/index.html`);
};

export const create = (req, res) => {
  res.redirect(`${fe_url}admin/books/create.html`);
};

export const edit = (req, res) => {
  res.redirect(`${fe_url}admin/books/edit.html?id=${req.params.id}`);
}

export const createBook = async (req, res) => {
  console.log('Request body for createBook:', req.body);
  console.log('Request file for createBook:', req.file);
  try {
    const { title, author, isbn, published_year, quantity_total, quantity_available } = req.body;
    let genreIds = req.body['genreIds[]'] || req.body.genreIds;
    if (genreIds && !Array.isArray(genreIds)) genreIds = [genreIds];
    
    if (!title || !author || quantity_total === undefined || quantity_available === undefined) {
        return res.status(400).json({ message: 'Title, author, quantity total, and quantity available are required' });
    }

    let coverImageUrl = null;
    if (req.body.cover_image_url) {
        coverImageUrl = req.body.cover_image_url;
    }
    if (req.file) {
        coverImageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    let validNumericGenreIds = [];
    if (genreIds && genreIds.length > 0) {
      validNumericGenreIds = genreIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      if (validNumericGenreIds.length > 0) {
        const genres = await Genre.findAll({ where: { id: validNumericGenreIds } });
        if (genres.length !== validNumericGenreIds.length) {
          return res.status(400).json({ message: 'One or more genre IDs are invalid' });
        }
      }
    }

    const book = await Book.create({
        title,
        author,
        isbn,
        published_year: published_year ? parseInt(published_year, 10) : null,
        quantity_total: parseInt(quantity_total, 10),
        quantity_available: parseInt(quantity_available, 10),
        cover_image_url: coverImageUrl
    });

    if (validNumericGenreIds.length > 0) {
      await book.setGenres(validNumericGenreIds);
    }

    const newBookWithGenres = await Book.findByPk(book.id, {
        include: [{ model: Genre, attributes: ['id', 'name'], through: { attributes: [] } }]
    });

    res.status(201).json({ message: 'Book created successfully', data: newBookWithGenres });
  } catch (error) {
    console.error("Error creating book:", error);
    res.status(500).json({ message: 'Failed to create book', error: error.message });
  }
};

export const getAllBooks = async (req, res) => {
  try {
    const { search, genreId } = req.query;
    const whereClauseForBook = {};
    let includeOptions = [
      {
        model: Genre,
        attributes: ['id', 'name'],
        through: { attributes: [] }
      }
    ];

    if (search) {
      whereClauseForBook[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { author: { [Op.like]: `%${search}%` } }
      ];
    }
    if (genreId) {
      const numericGenreId = parseInt(genreId, 10);
      if (!isNaN(numericGenreId)) {
        includeOptions = [
          {
            model: Genre,
            attributes: ['id', 'name'],
            where: { id: numericGenreId },
            through: { attributes: [] },
            required: true
          }
        ];
      } else {
        console.warn("Received invalid genreId:", genreId);
      }
    }
    
    const bookList = await Book.findAll({
      where: whereClauseForBook,
      include: includeOptions,
      order: [['title', 'ASC']],
      distinct: true
    });

    res.status(200).json(bookList);
  } catch (error) {
    console.error("Error retrieving books:", error);
    res.status(500).json({ message: 'Failed to retrieve books', error: error.message });
  }
};

export const getRecentBooks = async (req, res) => {
  try {
    const bookList = await Book.findAll({
      include: {
        model: Genre,
        attributes: ['id', 'name'],
        through: { attributes: [] },
      },
      order: [['createdAt', 'DESC']],
      limit: 5,
    });
    res.status(200).json(bookList);
  } catch (error) {
    console.error("Error retrieving recent books:", error);
    res.status(500).json({ message: 'Failed to retrieve recent books', error: error.message });
  }
};

export const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
        return res.status(400).json({ message: 'Invalid book ID format' });
    }
    const book = await Book.findByPk(numericId, {
      include: {
        model: Genre,
        attributes: ['id', 'name'],
        through: { attributes: [] },
      },
    });

    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.status(200).json(book);
  } catch (error) {
    console.error("Error retrieving book by ID:", error);
    res.status(500).json({ message: 'Failed to retrieve book', error: error.message });
  }
};

export const updateBook = async (req, res) => {
  console.log('Request body for updateBook:', req.body);
  console.log('Request file for updateBook:', req.file);
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
        return res.status(400).json({ message: 'Invalid book ID format' });
    }

    const { title, author, isbn, published_year, quantity_total, quantity_available } = req.body;
    let genreIds = req.body['genreIds[]'] || req.body.genreIds;
    if (genreIds && !Array.isArray(genreIds)) genreIds = [genreIds];

    const book = await Book.findByPk(numericId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    let coverImageUrl = book.cover_image_url;
    if (req.body.cover_image_url === '') {
        coverImageUrl = null;
    } else if (req.body.cover_image_url) {
        coverImageUrl = req.body.cover_image_url;
    }
    
    if (req.file) {
        coverImageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      const oldImage = book.cover_image_url;
      if (oldImage && oldImage.startsWith(`${req.protocol}://${req.get('host')}/uploads/`)) {
        try {
            const oldImageFileName = path.basename(new URL(oldImage).pathname);
            const oldImagePath = path.join(__dirname, '..', 'uploads', oldImageFileName); 
            if (fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, (err) => {
                  if (err) console.error('Failed to delete old image:', err);
                });
            } else {
                console.warn('Old image path not found, not deleting:', oldImagePath);
            }
        } catch (urlParseError) {
            console.error('Error parsing oldImage URL for deletion:', urlParseError);
        }
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (author !== undefined) updateData.author = author;
    if (isbn !== undefined) updateData.isbn = isbn;
    if (published_year !== undefined) updateData.published_year = published_year ? parseInt(published_year, 10) : null;
    if (quantity_total !== undefined) updateData.quantity_total = parseInt(quantity_total, 10);
    if (quantity_available !== undefined) updateData.quantity_available = parseInt(quantity_available, 10);
    if (req.file || req.body.cover_image_url !== undefined) {
        updateData.cover_image_url = coverImageUrl;
    }

    if (Object.keys(updateData).length > 0) {
      await book.update(updateData);
    }

    let validNumericGenreIdsForUpdate = [];
    if (genreIds) { 
      validNumericGenreIdsForUpdate = Array.isArray(genreIds) ? genreIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id)) : [];
      await book.setGenres(validNumericGenreIdsForUpdate); // Tidak perlu validasi genre lagi di sini, biarkan setGenres menangani
    }

    const updatedBook = await Book.findByPk(numericId, {
      include: [{ model: Genre, attributes:['id', 'name'], through: {attributes: []} }]
    });
    res.status(200).json({ message: 'Book updated successfully', data: updatedBook });
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ message: 'Failed to update book', error: error.message });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
        return res.status(400).json({ message: 'Invalid book ID format' });
    }
    const book = await Book.findByPk(numericId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    if (book.cover_image_url && book.cover_image_url.startsWith(`${req.protocol}://${req.get('host')}/uploads/`)) {
        try {
            const imageFileName = path.basename(new URL(book.cover_image_url).pathname);
            const imagePath = path.join(__dirname, '..', 'uploads', imageFileName);
            if (fs.existsSync(imagePath)) {
              fs.unlink(imagePath, (err) => {
                if (err) console.error('Failed to delete image file:', err);
              });
            } else {
                console.warn('Image file not found for deletion:', imagePath);
            }
        } catch (urlParseError) {
            console.error('Error parsing cover_image_url for deletion:', urlParseError);
        }
    }
    await book.destroy();
    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ message: 'Failed to delete book', error: error.message });
  }
};

export const countBooks = async (req, res) => {
  try {
    const count = await Book.count();
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error counting books:", error);
    res.status(500).json({ message: 'Failed to count books', error: error.message });
  }
};