const mongoose = require('mongoose');

const freelancerSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    profession: {
        type: String,
        required: [true, 'Profession is required'],
        trim: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        validate: {
            validator: function(v) {
                return /^[6-9]\d{9}$/.test(v);
            },
            message: 'Please enter a valid 10-digit Indian phone number'
        }
    },
    location: {
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true
        },
        area: {
            type: String,
            required: [true, 'Area is required'],
            trim: true
        },
        coordinates: {
            latitude: {
                type: Number,
                required: true,
                min: -90,
                max: 90
            },
            longitude: {
                type: Number,
                required: true,
                min: -180,
                max: 180
            }
        }
    },
    experience: {
        type: Number,
        required: [true, 'Experience is required'],
        min: [0, 'Experience cannot be negative'],
        max: [50, 'Experience cannot exceed 50 years']
    },
    rupeesPerHour: {
        type: Number,
        required: [true, 'Rate per hour is required'],
        min: [50, 'Minimum rate is ₹50 per hour'],
        max: [1000, 'Maximum rate is ₹1000 per hour']
    },
    profilePicture: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for geospatial queries
freelancerSchema.index({ 'location.coordinates': '2dsphere' });

// Index for search
freelancerSchema.index({ profession: 'text', 'location.city': 'text', 'location.area': 'text' });

// Update timestamp on save
freelancerSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for display name
freelancerSchema.virtual('displayLocation').get(function() {
    return `${this.location.area}, ${this.location.city}`;
});

// Ensure virtuals are included in JSON
freelancerSchema.set('toJSON', { virtuals: true });
freelancerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Freelancer', freelancerSchema);