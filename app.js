const tuningFilter = document.getElementById('tuningFilter');
const categoryFilter = document.getElementById('categoryFilter');
const searchQuery = document.getElementById('searchQuery');
const resultBody = document.getElementById('resultBody');
const statusMessage = document.getElementById('statusMessage');
const songsSource = document.getElementById('songsSource');

let songs = [];

function renderRows(filteredSongs) {
  resultBody.innerHTML = filteredSongs.map(s => `
    <tr>
      <td data-label="Guitarist">${s.guitarist}</td>
      <td data-label="Song">${s.title}</td>
      <td data-label="Tuning">${s.tuning}</td>
      <td data-label="Album">${s.albumtitle}</td>
      <td data-label="Remark">${s.remark}</td>
    </tr>`).join('');
}

function filterSongs() {
  const cat = categoryFilter.value;
  const query = searchQuery.value.toLowerCase();
  const tuning = tuningFilter.value;

  let filtered = songs.filter(s => s[cat].toLowerCase().includes(query));
  const availableTunings = [...new Set(filtered.map(s => s.tuning))].sort();
  
  // Tuning選択肢更新
  tuningFilter.innerHTML = '<option value="">All Tunings</option>' + 
    availableTunings.map(t => `<option value="${t}">${t}</option>`).join('');
  tuningFilter.value = tuning;

  if (tuning) filtered = filtered.filter(s => s.tuning === tuning);
  
  renderRows(filtered);
  statusMessage.textContent = `Showing ${filtered.length} of ${songs.length} songs.`;
}

// 読み込み処理
function initialize() {
  const doc = songsSource.contentDocument;
  const rows = [...doc.querySelectorAll('#songSourceTable tbody tr')];
  songs = rows.map(r => {
    const d = r.querySelectorAll('td');
    return { title: d[0]?.textContent.trim(), guitarist: d[1]?.textContent.trim(), tuning: d[2]?.textContent.trim(), albumtitle: d[3]?.textContent.trim(), remark: d[4]?.textContent.trim() };
  });
  statusMessage.textContent = `Loaded ${songs.length} songs.`;
  filterSongs();
  [categoryFilter, searchQuery, tuningFilter].forEach(el => el.disabled = false);
}

songsSource.addEventListener('load', initialize);
[categoryFilter, searchQuery, tuningFilter].forEach(el => el.addEventListener('change', filterSongs));
if (songsSource.contentDocument?.readyState === 'complete') initialize();