import React, { useEffect, useState } from 'react';
import api from './services/api'; // Ensure this matches your setup
import './styles/App.css';
import PlayerCard from './components/PlayerCard';

const App = () => {
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const response = await api.get('/players'); // Fetch players from backend
                console.log(response.data); // Log the response to check its structure
                setPlayers(response.data); // Update state with fetched data
            } catch (error) {
                console.error('Error fetching players:', error);
            }
        };

        fetchPlayers();
    }, []);

    return (
        <div>
            <h1>NFL & NBA Stats Predictor</h1>
            <div className="player-list">
                {players.map((player, index) => (
                    <PlayerCard key={index} player={player} />
                ))}
            </div>
        </div>
    );
};

export default App;
