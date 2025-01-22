import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import api from '../services/api';
import PlayerCard from '../components/PlayerCard';
import './StatsPage.css';

const StatsPage = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [selectedYear, setSelectedYear] = useState('');
    const [yearStats, setYearStats] = useState(null);
    const [availableYears, setAvailableYears] = useState([]);
    const location = useLocation();

    useEffect(() => {
        // Get player name from URL if present
        const params = new URLSearchParams(location.search);
        const playerName = params.get('player');
        if (playerName) {
            setSearchQuery(playerName);
            handleSearch(playerName);
        } else {
            fetchRandomPlayers();
        }
    }, [location]);

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

    const handleSearch = async (query = searchQuery) => {
        if (!query.trim()) return;

        setLoading(true);
        try {
            const response = await api.get(`/players/search/${encodeURIComponent(query)}`);
            const playerData = response.data.player;
            
            // Extract unique years from player stats
            const years = [...new Set(playerData.stats.map(stat => stat.SEASON_ID))].sort();
            
            setSearchResults(playerData);
            setAvailableYears(years);
            setSelectedYear(years[years.length - 1]); // Select most recent year
            setError(null);
            
            // Fetch stats for selected year
            if (years.length > 0) {
                await handleYearSelect(years[years.length - 1], playerData.id);
            }
        } catch (err) {
            setError('Player not found or failed to fetch stats.');
            setSearchResults(null);
            setAvailableYears([]);
        } finally {
            setLoading(false);
        }
    };

    const handleYearSelect = async (year, playerId = searchResults?.id) => {
        if (!playerId || !year) return;

        try {
            const response = await api.get(`/players/${playerId}/stats/${year}`);
            setYearStats(response.data);
            setSelectedYear(year);
        } catch (err) {
            setError('Failed to fetch year stats.');
            setYearStats(null);
        }
    };

    const renderStatsChart = (stats, statKey, title) => {
        if (!stats || !Array.isArray(stats)) return null;

        return (
            <div className="stats-chart">
                <h3>{title}</h3>
                <div className="h-64 w-full">
                    <LineChart data={stats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="SEASON_ID" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey={statKey} stroke="#8884d8" />
                    </LineChart>
                </div>
            </div>
        );
    };

    return (
        <div className="stats-page">
            <div className="header">
                <h1>NBA Player Stats</h1>
                <button onClick={fetchRandomPlayers} className="refresh-button">
                    Refresh Random Players
                </button>
            </div>

            <div className="search-section">
                <input
                    type="text"
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="search-input"
                />
                <button onClick={() => handleSearch()} className="search-button">
                    Search
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {searchResults && (
                <div className="search-results">
                    <h2>Player Details</h2>
                    <div className="year-selector">
                        <select
                            value={selectedYear}
                            onChange={(e) => handleYearSelect(e.target.value)}
                            className="year-select"
                        >
                            {availableYears.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="player-details">
                        <PlayerCard player={searchResults} />
                        
                        {yearStats && (
                            <div className="stats-container">
                                {renderStatsChart(searchResults.stats, 'PTS', 'Points Per Game')}
                                {renderStatsChart(searchResults.stats, 'AST', 'Assists Per Game')}
                                {renderStatsChart(searchResults.stats, 'REB', 'Rebounds Per Game')}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!searchResults && !loading && (
                <div className="random-players">
                    <h2>Featured Players</h2>
                    <div className="player-grid">
                        {players.map((player) => (
                            <div 
                                key={player.id} 
                                className="player-card-container"
                                onClick={() => {
                                    setSearchQuery(player.full_name);
                                    handleSearch(player.full_name);
                                }}
                            >
                                <PlayerCard player={player} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatsPage;