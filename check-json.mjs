import fs from 'fs';
import path from 'path';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(dirent => {
    const fullPath = path.join(dir, dirent.name);
    return dirent.isDirectory() ? walk(fullPath) : fullPath;
  });
}

const files = walk('.').filter(f => f.endsWith('.json'));

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    JSON.parse(content);
  } catch (err) {
    console.error(`❌ Error in ${file}: ${err.message}`);
  }
}
