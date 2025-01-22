import React, { useState } from 'react';
import './PlayerCard.css';

const PlayerCard = ({ player, isSearched }) => {
    const stats = Array.isArray(player.stats) ? player.stats : [];
    const [selectedSeason, setSelectedSeason] = useState(stats[0]?.SEASON_ID || '');
    const seasonStats = stats.find((stat) => stat.SEASON_ID === selectedSeason) || null;

    const handleSeasonChange = (e) => {
        setSelectedSeason(e.target.value);
    };

    return (
        <div className="player-card">
            <h3>{player.full_name}</h3>
            <p>Team: {player.team}</p>
            <p>Position: {player.position || 'N/A'}</p>

            {isSearched && stats.length > 0 ? (
                <div className="player-stats">
                    <h4>Season Stats:</h4>
                    <label htmlFor="season-select">Select Season:</label>
                    <select
                        id="season-select"
                        value={selectedSeason}
                        onChange={handleSeasonChange}
                    >
                        {stats.map((stat, index) => (
                            <option key={index} value={stat.SEASON_ID}>
                                {stat.SEASON_ID}
                            </option>
                        ))}
                    </select>
                    {seasonStats ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>Team</th>
                                    <th>Games</th>
                                    <th>Minutes</th>
                                    <th>FG%</th>
                                    <th>3P%</th>
                                    <th>FT%</th>
                                    <th>Points</th>
                                    <th>Assists</th>
                                    <th>Rebounds</th>
                                    <th>Steals</th>
                                    <th>Blocks</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{seasonStats.TEAM_ABBREVIATION}</td>
                                    <td>{seasonStats.GP}</td>
                                    <td>{seasonStats.MIN}</td>
                                    <td>{seasonStats.FG_PCT}</td>
                                    <td>{seasonStats.FG3_PCT}</td>
                                    <td>{seasonStats.FT_PCT}</td>
                                    <td>{seasonStats.PTS}</td>
                                    <td>{seasonStats.AST}</td>
                                    <td>{seasonStats.REB}</td>
                                    <td>{seasonStats.STL}</td>
                                    <td>{seasonStats.BLK}</td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <p>No stats available for the selected season.</p>
                    )}
                </div>
            ) : (
                <div className="player-stats">
                    <h4>Career Averages:</h4>
                    <ul>
                        {Object.entries(player.stats).map(([key, value]) => (
                            <li key={key}>
                                {key}: {value}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PlayerCard;
