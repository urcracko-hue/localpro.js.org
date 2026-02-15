const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const freelancerRoutes = require('./routes/freelancerRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/freelancers', freelancerRoutes);
app.use('/api/admin', adminRoutes);

// Serve main pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/search', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'search.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/freelancer/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'freelancer-detail.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!',
        error: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════════╗
    ║                                                       ║
    ║   🔧 Local Freelancer Platform is running!            ║
    ║                                                       ║
    ║   🌐 Server: http://localhost:${PORT}                    ║
    ║   📝 Register: http://localhost:${PORT}/register         ║
    ║   🔍 Search: http://localhost:${PORT}/search             ║
    ║   🔐 Admin: http://localhost:${PORT}/admin               ║
    ║                                                       ║
    ╚═══════════════════════════════════════════════════════╝
    `);
});

module.exports = app;