// Freelancer Detail Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    loadFreelancerProfile();
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

// Load Freelancer Profile
async function loadFreelancerProfile() {
    const container = document.getElementById('profileContainer');
    const loadingState = document.getElementById('loadingState');
    
    // Get ID from URL
    const pathParts = window.location.pathname.split('/');
    const freelancerId = pathParts[pathParts.length - 1];

    if (!freelancerId) {
        container.innerHTML = '<p class="error-message">Invalid profile URL</p>';
        return;
    }

    try {
        const response = await fetch(`/api/freelancers/${freelancerId}`);
        const data = await response.json();

        if (data.success) {
            renderProfile(data.data);
        } else {
            container.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">😕</div>
                    <h3>Profile Not Found</h3>
                    <p>The professional you're looking for doesn't exist or has been removed.</p>
                    <a href="/search" class="reset-btn">Browse Professionals</a>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        container.innerHTML = '<p class="error-message">Error loading profile. Please try again.</p>';
    }
}

// Render Profile
function renderProfile(freelancer) {
    const container = document.getElementById('profileContainer');
    const professionData = freelancer.professionDetails || {};

    // Update page title
    document.title = `${freelancer.fullName} - ${professionData.name || freelancer.profession} | LocalPro`;

    container.innerHTML = `
        <div class="profile-card">
            <div class="profile-header">
                <div class="profile-avatar">${freelancer.profilePicture || professionData.icon || '👤'}</div>
                <h1 class="profile-name">${escapeHtml(freelancer.fullName)}</h1>
                <div class="profile-profession">
                    ${professionData.icon || ''} ${professionData.name || freelancer.profession}
                    ${freelancer.isVerified ? '<span class="verified-badge">✓ Verified Professional</span>' : ''}
                </div>
            </div>
            <div class="profile-body">
                <div class="profile-stats">
                    <div class="profile-stat">
                        <div class="profile-stat-value">${freelancer.experience}</div>
                        <div class="profile-stat-label">Years Experience</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">₹${freelancer.rupeesPerHour}</div>
                        <div class="profile-stat-label">Per Hour</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">${freelancer.rating > 0 ? freelancer.rating.toFixed(1) : 'New'}</div>
                        <div class="profile-stat-label">${freelancer.totalReviews > 0 ? `${freelancer.totalReviews} Reviews` : 'No Reviews Yet'}</div>
                    </div>
                </div>

                <div class="profile-details">
                    <div class="profile-detail">
                        <span class="profile-detail-icon">📍</span>
                        <div class="profile-detail-info">
                            <div class="profile-detail-label">Location</div>
                            <div class="profile-detail-value">${escapeHtml(freelancer.location.area)}, ${escapeHtml(freelancer.location.city)}</div>
                        </div>
                    </div>
                    <div class="profile-detail">
                        <span class="profile-detail-icon">💼</span>
                        <div class="profile-detail-info">
                            <div class="profile-detail-label">Profession</div>
                            <div class="profile-detail-value">${professionData.name || freelancer.profession}</div>
                        </div>
                    </div>
                    <div class="profile-detail">
                        <span class="profile-detail-icon">📅</span>
                        <div class="profile-detail-info">
                            <div class="profile-detail-label">Member Since</div>
                            <div class="profile-detail-value">${formatDate(freelancer.createdAt)}</div>
                        </div>
                    </div>
                </div>

                <a href="tel:+91${freelancer.phoneNumber}" class="profile-contact">
                    📞 Call Now: +91 ${formatPhoneNumber(freelancer.phoneNumber)}
                </a>

                <p class="form-note" style="margin-top: 20px;">
                    ⚠️ This is an offline service. Contact the professional directly to discuss and schedule your service.
                </p>
            </div>
        </div>
    `;
}

// Utility Functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formatPhoneNumber(phone) {
    if (phone && phone.length === 10) {
        return `${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
    return phone;
}