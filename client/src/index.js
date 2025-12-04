// api/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(bodyParser.json());

let quotes = [
  { id: uuidv4(), text: "Budi hrabar", author: "Nepoznat", tag: "motivacija", score: 0 }
];

const USER = { username: "admin", password: "admin" };
const SECRET = "tajni_kljuc";

// login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if(username === USER.username && password === USER.password){
    const accessToken = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
    res.json({ accessToken });
  } else {
    res.status(401).json({ message: "Pogresni kredencijali" });
  }
});

// auth middleware
function auth(req, res, next){
  const authHeader = req.headers['authorization'];
  if(!authHeader) return res.sendStatus(401);
  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET, (err, user) => {
    if(err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// get all quotes
app.get('/quotes', auth, (req, res) => res.json(quotes));

// create quote
app.post('/quotes', auth, (req, res) => {
  const { text, author, tag } = req.body;
  const newQuote = { id: uuidv4(), text, author, tag, score: 0 };
  quotes.push(newQuote);
  res.json(newQuote);
});

// upvote / downvote
app.post('/quotes/:id/upvote', auth, (req, res) => {
  const q = quotes.find(q => q.id === req.params.id);
  if(!q) return res.sendStatus(404);
  q.score++;
  res.json(q);
});

app.post('/quotes/:id/downvote', auth, (req, res) => {
  const q = quotes.find(q => q.id === req.params.id);
  if(!q) return res.sendStatus(404);
  q.score--;
  res.json(q);
});

// delete quote
app.delete('/quotes/:id', auth, (req, res) => {
  const index = quotes.findIndex(q => q.id === req.params.id);
  if(index === -1) return res.sendStatus(404);
  quotes.splice(index, 1);
  res.sendStatus(204);
});

// start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
