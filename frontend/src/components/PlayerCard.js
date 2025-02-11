import React, { useState } from 'react';
import { formatSeason, formatStat, getCurrentTeam } from '../utils/formatHelpers';
import './PlayerCard.css';

const PlayerCard = ({ player, showSeasonsByDefault = false }) => {
    const [showCareer, setShowCareer] = useState(true);
    const [showSeasons, setShowSeasons] = useState(showSeasonsByDefault);

    const renderCareerStats = () => {
        if (!player?.career_averages) return null;
        
        const ca = player.career_averages;
        return (
            <div className="stats-section">
                <h4>Career Averages</h4>
                <div className="stats-grid">
                    <div className="stat-group">
                        <h5>Scoring</h5>
                        <div className="stat-row">
                            <span className="stat-label">PPG</span>
                            <span className="stat-value">{formatStat(ca.career_ppg)}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">FG%</span>
                            <span className="stat-value">{formatStat(ca.career_fg_pct * 100, true)}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">3P%</span>
                            <span className="stat-value">{formatStat(ca.career_fg3_pct * 100, true)}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">FT%</span>
                            <span className="stat-value">{formatStat(ca.career_ft_pct * 100, true)}</span>
                        </div>
                    </div>
                    <div className="stat-group">
                        <h5>Other Stats</h5>
                        <div className="stat-row">
                            <span className="stat-label">APG</span>
                            <span className="stat-value">{formatStat(ca.career_apg)}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">RPG</span>
                            <span className="stat-value">{formatStat(ca.career_rpg)}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">SPG</span>
                            <span className="stat-value">{formatStat(ca.career_spg)}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">BPG</span>
                            <span className="stat-value">{formatStat(ca.career_bpg)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSeasonStats = () => {
        if (!player?.seasons || player.seasons.length === 0) return null;

        return (
            <div className="stats-section">
                <h4>Season Stats</h4>
                <div className="seasons-table-container">
                    <table className="seasons-table">
                        <thead>
                            <tr>
                                <th>Season</th>
                                <th>Team</th>
                                <th>Games</th>
                                <th>PPG</th>
                                <th>APG</th>
                                <th>RPG</th>
                                <th>SPG</th>
                                <th>BPG</th>
                                <th>FG%</th>
                                <th>3P%</th>
                                <th>FT%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {player.seasons.map((season, index) => (
                                <tr key={index}>
                                    <td>{formatSeason(season.season)}</td>
                                    <td>{season.team}</td>
                                    <td>{season.games}</td>
                                    <td>{formatStat(season.pts_per_game)}</td>
                                    <td>{formatStat(season.ast_per_game)}</td>
                                    <td>{formatStat(season.reb_per_game)}</td>
                                    <td>{formatStat(season.stl_per_game)}</td>
                                    <td>{formatStat(season.blk_per_game)}</td>
                                    <td>{formatStat(season.fg_percent * 100, true)}</td>
                                    <td>{formatStat(season.fg3_percent * 100, true)}</td>
                                    <td>{formatStat(season.ft_percent * 100, true)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const currentTeam = getCurrentTeam(player?.seasons);

    return (
        <div className="player-card">
            <div className="player-header">
                <h3>{player.full_name}</h3>
                <div className="player-info">
                    <p>Position: {player.position || 'N/A'}</p>
                    <p>Current Team: {currentTeam}</p>
                </div>
            </div>
            
            <div className="view-selector">
                <button 
                    className={`toggle-button ${showCareer ? 'active' : ''}`}
                    onClick={() => setShowCareer(!showCareer)}
                >
                    Career Averages
                </button>
                <button 
                    className={`toggle-button ${showSeasons ? 'active' : ''}`}
                    onClick={() => setShowSeasons(!showSeasons)}
                >
                    Season Stats
                </button>
            </div>

            {showCareer && renderCareerStats()}
            {showSeasons && renderSeasonStats()}
        </div>
    );
};

export default PlayerCard;