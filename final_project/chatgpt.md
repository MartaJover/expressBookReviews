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
    if (req.session.authotization) {
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

const isValid = (username)=>{ //returns boolean
//write code to check is the username is valid
}

const authenticatedUser = (username,password)=>{ //returns boolean
//write code to check if username and password match the one we have in records.
}

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
  //Write your code here
  return res.status(300).json({message: "Yet to be implemented"});
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;


```

Task 7:
Complete the code for logging in as a registered user.
Hint: The code must validate and sign in a customer based on the username and password created in Exercise 6. It must also save the user credentials for the session as a JWT.
As you are required to login as a customer, while testing the output on Postman, use the endpoint as "customer/login"

Test the output on Postman.

I am getting the following error when trying npm start:

artajover@MBPM final_project % npm start

> bookshop@1.0.1 start
> nodemon index.js

[nodemon] 2.0.22
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node index.js`
/Users/martajover/Documents/Educación/Fullstack coursera/FS_Ejercicios/NODE JS/expressBookReviews/final_project/router/general.js:21
regd_users.post("/login", (req, res) => {
^

ReferenceError: regd_users is not defined
    at Object.<anonymous> (/Users/martajover/Documents/Educación/Fullstack coursera/FS_Ejercicios/NODE JS/expressBookReviews/final_project/router/general.js:21:1)
    at Module._compile (node:internal/modules/cjs/loader:1554:14)
    at Object..js (node:internal/modules/cjs/loader:1706:10)
    at Module.load (node:internal/modules/cjs/loader:1289:32)
    at Function._load (node:internal/modules/cjs/loader:1108:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:220:24)
    at Module.require (node:internal/modules/cjs/loader:1311:12)
    at require (node:internal/modules/helpers:136:16)
    at Object.<anonymous> (/Users/martajover/Documents/Educación/Fullstack coursera/FS_Ejercicios/NODE JS/expressBookReviews/final_project/index.js:5:21)

Node.js v22.14.0
[nodemon] app crashed - waiting for file changes before starting...
