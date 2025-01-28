import React, { useState } from 'react';
import './PlayerCard.css';

const PlayerCard = ({ player }) => {
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [showCareerStats, setShowCareerStats] = useState(true);

    const seasons = player.seasons || [];
    const careerAverages = player.career_averages || {};
    
    const formatStat = (value) => {
        if (value === null || value === undefined) return 'N/A';
        return typeof value === 'number' ? value.toFixed(1) : value;
    };

    const StatRow = ({ label, value, isPercentage = false }) => (
        <div className="stat-row">
            <span className="stat-label">{label}</span>
            <span className="stat-value">
                {isPercentage ? `${formatStat(value * 100)}%` : formatStat(value)}
            </span>
        </div>
    );

    const handleSeasonChange = (e) => {
        const value = e.target.value;
        setSelectedSeason(value === 'career' ? null : value);
        setShowCareerStats(value === 'career');
    };

    const currentStats = showCareerStats ? 
        careerAverages : 
        seasons.find(s => s.season_id === selectedSeason);

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
                <div className="season-selector">
                    <select 
                        value={showCareerStats ? 'career' : selectedSeason || ''}
                        onChange={handleSeasonChange}
                        className="season-select"
                    >
                        <option value="career">Career Averages</option>
                        {seasons.map((season) => (
                            <option key={season.season_id} value={season.season_id}>
                                {season.season_id} - {season.team}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="stats-grid">
                    <div className="stats-section">
                        <h5>Scoring</h5>
                        <StatRow label="PPG" value={showCareerStats ? careerAverages.ppg : currentStats?.pts_per_game} />
                        <StatRow label="FG%" value={showCareerStats ? careerAverages.fgPercent : currentStats?.fg_percent} isPercentage />
                        <StatRow label="3P%" value={showCareerStats ? careerAverages.fg3Percent : currentStats?.fg3_percent} isPercentage />
                        <StatRow label="FT%" value={showCareerStats ? careerAverages.ftPercent : currentStats?.ft_percent} isPercentage />
                    </div>

                    <div className="stats-section">
                        <h5>Other Stats</h5>
                        <StatRow label="APG" value={showCareerStats ? careerAverages.apg : currentStats?.ast_per_game} />
                        <StatRow label="RPG" value={showCareerStats ? careerAverages.rpg : currentStats?.reb_per_game} />
                        <StatRow label="SPG" value={showCareerStats ? careerAverages.spg : currentStats?.stl_per_game} />
                        <StatRow label="BPG" value={showCareerStats ? careerAverages.bpg : currentStats?.blk_per_game} />
                    </div>

                    {!showCareerStats && currentStats && (
                        <div className="stats-section">
                            <h5>Season Details</h5>
                            <StatRow label="Games" value={currentStats.games} />
                            <StatRow label="Started" value={currentStats.games_started} />
                            <StatRow label="MPG" value={currentStats.minutes_per_game} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlayerCard;