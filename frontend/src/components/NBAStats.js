import React, { useState } from 'react';
import api from '../services/api';

const NBAStats = () => {
    const [playerName, setPlayerName] = useState('');
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        try {
            const response = await api.get(`/stats/nba-player-stats?name=${playerName}`);
            setStats(response.data);
            setError(null); // Clear error on success
        } catch (err) {
            setError('Failed to fetch stats');
            setStats(null); // Clear stats on error
        }
    };

    return (
        <div>
            <h2>NBA Player Stats</h2>
            <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter player name"
            />
            <button onClick={fetchStats}>Get Stats</button>

            {error && <p>{error}</p>}
            {stats && stats.player ? (
                <div>
                    <h3>{stats.player.full_name}</h3>
                    <pre>{JSON.stringify(stats.stats, null, 2)}</pre>
                </div>
            ) : stats ? (
                <p>No player data available.</p>
            ) : null}
        </div>
    );
};

export default NBAStats;
