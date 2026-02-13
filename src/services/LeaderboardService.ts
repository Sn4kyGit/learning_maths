export interface LeaderboardEntry {
    name: string;
    score: number;
}

class LeaderboardService {
    private apiPath = '/api/leaderboard';

    async getTopPlayers(): Promise<LeaderboardEntry[]> {
        try {
            const response = await fetch(this.apiPath);
            if (!response.ok) throw new Error('Failed to fetch leaderboard');
            return await response.json();
        } catch (error) {
            console.error('Error in LeaderboardService.getTopPlayers:', error);
            return [];
        }
    }

    async updateScore(name: string, score: number): Promise<boolean> {
        try {
            const response = await fetch(this.apiPath, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, score }),
            });
            return response.ok;
        } catch (error) {
            console.error('Error in LeaderboardService.updateScore:', error);
            return false;
        }
    }
}

export const leaderboardService = new LeaderboardService();
