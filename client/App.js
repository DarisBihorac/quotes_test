const API_BASE = "http://localhost:8080";
const token = localStorage.getItem("token");

if(!token){
  window.location.href = "login.html";
}

document.getElementById("logoutBtn").addEventListener("click", ()=>{
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

document.getElementById("createBtn").addEventListener("click", ()=> alert("Dodaj modal ili formu za dodavanje citata"));

async function loadQuotes(){
  try {
    const res = await fetch(API_BASE + "/quotes", {
      headers: { "Authorization": "Bearer " + token }
    });
    if(!res.ok) throw new Error("Neuspesan zahtev");

    const data = await res.json();
    renderQuotes(data || []);
  } catch(err){
    console.error(err);
    alert("Ne mogu da učitam citate. Proveri server.");
  }
}

function renderQuotes(quotes){
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  if(!quotes.length){
    grid.innerHTML = '<div class="card" style="padding:24px">Nema citata.</div>';
    return;
  }

  quotes.forEach(q=>{
    const el = document.createElement("div");
    el.className = "quote-card";

    el.innerHTML = `
      <div class="quote-text">"${escapeHtml(q.text || q.quote || q.content || '')}"</div>
      <div class="quote-meta">
        <div>
          <div style="font-weight:600">${escapeHtml(q.author || "Nepoznat")}</div>
          <div style="color:var(--muted);font-size:13px">${escapeHtml(q.tag || '')}</div>
        </div>
        <div class="controls">
          <div class="badge">${q.score ?? 0}</div>
          <button class="icon-btn" data-id="${q.id}" data-action="up">👍</button>
          <button class="icon-btn" data-id="${q.id}" data-action="down">👎</button>
          <button class="icon-btn" data-id="${q.id}" data-action="del" title="Delete">🗑️</button>
        </div>
      </div>
    `;

    grid.appendChild(el);
  });

  grid.querySelectorAll(".icon-btn").forEach(btn=>{
    btn.addEventListener("click", async (e)=>{
      const id = e.currentTarget.dataset.id;
      const action = e.currentTarget.dataset.action;
      if(action === "del"){
        if(!confirm("Obrisati citat?")) return;
        await apiDelete(id);
      } else if(action === "up"){
        await apiVote(id, "upvote");
      } else {
        await apiVote(id, "downvote");
      }
      await loadQuotes();
    });
  });
}

async function apiVote(id, type){
  try {
    await fetch(`${API_BASE}/quotes/${id}/${type}`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + token }
    });
  } catch(err){ console.error(err) }
}

async function apiDelete(id){
  try {
    await fetch(`${API_BASE}/quotes/${id}`, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + token }
    });
  } catch(err){ console.error(err) }
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

loadQuotes();

