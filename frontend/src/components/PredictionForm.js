import React, { useState } from 'react';

const PredictionForm = () => {
    const [playerName, setPlayerName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Player name submitted:', playerName);
        // API call will be added later
    };

    return (
        <div>
            <h2>Predict Player Stats</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter player name"
                />
                <button type="submit">Get Prediction</button>
            </form>
        </div>
    );
};

export default PredictionForm;
