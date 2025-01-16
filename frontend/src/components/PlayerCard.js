import React from 'react';

const PlayerCard = ({ player }) => {
    return (
        <div className="player-card">
            <h3>{player.name}</h3>
            <p>Team: {player.team}</p>
            <p>Position: {player.position}</p>
        </div>
    );
};

export default PlayerCard;
