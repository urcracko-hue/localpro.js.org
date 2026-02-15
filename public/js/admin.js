// Admin Panel JavaScript

let adminPasscode = '';
let currentAdminPage = 1;
let adminTotalPages = 1;

document.addEventListener('DOMContentLoaded', function() {
    initLoginForm();
    checkAdminSession();
});

// Check if admin is already logged in
function checkAdminSession() {
    const savedPasscode = sessionStorage.getItem('adminPasscode');
    if (savedPasscode) {
        adminPasscode = savedPasscode;
        verifyAndLogin(savedPasscode);
    }
}

// Initialize Login Form
function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const passcodeInput = document.getElementById('passcode');
        const passcode = passcodeInput.value;
        const errorElement = document.getElementById('passcodeError');

        if (!passcode) {
            errorElement.textContent = 'Please enter the passcode';
            return;
        }

        await verifyAndLogin(passcode);
    });
}

// Verify and Login
async function verifyAndLogin(passcode) {
    const errorElement = document.getElementById('passcodeError');
    
    try {
        const response = await fetch('/api/admin/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ passcode })
        });

        const data = await response.json();

        if (data.success) {
            adminPasscode = passcode;
            sessionStorage.setItem('adminPasscode', passcode);
            showDashboard();
        } else {
            if (errorElement) {
                errorElement.textContent = 'Invalid passcode';
            }
            sessionStorage.removeItem('adminPasscode');
        }
    } catch (error) {
        console.error('Login error:', error);
        if (errorElement) {
            errorElement.textContent = 'Error verifying passcode';
        }
    }
}

// Show Dashboard
function showDashboard() {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';

    initDashboard();
    loadStats();
    loadProfessions();
    initTabs();
    initLogout();
}

// Initialize Dashboard
function initDashboard() {
    // Load initial data
    loadFreelancers();
}

// Initialize Tabs
function initTabs() {
    const tabBtns = document.querySelectorAll('.admin-nav-btn[data-tab]');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            
            // Update active button
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding tab
            document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
            document.getElementById(`${tab}Tab`).style.display = 'block';
            
            // Load tab data
            if (tab === 'dashboard') {
                loadStats();
            } else if (tab === 'freelancers') {
                loadFreelancers();
            }
        });
    });
}

// Initialize Logout
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            sessionStorage.removeItem('adminPasscode');
            adminPasscode = '';
            location.reload();
        });
    }
}

// Load Stats
async function loadStats() {
    try {
        const response = await fetch('/api/admin/stats', {
            headers: {
                'X-Admin-Passcode': adminPasscode
            }
        });

        const data = await response.json();

        if (data.success) {
            const stats = data.data;
            
            document.getElementById('totalCount').textContent = stats.totalFreelancers;
            document.getElementById('activeCount').textContent = stats.activeFreelancers;
            document.getElementById('verifiedCount').textContent = stats.verifiedFreelancers;
            document.getElementById('recentCount').textContent = stats.recentRegistrations;

            // Render profession chart
            renderChart('professionChart', stats.professionStats, 'profession');
            
            // Render city chart
            renderChart('cityChart', stats.cityStats, 'city');
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Render Chart
function renderChart(containerId, data, type) {
    const container = document.getElementById(containerId);
    if (!container || !data || data.length === 0) return;

    const maxValue = Math.max(...data.map(item => item.count));

    container.innerHTML = data.map(item => {
        const percentage = (item.count / maxValue) * 100;
        const label = item._id || 'Unknown';
        
        return `
            <div class="chart-bar">
                <div class="chart-bar-label" title="${label}">${label}</div>
                <div class="chart-bar-fill">
                    <div class="chart-bar-progress" style="width: ${percentage}%"></div>
                </div>
                <div class="chart-bar-value">${item.count}</div>
            </div>
        `;
    }).join('');
}

// Load Professions for Filter
async function loadProfessions() {
    const select = document.getElementById('professionFilter');
    if (!select) return;

    try {
        const response = await fetch('/api/freelancers/professions');
        const data = await response.json();

        if (data.success) {
            data.data.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.id;
                option.textContent = `${prof.icon} ${prof.name}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading professions:', error);
    }

    // Initialize filter events
    initFilters();
}

// Initialize Filters
function initFilters() {
    const applyBtn = document.getElementById('applyFilters');
    const searchInput = document.getElementById('searchInput');
    const prevBtn = document.getElementById('adminPrevPage');
    const nextBtn = document.getElementById('adminNextPage');

    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            currentAdminPage = 1;
            loadFreelancers();
        });
    }

    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentAdminPage = 1;
                loadFreelancers();
            }, 500);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentAdminPage > 1) {
                currentAdminPage--;
                loadFreelancers();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentAdminPage < adminTotalPages) {
                currentAdminPage++;
                loadFreelancers();
            }
        });
    }
}

// Load Freelancers
async function loadFreelancers() {
    const tableBody = document.getElementById('freelancersTableBody');
    if (!tableBody) return;

    // Get filter values
    const search = document.getElementById('searchInput')?.value || '';
    const status = document.getElementById('statusFilter')?.value || 'all';
    const profession = document.getElementById('professionFilter')?.value || 'all';

    // Build query
    const params = new URLSearchParams();
    params.set('page', currentAdminPage);
    params.set('limit', 20);
    if (search) params.set('search', search);
    if (status !== 'all') params.set('status', status);
    if (profession !== 'all') params.set('profession', profession);

    tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">Loading...</td></tr>';

    try {
        const response = await fetch(`/api/admin/freelancers?${params.toString()}`, {
            headers: {
                'X-Admin-Passcode': adminPasscode
            }
        });

        const data = await response.json();

        if (data.success) {
            if (data.data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No freelancers found</td></tr>';
            } else {
                renderFreelancersTable(data.data);
            }

            // Update pagination
            adminTotalPages = data.pagination.pages;
            document.getElementById('adminPageInfo').textContent = `Page ${currentAdminPage} of ${adminTotalPages}`;
            document.getElementById('adminPrevPage').disabled = currentAdminPage === 1;
            document.getElementById('adminNextPage').disabled = currentAdminPage === adminTotalPages;
        }
    } catch (error) {
        console.error('Error loading freelancers:', error);
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: red;">Error loading data</td></tr>';
    }
}

// Render Freelancers Table
function renderFreelancersTable(freelancers) {
    const tableBody = document.getElementById('freelancersTableBody');
    
    tableBody.innerHTML = freelancers.map(f => `
        <tr>
            <td>
                <div class="profile-cell">
                    <div class="profile-avatar">${f.profilePicture || '👤'}</div>
                </div>
            </td>
            <td><strong>${escapeHtml(f.fullName)}</strong></td>
            <td>${escapeHtml(f.profession)}</td>
            <td>+91 ${f.phoneNumber}</td>
            <td>${escapeHtml(f.location.area)}, ${escapeHtml(f.location.city)}</td>
            <td>₹${f.rupeesPerHour}/hr</td>
            <td>
                <span class="status-badge ${f.isActive ? 'active' : 'inactive'}">
                    ${f.isActive ? 'Active' : 'Inactive'}
                </span>
                ${f.isVerified ? '<span class="status-badge verified">Verified</span>' : ''}
            </td>
            <td>
                <div class="action-btns">
                    <button class="action-btn verify" onclick="toggleVerify('${f._id}', ${!f.isVerified})" title="${f.isVerified ? 'Unverify' : 'Verify'}">
                        ${f.isVerified ? '✗' : '✓'}
                    </button>
                    <button class="action-btn toggle" onclick="toggleActive('${f._id}', ${!f.isActive})" title="${f.isActive ? 'Deactivate' : 'Activate'}">
                        ${f.isActive ? '⏸' : '▶'}
                    </button>
                    <button class="action-btn delete" onclick="confirmDelete('${f._id}', '${escapeHtml(f.fullName)}')" title="Delete">
                        🗑
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Toggle Verify Status
async function toggleVerify(id, isVerified) {
    try {
        const response = await fetch(`/api/admin/freelancers/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Passcode': adminPasscode
            },
            body: JSON.stringify({ isVerified })
        });

        const data = await response.json();
        
        if (data.success) {
            loadFreelancers();
            loadStats();
        } else {
            alert(data.message || 'Error updating status');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error updating status');
    }
}

// Toggle Active Status
async function toggleActive(id, isActive) {
    try {
        const response = await fetch(`/api/admin/freelancers/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Passcode': adminPasscode
            },
            body: JSON.stringify({ isActive })
        });

        const data = await response.json();
        
        if (data.success) {
            loadFreelancers();
            loadStats();
        } else {
            alert(data.message || 'Error updating status');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error updating status');
    }
}

// Confirm Delete
function confirmDelete(id, name) {
    const modal = document.getElementById('confirmModal');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOk = document.getElementById('confirmOk');
    const confirmCancel = document.getElementById('confirmCancel');

    confirmTitle.textContent = 'Delete Professional';
    confirmMessage.textContent = `Are you sure you want to delete "${name}"? This action cannot be undone.`;

    modal.classList.add('show');

    confirmOk.onclick = async () => {
        modal.classList.remove('show');
        await deleteFreelancer(id);
    };

    confirmCancel.onclick = () => {
        modal.classList.remove('show');
    };
}

// Delete Freelancer
async function deleteFreelancer(id) {
    try {
        const response = await fetch(`/api/admin/freelancers/${id}`, {
            method: 'DELETE',
            headers: {
                'X-Admin-Passcode': adminPasscode
            }
        });

        const data = await response.json();
        
        if (data.success) {
            loadFreelancers();
            loadStats();
        } else {
            alert(data.message || 'Error deleting freelancer');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error deleting freelancer');
    }
}

// Utility function
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}