const tuningFilter = document.getElementById('tuningFilter');
const searchQuery = document.getElementById('searchQuery');
const resultBody = document.getElementById('resultBody');
const statusMessage = document.getElementById('statusMessage');
const clearBtn = document.getElementById('clearBtn');
const songsSource = document.getElementById('songsSource');

let allSongs = [];

// テーブルデータ取得 (Table形式とList形式の両対応)
function parseData(doc) {
  const table = doc.querySelector('#songSourceTable');
  if (table) {
    return Array.from(table.querySelectorAll('tbody tr')).map(r => {
      const d = r.querySelectorAll('td');
      return { guitarist: d[1]?.textContent.trim(), title: d[0]?.textContent.trim(), tuning: d[2]?.textContent.trim(), album: d[3]?.textContent.trim(), remark: d[4]?.textContent.trim() };
    });
  }
  return Array.from(doc.querySelectorAll('ul.list li')).map(li => ({
    guitarist: li.querySelector('.guitarist')?.textContent.trim(),
    title: li.querySelector('.songtitle')?.textContent.trim(),
    tuning: li.querySelector('.tuning')?.textContent.trim(),
    album: li.querySelector('.albumtitle')?.textContent.trim(),
    remark: li.parentElement?.querySelector('.remark')?.textContent.trim()
  }));
}

function updateView() {
  const query = searchQuery.value.toLowerCase();
  const tuning = tuningFilter.value;

  const filtered = allSongs.filter(s => 
    (tuning === "" || s.tuning === tuning) &&
    (s.guitarist.toLowerCase().includes(query) || s.title.toLowerCase().includes(query))
  );

  resultBody.innerHTML = filtered.map(s => `
    <tr data-label="Guitarist">
      <td>${s.guitarist}</td>
      <td data-label="Song">${s.title}</td>
      <td data-label="Tuning">${s.tuning}</td>
      <td data-label="Album">${s.album}</td>
      <td data-label="Remark">${s.remark}</td>
    </tr>`).join('');
    
  statusMessage.textContent = `Showing ${filtered.length} of ${allSongs.length} songs.`;
}

function initialize(doc) {
  allSongs = parseData(doc);
  const tunings = [...new Set(allSongs.map(s => s.tuning))].filter(Boolean).sort();
  tuningFilter.innerHTML = '<option value="">All Tunings</option>' + tunings.map(t => `<option value="${t}">${t}</option>`).join('');
  [tuningFilter, searchQuery, clearBtn].forEach(el => el.disabled = false);
  updateView();
}

songsSource.addEventListener('load', () => initialize(songsSource.contentDocument));
searchQuery.addEventListener('input', updateView);
tuningFilter.addEventListener('change', updateView);
clearBtn.addEventListener('click', () => { searchQuery.value = ''; tuningFilter.value = ''; updateView(); });