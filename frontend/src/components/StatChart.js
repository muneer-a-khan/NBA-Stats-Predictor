import React from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const StatVisualizations = ({ stats, type = 'line' }) => {
    const renderLineChart = (data, title, dataKey) => (
        <div className="chart-container">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="season" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                        type="monotone" 
                        dataKey={dataKey} 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );

    const renderBarChart = (data, title, dataKey) => (
        <div className="chart-container">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="season" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey={dataKey} fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );

    const renderAreaChart = (data, title, dataKey) => (
        <div className="chart-container">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="season" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                        type="monotone" 
                        dataKey={dataKey} 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );

    const renderChart = (data, title, dataKey) => {
        switch (type) {
            case 'bar':
                return renderBarChart(data, title, dataKey);
            case 'area':
                return renderAreaChart(data, title, dataKey);
            default:
                return renderLineChart(data, title, dataKey);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {renderChart(stats, 'Points Per Game', 'points')}
            {renderChart(stats, 'Assists Per Game', 'assists')}
            {renderChart(stats, 'Rebounds Per Game', 'rebounds')}
            {renderChart(stats, 'Field Goal Percentage', 'fgPercentage')}
        </div>
    );
};

export default StatVisualizations;