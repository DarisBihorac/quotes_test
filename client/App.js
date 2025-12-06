const API_BASE = "http://localhost:3000";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "./login.html";
}

const quotesList = document.getElementById("quotes-list");
const logoutBtn = document.getElementById("logout-btn");
const addForm = document.getElementById("add-form");

// ------------------ GET QUOTES ------------------
async function loadQuotes() {
  const res = await fetch(`${API_BASE}/quotes/all`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  const data = await res.json();

  quotesList.innerHTML = "";

  data.forEach(q => {
    const item = document.createElement("div");
    item.classList.add("quote-card");

    item.innerHTML = `
      <p class="quote-text">"${q.text}"</p>
      <p class="quote-author">— ${q.author}</p>

      <div class="vote-box">
        <button onclick="vote('${q.id}', 'upvote')">👍 ${q.upvotes}</button>
        <button onclick="vote('${q.id}', 'downvote')">👎 ${q.downvotes}</button>
      </div>
    `;

    quotesList.appendChild(item);
  });
}

window.vote = async function(id, type) {
  await fetch(`${API_BASE}/quotes/${type}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ id })
  });

  loadQuotes();
};

// ------------------ ADD QUOTE ------------------
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const author = document.getElementById("author").value.trim();
  const text = document.getElementById("text").value.trim();

  await fetch(`${API_BASE}/quotes/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ author, text })
  });

  addForm.reset();
  loadQuotes();
});

// ------------------ LOGOUT ------------------
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "./login.html";
});

loadQuotes();
