const tuningFilter = document.getElementById('tuningFilter');
const guitaristFilter = document.getElementById('guitaristFilter');
const resultBody = document.getElementById('resultBody');
const statusMessage = document.getElementById('statusMessage');
const clearBtn = document.getElementById('clearBtn');
const songsSource = document.getElementById('songsSource');
const sourceFile = document.getElementById('sourceFile');
const fileLoaderSection = document.getElementById('fileLoaderSection');

let songs = [];

function setControlsEnabled(enabled) {
  tuningFilter.disabled = !enabled;
  guitaristFilter.disabled = !enabled;
  clearBtn.disabled = !enabled;
}

function setFileLoaderVisible(visible) {
  if (!fileLoaderSection) return;
  fileLoaderSection.hidden = !visible;
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
      const remark = item.querySelector('.remark')?.textContent.trim() || '';

      if (!title || !guitarist || !tuning) return null;
      return { title, guitarist, tuning, albumtitle, remark };
    })
    .filter(Boolean);
}

function parseSongsFromSourceDocument(doc) {
  const byTable = parseSongsFromTable(doc);
  if (byTable.length > 0) return byTable;

  const byLegacyList = parseSongsFromLegacyList(doc);
  if (byLegacyList.length > 0) return byLegacyList;

  return [];
}

function populateTuningOptions() {
  tuningFilter.innerHTML = '<option value="">すべて</option>';
  const tunings = [...new Set(songs.map((song) => song.tuning))].sort((a, b) => a.localeCompare(b));

  tunings.forEach((tuning) => {
    const option = document.createElement('option');
    option.value = tuning;
    option.textContent = tuning;
    tuningFilter.appendChild(option);
  });
}

function renderRows(list) {
  resultBody.innerHTML = '';

  if (list.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td class="empty" colspan="5">該当するデータがありません</td>';
    resultBody.appendChild(tr);
    statusMessage.textContent = '0件';
    return;
  }

  list.forEach((song) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${song.guitarist}</td>
      <td>${song.title}</td>
      <td>${song.tuning}</td>
      <td>${song.albumtitle || ''}</td>
      <td>${song.remark || ''}</td>
    `;
    resultBody.appendChild(tr);
  });

  statusMessage.textContent = `${list.length}件表示`;
}

function filterSongs() {
  const selectedTuning = tuningFilter.value;
  const guitaristQuery = guitaristFilter.value.trim().toLowerCase();

  const filtered = songs.filter((song) => {
    const tuningMatch = !selectedTuning || song.tuning === selectedTuning;
    const guitaristMatch = !guitaristQuery || song.guitarist.toLowerCase().includes(guitaristQuery);
    return tuningMatch && guitaristMatch;
  });

  renderRows(filtered);
}

function clearFilters() {
  tuningFilter.value = '';
  guitaristFilter.value = '';
  filterSongs();
}

function applyParsedSongs(parsedSongs, sourceLabel = 'songs.html') {
  songs = parsedSongs;

  if (songs.length === 0) {
    statusMessage.textContent = `${sourceLabel} に有効なデータが見つかりません（table または ul.list 形式を確認）`;
    return;
  }

  populateTuningOptions();
  renderRows(songs);
  setControlsEnabled(true);
}

function initializeFromIframe() {
  const sourceDocument = songsSource.contentDocument;

  if (!sourceDocument) {
    setFileLoaderVisible(true);
    statusMessage.textContent =
      '自動読み込みに失敗しました。下のファイル選択で songs.html を指定してください（または http://localhost で実行）';
    return;
  }

  const parsedSongs = parseSongsFromSourceDocument(sourceDocument);
  setFileLoaderVisible(parsedSongs.length === 0);
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
    setFileLoaderVisible(parsedSongs.length === 0);
    applyParsedSongs(parsedSongs, file.name || '選択ファイル');
  };

  reader.onerror = () => {
    statusMessage.textContent = '選択したファイルの読み込みに失敗しました';
  };

  reader.readAsText(file, 'utf-8');
}

setFileLoaderVisible(window.location.protocol === 'file:');

songsSource.addEventListener('load', initializeFromIframe);
sourceFile.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  initializeFromSelectedFile(file);
});

if (songsSource.contentDocument?.readyState === 'complete') {
  initializeFromIframe();
}

tuningFilter.addEventListener('change', filterSongs);
guitaristFilter.addEventListener('input', filterSongs);
clearBtn.addEventListener('click', clearFilters);