
import fs from 'fs';
import path from 'path';
import { https } from 'follow-redirects';
import type { IncomingMessage } from 'http';
import { PREDEFINED_PROBLEMS } from '../src/data/predefinedProblems';

// Constants
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'problems');


// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper to download image
const downloadImage = (url: string, filepath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response: IncomingMessage) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to consume ${url}: status code ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err: Error) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
};

const main = async () => {
    console.log('Starting image download...');
    let count = 0;

    for (const diff of ['easy', 'medium', 'hard'] as const) {
        const problems = PREDEFINED_PROBLEMS[diff];
        console.log(`Processing ${diff} problems...`);

        for (const problem of problems) {
            if (!problem.id) continue;

            const prompt = encodeURIComponent(`comic illustration, cartoon style, funny, supermarket, for kids: ${problem.story}`);
            const imageUrl = `https://pollinations.ai/p/${prompt}?width=600&height=400&model=flux&nologo=true&seed=${problem.solution * 1337}`;
            const filePath = path.join(OUTPUT_DIR, `${problem.id}.jpg`);

            if (fs.existsSync(filePath)) {
                console.log(`Skipping existing: ${problem.id}`);
                continue;
            }

            console.log(`Downloading: ${problem.id}...`);
            try {
                await downloadImage(imageUrl, filePath);
                // Add explicit delay to be nice to the API
                await new Promise(resolve => setTimeout(resolve, 800));
                count++;
            } catch (error) {
                console.error(`Failed to download ${problem.id}:`, error);
            }
        }
    }

    console.log(`Finished! Downloaded ${count} new images.`);
};

main();
