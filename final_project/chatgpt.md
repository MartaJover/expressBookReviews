general.js:
``` javascript
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
```

booksdb.js:
```javascript
let books = {
      1: {
        "author": "Chinua Achebe",
        "title": "Things Fall Apart",
        "reviews": {
          "GoodreadsUser1": "A powerful narrative that reveals the tragedy of pre-colonial Africa."
        }
      },
      2: {
        "author": "Hans Christian Andersen",
        "title": "Fairy tales",
        "reviews": {
          "GoodreadsUser2": "Enchanting and timeless, these tales mirror the human condition."
        }
      },
      3: {
        "author": "Dante Alighieri",
        "title": "The Divine Comedy",
        "reviews": {
          "GoodreadsUser3": "A profound journey through hell, purgatory, and heaven that inspires awe."
        }
      },
      4: {
        "author": "Unknown",
        "title": "The Epic Of Gilgamesh",
        "reviews": {
          "GoodreadsUser4": "A mythic tale of heroism and friendship that transcends time."
        }
      },
      5: {
        "author": "Unknown",
        "title": "The Book Of Job",
        "reviews": {
          "GoodreadsUser5": "A stark exploration of suffering and faith that resonates deeply."
        }
      },
      6: {
        "author": "Unknown",
        "title": "One Thousand and One Nights",
        "reviews": {
          "GoodreadsUser6": "A mesmerizing collection of stories that weave magic with wisdom."
        }
      },
      7: {
        "author": "Unknown",
        "title": "Njál's Saga",
        "reviews": {
          "GoodreadsUser7": "A gripping saga of honor, betrayal, and the spirit of ancient culture."
        }
      },
      8: {
        "author": "Jane Austen",
        "title": "Pride and Prejudice",
        "reviews": {
          "GoodreadsUser8": "A witty, insightful look into society that continues to charm readers."
        }
      },
      9: {
        "author": "Honoré de Balzac",
        "title": "Le Père Goriot",
        "reviews": {
          "GoodreadsUser9": "A compelling portrayal of ambition and decay in 19th-century Paris."
        }
      },
      10: {
        "author": "Samuel Beckett",
        "title": "Molloy, Malone Dies, The Unnamable, the trilogy",
        "reviews": {
          "GoodreadsUser10": "An abstract, challenging work that pushes narrative boundaries."
        }
      }
    }
    
    module.exports = books;

module.exports=books;

```

index.js:
```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use("/customer",session({secret:"fingerprint_customer",resave: true, saveUninitialized: true}))

app.use("/customer/auth/*", function auth(req,res,next){
// Check if user is logged in and has valid access token
    if (req.session.authorization) {
        let token = req.session.authorization['accessToken'];

        // Verify the JWT token
        jwt.verify(token, "access", (err, user) => {
            if (!err) {
                req.user = user;
                next(); // Proceed to the next middleware
            } else {
                return res.status(403).json({ message: "User not authenticated"});
            }
        });
    } else {
        return res.status(403).json({ message: "User not logged in"});
    }
});
 
const PORT =5001;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT,()=>console.log("Server is running"));
```

auth_users.js:
```javascript
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
```

Task 10:
Add the code for getting the list of books available in the shop (done in Task 1) using Promise callbacks or async-await with Axios.
Hint: Refer to this lab on Promises and Callbacks.

Please ensure that the general.js file has the code for getting the list of books available in the shop using Promise callbacks or async-await with Axios is covered.