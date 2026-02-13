import { kv } from '@vercel/kv';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    const LEADERBOARD_KEY = 'hero_leaderboard';

    try {
        // GET: Fetch top players
        if (req.method === 'GET') {
            // Get all entries using ZRANGE (score is points, name is member)
            // Sorted by score descending
            const list = await kv.zrange(LEADERBOARD_KEY, 0, 9, {
                rev: true,
                withScores: true,
            });

            // Format from [name1, score1, name2, score2] to objects
            const formatted = [];
            for (let i = 0; i < list.length; i += 2) {
                formatted.push({
                    name: list[i],
                    score: list[i + 1],
                    streak: 0, // Streak is not stored in sorted set directly, maybe later
                });
            }

            return new Response(JSON.stringify(formatted), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // POST: Update player score
        if (req.method === 'POST') {
            const { name, score } = await req.json();

            if (!name || typeof score !== 'number') {
                return new Response('Invalid data', { status: 400 });
            }

            // Add to sorted set (replaces if exists and higher)
            // Actually ZADD by default overwrites. 
            // We use ZADD LEADERBOARD_KEY score name
            await kv.zadd(LEADERBOARD_KEY, { score, member: name });

            return new Response('Success', { status: 200 });
        }

        return new Response('Method not allowed', { status: 405 });
    } catch (error) {
        console.error('Leaderboard API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
