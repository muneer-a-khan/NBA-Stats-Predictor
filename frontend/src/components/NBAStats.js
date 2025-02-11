import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { formatSeason, formatStat, getCurrentTeam } from '../utils/formatHelpers';

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
        <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
    </svg>
);

const NBAStats = () => {
    const [playerName, setPlayerName] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);
    const searchContainerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = async (searchTerm) => {
        try {
            if (!searchTerm.trim()) {
                setSuggestions([]);
                setShowSuggestions(false);
                return;
            }

            const response = await api.get(`/players/search-suggestions?term=${encodeURIComponent(searchTerm)}`);
            setSuggestions(response.data);
            setShowSuggestions(true);
        } catch (err) {
            console.error('Error fetching suggestions:', err);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleInputChange = async (e) => {
        const value = e.target.value;
        setPlayerName(value);
        await fetchSuggestions(value);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            fetchStats();
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setPlayerName(suggestion.name);
        setShowSuggestions(false);
        fetchStats(suggestion.name);
    };

    const fetchStats = async (name = playerName) => {
        try {
            if (!name.trim()) {
                setError('Please enter a player name');
                setStats(null);
                return;
            }

            const response = await api.get(`/players?name=${encodeURIComponent(name)}`);
            if (response.data && response.data.player) {
                if (response.data.player.seasons) {
                    response.data.player.seasons.sort((a, b) => parseInt(b.season) - parseInt(a.season));
                }
                setStats(response.data);
                setError(null);
            } else {
                setError('No player found with that name.');
                setStats(null);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
            setError('Failed to fetch player stats. Please try again.');
            setStats(null);
        }
    };

    const renderCareerStats = () => {
        if (!stats?.player?.career_averages) return null;
        
        const ca = stats.player.career_averages;
        return (
            <div className="mt-8 bg-[#182534] rounded-lg p-6 border border-[#314b68]">
                <h4 className="text-white text-lg font-bold mb-4">Career Averages</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-white">
                        <thead>
                            <tr className="border-b border-[#314b68]">
                                <th className="pb-2">PPG</th>
                                <th className="pb-2">APG</th>
                                <th className="pb-2">RPG</th>
                                <th className="pb-2">FG%</th>
                                <th className="pb-2">3P%</th>
                                <th className="pb-2">FT%</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="text-center">
                                <td className="pt-2">{formatStat(ca.career_ppg)}</td>
                                <td className="pt-2">{formatStat(ca.career_apg)}</td>
                                <td className="pt-2">{formatStat(ca.career_rpg)}</td>
                                <td className="pt-2">{formatStat(ca.career_fg_pct * 100, true)}</td>
                                <td className="pt-2">{formatStat(ca.career_fg3_pct * 100, true)}</td>
                                <td className="pt-2">{formatStat(ca.career_ft_pct * 100, true)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderSeasonStats = () => {
        if (!stats?.player?.seasons) return null;

        const currentTeam = getCurrentTeam(stats.player.seasons);

        return (
            <div className="mt-8 bg-[#182534] rounded-lg p-6 border border-[#314b68]">
                <h3 className="text-white text-2xl font-bold mb-2">{stats.player.full_name}</h3>
                <div className="text-[#90abcb] mb-6">
                    <p>Position: {stats.player.position || 'N/A'}</p>
                    <p>Current Team: {currentTeam}</p>
                </div>
                {renderCareerStats()}
                <h4 className="text-white text-lg font-bold mt-8 mb-4">Season Stats</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-white">
                        <thead>
                            <tr className="border-b border-[#314b68]">
                                <th className="pb-2">Season</th>
                                <th className="pb-2">Team</th>
                                <th className="pb-2">Games</th>
                                <th className="pb-2">PPG</th>
                                <th className="pb-2">APG</th>
                                <th className="pb-2">RPG</th>
                                <th className="pb-2">FG%</th>
                                <th className="pb-2">3P%</th>
                                <th className="pb-2">FT%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.player.seasons.map((season, index) => (
                                <tr key={index} className="text-center border-b border-[#314b68]/30">
                                    <td className="py-2">{formatSeason(season.season)}</td>
                                    <td className="py-2">{season.team}</td>
                                    <td className="py-2">{season.games}</td>
                                    <td className="py-2">{formatStat(season.pts_per_game)}</td>
                                    <td className="py-2">{formatStat(season.ast_per_game)}</td>
                                    <td className="py-2">{formatStat(season.reb_per_game)}</td>
                                    <td className="py-2">{formatStat(season.fg_percent * 100, true)}</td>
                                    <td className="py-2">{formatStat(season.fg3_percent * 100, true)}</td>
                                    <td className="py-2">{formatStat(season.ft_percent * 100, true)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="nba-stats">
            <div className="flex min-h-[480px] flex-col gap-6 bg-cover bg-center bg-no-repeat items-start justify-end px-4 pb-10 rounded-xl" 
                style={{
                    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("https://cdn.usegalileo.ai/sdxl10/26209e49-8f36-4da5-9485-e0f54a6f05c3.png")'
                }}>
                <div className="flex flex-col gap-2 text-left">
                    <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                        NBA Player Stats
                    </h1>
                    <h2 className="text-white text-base font-normal leading-normal">
                        Search for any NBA player to view their career and season statistics
                    </h2>
                </div>
                <label className="flex flex-col min-w-40 h-14 w-full max-w-[480px]">
                    <div className="flex w-full flex-1 items-stretch rounded-xl h-full relative" ref={searchContainerRef}>
                        <div className="text-[#90abcb] flex border border-[#314b68] bg-[#182534] items-center justify-center pl-[15px] rounded-l-xl border-r-0">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            value={playerName}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder="Search a player"
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-0 border border-[#314b68] bg-[#182534] focus:border-[#314b68] h-full placeholder:text-[#90abcb] px-[15px] rounded-r-none border-r-0 pr-2 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                            autoComplete="off"
                        />
                        <div className="flex items-center justify-center rounded-r-xl border-l-0 border border-[#314b68] bg-[#182534] pr-[7px]">
                            <button
                                onClick={() => fetchStats()}
                                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#1c80f2] text-white text-sm font-bold leading-normal tracking-[0.015em]"
                            >
                                <span className="truncate">Search</span>
                            </button>
                        </div>
                        {showSuggestions && suggestions.length > 0 && (
                            <ul className="absolute top-full left-0 right-0 mt-2 bg-[#182534] border border-[#314b68] rounded-lg overflow-hidden z-50">
                                {suggestions.map((suggestion) => (
                                    <li
                                        key={suggestion.id}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="px-4 py-3 text-white hover:bg-[#223449] cursor-pointer transition-colors"
                                    >
                                        {suggestion.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </label>
            </div>
            {error && <div className="text-[#e53e3e] text-center mt-4">{error}</div>}
            {stats && renderSeasonStats()}
        </div>
    );
};

export default NBAStats;