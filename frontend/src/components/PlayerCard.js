import React from 'react';

const PlayerCard = ({ player }) => {
    return (
        <div className="player-card">
            <h3>{player.name}</h3>
            <p>Team: {player.team}</p>
            <p>Position: {player.position}</p>
            <p>Points per Game: {player.points}</p>
            <p>Assists per Game: {player.assists}</p>
            <p>Games Played: {player.games}</p>
        </div>
    );
};

export default PlayerCard;
