const express = require("express");
const bodyParser = require("body-parser");
const { uuid } = require("uuidv4");
const port = 8000;

const USERS = [
  { id: "d964099a-1a2a-46f5-9782-e2601b5aac9e", username: "fazi", password: "1234" },
  { id: "a77d280e-94b8-4a1e-a869-1f14e622fa4e", username: "pera", password: "1234" },
  { id: "49d73d43-e1bc-46b4-88a6-d802d1cc9fe9", username: "mika", password: "1234" },
  { id: "3de3d9ff-60b1-4694-9e87-77aefea9ea0e", username: "zika", password: "1234" },
];

// token : userId
const TOKENS = {
  "ba13533b-e275-45a2-bc2e-b3098036d655": "d964099a-1a2a-46f5-9782-e2601b5aac9e",
  "csa31d3b-e275-45a2-bc2e-b3098036d655": "a77d280e-94b8-4a1e-a869-1f14e622fa4e",
  "popk376k-e275-45a2-bc2e-b3098036d655": "49d73d43-e1bc-46b4-88a6-d802d1cc9fe9",
  "yuim98oq-e275-45a2-bc2e-b3098036d655": "3de3d9ff-60b1-4694-9e87-77aefea9ea0e",
};

const QUOTES = [
  {
    id: "4f71adf6-b7f5-45a5-82d6-1ed37d79c2d1",
    content: "Be yourself; everyone else is already taken.",
    author: "Oscar Wilde",
    tags: ["be yourself", "honesty", "inspirational"],
    userId: "d964099a-1a2a-46f5-9782-e2601b5aac9e",
    upvotesCount: 21,
    downvotesCount: 3,
    createdAt: "2020-07-12T07:54:35.090Z",
    upvotedBy: ["a77d280e-94b8-4a1e-a869-1f14e622fa4e", "49d73d43-e1bc-46b4-88a6-d802d1cc9fe9"],
    downvotedBy: ["3de3d9ff-60b1-4694-9e87-77aefea9ea0e"],
  },
  {
    id: "25bb3e69-5b6b-4376-8f77-f79d6bac40c9",
    content: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.",
    author: "Albert Einstein",
    tags: ["human nature", "humor", "infinity", "philosophy", "science", "stupidity", "universe"],
    userId: "d964099a-1a2a-46f5-9782-e2601b5aac9e",
    upvotesCount: 26,
    downvotesCount: 2,
    createdAt: "2020-07-12T07:55:35.090Z",
    upvotedBy: ["d964099a-1a2a-46f5-9782-e2601b5aac9e", "49d73d43-e1bc-46b4-88a6-d802d1cc9fe9", "3de3d9ff-60b1-4694-9e87-77aefea9ea0e"],
    downvotedBy: [],
  },
  // ... ostali citati (skraćeno radi preglednosti, možeš dodati ostatak)
];

const app = express();
app.use(bodyParser.json());
app.use(require("cors")());

// --- Helper functions ---
function getToken(req) {
  const header = req.header("Authorization");
  if (!header) return null;
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return null;
  return header.slice(prefix.length);
}

function identifyUser(req) {
  const token = getToken(req);
  if (!token) return null;
  const userId = TOKENS[token];
  if (!userId) return null;
  return USERS.find((user) => user.id === userId) || null;
}

function getAllTags() {
  const tags = QUOTES.map((q) => q.tags).flat();
  return Array.from(new Set(tags));
}

function transformQuote(quote, userId) {
  return {
    id: quote.id,
    content: quote.content,
    author: quote.author,
    tags: quote.tags,
    userId: quote.userId,
    upvotesCount: quote.upvotesCount,
    downvotesCount: quote.downvotesCount,
    createdAt: quote.createdAt,
    givenVote: quote.upvotedBy.includes(userId)
      ? "upvote"
      : quote.downvotedBy.includes(userId)
      ? "downvote"
      : "none",
  };
}

// --- Public routes ---
app.get("/", (req, res) => {
  res.send("Server radi! /quotes zahteva Authorization header.");
});

app.get("/quotes-public", (req, res) => {
  res.send(
    QUOTES.map((quote) => ({
      id: quote.id,
      content: quote.content,
      author: quote.author,
    }))
  );
});

// --- Authentication ---
app.post("/sessions", (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find((u) => u.username === username);
  if (!user || user.password !== password) return res.status(401).send(null);

  const tokenEntry = Object.entries(TOKENS).find(([token, uid]) => uid === user.id);
  const [accessToken] = tokenEntry;
  res.status(200).send({ accessToken });
});

// --- Protected routes ---
app.get("/tags", (req, res) => {
  const user = identifyUser(req);
  if (!user) return res.status(401).send();
  res.status(200).send(getAllTags());
});

app.get("/quotes", (req, res) => {
  const user = identifyUser(req);
  if (!user) return res.status(401).send();

  const tags = (req.query.tags || "").split(",").filter(Boolean);
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const sortBy = req.query.sortBy || "upvotesCount";
  const sortDirection = req.query.sortDirection || "desc";

  let quotes = QUOTES.filter((q) => !tags.length || q.tags.some((t) => tags.includes(t)));
  quotes.sort((a, b) => (sortDirection === "asc" ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy]));

  res.send({
    quotesCount: quotes.length,
    quotes: quotes.slice((page - 1) * pageSize, page * pageSize).map((q) => transformQuote(q, user.id)),
  });
});

app.get("/quotes/:id", (req, res) => {
  const user = identifyUser(req);
  if (!user) return res.status(401).send();

  const quote = QUOTES.find((q) => q.id === req.params.id);
  if (!quote) return res.status(404).send();

  res.send(transformQuote(quote, user.id));
});

// --- Start server ---
app.listen(port, () => {
  console.log(`Server pokrenut na http://localhost:${port}`);
});
