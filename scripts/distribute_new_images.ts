
import fs from 'fs';
import path from 'path';

const IMG_DIR = path.join(process.cwd(), 'public', 'images', 'problems');
const PREDEFINED_COUNTS = {
    easy: 20,
    medium: 20,
    hard: 20
};

// get all files that are NOT existing problem files (e.g. easy_1.jpg) and NOT hidden files
const allFiles = fs.readdirSync(IMG_DIR).filter(file => {
    return !file.startsWith('.') &&
        !file.startsWith('easy_') &&
        !file.startsWith('medium_') &&
        !file.startsWith('hard_') &&
        (file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg') || file.endsWith('.webp'));
});

console.log(`Found ${allFiles.length} source images.`);

if (allFiles.length === 0) {
    console.error("No source images found to distribute!");
    process.exit(1);
}

// 1. Rename source files to standard format source_001.jpg etc to clean up filenames
const sourceFiles: string[] = [];
allFiles.forEach((file, index) => {
    const ext = path.extname(file);
    const newName = `source_${String(index + 1).padStart(3, '0')}${ext}`;
    const oldPath = path.join(IMG_DIR, file);
    const newPath = path.join(IMG_DIR, newName);

    // Only rename if it's not already named correctly (to allow re-running)
    if (file !== newName) {
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed: ${file.substring(0, 20)}... -> ${newName}`);
    }
    sourceFiles.push(newName);
});

// 2. Shuffle the source files
const shuffled = [...sourceFiles].sort(() => 0.5 - Math.random());

// 3. Assign to problems
let imageIndex = 0;

Object.entries(PREDEFINED_COUNTS).forEach(([difficulty, count]) => {
    for (let i = 1; i <= count; i++) {
        // Recycle images if we run out
        if (imageIndex >= shuffled.length) {
            imageIndex = 0;
            // Optional: reshuffle? No, just loop.
        }

        const sourceImage = shuffled[imageIndex];
        const targetFilename = `${difficulty}_${i}${path.extname(sourceImage)}`; // keep extension
        const sourcePath = path.join(IMG_DIR, sourceImage);
        const targetPath = path.join(IMG_DIR, targetFilename);

        // We copy instead of rename, so we keep the "source" pool clean for future re-shuffles
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Assigned ${sourceImage} -> ${targetFilename}`);

        imageIndex++;
    }
});

console.log('Distribution complete!');
