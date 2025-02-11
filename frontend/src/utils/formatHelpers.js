// Format season to display as YYYY-YYYY (e.g., 2024-2025)
export const formatSeason = (season) => {
    if (!season) return 'N/A';
    const endYear = parseInt(season);
    const startYear = endYear - 1;
    return `${startYear}-${endYear}`;
};

// Format stat value with optional percentage
export const formatStat = (value, isPercentage = false) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    const formattedValue = parseFloat(value).toFixed(1);
    return isPercentage ? `${formattedValue}%` : formattedValue;
};

// Get current or most recent team for a player
export const getCurrentTeam = (seasons) => {
    if (!seasons || seasons.length === 0) return 'N/A';
    
    // Sort seasons by year in descending order
    const sortedSeasons = [...seasons].sort((a, b) => parseInt(b.season) - parseInt(a.season));
    
    // Return the team from the most recent season
    return sortedSeasons[0].team || 'N/A';
};
