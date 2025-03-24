const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  const existingUser = users.find((user) => user.username === username);
  // If no user is found, username is valid (i.e., not taken)
  return !existingUser;
};

const authenticatedUser = (username, password) => {
  const validUser = users.find(
    (user) => user.username === username && user.password === password
  );
  // Return true if we found a matching user, otherwise false
  return !!validUser;
};

regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }
  const validUser = users.find(user => user.username === username && user.password === password);
  if (validUser) {
    let accessToken = jwt.sign({ username: username }, "access", { expiresIn: '1h' });
    req.session.authorization = { accessToken };
    return res.status(200).json({ message: "User successfully logged in", token: accessToken });
  } else {
    return res.status(403).json({ message: "Invalid username or password" });
  }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;

  const reviewText = req.query.review;
  if (!reviewText) {
    return res.status(400).json({ message: "Review text is required."});
  }

  const book = books[isbn];
  if (!book) {
    return res.status(404).json({message: `Book with ISBN ${isbn} not found.`});
  }

  const username = req.user && req.user.username;
  if (!username) {
    return res.status(403).json({ message: "User not authenticated" });
  }

  book.reviews[username] = reviewText;

  return res.status(300).json({
    message: "Review added/modified successfully",
    reviews: book.reviews
  });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found.` });
  }

  const username = req.user && req.user.username;
  if (!username) {
    return res.status(403).json({ message: "User not authenticated" });
  }

  if (!book.reviews[username]) {
    return res
      .status(404)
      .json({ message: `No review found for user ${username} on this book.` });
  }

  delete book.reviews[username];

  return res.status(200).json({
    message: "Review deleted successfully",
    reviews: book.reviews,
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
