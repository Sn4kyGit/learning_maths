
import fs from 'fs';
import path from 'path';

const IMG_DIR = path.join(process.cwd(), 'public', 'images', 'problems');

// Helper to check if a file is a "problem" image (easy_*, medium_*, hard_*)
function isProblemImage(filename: string): boolean {
    return filename.startsWith('easy_') || filename.startsWith('medium_') || filename.startsWith('hard_');
}

// Helper to check if a file is a "source" image (source_*)
function isSourceImage(filename: string): boolean {
    return filename.startsWith('source_');
}

// 1. CLEANUP: Delete all verifyably generated files
console.log('--- Cleaning up generated files ---');
const files = fs.readdirSync(IMG_DIR);
let deletedCount = 0;

files.forEach(file => {
    if (file.startsWith('.')) return; // skip hidden

    if (isProblemImage(file) || isSourceImage(file)) {
        try {
            fs.unlinkSync(path.join(IMG_DIR, file));
            console.log(`Deleted: ${file}`);
            deletedCount++;
        } catch (e) {
            console.error(`Failed to delete ${file}:`, e);
        }
    }
});
console.log(`Deleted ${deletedCount} generated files.`);

// 2. RENAME: Rename remaining "long name" files to source_XXX.jpg
console.log('--- Renaming source files ---');
const remainingFiles = fs.readdirSync(IMG_DIR).filter(file => !file.startsWith('.'));
const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

const validImages = remainingFiles.filter(file => allowedExts.includes(path.extname(file).toLowerCase()));

console.log(`Found ${validImages.length} original images to rename.`);

validImages.forEach((file, index) => {
    const ext = path.extname(file);
    const newName = `source_${String(index + 1).padStart(3, '0')}${ext}`;
    const oldPath = path.join(IMG_DIR, file);
    const newPath = path.join(IMG_DIR, newName);

    try {
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed: "${file.substring(0, 30)}..." -> ${newName}`);
    } catch (e) {
        console.error(`Failed to rename ${file}:`, e);
    }
});

// 3. DISTRIBUTE: Assign source_XXX.jpg to problem IDs
console.log('--- Distributing images ---');
const sourceFiles = fs.readdirSync(IMG_DIR).filter(f => isSourceImage(f));
if (sourceFiles.length === 0) {
    console.error("No source files found after rename!");
    process.exit(1);
}

const shuffled = [...sourceFiles].sort(() => 0.5 - Math.random());
let imageIndex = 0;

const COUNTS = { easy: 20, medium: 20, hard: 20 };

Object.entries(COUNTS).forEach(([difficulty, count]) => {
    for (let i = 1; i <= count; i++) {
        const src = shuffled[imageIndex % shuffled.length];
        const dest = `${difficulty}_${i}${path.extname(src)}`;

        fs.copyFileSync(path.join(IMG_DIR, src), path.join(IMG_DIR, dest));
        console.log(`Assigned ${src} -> ${dest}`);
        imageIndex++;
    }
});

console.log("Fix complete!");
