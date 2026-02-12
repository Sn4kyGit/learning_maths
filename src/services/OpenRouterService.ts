const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export interface AIProblem {
    id?: string;
    story: string;
    question: string;
    solution: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export const generateAIWordProblem = async (difficulty: Difficulty = 'medium'): Promise<AIProblem> => {
    let difficultyInstruction = '';

    if (difficulty === 'easy') {
        difficultyInstruction = 'Halte die Geschichte sehr einfach und kurz. Verwende insgesamt EXAKT 3 Geldbeträge oder Zahlen in der Geschichte.';
    } else if (difficulty === 'medium') {
        difficultyInstruction = 'Erstelle eine normale Geschichte. Verwende zwischen 4 und 6 verschiedene Geldbeträge oder Zahlen.';
    } else {
        difficultyInstruction = 'Erstelle eine komplexe Geschichte mit vielen Details, Rabatten oder mehreren Personen. Verwende zwischen 7 und 9 verschiedene Geldbeträge oder Zahlen.';
    }

    const prompt = `Du bist eine freundliche Mathelehrerin für einen 8-jährigen Jungen (3. Klasse). 
    Erstelle eine spannende Sachaufgabe zum Thema Geld im Supermarkt. 
    ${difficultyInstruction}
    WICHTIG: Es muss IMMER eine Rechenaufgabe mit Geld sein (Euro/Cent).
    VERBOTEN: Frage NIEMALS nach der Anzahl von Dingen (z.B. "Wie viele Äpfel?").
    VERBOTEN: Verrate NIEMALS die Lösung oder das Ergebnis in der Geschichte (z.B. "Das macht zusammen 8€" ist verboten!).
    Die Frage muss immer lauten: "Wie viel kostet...", "Wie viel Geld...", "Wie viel Wechselgeld..." oder ähnlich.
    Die Aufgabe sollte Geldbeträge bis 1000€ enthalten. 
    Antworte ausschließlich im JSON-Format mit den Feldern: "story" (Text der Geschichte ohne Lösung), "question" (Die konkrete Rechenfrage nach einem Geldbetrag), "solution" (Die numerische Lösung).`;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' }
            }),
        });

        const data = await response.json();
        const content = data.choices[0].message.content;
        return JSON.parse(content);
    } catch (error) {
        console.error('AI Problem Generation Error:', error);
        return {
            story: 'Heute im Supermarkt: Du kaufst Äpfel für 4,50€ und Bananen für 3,20€.',
            question: 'Wie viel musst du insgesamt bezahlen?',
            solution: 7.7
        };
    }
};

