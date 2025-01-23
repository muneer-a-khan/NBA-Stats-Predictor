import React, { useState } from 'react';
import PredictionForm from '../components/PredictionForm';
import LoadingSpinner from '../components/LoadingSpinner';

const PredictionsPage = () => {
    const [prediction, setPrediction] = useState(null);

    const handlePrediction = (predData) => {
        setPrediction(predData);
    };

    return (
        <div className="predictions-page max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-center mb-8">NBA Stats Predictor</h1>
            <div className="mb-8">
                <PredictionForm onPrediction={handlePrediction} />
            </div>

            {prediction && (
                <div className="prediction-results mt-8 bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-bold mb-6">Analysis Results</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="stat-card bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold">Points</h3>
                            <p className="text-2xl font-bold text-blue-600">
                                {prediction.predictedPoints?.toFixed(2)}
                            </p>
                        </div>
                        <div className="stat-card bg-green-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold">Assists</h3>
                            <p className="text-2xl font-bold text-green-600">
                                {prediction.predictedAssists?.toFixed(2)}
                            </p>
                        </div>
                        <div className="stat-card bg-purple-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold">Games</h3>
                            <p className="text-2xl font-bold text-purple-600">
                                {prediction.predictedGames?.toFixed(0)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PredictionsPage;