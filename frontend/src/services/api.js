import axios from 'axios';

// Create an Axios instance
const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Backend base URL
});

export default api;
