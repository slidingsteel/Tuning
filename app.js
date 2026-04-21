const tuningFilter = document.getElementById('tuningFilter');
const categoryFilter = document.getElementById('categoryFilter');
const searchQuery = document.getElementById('searchQuery');
const resultBody = document.getElementById('resultBody');
const statusMessage = document.getElementById('statusMessage');
const clearBtn = document.getElementById('clearBtn');
const songsSource = document.getElementById('songsSource');
const sourceFile = document.getElementById('sourceFile');

let songs = [];

// 検索と絞り込みの共通ロジック
function filterSongs() {
  const category = categoryFilter.value;
  const query = searchQuery.value.toLowerCase();
  
  // 1. カテゴリとキーワードでフィルタリング
  let filtered = songs.filter((s) => {
    return s[category] && s[category].toLowerCase().includes(query);
  });

  // 2. 検索結果に基づいてTuningドロップダウンを更新
  const availableTunings = [...new Set(filtered.map((s) => s.tuning))].sort();
  
  // 現在選択中のTuningを保持
  const currentTuning = tuningFilter.value;
  
  tuningFilter.innerHTML = '<option value="">All Tunings</option>';
  availableTunings.forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    tuningFilter.appendChild(opt);
  });
  
  // 選択肢を復元（存在する場合のみ）
  if (availableTunings.includes(currentTuning)) {
    tuningFilter.value = currentTuning;
  } else {
    tuningFilter.value = "";
  }

  // 3. 選択されたTuningでさらに絞り込み
  if (tuningFilter.value) {
    filtered = filtered.filter((s) => s.tuning === tuningFilter.value);
  }

  renderRows(filtered);
}

function setControlsEnabled(enabled) {
  tuningFilter.disabled = !enabled;
  categoryFilter.disabled = !enabled;
  searchQuery.disabled = !enabled;
  clearBtn.disabled = !enabled;
}

function renderRows(filteredSongs) {
  resultBody.innerHTML = filteredSongs
    .map(
      (s) => `
    <tr>
      <td>${s.guitarist}</td>
      <td>${s.title}</td>
      <td>${s.tuning}</td>
      <td>${s.albumtitle}</td>
      <td>${s.remark}</td>
    </tr>
  `
    )
    .join('');
  
  if (filteredSongs.length === 0) {
    resultBody.innerHTML = '<tr><td colspan="5" class="empty">No songs found.</td></tr>';
  }
}

function parseSongsFromTable(doc) {
  const rows = [...doc.querySelectorAll('#songSourceTable tbody tr')];
  return rows
    .map((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 3) return null;
      return {
        title: cells[0].textContent.trim(),
        guitarist: cells[1].textContent.trim(),
        tuning: cells[2].textContent.trim(),
        albumtitle: (cells[3]?.textContent || '').trim(),
        remark: (cells[4]?.textContent || '').trim()
      };
    })
    .filter(Boolean);
}

function parseSongsFromLegacyList(doc) {
  const items = [...doc.querySelectorAll('ul.list li')];
  return items
    .map((item) => {
      const title = item.querySelector('.songtitle')?.textContent.trim() || '';
      const guitarist = item.querySelector('.guitarist')?.textContent.trim() || '';
      const tuning = item.querySelector('.tuning')?.textContent.trim() || '';
      const albumtitle = item.querySelector('.albumtitle')?.textContent.trim() || '';
      const remark = item.parentElement?.querySelector('.remark')?.textContent.trim() || '';
      return { title, guitarist, tuning, albumtitle, remark };
    })
    .filter((s) => s.title || s.guitarist);
}

function parseSongsFromSourceDocument(doc) {
  if (doc.querySelector('#songSourceTable')) {
    return parseSongsFromTable(doc);
  }
  return parseSongsFromLegacyList(doc);
}

function applyParsedSongs(parsedSongs, sourceName) {
  songs = parsedSongs;
  statusMessage.textContent = `Loaded ${songs.length} songs from ${sourceName}.`;
  
  // 初期フィルタリング実行
  filterSongs();
  setControlsEnabled(true);
}

function initializeFromIframe() {
  const sourceDocument = songsSource.contentDocument;
  if (!sourceDocument) return;
  const parsedSongs = parseSongsFromSourceDocument(sourceDocument);
  applyParsedSongs(parsedSongs, 'songs.html');
}

function initializeFromSelectedFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const htmlText = typeof reader.result === 'string' ? reader.result : '';
    const parser = new DOMParser();
    const parsedDoc = parser.parseFromString(htmlText, 'text/html');
    const parsedSongs = parseSongsFromSourceDocument(parsedDoc);
    applyParsedSongs(parsedSongs, file.name || 'selected file');
  };
  reader.readAsText(file, 'utf-8');
}

// イベントリスナー
categoryFilter.addEventListener('change', filterSongs);
searchQuery.addEventListener('input', filterSongs);
tuningFilter.addEventListener('change', filterSongs);

clearBtn.addEventListener('click', () => {
  searchQuery.value = '';
  tuningFilter.value = '';
  filterSongs();
});

songsSource.addEventListener('load', initializeFromIframe);
sourceFile.addEventListener('change', (event) => {
  initializeFromSelectedFile(event.target.files?.[0]);
});

if (songsSource.contentDocument?.readyState === 'complete') {
  initializeFromIframe();
}