import React, { useState } from 'react';
import api from '../services/api';

const NBAStats = () => {
    const [playerName, setPlayerName] = useState('');
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        try {
            if (!playerName.trim()) {
                setError('Please enter a player name');
                setStats(null);
                return;
            }

            const response = await api.get(`/players?name=${encodeURIComponent(playerName)}`);
            console.log('API Response:', response.data);
            if (response.data && response.data.player) {
                if (response.data.player.seasons) {
                    response.data.player.seasons.sort((a, b) => parseInt(b.season) - parseInt(a.season));
                }
                setStats(response.data);
                setError(null);
            } else {
                setError('No player found with that name.');
                setStats(null);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
            if (err.response && err.response.status === 404) {
                setError('No player found with that name.');
            } else {
                setError('Failed to fetch stats. Please try again.');
            }
            setStats(null);
        }
    };

    const formatStat = (value, isPercentage = false) => {
        if (value === null || value === undefined || isNaN(value)) return 'N/A';
        const formattedValue = parseFloat(value).toFixed(1);
        return isPercentage ? `${formattedValue}%` : formattedValue;
    };

    const renderCareerStats = () => {
        if (!stats?.player?.career_averages) return null;
        
        const ca = stats.player.career_averages;
        return (
            <div className="career-stats">
                <h4>Career Averages</h4>
                <table>
                    <thead>
                        <tr>
                            <th>PPG</th>
                            <th>APG</th>
                            <th>RPG</th>
                            <th>FG%</th>
                            <th>3P%</th>
                            <th>FT%</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{formatStat(ca.career_ppg)}</td>
                            <td>{formatStat(ca.career_apg)}</td>
                            <td>{formatStat(ca.career_rpg)}</td>
                            <td>{formatStat(ca.career_fg_pct * 100, true)}</td>
                            <td>{formatStat(ca.career_fg3_pct * 100, true)}</td>
                            <td>{formatStat(ca.career_ft_pct * 100, true)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };
    
    const renderSeasonStats = () => {
        if (!stats || !stats.player || !stats.player.seasons) {
            return null;
        }

        return (
            <div>
                <h3>{stats.player.full_name}</h3>
                <p>Position: {stats.player.position}</p>
                {renderCareerStats()}
                <h4>Season Stats</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Season</th>
                            <th>Team</th>
                            <th>Games</th>
                            <th>PPG</th>
                            <th>APG</th>
                            <th>RPG</th>
                            <th>FG%</th>
                            <th>3P%</th>
                            <th>FT%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.player.seasons.map((season, index) => (
                            <tr key={index}>
                                <td>{season.season}</td>
                                <td>{season.team}</td>
                                <td>{season.games}</td>
                                <td>{formatStat(season.pts_per_game)}</td>
                                <td>{formatStat(season.ast_per_game)}</td>
                                <td>{formatStat(season.reb_per_game)}</td>
                                <td>{formatStat(season.fg_percent * 100, true)}</td>
                                <td>{formatStat(season.fg3_percent * 100, true)}</td>
                                <td>{formatStat(season.ft_percent * 100, true)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div>
            <h2>NBA Player Stats</h2>
            <div className="search-container">
                <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter player name"
                />
                <button onClick={fetchStats}>Get Stats</button>
            </div>
            {error && <p className="error">{error}</p>}
            {renderSeasonStats()}
        </div>
    );
};

export default NBAStats;