const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req,res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }
  const userExists = users.find((user) => user.username === username);
  if (userExists) {
    return res.status(409).json({ message: "Username already exists." });
  }
  users.push({ username, password });
  return res.status(200).json({ message: "User registered successfully." });
});

// Get the book list available in the shop
public_users.get('/books',function (req, res) {
  // Convert the books object to a formatted JSON string
  const booksList = JSON.stringify(books, null, 4);
  // Send the JSON string as a response with a 200 status
  return res.status(200).send(booksList);
});

// Get the list of books available in the shop using async/await with Axios
public_users.get('/books-async', async (req, res) => {
  try {
    const axios = require('axios');
    // Call the existing '/books' endpoint on your server
    const response = await axios.get('http://localhost:5001/books');
    // Return the data received from the '/books' endpoint
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving books", error: error.message });
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];
  if (book) {
    return res.status(200).json(book);
  } else {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
  }
 });
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  const author = req.params.author;
  const matchedBooks = Object.values(books).filter((book) => book.author === author);
  if (matchedBooks.length > 0) {
    return res.status(200).json(matchedBooks);
  } else {
    return res.status(404).json({ message: `No books found for author "${author}".` });
  }
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  const title = req.params.title;
  const bookTitle = Object.values(books).filter((book) => book.title === title);

  if (bookTitle.length > 0) {
    return res.status(200).json(bookTitle);
  } else {
    return res.status(404).json({ message: `No books found with title "${title}".` });
  }
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];
  if (book) {
    return res.status(200).json(book.reviews);
  } else {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
  }
});

module.exports.general = public_users;
