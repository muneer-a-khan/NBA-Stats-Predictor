import React, { useEffect, useState } from 'react';
import api from './services/api';
import './styles/App.css';
import PlayerCard from './components/PlayerCard';
import PredictionForm from './components/PredictionForm';

const App = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState(''); // New state for search
    const [prediction, setPrediction] = useState(null);

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const response = await api.get('/players');
                setPlayers(response.data);
            } catch (error) {
                setError('Failed to fetch player data.');
            } finally {
                setLoading(false);
            }
        };

        fetchPlayers();
    }, []);

    const filteredPlayers = players.filter((player) =>
        player.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <p>Loading players...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h1>NFL & NBA Stats Predictor</h1>
            
            <PredictionForm onPrediction={setPrediction} />
            
            {prediction && (
                <div className="prediction-results">
                    <h2>Prediction Results</h2>
                    <p>Player: {prediction.playerName}</p>
                    <p>Predicted Points: {prediction.predictedPoints.toFixed(2)}</p>
                    <p>Predicted Assists: {prediction.predictedAssists.toFixed(2)}</p>
                    <p>Predicted Games: {prediction.predictedGames.toFixed(2)}</p>
                </div>
            )}

            <input
                type="text"
                placeholder="Search players"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="player-list">
                {filteredPlayers.map((player, index) => (
                    <PlayerCard key={index} player={player} />
                ))}
            </div>
        </div>
    );
};

export default App;
