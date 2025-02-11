import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import PlayerCard from '../components/PlayerCard';
import LoadingSpinner from '../components/LoadingSpinner';
import NBAStats from '../components/NBAStats';

const StatsPage = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchResults, setSearchResults] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const playerName = params.get('player');
        if (playerName) {
            handlePlayerSearch({ full_name: playerName });
        } else {
            fetchRandomPlayers();
        }
    }, [location]);

    const fetchRandomPlayers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/random-players');
            if (response.data) {
                setPlayers(response.data);
                setSearchResults(null);
            } else {
                setError('No players found');
            }
        } catch (err) {
            setError('Failed to fetch players. Please try again.');
            setPlayers([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePlayerSearch = async (player) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/players?name=${encodeURIComponent(player.full_name)}`);
            if (response.data && response.data.player) {
                setSearchResults(response.data.player);
            } else {
                setError('Player not found');
                setSearchResults(null);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to find player');
            setSearchResults(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex size-full min-h-screen flex-col bg-[#101923] overflow-x-hidden" style={{ fontFamily: '"Space Grotesk", "Noto Sans", sans-serif' }}>
            <div className="flex h-full grow flex-col">
                <div className="px-40 flex flex-1 justify-center py-5">
                    <div className="flex flex-col max-w-[960px] flex-1">
                        <div className="flex flex-wrap justify-between gap-3 p-4">
                            <p className="text-white text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
                                Explore NBA player stats
                            </p>
                        </div>

                        <div className="px-4 py-3">
                            <NBAStats onPlayerSearch={handlePlayerSearch} />
                        </div>

                        {error && (
                            <div className="text-[#e53e3e] text-center p-4">
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="flex justify-center p-8">
                                <LoadingSpinner />
                            </div>
                        ) : (
                            <>
                                {searchResults ? (
                                    <div className="p-4">
                                        <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-4">
                                            Player Details
                                        </h3>
                                        <PlayerCard player={searchResults} isSearched />
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
                                            Featured players
                                        </h3>
                                        <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
                                            {players.map((player) => (
                                                <div
                                                    key={player.id}
                                                    className="flex flex-1 gap-3 rounded-lg border border-[#314b68] bg-[#182534] p-4 items-center cursor-pointer hover:bg-[#223449] transition-colors"
                                                    onClick={() => handlePlayerSearch(player)}
                                                >
                                                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 shrink-0 bg-[#223449]" />
                                                    <h2 className="text-white text-base font-bold leading-tight">
                                                        {player.full_name}
                                                    </h2>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsPage;