
import fs from 'fs';
import path from 'path';

const IMG_DIR = path.join(process.cwd(), 'public', 'images', 'problems');
const COUNTS = { easy: 20, medium: 20, hard: 20 };

// 1. Identify Source Images
console.log('--- identifying_source_images ---');
const allFiles = fs.readdirSync(IMG_DIR);
const sourceCandidates: string[] = [];

allFiles.forEach(file => {
    // 0. Fix file names with spaces
    let currentFilename = file;
    if (file.trim() !== file) {
        const newName = file.trim();
        try {
            fs.renameSync(path.join(IMG_DIR, file), path.join(IMG_DIR, newName));
            console.log(`Fixed whitespace: "${file}" -> "${newName}"`);
            currentFilename = newName;
        } catch (e) {
            console.error(`Failed to rename "${file}":`, e);
            return; // Skip this file if we can't fix it
        }
    }

    // Ignore hidden files
    if (currentFilename.startsWith('.')) return;

    // Ignore already distributed files (target files)
    if (currentFilename.startsWith('easy_') || currentFilename.startsWith('medium_') || currentFilename.startsWith('hard_')) return;

    // Must be image
    const ext = path.extname(currentFilename).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    if (!isImage) {
        console.log(`Skipping non-image: ${file}`);
        return; // Skip this file if it's not an image
    }

    sourceCandidates.push(currentFilename);
});

console.log(`Debug: Total files in ${IMG_DIR}: ${allFiles.length}`);
console.log(`Debug: First 5 files: ${allFiles.slice(0, 5).join(', ')}`);
console.log(`Found ${sourceCandidates.length} potential source images.`);

if (sourceCandidates.length === 0) {
    console.error("No source images found! Please add images to public/images/problems.");
    process.exit(1);
}

// 2. Rename to source_XXX.jpg
// We'll rename them in place.
const finalSourceFiles: string[] = [];
console.log('--- renaming_images ---');

sourceCandidates.forEach((file, index) => {
    const ext = path.extname(file);
    // 1-based index, padded to 3 digits
    const newName = `source_${String(index + 1).padStart(3, '0')}${ext} `;

    // If the file is already named correctly, just keep it
    if (file === newName) {
        finalSourceFiles.push(newName);
        return;
    }

    const oldPath = path.join(IMG_DIR, file);
    const newPath = path.join(IMG_DIR, newName);

    // Safety: check if target exists and is NOT one of our candidates (should not happen in clean run)
    if (fs.existsSync(newPath) && !sourceCandidates.includes(newName)) {
        console.warn(`Warning: Target ${newName} already exists.Overwriting.`);
    }

    fs.renameSync(oldPath, newPath);
    console.log(`Renamed: "${file.substring(0, 30)}..." -> ${newName} `);
    finalSourceFiles.push(newName);
});

// 3. Distribute
console.log(`-- - distributing ${finalSourceFiles.length} images to problems-- - `);
const shuffled = [...finalSourceFiles].sort(() => 0.5 - Math.random());
let imageIndex = 0;

Object.entries(COUNTS).forEach(([difficulty, count]) => {
    for (let i = 1; i <= count; i++) {
        // Wrap around if we have fewer images than problems (74 images vs 60 problems -> no wrap needed initially)
        const srcFilename = shuffled[imageIndex % shuffled.length];
        const destFilename = `${difficulty}_${i}${path.extname(srcFilename)} `;

        fs.copyFileSync(path.join(IMG_DIR, srcFilename), path.join(IMG_DIR, destFilename));
        console.log(`Assigned ${srcFilename} -> ${destFilename} `);

        imageIndex++;
    }
});

console.log("Success! Images renamed and distributed.");
