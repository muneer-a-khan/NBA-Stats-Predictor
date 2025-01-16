import React, { useEffect, useState } from 'react';
import api from './services/api'; // Ensure this matches your setup
import './styles/App.css';
import PlayerCard from './components/PlayerCard';
import PredictionForm from './components/PredictionForm';

const App = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for prediction results
    const [prediction, setPrediction] = useState(null);

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const response = await api.get('/players'); // Fetch players from backend
                setPlayers(response.data); // Update state with fetched data
            } catch (error) {
                setError('Failed to catch player data.');
            } finally {
                setLoading(false);
            }
        };

        fetchPlayers();
    }, []);

    if (loading) return <p>Loading players...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h1>NFL & NBA Stats Predictor</h1>
            
            {/* Add PredictionForm Component */}
            <PredictionForm onPrediction={setPrediction} />
            
            {/* Show Prediction Results */}
            {prediction && (
                <div>
                    <h2>Prediction Results</h2>
                    <p>Player: {prediction.playerName}</p>
                    <p>Predicted Points: {prediction.predictedPoints.toFixed(2)}</p>
                    <p>Predicted Assists: {prediction.predictedAssists.toFixed(2)}</p>
                    <p>Predicted Games: {prediction.predictedGames.toFixed(2)}</p>
                </div>
            )}

            {/* Player List */}
            <div className="player-list">
                {players.map((player, index) => (
                    <PlayerCard key={index} player={player} />
                ))}
            </div>
        </div>
    );
};

export default App;
