import React, { useState } from 'react';
import PredictionForm from '../components/PredictionForm';

const PredictionsPage = () => {
    const [prediction, setPrediction] = useState(null);

    return (
        <div className="predictions-page">
            <h1>NBA Predictions</h1>
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
        </div>
    );
};

export default PredictionsPage;
