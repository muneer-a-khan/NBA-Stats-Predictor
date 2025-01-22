import React, { useEffect, useState } from 'react';
import api from '../services/api';
import PlayerCard from '../components/PlayerCard';
import './StatsPage.css';

const StatsPage = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [selectedSeason, setSelectedSeason] = useState('');
    const [availableSeasons, setAvailableSeasons] = useState([]);
    const [seasonStats, setSeasonStats] = useState(null);
    const [loadingSeasonStats, setLoadingSeasonStats] = useState(false);

    // Fetch 10 random players on component load
    useEffect(() => {
        fetchRandomPlayers();
    }, []);

    const fetchRandomPlayers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/players/random-players');
            setPlayers(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch random players.');
            setPlayers([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle player search
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const response = await api.get(`/players/search/${encodeURIComponent(searchQuery)}`);
            setSearchResults(response.data.player);
            setAvailableSeasons(response.data.seasons || []);
            setSelectedSeason(''); // Reset selected season
            setSeasonStats(null); // Reset season stats
            setError(null);
        } catch (err) {
            setError('Player not found or failed to fetch stats.');
            setSearchResults(null);
            setAvailableSeasons([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle season selection
    const handleSeasonSelect = async (season) => {
        if (!searchResults || !season) return;

        setLoadingSeasonStats(true);
        try {
            const response = await api.get(`/players/${searchResults.id}/stats/${season}`);
            setSeasonStats(response.data);
            setSelectedSeason(season);
            setError(null);
        } catch (err) {
            setError('Failed to fetch season stats.');
            setSeasonStats(null);
        } finally {
            setLoadingSeasonStats(false);
        }
    };

    // Handle refresh random players
    const handleRefreshPlayers = () => {
        fetchRandomPlayers();
    };

    // Handle search on Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const renderStats = (stats) => {
        if (!stats) return null;

        return (
            <div className="stats-grid">
                <div className="stat-item">
                    <span className="stat-label">Points</span>
                    <span className="stat-value">{stats.PTS?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Assists</span>
                    <span className="stat-value">{stats.AST?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Rebounds</span>
                    <span className="stat-value">{stats.REB?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Steals</span>
                    <span className="stat-value">{stats.STL?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Blocks</span>
                    <span className="stat-value">{stats.BLK?.toFixed(1) || '0.0'}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="stats-page">
            <div className="header">
                <h1>NBA Player Stats</h1>
                <button onClick={handleRefreshPlayers} className="refresh-button">
                    Refresh Random Players
                </button>
            </div>

            <div className="search-section">
                <input
                    type="text"
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="search-input"
                />
                <button onClick={handleSearch} className="search-button">
                    Search
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {searchResults && (
                <div className="search-results">
                    <h2>Player Details</h2>
                    <div className="player-details">
                        <PlayerCard player={searchResults} />
                        
                        <div className="season-selector">
                            <select
                                value={selectedSeason}
                                onChange={(e) => handleSeasonSelect(e.target.value)}
                                className="season-select"
                            >
                                <option value="">Select Season</option>
                                {availableSeasons.map((season) => (
                                    <option key={season} value={season}>
                                        {season}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {loadingSeasonStats ? (
                            <div className="loading">Loading season stats...</div>
                        ) : (
                            seasonStats && (
                                <div className="season-stats">
                                    <h3>Stats for {selectedSeason} Season</h3>
                                    {renderStats(seasonStats)}
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}

            {!searchResults && (
                <div className="random-players">
                    <h2>Random Players</h2>
                    <div className="player-grid">
                        {players.map((player, index) => (
                            <PlayerCard key={index} player={player} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatsPage;