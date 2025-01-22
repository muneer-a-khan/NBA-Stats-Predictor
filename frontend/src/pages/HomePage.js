import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PlayerCard from '../components/PlayerCard';

const HomePage = () => {
    const [randomPlayers, setRandomPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRandomPlayers();
    }, []);

    const fetchRandomPlayers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/players/random');
            setRandomPlayers(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch random players');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">NBA Stats Predictor</h1>
                <p className="text-xl text-gray-600 mb-8">
                    Explore NBA player statistics and predict future performance
                </p>
                <div className="flex justify-center gap-4">
                    <Link 
                        to="/stats" 
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                    >
                        View Stats
                    </Link>
                    <Link 
                        to="/predictions" 
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                    >
                        Make Predictions
                    </Link>
                </div>
            </div>

            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Featured Players</h2>
                    <button 
                        onClick={fetchRandomPlayers}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8">Loading...</div>
                ) : error ? (
                    <div className="text-center text-red-600 py-8">{error}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {randomPlayers.map((player) => (
                            <Link 
                                key={player.id}
                                to={`/stats?player=${encodeURIComponent(player.full_name)}`}
                                className="transform hover:scale-105 transition-transform duration-200"
                            >
                                <PlayerCard player={player} />
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-gray-50 rounded-xl p-8 mt-12">
                <h2 className="text-2xl font-bold mb-4">About NBA Stats Predictor</h2>
                <p className="text-gray-600">
                    NBA Stats Predictor uses advanced analytics and machine learning to provide 
                    detailed statistics and predictions for NBA players. Explore career trends, 
                    compare players, and get insights into future performance predictions.
                </p>
            </div>
        </div>
    );
};

export default HomePage;