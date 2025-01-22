const calculateAverages = (stats) => {
    if (!stats || stats.length === 0) return {};

    const validStats = stats.filter(stat => 
        !Object.values(stat).some(val => 
            val === null || val === undefined || isNaN(val)
        )
    );

    if (validStats.length === 0) return {};

    const totals = validStats.reduce((acc, stat) => {
        Object.keys(stat).forEach(key => {
            if (typeof stat[key] === 'number') {
                acc[key] = (acc[key] || 0) + stat[key];
            }
        });
        return acc;
    }, {});

    return Object.keys(totals).reduce((acc, key) => {
        acc[key] = totals[key] / validStats.length;
        return acc;
    }, {});
};

const calculateTrends = (stats) => {
    if (!stats || stats.length < 2) return {};

    const sortedStats = [...stats].sort((a, b) => 
        parseInt(a.season_id) - parseInt(b.season_id)
    );

    const trends = {};
    const statKeys = ['PTS', 'AST', 'REB', 'STL', 'BLK', 'FG_PCT', 'FG3_PCT', 'FT_PCT'];

    statKeys.forEach(key => {
        const values = sortedStats.map(stat => stat[key]).filter(val => !isNaN(val));
        if (values.length < 2) return;

        const differences = [];
        for (let i = 1; i < values.length; i++) {
            differences.push(values[i] - values[i - 1]);
        }

        const averageChange = differences.reduce((a, b) => a + b, 0) / differences.length;
        const trend = {
            direction: averageChange > 0 ? 'increasing' : 'decreasing',
            magnitude: Math.abs(averageChange),
            percentage: (averageChange / values[0]) * 100
        };

        trends[key] = trend;
    });

    return trends;
};

const calculatePerGameStats = (stats) => {
    if (!stats || !stats.GP) return {};

    const perGameStats = {};
    const statsToConvert = ['PTS', 'AST', 'REB', 'STL', 'BLK'];

    statsToConvert.forEach(key => {
        if (stats[key]) {
            perGameStats[key] = stats[key] / stats.GP;
        }
    });

    return perGameStats;
};

const calculateCareerHighs = (stats) => {
    if (!stats || stats.length === 0) return {};

    const careerHighs = {};
    const statsToTrack = ['PTS', 'AST', 'REB', 'STL', 'BLK', 'FG_PCT', 'FG3_PCT', 'FT_PCT'];

    statsToTrack.forEach(key => {
        const validValues = stats
            .map(stat => stat[key])
            .filter(val => !isNaN(val) && val !== null);

        if (validValues.length > 0) {
            careerHighs[key] = Math.max(...validValues);
        }
    });

    return careerHighs;
};

module.exports = {
    calculateAverages,
    calculateTrends,
    calculatePerGameStats,
    calculateCareerHighs
};