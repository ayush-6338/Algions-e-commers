import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { categoryRows, productRows } from '../seeds/data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/public/images');
const palette = [
  { bg: '#dceef5', fg: '#34758e', alt: '#7db3c5' },
  { bg: '#e6eee2', fg: '#587a50', alt: '#9db994' },
  { bg: '#f3ead7', fg: '#9b7540', alt: '#c7a46e' },
  { bg: '#eee5f3', fg: '#765b8c', alt: '#ac8fc0' },
  { bg: '#f5e3df', fg: '#a85e55', alt: '#d08c7f' },
  { bg: '#f3e7d8', fg: '#a16b45', alt: '#c99569' },
];

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const hash = (value) => [...value].reduce((sum, char) => ((sum * 31) + char.charCodeAt(0)) >>> 0, 7);
const escapeXml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

function iconFor(name, categoryIndex) {
  const text = name.toLowerCase();
  if (/lamp|light/.test(text)) return 'lamp';
  if (/plant|basket|throw|cushion/.test(text)) return 'plant';
  if (/notebook|journal|planner|calendar|paper|pencil/.test(text)) return 'book';
  if (/headphone|audio/.test(text)) return 'headphones';
  if (/bag|pouch|cube|wallet|tote|backpack/.test(text)) return 'bag';
  if (/bottle|dispenser|jar|charger/.test(text)) return 'bottle';
  if (/mug|coffee|ceramic|stoneware|dinner|board|dripper/.test(text)) return 'mug';
  if (/soap|care|brush|comb|towel|makeup/.test(text)) return 'soap';
  return ['plant', 'mug', 'book', 'headphones', 'soap', 'bag'][categoryIndex] || 'mug';
}

function iconMarkup(type, color, accent) {
  const common = `fill="${color}"`;
  const detail = `fill="${accent}"`;
  const icons = {
    mug: `<path ${common} d="M115 92h154l-14 167a28 28 0 0 1-28 26h-70a28 28 0 0 1-28-26z"/><path ${detail} d="M269 121h35a39 39 0 0 1 0 78h-41l4-27h37a12 12 0 0 0 0-24h-33z"/><path fill="#fff" opacity=".75" d="M145 117h19v133h-19z"/>`,
    plant: `<path ${common} d="M112 168h174l-20 111a28 28 0 0 1-27 23h-80a28 28 0 0 1-27-23z"/><path ${detail} d="M194 168c-6-42 15-78 55-97 5 44-14 79-55 97zm-8-13c-36-7-59-33-63-72 39 3 65 25 72 61z"/><path fill="none" stroke="${color}" stroke-width="13" stroke-linecap="round" d="M197 169V89"/>`,
    book: `<path ${common} d="M95 105a30 30 0 0 1 30-30h82v222h-82a30 30 0 0 1-30-30z"/><path ${detail} d="M207 75h79a30 30 0 0 1 30 30v162a30 30 0 0 1-30 30h-79z"/><path fill="#fff" opacity=".8" d="M130 118h45v10h-45zm0 31h45v10h-45zm99 0h48v10h-48zm0 31h48v10h-48z"/>`,
    headphones: `<path fill="none" stroke="${color}" stroke-width="26" stroke-linecap="round" d="M103 187v-35a98 98 0 0 1 196 0v35"/><rect ${common} x="86" y="171" width="68" height="112" rx="28"/><rect ${detail} x="248" y="171" width="68" height="112" rx="28"/><path fill="#fff" opacity=".55" d="M105 194h16v65h-16zm162 0h16v65h-16z"/>`,
    bag: `<path ${common} d="M100 126h200l18 172H82z"/><path fill="none" stroke="${accent}" stroke-width="17" stroke-linecap="round" d="M149 132v-26a51 51 0 0 1 102 0v26"/><path ${detail} d="M130 183h140v17H130z"/><circle fill="#fff" opacity=".7" cx="200" cy="235" r="12"/>`,
    bottle: `<path ${common} d="M169 70h62v45l24 26v145a28 28 0 0 1-28 28h-54a28 28 0 0 1-28-28V141l24-26z"/><path ${detail} d="M169 68h62v33h-62z"/><path fill="#fff" opacity=".7" d="M167 165h66v18h-66z"/><path fill="none" stroke="#fff" stroke-width="8" opacity=".65" d="M181 198v77"/>`,
    lamp: `<path ${common} d="M128 100h144l-25 91H153z"/><path fill="none" stroke="${color}" stroke-width="17" stroke-linecap="round" d="M200 191v82"/><path ${detail} d="M137 267h126l24 28H113z"/><circle fill="#fff" opacity=".6" cx="200" cy="137" r="19"/>`,
    soap: `<path ${common} d="M156 128h88l21 27v139a28 28 0 0 1-28 28h-74a28 28 0 0 1-28-28V155z"/><path ${detail} d="M171 98h58v30h-58z"/><path fill="none" stroke="${color}" stroke-width="13" stroke-linecap="round" d="M200 98V76h54"/><path fill="#fff" opacity=".75" d="M164 185h72v29h-72z"/>`,
  };
  return icons[type] || icons.mug;
}

function svg({ width, height, background, foreground, accent, icon, label = '', pattern = 0 }) {
  const iconY = label ? 12 : Math.max(0, Math.round((height - 400) / 2));
  const iconSize = label ? 1 : Math.min(width / 400, height / 400);
  const title = label ? `<rect x="0" y="${height - 78}" width="${width}" height="78" fill="#fff"/><path d="M0 ${height - 78}.5h${width}" stroke="#e7e5e4"/><text x="30" y="${height - 31}" fill="#292524" font-family="Arial,sans-serif" font-size="25" font-weight="600">${escapeXml(label.length > 30 ? label.slice(0, 29) + '…' : label)}</text>` : '';
  const patternMarks = pattern === 1
    ? `<circle cx="82" cy="92" r="8" fill="${accent}" opacity=".55"/><circle cx="${width - 80}" cy="${height - (label ? 108 : 70)}" r="13" fill="${accent}" opacity=".45"/>`
    : pattern === 2
      ? `<path d="M55 80h58M${width - 120} ${height - (label ? 112 : 88)}h65" stroke="${accent}" stroke-width="8" stroke-linecap="round" opacity=".65"/>`
      : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><rect width="${width}" height="${height}" fill="${background}"/>${patternMarks}<g transform="translate(${Math.round((width - 400 * iconSize) / 2)} ${iconY}) scale(${iconSize})">${iconMarkup(icon, foreground, accent)}</g>${title}</svg>`;
}

async function save(relativePath, contents) {
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents, 'utf8');
}

for (const [name, slug] of categoryRows.map((row) => [row[0], row[1]])) {
  const index = categoryRows.findIndex((row) => row[1] === slug);
  const colors = palette[index % palette.length];
  await save(`categories/${slug}.svg`, svg({ width: 600, height: 400, background: colors.bg, foreground: colors.fg, accent: colors.alt, icon: iconFor(name, index), pattern: hash(slug) % 3 }));
}

const products = productRows.map(([name, , , categoryIndex]) => ({ name, slug: slugify(name), categoryIndex }));
for (const product of products) {
  const colors = palette[product.categoryIndex % palette.length];
  const icon = iconFor(product.name, product.categoryIndex);
  const variation = hash(product.slug);
  for (let angle = 1; angle <= 2; angle += 1) {
    const colorsForImage = angle === 1 ? colors : { ...colors, fg: colors.alt, alt: colors.fg };
    await save(`products/${product.slug}-${angle}.svg`, svg({ width: 600, height: 600, background: angle === 1 ? colors.bg : '#fff', foreground: colorsForImage.fg, accent: colorsForImage.alt, icon, label: product.name, pattern: (variation + angle) % 3 }));
  }
}

const featured = products.slice(0, 4);
for (const [index, product] of featured.entries()) {
  const colors = palette[product.categoryIndex % palette.length];
  await save(`hero/hero-${index + 1}.svg`, svg({ width: 600, height: 600, background: colors.bg, foreground: colors.fg, accent: colors.alt, icon: iconFor(product.name, product.categoryIndex), pattern: hash(product.slug) % 3 }));
}

await save('placeholder.svg', svg({ width: 600, height: 600, background: '#f5f5f4', foreground: '#78716c', accent: '#d6d3d1', icon: 'mug', pattern: 2 }));
console.log(`Generated ${categoryRows.length} category images, ${products.length * 2} product images, 4 hero images and a placeholder in client/public/images.`);
