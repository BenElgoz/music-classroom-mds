const API_BASE = '/api';

const sessionsBody = document.getElementById('sessions-body');
const sessionsStatus = document.getElementById('sessions-status');
const sessionDetail = document.getElementById('session-detail');
const tracksBody = document.getElementById('tracks-body');
const tracksStatus = document.getElementById('tracks-status');
const proposeForm = document.getElementById('propose-form');
const submitStatus = document.getElementById('submit-status');

const emailInput = document.getElementById('email');
const saveEmailBtn = document.getElementById('save-email');
const artistInput = document.getElementById('artist');
const titleInput = document.getElementById('title');
const submitBtn = document.getElementById('submit-track');

let selectedSession = null;
let userEmail = localStorage.getItem('email') || '';
if (userEmail) emailInput && (emailInput.value = userEmail);

saveEmailBtn?.addEventListener('click', () => {
  const v = emailInput.value.trim();
  if (!v) return;
  userEmail = v;
  localStorage.setItem('email', v);
  document.getElementById('login-block').style.display = 'none';
  proposeForm.style.display = 'block';
});

async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function loadSessions() {
  sessionsStatus.textContent = 'Chargement...';
  try {
    const sessions = await fetchJSON(`${API_BASE}/sessions`);
    sessionsBody.innerHTML = '';
    if (!sessions.length) {
      sessionsStatus.textContent = 'Aucune session aujourd\'hui';
      return;
    }
    sessionsStatus.textContent = '';
    for (const s of sessions) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.startTime || ''} - ${s.endTime || ''}</td>
        <td>${s.subject}</td>
        <td>${s.teacher || ''}</td>
        <td>${s.promotion || ''}</td>
        <td><button data-id="${s.id}">Ouvrir</button></td>
      `;
      tr.querySelector('button').addEventListener('click', () => selectSession(s));
      sessionsBody.appendChild(tr);
    }
  } catch (e) {
    sessionsStatus.textContent = 'Erreur chargement sessions';
  }
}

function selectSession(s) {
  selectedSession = s;
  sessionDetail.innerHTML = `
    <div><strong>${s.subject}</strong></div>
    <div class="muted">${s.teacher || ''} · ${s.promotion || ''}</div>
    <div class="muted">${s.startTime || ''} - ${s.endTime || ''} (${s.date})</div>
  `;
  

  document.getElementById('login-block').style.display = 'block';
  proposeForm.style.display = 'none';
  loadTracks();
}

async function loadTracks() {
  if (!selectedSession) return;
  tracksStatus.textContent = 'Chargement...';
  tracksBody.innerHTML = '';
  try {
    const tracks = await fetchJSON(`${API_BASE}/tracks/session/${selectedSession.id}`);
    if (!tracks.length) {
      tracksStatus.textContent = 'Aucun morceau proposé';
      return;
    }
    tracksStatus.textContent = '';
    // voteCount = nombre de votes
    const rows = tracks
      .map(t => ({ ...t, voteCount: (t.votes?.length) ?? 0 }))
      .sort((a,b) => b.voteCount - a.voteCount || new Date(a.submittedAt) - new Date(b.submittedAt));

    for (const t of rows) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.artist}</td>
        <td>${t.title}</td>
        <td>${t.voteCount}</td>
        <td><button class="like-btn" data-track-id="${t.id}">👍 ${t.voteCount}</button></td>
      `;
      tr.querySelector('.like-btn').addEventListener('click', () => voteTrack(t.id));
      tracksBody.appendChild(tr);
    }
  } catch (e) {
    tracksStatus.textContent = 'Erreur chargement morceaux';
  }
}

submitBtn?.addEventListener('click', async () => {
  if (!selectedSession) return;
  if (!userEmail) return alert('Entrez un email (mock)');

  const artist = artistInput.value.trim();
  const title = titleInput.value.trim();
  if (!artist || !title) return alert('Artiste et Titre requis');

  submitStatus.textContent = 'Envoi...';
  try {
    await fetchJSON(`${API_BASE}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artist, title, sessionId: selectedSession.id, userId: userEmail })
    });
    submitStatus.textContent = '✅ Envoyé';
    artistInput.value = '';
    titleInput.value = '';
    // Masquer le formulaire après envoi
    proposeForm.style.display = 'none';
    await loadTracks();
  } catch (e) {
    submitStatus.textContent = '❌ Erreur envoi';
  }
});

async function voteTrack(trackId) {
  if (!userEmail) return alert('Connectez-vous d\'abord');
  
  try {
    await fetchJSON(`${API_BASE}/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userEmail, trackId })
    });
    await loadTracks();
  } catch (e) {
    if (e.message.includes('Déjà voté')) {
      alert('Vous avez déjà voté pour cette session aujourd\'hui');
    } else {
      alert('Erreur lors du vote');
    }
  }
}

function hashCode(str) {
  let h = 0; for (let i = 0; i < str.length; i++) { h = ((h<<5)-h) + str.charCodeAt(i); h |= 0; }
  return h;
}

loadSessions();
