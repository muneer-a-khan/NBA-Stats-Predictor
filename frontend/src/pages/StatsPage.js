import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PlayerCard from '../components/PlayerCard';
import './StatsPage.css';

const StatsPage = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchedPlayer, setSearchedPlayer] = useState(null);

    // Fetch 10 random players on load
    useEffect(() => {
        const fetchRandomPlayers = async () => {
            try {
                const response = await api.get('/players/random-players');
                setPlayers(response.data); // Load 10 random players
            } catch (err) {
                setError('Failed to fetch players.');
            } finally {
                setLoading(false);
            }
        };

        fetchRandomPlayers();
    }, []);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            alert('Please enter a player name.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.get(`/players?name=${encodeURIComponent(searchQuery)}`);
            setSearchedPlayer(response.data.player); // Load specific player
            setPlayers([]); // Clear random players
        } catch (err) {
            console.error('API Error:', err);
            setError('Player not found.');
            setSearchedPlayer(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p>Loading players...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="stats-page">
            <h1>NBA Player Stats</h1>
            <input
                type="text"
                placeholder="Search players by name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button onClick={handleSearch}>Search</button>

            {searchedPlayer ? (
                <PlayerCard player={searchedPlayer} isSearched={true} />
            ) : (
                <div className="player-list">
                    {players.map((player, index) => (
                        <PlayerCard key={index} player={player} isSearched={false} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default StatsPage;
