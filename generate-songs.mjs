const SOURCE_URL = 'https://www.dancingcat.com/section-5-hawaiian-recordings-in-the-slack-key-tunings';
const OUTPUT_FILES = ['songs.html', 'CHAT/songs.html'];
const TUNING_NAME_BY_NOTES = {
  'D-G-D-G-B-D': 'Taro Patch',
  'D-G-D-F#-B-D': 'G Wahine',
  'D-G-D-D-G-D': 'G Mauna Loa',
  'D-G-D-E-G-D': 'Maori Brown Eyes',
  'D-G-D-D-F#-C#': "Alika's Mauna Loa",
  'D-G-D-E-A-D': 'Old Mauna Loa',
  'C-G-D-E-A-D': "Ni'ihau",
  'D-G-C-G-B-E': 'Kilauea',
  'D-G-D-E-B-D': 'G Sixth',
  'C-G-E-G-C-E': "Atta's C",
  'C-G-D-G-B-D': 'Dropped C',
  'C-G-E-G-A-E': "Gabby's C",
  'G-C-E-G-A-E': 'B Flat Mauna Loa',
  'C-G-C-G-D-E': 'Ka Honu (Turtle)',
  'C-G-C-G-C-E': 'Mainland Open C',
  'C-G-D-G-B-E': "Keola's C",
  'C-G-E-G-B-E': "Hi'ilawe",
  'C-G-E-G-B-D': 'Hanalei C',
  'G-C-E-G-B-D': "Led's New C Wahine",
  'C-G-C-G-B-D': "Ni'ihau C Wahine",
  'G-C-C-G-B-E': 'Wela Kahau',
  'C-G-C-G-A-E': "Ni'ihau C Mauna Loa",
  'F-G-C-G-A-E': 'Samoan C Mauna Loa',
  'E-A-D-G-B-E': 'Standard',
  'D-A-D-F#-A-D': 'Open D',
  'C-A-D-F#-A-D': 'D Seventh',
  'D-A-D-F#-A-C#': 'D Wahine',
  'D-A-D-F#-B-E': "Cyril's D",
  'D-A-D-G-B-E': 'Dropped D',
  'D-A-D-F#-B-D': 'D Sixth',
  'D-A-D-G-B-D': 'Double Dropped D',
  'C-F-C-G-A-F': "'Elepaio",
  'F-C-E-G-C-E': "Gabby's F Wahine",
  'C-F-C-G-C-E': "Leonard's F",
  'F-Bb-C-F-A-E': 'Wahine/Mauna Loa'
};

function decodeHtmlEntities(text) {
  const named = {
    amp: '&',
    nbsp: ' ',
    quot: '"',
    apos: "'",
    lsquo: "'",
    rsquo: "'",
    ldquo: '"',
    rdquo: '"',
    ndash: '-',
    mdash: '-',
    hellip: '...',
    bull: '*'
  };

  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, entity) => {
    if (entity[0] === '#') {
      const isHex = entity[1]?.toLowerCase() === 'x';
      const value = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isNaN(value) ? _ : String.fromCodePoint(value);
    }

    return Object.prototype.hasOwnProperty.call(named, entity) ? named[entity] : _;
  });
}

function stripTags(html) {
  return decodeHtmlEntities(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''));
}

function normalizeWhitespace(text) {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s+([,.;:)])/g, '$1')
    .replace(/[(]\s+/g, '(')
    .trim();
}

function normalizeNotes(notes) {
  return notes.replace(/\s+/g, '').replace(/[–—]/g, '-');
}

function compactNotes(notes) {
  return normalizeNotes(notes).replaceAll('-', '');
}

function cleanText(html) {
  return normalizeWhitespace(stripTags(html));
}

function cleanArtist(text) {
  return text
    .split(':')[0]
    .replace(/\s*[-–—]+\s*$/, '')
    .trim();
}

function extractLeadingStrongText(paragraph) {
  const trimmed = paragraph.trim();
  const match = trimmed.match(/^<strong>([\s\S]*?)<\/strong>/i);
  if (!match) return '';

  return cleanArtist(cleanText(match[1]));
}

function deriveTuningDisplay(headingText, detailText) {
  const match = headingText.match(/^([A-Z0-9]+)\.\s*(.+)$/);
  if (!match) return headingText;

  const code = match[1];
  const notes = normalizeNotes(match[2].trim());
  const mappedName = TUNING_NAME_BY_NOTES[notes];
  if (mappedName) {
    return `${mappedName} (${compactNotes(notes)})`;
  }

  const aliasMatch = detailText.match(
    /(?:Often called|Sometimes called|Called|called)\s+[“"'`]?(.+?)(?:\s+Tuning\b|,|\s+or\s+|\.|;|$)/i
  );
  const alias = aliasMatch?.[1]?.replace(/[“”"'`]/g, '').trim();

  return alias ? `${alias} (${compactNotes(notes)})` : `${code}: ${notes}`;
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function extractParagraphs(html) {
  const startMarker = '<strong>Hawaiian Recordings in the Slack Key Tunings';
  const startIndex = html.indexOf(startMarker);

  if (startIndex === -1) {
    throw new Error('Could not find the start of the source content.');
  }

  const relevantHtml = html.slice(startIndex);
  const paragraphRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/g;
  return [...relevantHtml.matchAll(paragraphRegex)].map((match) => match[1]);
}

function isSectionHeading(text) {
  return /Tunings?$/i.test(text) || text === 'Hawaiian Recordings in the Slack Key Tunings';
}

function stripLeadingSongDecorations(html) {
  let value = html.trim();

  while (true) {
    const next = value
      .replace(/^(?:&nbsp;|\s|·|•|-)+/i, '')
      .replace(/^(?:['‘’"“”`])+/, '')
      .replace(/^<span\b[^>]*>[\s\S]*?<\/span>/i, '')
      .replace(/^<strong>\s*(?:&nbsp;|\s|<em>\s*<\/em>)*\s*<\/strong>/i, '')
      .trimStart();

    if (next === value) {
      return value;
    }

    value = next;
  }
}

function extractSongMatch(paragraph) {
  const stripped = stripLeadingSongDecorations(paragraph);
  if (!stripped.startsWith('<em>')) return null;

  const match = stripped.match(
    /^((?:<em>[\s\S]*?<\/em>(?:\s|&nbsp;|<strong>\s*(?:&nbsp;|\s)*<\/strong>)*)+)([\s\S]*)$/i
  );
  if (!match) return null;

  const titleHtml = [...match[1].matchAll(/<em>([\s\S]*?)<\/em>/gi)].map((part) => part[1]).join(' ');
  return [match[0], titleHtml, match[2]];
}

function hasMeaningfulLeadingStrong(paragraph) {
  const trimmed = paragraph.trim();
  const match = trimmed.match(/^<strong>([\s\S]*?)<\/strong>([\s\S]*)$/i);
  if (!match) return false;

  return cleanText(match[1]).length > 0;
}

function parseRows(paragraphs) {
  const rows = [];
  let currentTuning = '';
  let pendingTuningHeading = '';
  let currentArtist = '';
  let currentAlbum = '';

  for (const paragraph of paragraphs) {
    const text = cleanText(paragraph);
    if (!text) continue;

    if (text === 'Hawaiian Recordings in the Slack Key Tunings') {
      continue;
    }

    if (/^[A-Z][0-9A-Z]*\.\s/.test(text)) {
      pendingTuningHeading = text;
      currentTuning = text;
      currentArtist = '';
      currentAlbum = '';
      continue;
    }

    if (pendingTuningHeading) {
      currentTuning = deriveTuningDisplay(pendingTuningHeading, text);
      pendingTuningHeading = '';
      continue;
    }

    if (isSectionHeading(text)) {
      currentArtist = '';
      currentAlbum = '';
      continue;
    }

    if (hasMeaningfulLeadingStrong(paragraph)) {
      currentArtist = extractLeadingStrongText(paragraph);
      currentAlbum = '';
      continue;
    }

    const songMatch = extractSongMatch(paragraph);
    if (songMatch) {
      const title = cleanText(songMatch[1])
        .replace(/^[*.\- ]+/, '')
        .replace(/\s*[-–—]+\s*$/, '')
        .trim();
      let remark = cleanText(songMatch[2])
        .replace(/^[\-–—:;.,)\]]+\s*/, '')
        .replace(/^\*\s*/, '')
        .trim();

      rows.push({
        title,
        guitarist: currentArtist,
        tuning: currentTuning,
        albumtitle: currentAlbum,
        remark
      });
      continue;
    }

    if (currentArtist && currentTuning) {
      currentAlbum = text;
    }
  }

  return rows.filter((row) => row.title && row.guitarist && row.tuning);
}

function buildSongsHtml(rows) {
  const generatedAt = new Date().toISOString();
  const bodyRows = rows
    .map((row) => {
      return `        <tr>
          <td>${escapeHtml(row.title)}</td>
          <td>${escapeHtml(row.guitarist)}</td>
          <td>${escapeHtml(row.tuning)}</td>
          <td>${escapeHtml(row.albumtitle)}</td>
          <td>${escapeHtml(row.remark)}</td>
        </tr>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Slack Key Tunings Source</title>
  </head>
  <body>
    <!-- Generated from ${SOURCE_URL} at ${generatedAt} -->
    <table id="songSourceTable">
      <thead>
        <tr>
          <th>Song Title</th>
          <th>Guitarist</th>
          <th>Tuning</th>
          <th>Album</th>
          <th>Remark</th>
        </tr>
      </thead>
      <tbody>
${bodyRows}
      </tbody>
    </table>
  </body>
</html>
`;
}

async function main() {
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch source page: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const paragraphs = extractParagraphs(html);
  const rows = parseRows(paragraphs);

  if (rows.length === 0) {
    throw new Error('No rows were parsed from the source page.');
  }

  const output = buildSongsHtml(rows);
  const { writeFile } = await import('node:fs/promises');

  for (const file of OUTPUT_FILES) {
    await writeFile(new URL(file, `file://${process.cwd()}/`), output, 'utf8');
  }

  console.log(`Generated ${rows.length} rows from ${SOURCE_URL}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
