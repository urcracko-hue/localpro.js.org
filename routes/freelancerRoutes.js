const express = require('express');
const router = express.Router();
const Freelancer = require('../models/Freelancer');
const { professions, getProfessionById } = require('../utils/professions');

// Get all professions
router.get('/professions', (req, res) => {
    try {
        res.json({
            success: true,
            data: professions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Register a new freelancer
router.post('/register', async (req, res) => {
    try {
        const { fullName, profession, phoneNumber, location, experience, rupeesPerHour } = req.body;

        // Validate required fields
        if (!fullName || !profession || !phoneNumber || !location || experience === undefined || !rupeesPerHour) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate rupees per hour
        if (rupeesPerHour > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Rate cannot exceed ₹1000 per hour'
            });
        }

        if (rupeesPerHour < 50) {
            return res.status(400).json({
                success: false,
                message: 'Rate must be at least ₹50 per hour'
            });
        }

        // Check for existing phone number
        const existingFreelancer = await Freelancer.findOne({ phoneNumber });
        if (existingFreelancer) {
            return res.status(400).json({
                success: false,
                message: 'This phone number is already registered'
            });
        }

        // Validate profession
        const professionData = getProfessionById(profession);
        if (!professionData) {
            return res.status(400).json({
                success: false,
                message: 'Invalid profession selected'
            });
        }

        // Create freelancer with auto profile picture
        const freelancer = new Freelancer({
            fullName,
            profession,
            phoneNumber,
            location: {
                city: location.city,
                area: location.area,
                coordinates: {
                    latitude: parseFloat(location.latitude) || 0,
                    longitude: parseFloat(location.longitude) || 0
                }
            },
            experience: parseInt(experience),
            rupeesPerHour: parseInt(rupeesPerHour),
            profilePicture: professionData.icon
        });

        await freelancer.save();

        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            data: freelancer
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'This phone number is already registered'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Search freelancers
router.get('/search', async (req, res) => {
    try {
        const { profession, latitude, longitude, radius = 10, page = 1, limit = 20 } = req.query;

        let query = { isActive: true };

        // Filter by profession
        if (profession && profession !== 'all') {
            query.profession = profession;
        }

        let freelancers;
        
        // If coordinates are provided, use geospatial query
        if (latitude && longitude) {
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            const radiusInKm = parseFloat(radius);

            // Get all freelancers and calculate distance
            freelancers = await Freelancer.find(query).lean();

            // Calculate distance for each freelancer
            freelancers = freelancers.map(f => {
                const distance = calculateDistance(
                    lat, lng,
                    f.location.coordinates.latitude,
                    f.location.coordinates.longitude
                );
                return { ...f, distance };
            });

            // Filter by radius
            freelancers = freelancers.filter(f => f.distance <= radiusInKm);

            // Sort by distance
            freelancers.sort((a, b) => a.distance - b.distance);

        } else {
            freelancers = await Freelancer.find(query)
                .sort({ createdAt: -1 })
                .lean();
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedResults = freelancers.slice(startIndex, endIndex);

        // Add profession details
        const resultsWithDetails = paginatedResults.map(f => {
            const professionData = getProfessionById(f.profession);
            return {
                ...f,
                professionDetails: professionData
            };
        });

        res.json({
            success: true,
            data: resultsWithDetails,
            pagination: {
                total: freelancers.length,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(freelancers.length / limit)
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get single freelancer
router.get('/:id', async (req, res) => {
    try {
        const freelancer = await Freelancer.findById(req.params.id);
        
        if (!freelancer) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer not found'
            });
        }

        const professionData = getProfessionById(freelancer.profession);

        res.json({
            success: true,
            data: {
                ...freelancer.toObject(),
                professionDetails: professionData
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

module.exports = router;