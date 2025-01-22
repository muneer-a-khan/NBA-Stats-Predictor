import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import StatsPage from './pages/StatsPage';
import PredictionsPage from './pages/PredictionsPage';
import './styles/App.css';

const App = () => {
    return (
        <div>
            <Navbar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/predictions" element={<PredictionsPage />} />
            </Routes>
        </div>
    );
};

export default App;
