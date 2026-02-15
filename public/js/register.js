// Registration Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    loadProfessions();
    initForm();
    initLocationDetection();
});

// Navigation Toggle
function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

// Load Professions
async function loadProfessions() {
    const select = document.getElementById('profession');
    if (!select) return;

    try {
        const response = await fetch('/api/freelancers/professions');
        const data = await response.json();

        if (data.success) {
            // Group by category
            const categories = {};
            data.data.forEach(prof => {
                if (!categories[prof.category]) {
                    categories[prof.category] = [];
                }
                categories[prof.category].push(prof);
            });

            // Populate select
            Object.keys(categories).forEach(category => {
                const optgroup = document.createElement('optgroup');
                optgroup.label = category;
                
                categories[category].forEach(prof => {
                    const option = document.createElement('option');
                    option.value = prof.id;
                    option.textContent = prof.name;
                    option.dataset.icon = prof.icon;
                    optgroup.appendChild(option);
                });
                
                select.appendChild(optgroup);
            });

            // Update avatar on change
            select.addEventListener('change', updateAvatar);
        }
    } catch (error) {
        console.error('Error loading professions:', error);
    }
}

// Update Avatar based on Profession
function updateAvatar() {
    const select = document.getElementById('profession');
    const avatarPreview = document.getElementById('avatarPreview');
    
    if (!select || !avatarPreview) return;

    const selectedOption = select.options[select.selectedIndex];
    const icon = selectedOption.dataset.icon || '👤';
    
    avatarPreview.innerHTML = `<span class="avatar-placeholder">${icon}</span>`;
}

// Initialize Form
function initForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    // Validate rate input
    const rateInput = document.getElementById('rupeesPerHour');
    if (rateInput) {
        rateInput.addEventListener('input', function() {
            const value = parseInt(this.value);
            const errorElement = document.getElementById('rupeesPerHourError');
            
            if (value > 1000) {
                this.classList.add('error');
                errorElement.textContent = 'Maximum rate is ₹1000 per hour';
            } else if (value < 50 && this.value !== '') {
                this.classList.add('error');
                errorElement.textContent = 'Minimum rate is ₹50 per hour';
            } else {
                this.classList.remove('error');
                errorElement.textContent = '';
            }
        });
    }

    // Validate phone number
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 10);
            const errorElement = document.getElementById('phoneNumberError');
            
            if (this.value && !/^[6-9]/.test(this.value)) {
                this.classList.add('error');
                errorElement.textContent = 'Phone number must start with 6, 7, 8, or 9';
            } else {
                this.classList.remove('error');
                errorElement.textContent = '';
            }
        });
    }

    // Form submission
    form.addEventListener('submit', handleSubmit);
}

// Handle Form Submission
async function handleSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    // Validate all fields
    if (!validateForm()) {
        return;
    }

    // Get form data
    const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        profession: document.getElementById('profession').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        location: {
            city: document.getElementById('city').value.trim(),
            area: document.getElementById('area').value.trim(),
            latitude: parseFloat(document.getElementById('latitude').value) || 0,
            longitude: parseFloat(document.getElementById('longitude').value) || 0
        },
        experience: parseInt(document.getElementById('experience').value),
        rupeesPerHour: parseInt(document.getElementById('rupeesPerHour').value)
    };

    // Check rate limit
    if (formData.rupeesPerHour > 1000) {
        showError('rupeesPerHourError', 'Rate cannot exceed ₹1000 per hour');
        return;
    }

    // Show loading state
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-flex';
    submitBtn.disabled = true;

    try {
        const response = await fetch('/api/freelancers/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            // Show success modal
            document.getElementById('successModal').classList.add('show');
            form.reset();
            document.getElementById('avatarPreview').innerHTML = '<span class="avatar-placeholder">👤</span>';
            document.getElementById('coordinatesDisplay').style.display = 'none';
        } else {
            // Show error
            alert(data.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('An error occurred. Please try again.');
    } finally {
        // Reset button
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Validate Form
function validateForm() {
    let isValid = true;

    // Full Name
    const fullName = document.getElementById('fullName');
    if (!fullName.value.trim() || fullName.value.trim().length < 2) {
        showError('fullNameError', 'Please enter a valid name (at least 2 characters)');
        isValid = false;
    } else {
        clearError('fullNameError');
    }

    // Profession
    const profession = document.getElementById('profession');
    if (!profession.value) {
        showError('professionError', 'Please select a profession');
        isValid = false;
    } else {
        clearError('professionError');
    }

    // Phone Number
    const phoneNumber = document.getElementById('phoneNumber');
    if (!phoneNumber.value || !/^[6-9]\d{9}$/.test(phoneNumber.value)) {
        showError('phoneNumberError', 'Please enter a valid 10-digit phone number');
        isValid = false;
    } else {
        clearError('phoneNumberError');
    }

    // Location
    const city = document.getElementById('city');
    const area = document.getElementById('area');
    if (!city.value.trim() || !area.value.trim()) {
        showError('locationError', 'Please enter city and area');
        isValid = false;
    } else {
        clearError('locationError');
    }

    // Experience
    const experience = document.getElementById('experience');
    if (experience.value === '' || parseInt(experience.value) < 0 || parseInt(experience.value) > 50) {
        showError('experienceError', 'Please enter valid experience (0-50 years)');
        isValid = false;
    } else {
        clearError('experienceError');
    }

    // Rate
    const rupeesPerHour = document.getElementById('rupeesPerHour');
    const rate = parseInt(rupeesPerHour.value);
    if (!rupeesPerHour.value || rate < 50 || rate > 1000) {
        showError('rupeesPerHourError', 'Rate must be between ₹50 and ₹1000 per hour');
        isValid = false;
    } else {
        clearError('rupeesPerHourError');
    }

    return isValid;
}

// Show Error
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
    }
}

// Clear Error
function clearError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = '';
    }
}

// Initialize Location Detection
function initLocationDetection() {
    const detectBtn = document.getElementById('detectLocation');
    if (!detectBtn) return;

    detectBtn.addEventListener('click', function() {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        this.textContent = '🔄 Detecting...';
        this.disabled = true;

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Update hidden fields
                document.getElementById('latitude').value = lat;
                document.getElementById('longitude').value = lng;

                // Show coordinates
                const coordsDisplay = document.getElementById('coordinatesDisplay');
                const coordsText = document.getElementById('coordsText');
                coordsDisplay.style.display = 'block';
                coordsText.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

                // Try to get address from coordinates (reverse geocoding)
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
                    const data = await response.json();

                    if (data.address) {
                        const city = data.address.city || data.address.town || data.address.village || data.address.state_district || '';
                        const area = data.address.suburb || data.address.neighbourhood || data.address.road || '';

                        if (city) document.getElementById('city').value = city;
                        if (area) document.getElementById('area').value = area;
                    }
                } catch (error) {
                    console.log('Reverse geocoding failed:', error);
                }

                detectBtn.textContent = '✅ Location Detected';
                detectBtn.classList.add('active');
                detectBtn.disabled = false;
            },
            (error) => {
                console.error('Geolocation error:', error);
                detectBtn.textContent = '❌ Detection Failed';
                detectBtn.disabled = false;
                
                setTimeout(() => {
                    detectBtn.textContent = '📍 Detect My Location';
                    detectBtn.classList.remove('active');
                }, 2000);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    });
}