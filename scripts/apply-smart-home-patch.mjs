import fs from 'fs';
import path from 'path';

const root = process.cwd();
const homePath = path.join(root, 'src/pages/HomePage.tsx');

if (!fs.existsSync(homePath)) {
  console.error('src/pages/HomePage.tsx پیدا نشد. پچ دستی اعمال نشد.');
  process.exit(1);
}

let source = fs.readFileSync(homePath, 'utf8');

if (!source.includes('SmartCarHomeSections')) {
  const importLine = `import SmartCarHomeSections from "../components/home/SmartCarHomeSections";\n`;
  const lastImport = [...source.matchAll(/^import .*?;\s*$/gm)].pop();
  if (lastImport) {
    source = source.slice(0, lastImport.index + lastImport[0].length) + '\n' + importLine + source.slice(lastImport.index + lastImport[0].length);
  } else {
    source = importLine + source;
  }
}

if (!source.includes('<SmartCarHomeSections')) {
  const markers = [
    '<main',
    '<section',
    'return ('
  ];
  let inserted = false;

  const mainMatch = source.match(/<main[^>]*>/);
  if (mainMatch && mainMatch.index !== undefined) {
    const pos = mainMatch.index + mainMatch[0].length;
    source = source.slice(0, pos) + '\n      <SmartCarHomeSections />\n' + source.slice(pos);
    inserted = true;
  }

  if (!inserted) {
    const returnMatch = source.match(/return\s*\(\s*<>/);
    if (returnMatch && returnMatch.index !== undefined) {
      const pos = returnMatch.index + returnMatch[0].length;
      source = source.slice(0, pos) + '\n      <SmartCarHomeSections />\n' + source.slice(pos);
      inserted = true;
    }
  }

  if (!inserted) {
    console.warn('محل درج خودکار پیدا نشد. کامپوننت را دستی داخل HomePage قرار بده: <SmartCarHomeSections />');
  }
}

fs.writeFileSync(homePath, source, 'utf8');
console.log('SmartCarHomeSections به HomePage اضافه شد.');
