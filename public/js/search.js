// =======================================
// Search Page JavaScript (FINAL FIXED)
// =======================================

let currentPage = 1;
let totalPages = 1;
let userLocation = null;
let professions = [];

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    loadProfessions();
    initFilters();
    parseURLParams();
    initLocationDetection();
});

// ---------------------------------------
// Small helpers
// ---------------------------------------
const $ = (id) => document.getElementById(id);

function safeShow(el, display) {
    if (el) el.style.display = display;
}

// ---------------------------------------
// Navigation
// ---------------------------------------
function initNavigation() {
    const navToggle = $('navToggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

// ---------------------------------------
// Load professions
// ---------------------------------------
async function loadProfessions() {
    const select = $('professionFilter');
    if (!select) return;

    try {
        const res = await fetch('/api/freelancers/professions');
        const data = await res.json();

        if (!data.success) return;

        professions = data.data;

        professions.forEach(prof => {
            const opt = document.createElement('option');
            opt.value = prof.id;
            opt.textContent = `${prof.icon} ${prof.name}`;
            select.appendChild(opt);
        });

        populateCategoryFilters(professions);

    } catch (err) {
        console.error('Error loading professions:', err);
    }
}

// ---------------------------------------
// Category quick filters
// ---------------------------------------
function populateCategoryFilters(list) {
    const container = $('categoryFilters');
    if (!container) return;

    container.innerHTML = list.slice(0, 8).map(prof => `
        <button class="category-filter-btn" data-profession="${prof.id}">
            <span>${prof.icon}</span>
            <span>${prof.name}</span>
        </button>
    `).join('');

    container.querySelectorAll('.category-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const select = $('professionFilter');
            if (select) select.value = btn.dataset.profession;

            container.querySelectorAll('button')
                .forEach(b => b.classList.remove('active'));

            btn.classList.add('active');
            currentPage = 1;
            searchFreelancers();
        });
    });
}

// ---------------------------------------
// URL params
// ---------------------------------------
function parseURLParams() {
    const params = new URLSearchParams(window.location.search);

    const profession = params.get('profession');
    const lat = params.get('lat');
    const lng = params.get('lng');

    if (profession && $('professionFilter')) {
        $('professionFilter').value = profession;
    }

    if (lat && lng) {
        userLocation = {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng)
        };
        updateLocationStatus(true);
    }

    searchFreelancers();
}

// ---------------------------------------
// Filters & pagination
// ---------------------------------------
function initFilters() {
    $('searchBtn')?.addEventListener('click', () => {
        currentPage = 1;
        searchFreelancers();
    });

    $('resetFilters')?.addEventListener('click', resetFilters);

    $('prevPage')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            searchFreelancers();
        }
    });

    $('nextPage')?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            searchFreelancers();
        }
    });

    const modal = $('freelancerModal');
    $('closeModal')?.addEventListener('click', () => modal?.classList.remove('show'));

    modal?.addEventListener('click', e => {
        if (e.target === modal) modal.classList.remove('show');
    });
}

// ---------------------------------------
// Location detection
// ---------------------------------------
function initLocationDetection() {
    const btn = $('getLocationBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            alert('Geolocation not supported');
            return;
        }

        const status = $('locationStatus');
        if (status) status.textContent = 'Detecting...';
        btn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            pos => {
                userLocation = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                };
                updateLocationStatus(true);
                btn.disabled = false;
                searchFreelancers();
            },
            () => {
                updateLocationStatus(false);
                btn.disabled = false;
            }
        );
    });
}

function updateLocationStatus(ok) {
    const status = $('locationStatus');
    const btn = $('getLocationBtn');
    if (!status || !btn) return;

    status.textContent = ok ? 'Location Set ✓' : 'Detect Location';
    btn.classList.toggle('active', ok);
}

// ---------------------------------------
// MAIN SEARCH (CRASH-PROOF)
// ---------------------------------------
async function searchFreelancers() {
    const resultsGrid = $('resultsGrid');
    if (!resultsGrid) return;

    const loadingState = $('loadingState');
    const noResults = $('noResults');
    const pagination = $('pagination');
    const resultsInfo = $('resultsInfo');

    resultsGrid.innerHTML = '';
    safeShow(loadingState, 'block');
    safeShow(noResults, 'none');
    safeShow(pagination, 'none');

    const params = new URLSearchParams();

    const profession = $('professionFilter')?.value;
    const radius = $('radiusFilter')?.value || 10;

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
        const res = await fetch(`/api/freelancers/search?${params.toString()}`);
        const data = await res.json();

        safeShow(loadingState, 'none');

        if (!data.success || !data.data.length) {
            safeShow(noResults, 'block');
            if (resultsInfo) resultsInfo.textContent = 'No results found';
            return;
        }

        displayResults(data.data);

        totalPages = data.pagination.pages || 1;

        if (pagination && totalPages > 1) {
            safeShow(pagination, 'flex');
            $('pageInfo') &&
                ($('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`);
            $('prevPage') &&
                ($('prevPage').disabled = currentPage === 1);
            $('nextPage') &&
                ($('nextPage').disabled = currentPage === totalPages);
        }

        if (resultsInfo) {
            resultsInfo.textContent =
                `Found ${data.pagination.total} professional${data.pagination.total !== 1 ? 's' : ''}`;
        }

    } catch (err) {
        console.error('Search error:', err);
        safeShow(loadingState, 'none');
        resultsGrid.innerHTML =
            '<p class="error-message">Error loading results</p>';
    }
}

// ---------------------------------------
// FULL PROFESSIONAL INFO CARD (RESTORED)
// ---------------------------------------
function displayResults(freelancers) {
    const resultsGrid = $('resultsGrid');
    if (!resultsGrid) return;

    resultsGrid.innerHTML = freelancers.map(f => {
        const p = f.professionDetails || {};
        const distance =
            f.distance !== undefined ? formatDistance(f.distance) : '';

        return `
            <div class="freelancer-card"
                 onclick="showFreelancerDetail('${f._id}')">

                <div class="card-header">
                    <div class="card-avatar">
                        ${f.profilePicture || p.icon || '👤'}
                    </div>

                    <div class="card-title">
                        <div class="card-name">
                            ${escapeHtml(f.fullName)}
                        </div>
                        <div class="card-profession">
                            ${p.icon || ''} ${p.name || f.profession}
                        </div>
                    </div>
                </div>

                <div class="card-body">
                    <div class="card-info">
                        <div class="info-item">
                            📍 ${escapeHtml(f.location?.area || '')},
                            ${escapeHtml(f.location?.city || '')}
                        </div>

                        <div class="info-item">
                            ⏱️ ${f.experience} year${f.experience !== 1 ? 's' : ''} experience
                        </div>

                        ${f.isVerified
                            ? '<div class="verified-badge">✓ Verified</div>'
                            : ''}
                    </div>

                    <div class="card-footer">
                        <div class="card-rate">
                            ₹${f.rupeesPerHour} <span>/hour</span>
                        </div>

                        ${distance
                            ? `<div class="card-distance">📍 ${distance}</div>`
                            : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ---------------------------------------
// Freelancer detail modal
// ---------------------------------------
async function showFreelancerDetail(id) {
    const modal = $('freelancerModal');
    const detail = $('freelancerDetail');
    if (!modal || !detail) return;

    modal.classList.add('show');
    detail.innerHTML =
        '<div class="loading-state"><div class="loader"></div><p>Loading...</p></div>';

    try {
        const res = await fetch(`/api/freelancers/${id}`);
        const data = await res.json();
        if (!data.success) throw new Error();

        const f = data.data;
        const p = f.professionDetails || {};

        detail.innerHTML = `
            <div class="detail-header">
                <div class="detail-avatar">
                    ${f.profilePicture || p.icon || '👤'}
                </div>
                <div class="detail-name">${escapeHtml(f.fullName)}</div>
                <div class="detail-profession">
                    ${p.icon || ''} ${p.name || f.profession}
                    ${f.isVerified ? '<span class="verified-badge">✓ Verified</span>' : ''}
                </div>
            </div>

            <div class="detail-body">
                <div class="detail-info">
                    <div class="detail-item">
                        <div class="detail-label">Experience</div>
                        <div class="detail-value">${f.experience} Years</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">Rate</div>
                        <div class="detail-value">₹${f.rupeesPerHour}/hr</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">Location</div>
                        <div class="detail-value">${escapeHtml(f.location.area)}</div>
                    </div>

                    <div class="detail-item">
                        <div class="detail-label">City</div>
                        <div class="detail-value">${escapeHtml(f.location.city)}</div>
                    </div>
                </div>

                <a href="tel:+91${f.phoneNumber}" class="contact-btn">
                    📞 Call +91 ${formatPhoneNumber(f.phoneNumber)}
                </a>
            </div>
        `;
    } catch {
        detail.innerHTML =
            '<p class="error-message">Error loading profile</p>';
    }
}

// ---------------------------------------
// Reset
// ---------------------------------------
function resetFilters() {
    $('professionFilter') && ($('professionFilter').value = 'all');
    $('radiusFilter') && ($('radiusFilter').value = '10');
    currentPage = 1;
    searchFreelancers();
}

// ---------------------------------------
// Utils
// ---------------------------------------
function formatDistance(km) {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
}

function formatPhoneNumber(phone) {
    if (phone?.length === 10) {
        return `${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
    return phone;
}

function escapeHtml(text = '') {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}
