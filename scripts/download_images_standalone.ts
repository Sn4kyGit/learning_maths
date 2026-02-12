import fs from 'fs';
import path from 'path';
import followRedirects from 'follow-redirects';
import type { IncomingMessage } from 'http';

// Define data directly to avoid module resolution issues
const PREDEFINED_PROBLEMS = {
    easy: [
        { id: "easy_1", story: "Leo hat 10€. Er kauft Schokolade für 2€.", question: "Wie viel Geld hat Leo noch?", solution: 8 },
        { id: "easy_2", story: "Ein Heft kostet 5€. Ein Stift kostet 3€.", question: "Wie viel kosten Heft und Stift zusammen?", solution: 8 },
        { id: "easy_3", story: "Ein Eis kostet 2€. Du kaufst 2 Kugeln.", question: "Wie viel kostet das Eis zusammen?", solution: 4 },
        { id: "easy_4", story: "Du hast 5€. Ein Lolli kostet 1€.", question: "Wie viel Geld bleibt dir übrig?", solution: 4 },
        { id: "easy_5", story: "Ein Apfel kostet 1€. Du kaufst 7 Äpfel.", question: "Wie viel musst du bezahlen?", solution: 7 },
        { id: "easy_6", story: "Du hast 10€. Du kaufst Chips für 3€.", question: "Wie viel Geld hast du jetzt noch?", solution: 7 },
        { id: "easy_7", story: "Ein Brötchen kostet 1€. Du kaufst 5 Stück.", question: "Wie viel kosten 5 Brötchen?", solution: 5 },
        { id: "easy_8", story: "Du findest 2€ auf dem Boden. Du hast schon 3€.", question: "Wie viel Geld hast du jetzt?", solution: 5 },
        { id: "easy_9", story: "Eine Brezel kostet 1€. Du kaufst 4 Stück.", question: "Wie viel musst du bezahlen?", solution: 4 },
        { id: "easy_10", story: "Die Eintrittskarte kostet 8€. Du hast einen 2€ Rabatt.", question: "Wie viel musst du bezahlen?", solution: 6 },
        { id: "easy_11", story: "Du hast 20€. Ein Buch kostet 15€.", question: "Wie viel Wechselgeld bekommst du?", solution: 5 },
        { id: "easy_12", story: "Du hast 6€. Du kannst 3 Säfte kaufen.", question: "Wie viel kostet ein Saft?", solution: 2 },
        { id: "easy_13", story: "Ein Sticker kostet 2€. Du kaufst 3 Sticker.", question: "Was kosten 3 Sticker zusammen?", solution: 6 },
        { id: "easy_14", story: "Oma gibt dir 5€. Opa gibt dir auch 5€.", question: "Wie viel Geld hast du bekommen?", solution: 10 },
        { id: "easy_15", story: "Du hast 5€. Oma gibt dir noch 5€ dazu.", question: "Wie viel Geld hast du am Ende?", solution: 10 },
        { id: "easy_16", story: "Eine Kugel Eis kostet 2€.", question: "Wie viel kosten 3 Kugeln Eis?", solution: 6 },
        { id: "easy_17", story: "Du kaufst Milch für 2€ und Saft für 3€.", question: "Wie viel musst du bezahlen?", solution: 5 },
        { id: "easy_18", story: "Ein Keks kostet 1€. Du hast 10€. Du kaufst 1 Keks.", question: "Wie viel Geld hast du nach dem Kauf?", solution: 9 },
        { id: "easy_19", story: "Ein Blumenstrauß kostet 5€. Du gibst 10€.", question: "Wie viel Wechselgeld bekommst du?", solution: 5 },
        { id: "easy_20", story: "Papa schenkt dir 5€. Du hattest schon 1€.", question: "Wie viel Geld hast du jetzt?", solution: 6 }
    ],
    medium: [
        { id: "medium_1", story: "Du hast 20€. Du kaufst Brot für 3€, Butter für 2€ und Käse für 5€.", question: "Wie viel kosten die Einkäufe zusammen?", solution: 10 },
        { id: "medium_2", story: "Im Supermarkt kosten Äpfel 4€, Birnen 3€ und Bananen 2€. Du kaufst alles.", question: "Wie viel kosten Äpfel und Birnen zusammen?", solution: 7 },
        { id: "medium_3", story: "Du hast 50€. Du kaufst ein T-Shirt für 15€ und eine Kappe für 10€.", question: "Wie viel Geld hast du noch übrig?", solution: 25 },
        { id: "medium_4", story: "Mama gibt dir 30€. Du kaufst 5 Hefte für je 2€.", question: "Wie viel Geld hast du nach dem Kauf?", solution: 20 },
        { id: "medium_5", story: "Ein Spielzeugauto kostet 8€. Du kaufst 2 Stück und zahlst mit 20€.", question: "Wie viel Wechselgeld bekommst du?", solution: 4 },
        { id: "medium_6", story: "Ein Joghurt kostet 1€. Du kaufst 6 Erdbeer- und 10 Vanille-Joghurt.", question: "Wie viel kosten die Joghurts zusammen?", solution: 16 },
        { id: "medium_7", story: "Du hast 10€. Du kaufst 2 Brezeln für je 1,50€ und einen Limo für 2€.", question: "Wie viel Geld hast du am Ende?", solution: 5 },
        { id: "medium_8", story: "Ein Kinoticket kostet 7€. Du kaufst 3 Tickets. Du zahlst mit 50€.", question: "Wie viel Restgeld hast du?", solution: 29 },
        { id: "medium_9", story: "Du sparst 12€ im Januar, 15€ im Februar und 13€ im März.", question: "Wie viel Geld hast du insgesamt gespart?", solution: 40 },
        { id: "medium_10", story: "Der Eintritt kostet 5€.", question: "Wie viel müssen 4 Kinder bezahlen?", solution: 20 },
        { id: "medium_11", story: "Du hast 15€. Du kaufst einen Ball für 6€ und Eis für 4€. Papa gibt dir 5€ dazu.", question: "Wie viel Geld hast du jetzt?", solution: 10 },
        { id: "medium_12", story: "Ein Fahrradschloss kostet 12€. Ein Licht kostet 15€. Du zahlst mit 30€.", question: "Was ist dein Wechselgeld?", solution: 3 },
        { id: "medium_13", story: "Du hast 40€. Du kaufst eine Pizza für 9€ und 2 Getränke für je 3€.", question: "Wie viel musstest du insgesamt bezahlen?", solution: 15 },
        { id: "medium_14", story: "Auf dem Flohmarkt verkaufst du ein Spiel für 5€, ein Buch für 3€ und ein Puzzle für 4€.", question: "Wie viel Geld hast du verdient?", solution: 12 },
        { id: "medium_15", story: "Der Zoodirektor kauft Futter: Fleisch für 50€, Obst für 30€ und Heu für 20€.", question: "Wie viel kostet das Futter insgesamt?", solution: 100 },
        { id: "medium_16", story: "Ein Paket Nudeln kostet 1,50€. Du kaufst 4 Pakete. Du zahlst mit 10€.", question: "Wie viel kosten 4 Pakete Nudeln?", solution: 6 },
        { id: "medium_17", story: "Ein Packung Sammelkarten kostet 5€. Du kaufst 4 Stück. Du hast 30€ dabei.", question: "Wie viel Geld hast du nach dem Kauf noch?", solution: 10 },
        { id: "medium_18", story: "Eine Packung Farbstifte kostet 14€. Ein Malblock kostet 6€. Du hast 25€ dabei.", question: "Wie viel Geld hast du nach dem Einkauf noch?", solution: 5 },
        { id: "medium_19", story: "Das Parkhaus kostet 2€ pro Stunde. Papa parkt 3 Stunden.", question: "Wie viel kostet das Parken?", solution: 6 },
        { id: "medium_20", story: "Du hast 60€. Du kaufst Schuhe für 45€ und Socken für 5€.", question: "Wie viel kosten Schuhe und Socken zusammen?", solution: 50 }
    ],
    hard: [
        { id: "hard_1", story: "Du hast 100€. Du kaufst ein Spiel für 45€, einen Controller für 35€ und Batterien für 5€. Der Rabatt ist 10€.", question: "Wie viel kosten die Sachen ohne Rabatt?", solution: 85 },
        { id: "hard_2", story: "Im Supermarkt kaufst du 2kg Äpfel (4€), 3 Packungen Milch (6€), Brot (3€) und Wurst (7€). Du hast einen 5€ Gutschein.", question: "Wie viel hättest du ohne Gutschein bezahlt?", solution: 20 },
        { id: "hard_3", story: "Vier Freunde gehen essen. Die Pizza kostet 32€, Getränke 12€ und Eis 16€. Sie teilen die Kosten durch 4.", question: "Wie viel kostet das Essen insgesamt?", solution: 60 },
        { id: "hard_4", story: "Du hast 200€. Ein Tablet kostet 150€. Eine Hülle kostet 20€ und Kopfhörer 15€. Der Versand ist 5€.", question: "Wie viel kosten Tablet, Hülle und Kopfhörer zusammen?", solution: 185 },
        { id: "hard_5", story: "Oma hat 50€. Sie kauft Blumen für 12€, Erde für 8€, Töpfe für 15€ und Gießkannen für 10€.", question: "Wie viel kosten Blumen und Töpfe zusammen?", solution: 27 },
        { id: "hard_6", story: "Im Freizeitpark kostet der Eintritt 25€ pro Person. Ihr seid 3 Kinder und 2 Erwachsene. Erwachsene zahlen 35€..", question: "Wie viel kosten die Kindertickets zusammen?", solution: 75 },
        { id: "hard_7", story: "Ein Skateboard kostet 89€. Rollen kosten 24€. Ein Helm 35€. Der Shop gibt 10€ Rabatt.", question: "Wie viel kostet alles zusammen mit Rabatt?", solution: 138 },
        { id: "hard_8", story: "Du hast 500€. Du kaufst ein Handy für 399€, eine Versicherung für 50€ und eine SD-Karte für 20€.", question: "Wie viel hast du für Handy und SD-Karte bezahlt?", solution: 419 },
        { id: "hard_9", story: "In der Bäckerei kosten 10 Brötchen 5€. 5 Brezeln kosten 7,50€. 2 Kuchen kosten 12€.", question: "Was kosten Brötchen und Brezeln zusammen?", solution: 12.5 },
        { id: "hard_10", story: "Du hast 45€. Du kaufst 3 DVDs für je 12€ und Popcorn für 4€. Du findest 5€ auf dem Weg.", question: "Wie viel Geld hattest du nach dem Kauf der DVDs (ohne Fund)?", solution: 9 },
        { id: "hard_11", story: "Ein Lego-Set kostet 120€. Du sparst 15€ pro Woche.", question: "Wie viel Geld hast du nach 8 Wochen gespart?", solution: 120 },
        { id: "hard_12", story: "Du verkaufst Limonade. Glas 1€, Becher 2€. Du verkaufst 10 Gläser und 5 Becher. Kosten 5€ für Zitronen.", question: "Wie viel Geld hast du insgesamt eingenommen (vor Kosten)?", solution: 20 },
        { id: "hard_13", story: "Im Kino kostet Popcorn 4,50€, Nachos 5,50€ und Cola 3,50€. Du kaufst 2 Popcorn, 1 Nachos und 3 Cola. Du zahlst mit 50€.", question: "Was ist dein Wechselgeld?", solution: 25 },
        { id: "hard_14", story: "Ein Zoobesuch kostet für 4 Personen 64€. Ein Eis kostet 2,50€ pro Kugel. Jeder isst 2 Kugeln. Souvenirs kosten 16€.", question: "Was kosten die Souvenirs und das Eis zusammen?", solution: 36 },
        { id: "hard_15", story: "Du hast 80€. Du kaufst Turnschuhe für 55€, eine Hose für 25€ und Socken für 5€. Der Verkäufer schenkt dir 5€.", question: "Was war der Preis der Hose?", solution: 25 },
        { id: "hard_16", story: "Eine Reise kostet 1200€. Du hast 800€ gespart. Monatlich sparst du 100€..", question: "Wie viel Geld hast du nach 2 Monaten gespart insgesamt?", solution: 1000 },
        { id: "hard_17", story: "Im Sportladen: Ball 19€, Trikot 39€, Schuhe 79€. Du kaufst alles. Du bekommst 10% Rabatt.", question: "Was ist der Gesamtpreis vor dem Rabatt?", solution: 137 },
        { id: "hard_18", story: "Du hast 10€. Du kaufst 12 Eier für 3,60€, 1 Liter Milch für 1,40€ und 5 Brötchen für 2,50€.", question: "Was kosten Eier und Milch zusammen?", solution: 5 },
        { id: "hard_19", story: "Ein Buch kostet 18€. Du kaufst 3 Bücher. Es gibt ein Angebot: '3 für 2'.", question: "Wie viel hättest du ohne Angebot gezahlt?", solution: 54 },
        { id: "hard_20", story: "Dein Sparschwein hat 45€. Du leerst es und findest 3 Zehner, 2 Fünfer und 5 Ein-Euro-Münzen.", question: "Wie viele 10-Euro-Scheine sind im Schwein?", solution: 3 }
    ]
};

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
        followRedirects.https.get(url, (response: IncomingMessage) => {
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
            const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=600&height=400&model=flux&nologo=true&seed=${problem.solution * 1337}`;
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
