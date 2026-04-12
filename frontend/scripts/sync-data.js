import fs from 'fs';
import path from 'path';

// const sourceDir = path.resolve('analysis/data/processed');
// const targetDir = path.resolve('frontend/public');
const sourceDir = path.resolve('../analysis/data/processed');
const targetDir = path.resolve('public');

if (!fs.existsSync(sourceDir)) {
  console.error('❌ Source folder not found:', sourceDir);
  process.exit(1);
}

const files = fs.readdirSync(sourceDir);

files.forEach(file => {
  if (file.endsWith('.json')) {
    const src = path.join(sourceDir, file);
    const dest = path.join(targetDir, file);

    fs.copyFileSync(src, dest);
    console.log(`✅ Copied: ${file}`);
  }
});

console.log('🎉 All JSON files synced!');