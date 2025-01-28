import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import PlayerCard from '../components/PlayerCard';
import LoadingSpinner from '../components/LoadingSpinner';
import './StatsPage.css';

const StatsPage = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const location = useLocation();

    useEffect(() => {
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
        setError(null);
        try {
            const response = await api.get('/random-players');
            if (response.data) {
                setPlayers(response.data);
            } else {
                setError('No players found');
            }
        } catch (err) {
            setError('Failed to fetch players. Please try again.');
            setPlayers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query = searchQuery) => {
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/players', { params: { name: query } });
            if (response.data && response.data.player) {
                setSearchResults(response.data.player);
            } else {
                setError('Player not found');
                setSearchResults(null);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to find player');
            setSearchResults(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="stats-page">
            <div className="header">
                <h1>NBA Player Stats</h1>
                <button 
                    onClick={fetchRandomPlayers} 
                    className="refresh-button"
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Refresh Players'}
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
                    disabled={loading}
                />
                <button 
                    onClick={() => handleSearch()} 
                    className="search-button"
                    disabled={loading}
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {loading && (
                <div className="loading-container">
                    <LoadingSpinner />
                </div>
            )}

            {searchResults && !loading && (
                <div className="search-results">
                    <h2>Player Details</h2>
                    <PlayerCard player={searchResults} isSearched />
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