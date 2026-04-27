const tuningFilter = document.getElementById('tuningFilter');
const searchField = document.getElementById('searchField');
const guitaristFilter = document.getElementById('guitaristFilter');
const resultBody = document.getElementById('resultBody');
const statusMessage = document.getElementById('statusMessage');
const clearBtn = document.getElementById('clearBtn');
const songsSource = document.getElementById('songsSource');
const sourceFile = document.getElementById('sourceFile');
const loaderLead = document.querySelector('.lead');
const fileLoader = document.querySelector('.file-loader');

let songs = [];

function setControlsEnabled(enabled) {
  tuningFilter.disabled = !enabled;
  searchField.disabled = !enabled;
  guitaristFilter.disabled = !enabled;
  clearBtn.disabled = !enabled;
}

function getSearchQuery() {
  return guitaristFilter.value.trim().toLowerCase();
}

function getSearchValue(song) {
  const selectedField = searchField.value;
  return String(song[selectedField] || '').toLowerCase();
}

function updateSearchPlaceholder() {
  const placeholders = {
    guitarist: 'Example: Keola / Sonny',
    title: 'Example: Hula / Sand',
    albumtitle: 'Example: Dancing Cat / Pumehana'
  };

  guitaristFilter.placeholder = placeholders[searchField.value] || placeholders.guitarist;
}

function setSourcePickerVisible(visible) {
  if (loaderLead) {
    loaderLead.hidden = !visible;
  }

  if (fileLoader) {
    fileLoader.hidden = !visible;
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

function getSongsMatchingGuitaristQuery() {
  const query = getSearchQuery();

  return songs.filter((song) => {
    return !query || getSearchValue(song).includes(query);
  });
}

function populateTuningOptions() {
  const previousValue = tuningFilter.value;
  tuningFilter.innerHTML = '<option value="">All</option>';
  const tunings = [...new Set(getSongsMatchingGuitaristQuery().map((song) => song.tuning))].sort((a, b) =>
    a.localeCompare(b)
  );

  tunings.forEach((tuning) => {
    const option = document.createElement('option');
    option.value = tuning;
    option.textContent = tuning;
    tuningFilter.appendChild(option);
  });

  if (previousValue && tunings.includes(previousValue)) {
    tuningFilter.value = previousValue;
  }
}

function renderRows(list) {
  resultBody.innerHTML = '';

  if (list.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td class="empty" colspan="5">No matching results found.</td>';
    resultBody.appendChild(tr);
    statusMessage.textContent = '0 results';
    return;
  }

  list.forEach((song) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Guitarist">${song.guitarist}</td>
      <td data-label="Song Title">${song.title}</td>
      <td data-label="Tuning">${song.tuning}</td>
      <td data-label="Album">${song.albumtitle || ''}</td>
      <td data-label="Remark">${song.remark || ''}</td>
    `;
    resultBody.appendChild(tr);
  });

  statusMessage.textContent = `${list.length} results`;
}

function filterSongs() {
  const selectedTuning = tuningFilter.value;
  const query = getSearchQuery();

  const filtered = songs.filter((song) => {
    const tuningMatch = !selectedTuning || song.tuning === selectedTuning;
    const searchMatch = !query || getSearchValue(song).includes(query);
    return tuningMatch && searchMatch;
  });

  renderRows(filtered);
}

function clearFilters() {
  searchField.value = 'guitarist';
  updateSearchPlaceholder();
  guitaristFilter.value = '';
  populateTuningOptions();
  tuningFilter.value = '';
  filterSongs();
}

function applyParsedSongs(parsedSongs, sourceLabel = 'songs.html') {
  songs = parsedSongs;

  if (songs.length === 0) {
    setSourcePickerVisible(true);
    statusMessage.textContent = `No valid data found in ${sourceLabel} (expected table or ul.list format).`;
    return;
  }

  setSourcePickerVisible(sourceLabel !== 'songs.html');
  populateTuningOptions();
  renderRows(songs);
  setControlsEnabled(true);
}

function initializeFromIframe() {
  const sourceDocument = songsSource.contentDocument;

  if (!sourceDocument) {
    setSourcePickerVisible(true);
    statusMessage.textContent =
      'Auto-loading failed. Please select songs.html below, or run this app from http://localhost.';
    return;
  }

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

  reader.onerror = () => {
    setSourcePickerVisible(true);
    statusMessage.textContent = 'Failed to read the selected file.';
  };

  reader.readAsText(file, 'utf-8');
}

songsSource.addEventListener('load', initializeFromIframe);

if (sourceFile) {
  sourceFile.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    initializeFromSelectedFile(file);
  });
}

if (songsSource.contentDocument?.readyState === 'complete') {
  initializeFromIframe();
}

tuningFilter.addEventListener('change', filterSongs);
searchField.addEventListener('change', () => {
  updateSearchPlaceholder();
  populateTuningOptions();
  filterSongs();
});
guitaristFilter.addEventListener('input', () => {
  populateTuningOptions();
  filterSongs();
});
clearBtn.addEventListener('click', clearFilters);
updateSearchPlaceholder();
