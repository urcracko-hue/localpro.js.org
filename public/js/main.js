// Main JavaScript for LocalPro Platform

document.addEventListener('DOMContentLoaded', function() {
    // Initialize
    initNavigation();
    loadProfessions();
    loadCategories();
    initHeroSearch();
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

// Load Professions for Hero Search
async function loadProfessions() {
    const select = document.getElementById('professionSelect');
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
            select.innerHTML = '<option value="">Select a service...</option>';
            
            Object.keys(categories).forEach(category => {
                const optgroup = document.createElement('optgroup');
                optgroup.label = category;
                
                categories[category].forEach(prof => {
                    const option = document.createElement('option');
                    option.value = prof.id;
                    option.textContent = `${prof.icon} ${prof.name}`;
                    optgroup.appendChild(option);
                });
                
                select.appendChild(optgroup);
            });
        }
    } catch (error) {
        console.error('Error loading professions:', error);
    }
}

// Load Categories for Grid
async function loadCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;

    try {
        const response = await fetch('/api/freelancers/professions');
        const data = await response.json();

        if (data.success) {
            // Show first 12 popular professions
            const popular = data.data.slice(0, 12);
            
            grid.innerHTML = popular.map(prof => `
                <div class="category-card" onclick="searchProfession('${prof.id}')">
                    <div class="category-icon">${prof.icon}</div>
                    <div class="category-name">${prof.name}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        grid.innerHTML = '<p>Error loading categories</p>';
    }
}

// Initialize Hero Search
function initHeroSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const locationBtn = document.getElementById('getLocationBtn');
    const professionSelect = document.getElementById('professionSelect');

    let userLocation = null;

    // Get Location Button
    if (locationBtn) {
        locationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                locationBtn.innerHTML = '<span class="location-icon">🔄</span><span class="location-text">Detecting...</span>';
                
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        userLocation = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        };
                        locationBtn.innerHTML = '<span class="location-icon">✅</span><span class="location-text">Location Set</span>';
                        locationBtn.classList.add('active');
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        locationBtn.innerHTML = '<span class="location-icon">❌</span><span class="location-text">Location Failed</span>';
                        setTimeout(() => {
                            locationBtn.innerHTML = '<span class="location-icon">📍</span><span class="location-text">Detect Location</span>';
                        }, 2000);
                    }
                );
            } else {
                alert('Geolocation is not supported by your browser');
            }
        });
    }

    // Search Button
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const profession = professionSelect ? professionSelect.value : '';
            let url = '/search';
            const params = new URLSearchParams();

            if (profession) {
                params.set('profession', profession);
            }

            if (userLocation) {
                params.set('lat', userLocation.latitude);
                params.set('lng', userLocation.longitude);
            }

            if (params.toString()) {
                url += '?' + params.toString();
            }

            window.location.href = url;
        });
    }
}

// Search by Profession
function searchProfession(professionId) {
    window.location.href = `/search?profession=${professionId}`;
}

// Utility Functions
function formatDistance(km) {
    if (km < 1) {
        return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}