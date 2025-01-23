import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

const PredictionForm = () => {
  const [playerName, setPlayerName] = useState('');
  const [selectedStat, setSelectedStat] = useState('points');
  const [season, setSeason] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Mock prediction for now
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      setPrediction({
        playerName,
        stat: selectedStat,
        season,
        predictedValue: Math.random() * 30 + 10
      });
    } catch (err) {
      setError('Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">NBA Stats Predictor</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Player Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Enter player name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statistic to Predict
          </label>
          <select
            value={selectedStat}
            onChange={(e) => setSelectedStat(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="points">Points per Game</option>
            <option value="assists">Assists per Game</option>
            <option value="rebounds">Rebounds per Game</option>
            <option value="steals">Steals per Game</option>
            <option value="blocks">Blocks per Game</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Season to Predict
          </label>
          <select
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() + i;
              return (
                <option key={year} value={year}>
                  {year}-{(year + 1).toString().slice(2)}
                </option>
              );
            })}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 
                     disabled:bg-blue-300 transition-colors duration-200"
        >
          {loading ? 'Generating Prediction...' : 'Get Prediction'}
        </button>
      </form>

      {loading && <LoadingSpinner text="Generating prediction..." />}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}

      {prediction && !loading && (
        <div className="mt-6 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Prediction Results</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Player:</span> {prediction.playerName}</p>
            <p><span className="font-medium">Statistic:</span> {prediction.stat}</p>
            <p><span className="font-medium">Season:</span> {prediction.season}-{(prediction.season + 1).toString().slice(2)}</p>
            <p className="text-2xl font-bold text-blue-600 mt-4">
              Predicted {prediction.stat}: {prediction.predictedValue.toFixed(1)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionForm;