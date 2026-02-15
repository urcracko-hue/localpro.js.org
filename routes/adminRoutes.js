const express = require('express');
const router = express.Router();
const Freelancer = require('../models/Freelancer');
const { professions } = require('../utils/professions');

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '@Local2011';

// Middleware to verify admin passcode
const verifyAdmin = (req, res, next) => {
    const passcode = req.headers['x-admin-passcode'] || req.body.passcode;
    
    if (passcode !== ADMIN_PASSCODE) {
        return res.status(401).json({
            success: false,
            message: 'Invalid admin passcode'
        });
    }
    next();
};

// Verify passcode
router.post('/verify', (req, res) => {
    const { passcode } = req.body;
    
    if (passcode === ADMIN_PASSCODE) {
        res.json({
            success: true,
            message: 'Access granted'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid passcode'
        });
    }
});

// Get all freelancers (admin)
router.get('/freelancers', verifyAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50, status, profession, search } = req.query;

        let query = {};

        if (status === 'active') query.isActive = true;
        if (status === 'inactive') query.isActive = false;
        if (status === 'verified') query.isVerified = true;
        if (status === 'unverified') query.isVerified = false;

        if (profession && profession !== 'all') {
            query.profession = profession;
        }

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
                { 'location.city': { $regex: search, $options: 'i' } },
                { 'location.area': { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Freelancer.countDocuments(query);
        const freelancers = await Freelancer.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: freelancers,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get dashboard stats
router.get('/stats', verifyAdmin, async (req, res) => {
    try {
        const totalFreelancers = await Freelancer.countDocuments();
        const activeFreelancers = await Freelancer.countDocuments({ isActive: true });
        const verifiedFreelancers = await Freelancer.countDocuments({ isVerified: true });

        // Get profession distribution
        const professionStats = await Freelancer.aggregate([
            { $group: { _id: '$profession', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Get city distribution
        const cityStats = await Freelancer.aggregate([
            { $group: { _id: '$location.city', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Recent registrations (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentRegistrations = await Freelancer.countDocuments({
            createdAt: { $gte: weekAgo }
        });

        res.json({
            success: true,
            data: {
                totalFreelancers,
                activeFreelancers,
                verifiedFreelancers,
                recentRegistrations,
                professionStats,
                cityStats
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update freelancer status
router.patch('/freelancers/:id', verifyAdmin, async (req, res) => {
    try {
        const { isActive, isVerified } = req.body;
        
        const updateData = {};
        if (typeof isActive === 'boolean') updateData.isActive = isActive;
        if (typeof isVerified === 'boolean') updateData.isVerified = isVerified;

        const freelancer = await Freelancer.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!freelancer) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer not found'
            });
        }

        res.json({
            success: true,
            message: 'Freelancer updated successfully',
            data: freelancer
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete freelancer
router.delete('/freelancers/:id', verifyAdmin, async (req, res) => {
    try {
        const freelancer = await Freelancer.findByIdAndDelete(req.params.id);

        if (!freelancer) {
            return res.status(404).json({
                success: false,
                message: 'Freelancer not found'
            });
        }

        res.json({
            success: true,
            message: 'Freelancer deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;