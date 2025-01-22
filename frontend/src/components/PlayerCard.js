import React, { useState } from 'react';
import './PlayerCard.css';

const PlayerCard = ({ player, isSearched }) => {
    const stats = Array.isArray(player.stats) ? player.stats : [];
    const [selectedSeason, setSelectedSeason] = useState(stats[0]?.SEASON_ID || '');
    
    const seasonStats = stats.find((stat) => stat.SEASON_ID === selectedSeason) || null;
    const careerStats = !Array.isArray(player.stats) ? player.stats : null;

    const formatStat = (value) => {
        if (value === null || value === undefined) return 'N/A';
        return typeof value === 'number' ? value.toFixed(1) : value;
    };

    const handleSeasonChange = (e) => {
        setSelectedSeason(e.target.value);
    };

    const StatRow = ({ label, value, isPercentage }) => (
        <div className="stat-row">
            <span className="stat-label">{label}</span>
            <span className="stat-value">
                {isPercentage ? `${formatStat(value * 100)}%` : formatStat(value)}
            </span>
        </div>
    );

    return (
        <div className="player-card">
            <div className="player-header">
                <h3 className="player-name">{player.full_name}</h3>
                <div className="player-info">
                    <span className="info-item">
                        <span className="info-label">Team:</span> {player.team || 'N/A'}
                    </span>
                    <span className="info-item">
                        <span className="info-label">Position:</span> {player.position || 'N/A'}
                    </span>
                </div>
            </div>

            <div className="stats-container">
                {isSearched && stats.length > 0 ? (
                    <div className="seasonal-stats">
                        <div className="stats-header">
                            <h4>Season Statistics</h4>
                            <select
                                className="season-select"
                                value={selectedSeason}
                                onChange={handleSeasonChange}
                                aria-label="Select Season"
                            >
                                {stats.map((stat, index) => (
                                    <option key={index} value={stat.SEASON_ID}>
                                        {stat.SEASON_ID}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {seasonStats ? (
                            <div className="stats-grid">
                                <div className="stats-section">
                                    <h5>Game Stats</h5>
                                    <StatRow label="Games Played" value={seasonStats.GP} />
                                    <StatRow label="Minutes" value={seasonStats.MIN} />
                                </div>

                                <div className="stats-section">
                                    <h5>Shooting</h5>
                                    <StatRow label="FG%" value={seasonStats.FG_PCT} isPercentage />
                                    <StatRow label="3P%" value={seasonStats.FG3_PCT} isPercentage />
                                    <StatRow label="FT%" value={seasonStats.FT_PCT} isPercentage />
                                </div>

                                <div className="stats-section">
                                    <h5>Performance</h5>
                                    <StatRow label="Points" value={seasonStats.PTS} />
                                    <StatRow label="Assists" value={seasonStats.AST} />
                                    <StatRow label="Rebounds" value={seasonStats.REB} />
                                    <StatRow label="Steals" value={seasonStats.STL} />
                                    <StatRow label="Blocks" value={seasonStats.BLK} />
                                </div>
                            </div>
                        ) : (
                            <div className="no-stats">No statistics available for the selected season.</div>
                        )}
                    </div>
                ) : careerStats && (
                    <div className="career-stats">
                        <h4>Career Averages</h4>
                        <div className="stats-grid">
                            {Object.entries(careerStats)
                                .filter(([key]) => !['id', 'full_name', 'team', 'position'].includes(key))
                                .map(([key, value]) => (
                                    <StatRow
                                        key={key}
                                        label={key.toUpperCase()}
                                        value={value}
                                        isPercentage={key.includes('PCT')}
                                    />
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerCard;