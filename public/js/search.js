// Search Page JavaScript

let currentPage = 1;
let totalPages = 1;
let userLocation = null;
let professions = [];

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    loadProfessions();
    initFilters();
    parseURLParams();
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
    const select = document.getElementById('professionFilter');
    if (!select) return;

    try {
        const response = await fetch('/api/freelancers/professions');
        const data = await response.json();

        if (data.success) {
            professions = data.data;

            // Populate select
            professions.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.id;
                option.textContent = `${prof.icon} ${prof.name}`;
                select.appendChild(option);
            });

            // Populate category filters
            populateCategoryFilters(data.data);
        }
    } catch (error) {
        console.error('Error loading professions:', error);
    }
}

// Populate Category Filters
function populateCategoryFilters(professions) {
    const container = document.getElementById('categoryFilters');
    if (!container) return;

    // Create quick filter buttons (top 8 professions)
    const popularProfs = professions.slice(0, 8);

    container.innerHTML = popularProfs.map(prof => `
        <button class="category-filter-btn" data-profession="${prof.id}">
            <span>${prof.icon}</span>
            <span>${prof.name}</span>
        </button>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.category-filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {

            const profession = this.dataset.profession; // ✅ FIXED

            const professionSelect = document.getElementById('professionFilter');
            if (professionSelect) {
                professionSelect.value = profession;
            }

            // Update active state
            container.querySelectorAll('.category-filter-btn')
                .forEach(b => b.classList.remove('active'));

            this.classList.add('active');

            currentPage = 1;
            searchFreelancers();
        });
    });
}


// Parse URL Parameters
function parseURLParams() {
    const params = new URLSearchParams(window.location.search);
    
    const profession = params.get('profession');
    const lat = params.get('lat');
    const lng = params.get('lng');

    if (profession) {
        document.getElementById('professionFilter').value = profession;
    }

    if (lat && lng) {
        userLocation = {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng)
        };
        updateLocationStatus(true);
    }

    // Initial search
    searchFreelancers();
}

// Initialize Filters
function initFilters() {
    const searchBtn = document.getElementById('searchBtn');
    const resetBtn = document.getElementById('resetFilters');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            currentPage = 1;
            searchFreelancers();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                searchFreelancers();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                searchFreelancers();
            }
        });
    }

    // Close modal
    const closeModal = document.getElementById('closeModal');
    const modal = document.getElementById('freelancerModal');
    
    if (closeModal && modal) {
        closeModal.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    }
}

// Initialize Location Detection
function initLocationDetection() {
    const locationBtn = document.getElementById('getLocationBtn');
    if (!locationBtn) return;

    locationBtn.addEventListener('click', function() {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        const statusSpan = document.getElementById('locationStatus');
        statusSpan.textContent = 'Detecting...';
        locationBtn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                userLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };

                updateLocationStatus(true);
                locationBtn.disabled = false;

                // Get location name
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${userLocation.latitude}&lon=${userLocation.longitude}&format=json`
                    );
                    const data = await response.json();
                    
                    if (data.address) {
                        const locationName = data.address.suburb || 
                                           data.address.neighbourhood || 
                                           data.address.city || 
                                           data.address.town || 
                                           'Your Location';
                        
                        document.getElementById('currentLocation').textContent = locationName;
                        document.getElementById('locationInfo').style.display = 'block';
                    }
                } catch (error) {
                    console.log('Reverse geocoding failed:', error);
                }

                // Auto search
                searchFreelancers();
            },
            (error) => {
                console.error('Geolocation error:', error);
                statusSpan.textContent = 'Failed - Try Again';
                locationBtn.disabled = false;
                locationBtn.classList.remove('active');
                
                setTimeout(() => {
                    statusSpan.textContent = 'Detect Location';
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

// Update Location Status
function updateLocationStatus(detected) {
    const locationBtn = document.getElementById('getLocationBtn');
    const statusSpan = document.getElementById('locationStatus');
    
    if (detected) {
        statusSpan.textContent = 'Location Set ✓';
        locationBtn.classList.add('active');
    } else {
        statusSpan.textContent = 'Detect Location';
        locationBtn.classList.remove('active');
    }
}

// Search Freelancers
async function searchFreelancers() {
    const resultsGrid = document.getElementById('resultsGrid');
    const loadingState = document.getElementById('loadingState');
    const noResults = document.getElementById('noResults');
    const pagination = document.getElementById('pagination');
    const resultsInfo = document.getElementById('resultsInfo');

    // Show loading
    resultsGrid.innerHTML = '';
    loadingState.style.display = 'block';
    noResults.style.display = 'none';
    pagination.style.display = 'none';

    // Build query params
    const params = new URLSearchParams();
    
    const profession = document.getElementById('professionFilter').value;
    const radius = document.getElementById('radiusFilter').value;

    if (profession && profession !== 'all') {
        params.set('profession', profession);
    }

    if (userLocation) {
        params.set('latitude', userLocation.latitude);
        params.set('longitude', userLocation.longitude);
        params.set('radius', radius);
    }

    params.set('page', currentPage);
    params.set('limit', 12);

    try {
        const response = await fetch(`/api/freelancers/search?${params.toString()}`);
        const data = await response.json();

        loadingState.style.display = 'none';

        if (data.success && data.data.length > 0) {
            displayResults(data.data);
            
            // Update pagination
            totalPages = data.pagination.pages;
            if (totalPages > 1) {
                pagination.style.display = 'flex';
                document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
                document.getElementById('prevPage').disabled = currentPage === 1;
                document.getElementById('nextPage').disabled = currentPage === totalPages;
            }

            // Update results info
            resultsInfo.innerHTML = `<span id="resultsCount">Found ${data.pagination.total} professional${data.pagination.total !== 1 ? 's' : ''}</span>`;
        } else {
            noResults.style.display = 'block';
            resultsInfo.innerHTML = '<span id="resultsCount">No results found</span>';
        }
    } catch (error) {
        console.error('Search error:', error);
        loadingState.style.display = 'none';
        resultsGrid.innerHTML = '<p class="error-message">Error loading results. Please try again.</p>';
    }
}

// Display Results
function displayResults(freelancers) {
    const resultsGrid = document.getElementById('resultsGrid');
    
    resultsGrid.innerHTML = freelancers.map(freelancer => {
        const professionData = freelancer.professionDetails || {};
        const distanceText = freelancer.distance !== undefined 
            ? formatDistance(freelancer.distance) 
            : '';
        
        return `
            <div class="freelancer-card" onclick="showFreelancerDetail('${freelancer._id}')">
                <div class="card-header">
                    <div class="card-avatar">${freelancer.profilePicture || professionData.icon || '👤'}</div>
                    <div class="card-title">
                        <div class="card-name">${escapeHtml(freelancer.fullName)}</div>
                        <div class="card-profession">
                            ${professionData.icon || ''} ${professionData.name || freelancer.profession}
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-info">
                        <div class="info-item">
                            <span class="info-icon">📍</span>
                            <span>${escapeHtml(freelancer.location.area)}, ${escapeHtml(freelancer.location.city)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-icon">⏱️</span>
                            <span>${freelancer.experience} year${freelancer.experience !== 1 ? 's' : ''} experience</span>
                        </div>
                        ${freelancer.isVerified ? '<div class="verified-badge">✓ Verified</div>' : ''}
                    </div>
                    <div class="card-footer">
                        <div class="card-rate">₹${freelancer.rupeesPerHour} <span>/hour</span></div>
                        ${distanceText ? `<div class="card-distance">📍 ${distanceText}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Show Freelancer Detail
async function showFreelancerDetail(id) {
    const modal = document.getElementById('freelancerModal');
    const detailContainer = document.getElementById('freelancerDetail');
    
    modal.classList.add('show');
    detailContainer.innerHTML = '<div class="loading-state"><div class="loader"></div><p>Loading...</p></div>';

    try {
        const response = await fetch(`/api/freelancers/${id}`);
        const data = await response.json();

        if (data.success) {
            const freelancer = data.data;
            const professionData = freelancer.professionDetails || {};

            detailContainer.innerHTML = `
                <div class="detail-header">
                    <div class="detail-avatar">${freelancer.profilePicture || professionData.icon || '👤'}</div>
                    <div class="detail-name">${escapeHtml(freelancer.fullName)}</div>
                    <div class="detail-profession">
                        ${professionData.icon || ''} ${professionData.name || freelancer.profession}
                        ${freelancer.isVerified ? '<span class="verified-badge">✓ Verified</span>' : ''}
                    </div>
                </div>
                <div class="detail-body">
                    <div class="detail-info">
                        <div class="detail-item">
                            <div class="detail-label">Experience</div>
                            <div class="detail-value">${freelancer.experience} Years</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Rate</div>
                            <div class="detail-value">₹${freelancer.rupeesPerHour}/hr</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Location</div>
                            <div class="detail-value">${escapeHtml(freelancer.location.area)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">City</div>
                            <div class="detail-value">${escapeHtml(freelancer.location.city)}</div>
                        </div>
                    </div>
                    <a href="tel:+91${freelancer.phoneNumber}" class="contact-btn">
                        📞 Call +91 ${formatPhoneNumber(freelancer.phoneNumber)}
                    </a>
                </div>
            `;
        } else {
            detailContainer.innerHTML = '<p class="error-message">Error loading profile</p>';
        }
    } catch (error) {
        console.error('Error loading freelancer:', error);
        detailContainer.innerHTML = '<p class="error-message">Error loading profile</p>';
    }
}

// Reset Filters
function resetFilters() {
    document.getElementById('professionFilter').value = 'all';
    document.getElementById('radiusFilter').value = '10';
    
    const categoryBtns = document.querySelectorAll('.category-filter-btn');
    categoryBtns.forEach(btn => btn.classList.remove('active'));
    
    currentPage = 1;
    searchFreelancers();
}

// Utility Functions
function formatDistance(km) {
    if (km < 1) {
        return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
}

function formatPhoneNumber(phone) {
    if (phone.length === 10) {
        return `${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
    return phone;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}