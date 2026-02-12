
import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(process.cwd(), 'public', 'images', 'problems');
const IMG_1 = path.join(SRC_DIR, '001.jpg');
const IMG_2 = path.join(SRC_DIR, '002.jpg');

// Ensure source images exist
if (!fs.existsSync(IMG_1) || !fs.existsSync(IMG_2)) {
    console.error('Source images 001.jpg or 002.jpg not found!');
    process.exit(1);
}

// Distribute to easy_1 ... easy_20
for (let i = 1; i <= 20; i++) {
    const targetFile = path.join(SRC_DIR, `easy_${i}.jpg`);
    const sourceFile = (i % 2 === 1) ? IMG_1 : IMG_2; // Odd -> 001, Even -> 002

    fs.copyFileSync(sourceFile, targetFile);
    console.log(`Copied to ${path.basename(targetFile)}`);
}

console.log('Done distributing images.');
