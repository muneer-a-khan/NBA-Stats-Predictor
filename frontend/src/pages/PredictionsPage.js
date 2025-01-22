import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import api from '../services/api';

const PredictionForm = ({ onPrediction }) => {
    const [playerName, setPlayerName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [predictions, setPredictions] = useState(null);
    const [historicalStats, setHistoricalStats] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!playerName.trim()) return;

        setLoading(true);
        setError(null);

        try {
            // First fetch historical stats
            const statsResponse = await api.get(`/players/search/${encodeURIComponent(playerName)}`);
            const historicalData = statsResponse.data.player.stats.map(stat => ({
                season: stat.SEASON_ID,
                points: stat.PTS,
                assists: stat.AST,
                rebounds: stat.REB
            }));
            setHistoricalStats(historicalData);

            // Then get predictions
            const predictionResponse = await api.post('/predictions/generate', {
                playerName,
                historicalStats: historicalData
            });

            const predictionData = predictionResponse.data;
            setPredictions(predictionData);
            onPrediction && onPrediction(predictionData);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to get predictions');
        } finally {
            setLoading(false);
        }
    };

    const renderChart = (data, dataKey, title) => {
        if (!data || data.length === 0) return null;

        return (
            <div className="stats-chart mb-8">
                <h3 className="text-lg font-semibold mb-4">{title}</h3>
                <div className="h-64 w-full">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="season" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                            type="monotone" 
                            dataKey={dataKey} 
                            stroke="#8884d8" 
                            name="Historical"
                            strokeWidth={2}
                        />
                        {predictions && (
                            <Line 
                                type="monotone" 
                                dataKey={`predicted${dataKey.charAt(0).toUpperCase() + dataKey.slice(1)}`}
                                stroke="#82ca9d" 
                                name="Predicted"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                            />
                        )}
                    </LineChart>
                </div>
            </div>
        );
    };

    return (
        <div className="prediction-form max-w-4xl mx-auto p-6">
            <form onSubmit={handleSubmit} className="mb-8">
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Enter player name"
                        className="flex-1 p-2 border rounded"
                        disabled={loading}
                    />
                    <button 
                        type="submit" 
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Get Prediction'}
                    </button>
                </div>
            </form>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {predictions && (
                <div className="predictions-results bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-bold mb-6">Prediction Results</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="stat-card bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">Points</h3>
                            <p className="text-3xl font-bold text-blue-600">
                                {predictions.predictedPoints.toFixed(1)}
                            </p>
                        </div>
                        <div className="stat-card bg-green-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">Assists</h3>
                            <p className="text-3xl font-bold text-green-600">
                                {predictions.predictedAssists.toFixed(1)}
                            </p>
                        </div>
                        <div className="stat-card bg-purple-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">Rebounds</h3>
                            <p className="text-3xl font-bold text-purple-600">
                                {predictions.predictedRebounds.toFixed(1)}
                            </p>
                        </div>
                    </div>

                    <div className="charts">
                        {renderChart(historicalStats, 'points', 'Points Trend')}
                        {renderChart(historicalStats, 'assists', 'Assists Trend')}
                        {renderChart(historicalStats, 'rebounds', 'Rebounds Trend')}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PredictionForm;