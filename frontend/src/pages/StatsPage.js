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

    // Fetch 10 random players on component load
    useEffect(() => {
        const fetchRandomPlayers = async () => {
            try {
                const response = await api.get('/players/random-players'); // Updated endpoint for random players
                setPlayers(response.data);
            } catch (err) {
                setError('Failed to fetch random players.');
            } finally {
                setLoading(false);
            }
        };

        fetchRandomPlayers();
    }, []);

    // Handle player search
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const response = await api.get(`/players?name=${encodeURIComponent(searchQuery)}`);
            setSearchResults(response.data);
            setError(null); // Clear any previous errors
        } catch (err) {
            setError('Player not found or failed to fetch stats.');
            setSearchResults(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="stats-page">
            <h1>NBA Player Stats</h1>
            <input
                type="text"
                placeholder="Search players"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button onClick={handleSearch}>Search</button>

            {searchResults ? (
                <div className="search-results">
                    <h2>Search Results</h2>
                    <PlayerCard player={searchResults.player} stats={searchResults.stats} />
                </div>
            ) : (
                <div className="player-list">
                    {players.map((player, index) => (
                        <PlayerCard key={index} player={player} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default StatsPage;
