import React, { useEffect, useState } from 'react';
import api from './services/api'; // Ensure this matches your setup
import './styles/App.css';
import PlayerCard from './components/PlayerCard';

const App = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const response = await api.get('/players'); // Fetch players from backend
                setPlayers(response.data); // Update state with fetched data
            } catch (error) {
                setError('Failed to catch player data.');
            }
            finally{
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
          <div className="player-list">
              {players.map((player, index) => (
                  <PlayerCard key={index} player={player} />
              ))}
          </div>
      </div>
  );
};

export default App;
