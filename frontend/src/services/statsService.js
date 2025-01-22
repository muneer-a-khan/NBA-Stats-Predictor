import api from './api';

export const getPlayerStats = async (playerId, year = null) => {
    try {
        const endpoint = year 
            ? `/stats/${playerId}/${year}`
            : `/stats/${playerId}`;
        const response = await api.get(endpoint);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch player stats');
    }
};

export const getAdvancedStats = async (playerId) => {
    try {
        const response = await api.get(`/stats/advanced/${playerId}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch advanced stats');
    }
};

export const compareYears = async (playerId, year1, year2) => {
    try {
        const response = await api.get(`/stats/compare/${playerId}/${year1}/${year2}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to compare seasons');
    }
};

export const getPrediction = async (playerId) => {
    try {
        const response = await api.get(`/stats/predict/${playerId}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to generate prediction');
    }
};

export const getCareerTrends = async (playerId) => {
    try {
        const response = await api.get(`/stats/trends/${playerId}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch career trends');
    }
};

export const getSeasonalStats = async (playerId, season) => {
    try {
        const response = await api.get(`/stats/${playerId}/season/${season}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch seasonal stats');
    }
};