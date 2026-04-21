const tuningFilter = document.getElementById('tuningFilter');
const categoryFilter = document.getElementById('categoryFilter');
const searchQuery = document.getElementById('searchQuery');
const resultBody = document.getElementById('resultBody');
const statusMessage = document.getElementById('statusMessage');
const clearBtn = document.getElementById('clearBtn');
const songsSource = document.getElementById('songsSource');
const sourceFile = document.getElementById('sourceFile');

let songs = [];

// 検索ロジック
function filterSongs() {
  const category = categoryFilter.value;
  const query = searchQuery.value.toLowerCase();
  
  let filtered = songs.filter((s) => {
    return s[category] && s[category].toLowerCase().includes(query);
  });

  const availableTunings = [...new Set(filtered.map((s) => s.tuning))].sort();
  const currentTuning = tuningFilter.value;
  
  tuningFilter.innerHTML = '<option value="">All Tunings</option>';
  availableTunings.forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    tuningFilter.appendChild(opt);
  });
  
  if (availableTunings.includes(currentTuning)) {
    tuningFilter.value = currentTuning;
  } else {
    tuningFilter.value = "";
  }

  if (tuningFilter.value) {
    filtered = filtered.filter((s) => s.tuning === tuningFilter.value);
  }

  renderRows(filtered);
  statusMessage.textContent = `Showing ${filtered.length} of ${songs.length} songs.`;
}

function setControlsEnabled(enabled) {
  tuningFilter.disabled = !enabled;
  categoryFilter.disabled = !enabled;
  searchQuery.disabled = !enabled;
  clearBtn.disabled = !enabled;
}

function renderRows(filteredSongs) {
  resultBody.innerHTML = filteredSongs
    .map((s) => `<tr><td>${s.guitarist}</td><td>${s.title}</td><td>${s.tuning}</td><td>${s.albumtitle}</td><td>${s.remark}</td></tr>`)
    .join('');
  if (filteredSongs.length === 0) {
    resultBody.innerHTML = '<tr><td colspan="5" class="empty">No songs found.</td></tr>';
  }
}

function parseSongsFromSourceDocument(doc) {
  console.log("Parsing document...");
  if (doc.querySelector('#songSourceTable')) {
    console.log("Found #songSourceTable");
    return [...doc.querySelectorAll('#songSourceTable tbody tr')].map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 3) return null;
        return { title: cells[0].textContent.trim(), guitarist: cells[1].textContent.trim(), tuning: cells[2].textContent.trim(), albumtitle: (cells[3]?.textContent || '').trim(), remark: (cells[4]?.textContent || '').trim() };
    }).filter(Boolean);
  } else if (doc.querySelectorAll('ul.list li').length > 0) {
    console.log("Found ul.list");
    return [...doc.querySelectorAll('ul.list li')].map(item => {
      return { 
        title: item.querySelector('.songtitle')?.textContent.trim() || '',
        guitarist: item.querySelector('.guitarist')?.textContent.trim() || '',
        tuning: item.querySelector('.tuning')?.textContent.trim() || '',
        albumtitle: item.querySelector('.albumtitle')?.textContent.trim() || '',
        remark: item.parentElement?.querySelector('.remark')?.textContent.trim() || ''
      };
    }).filter(s => s.title || s.guitarist);
  }
  console.error("No valid table or list found in songs.html");
  return [];
}

function applyParsedSongs(parsedSongs, sourceName) {
  songs = parsedSongs;
  if (songs.length === 0) {
    statusMessage.textContent = `Error: No songs found in ${sourceName}. Check file structure.`;
    return;
  }
  statusMessage.textContent = `Loaded ${songs.length} songs from ${sourceName}.`;
  filterSongs();
  setControlsEnabled(true);
}

function initializeFromIframe() {
  console.log("Initializing from iframe...");
  const sourceDocument = songsSource.contentDocument;
  if (!sourceDocument || !sourceDocument.body.innerHTML) {
    console.warn("Iframe document not ready yet.");
    return;
  }
  const parsedSongs = parseSongsFromSourceDocument(sourceDocument);
  applyParsedSongs(parsedSongs, 'songs.html');
}

// イベント設定
categoryFilter.addEventListener('change', filterSongs);
searchQuery.addEventListener('input', filterSongs);
tuningFilter.addEventListener('change', filterSongs);
clearBtn.addEventListener('click', () => { searchQuery.value = ''; tuningFilter.value = ''; filterSongs(); });
songsSource.addEventListener('load', initializeFromIframe);
sourceFile.addEventListener('change', (e) => {
  if (!e.target.files[0]) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const doc = new DOMParser().parseFromString(ev.target.result, 'text/html');
    applyParsedSongs(parseSongsFromSourceDocument(doc), e.target.files[0].name);
  };
  reader.readAsText(e.target.files[0]);
});

// 初期起動
if (songsSource.contentDocument && songsSource.contentDocument.readyState === 'complete') {
    initializeFromIframe();
}