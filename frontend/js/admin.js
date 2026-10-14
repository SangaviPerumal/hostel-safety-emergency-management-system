/**
 * JavaScript for Warden / Admin Dashboard
 * Manages emergencies, complaints, and student directory
 * Endpoints:
 * - GET /api/emergencies
 * - PUT /api/emergencies/{id}/status
 * - GET /api/complaints
 * - PUT /api/complaints/{id}/status
 * - GET /api/students
 */

document.addEventListener('DOMContentLoaded', () => {
  const admin = AuthService.getAdmin();
  const dashCard = document.getElementById('admin-dash-card');
  
  // Requirement 7: Enforce strict role-based access
  // If not logged in as Warden, deny access and redirect to warden login
  if (!admin) {
    if (dashCard) dashCard.style.display = 'none';
    const student = AuthService.getStudent();
    if (student) {
      showToast('Access Denied: You are logged in as a Student. Students cannot access Warden Control Room.', 'error');
      setTimeout(() => {
        window.location.href = 'student-dashboard.html';
      }, 1000);
    } else {
      showToast('Warden authentication required to access Control Room.', 'error');
      setTimeout(() => {
        window.location.href = 'login.html?role=warden';
      }, 1000);
    }
    return;
  }

  // Helper for safely setting textContent
  function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // Requirement 3: Chief Warden name as Dr. Sumathi
  setElText('admin-display-name', admin.name || 'Dr. Sumathi (Chief Warden)');

  // Logout handler (support both btn-admin-logout and btn-logout safely)
  const logoutBtn = document.getElementById('btn-admin-logout') || document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      AuthService.logoutWarden();
    });
  }

  // Tab Elements
  const tabEmergencies = document.getElementById('tab-admin-emergencies');
  const tabComplaints = document.getElementById('tab-admin-complaints');
  const tabStudents = document.getElementById('tab-admin-students');

  const secEmergencies = document.getElementById('admin-section-emergencies');
  const secComplaints = document.getElementById('admin-section-complaints');
  const secStudents = document.getElementById('admin-section-students');

  if (tabEmergencies && secEmergencies) {
    tabEmergencies.addEventListener('click', () => {
      setActiveTab(tabEmergencies, secEmergencies);
    });
  }

  if (tabComplaints && secComplaints) {
    tabComplaints.addEventListener('click', () => {
      setActiveTab(tabComplaints, secComplaints);
    });
  }

  if (tabStudents && secStudents) {
    tabStudents.addEventListener('click', () => {
      setActiveTab(tabStudents, secStudents);
    });
  }

  function setActiveTab(activeTab, activeSec) {
    [tabEmergencies, tabComplaints, tabStudents].forEach(t => { if (t) t.classList.remove('active'); });
    [secEmergencies, secComplaints, secStudents].forEach(s => { if (s) s.style.display = 'none'; });

    if (activeTab) activeTab.classList.add('active');
    if (activeSec) activeSec.style.display = 'block';
  }

  // Refresh and Demo data buttons
  const refreshBtn = document.getElementById('btn-refresh-admin');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadEmergencies();
      loadComplaints();
      loadStudents();
      showToast('Control Room live data refreshed.', 'info');
    });
  }

  const seedBtn = document.getElementById('btn-seed-sample');
  if (seedBtn) {
    seedBtn.addEventListener('click', async () => {
      try {
        await apiRequest('/emergencies', 'POST', {
          studentName: 'Ananya Iyer',
          studentId: 'STU103',
          hostelName: 'Flat Office',
          emergencyCategory: 'Medical Emergency',
          emergencyType: 'Sudden Allergic Reaction',
          roomNumber: 'G2',
          description: 'Severe swelling and shortness of breath in room G2.',
          status: 'Pending',
          alertRecipients: 'Dr. Sumathi (Chief Warden), Hostel Management, Doctor and Nurse'
        });
        showToast('Sample emergency alert added!', 'success');
        loadEmergencies();
      } catch (e) {
        showToast(e.message, 'error');
      }
    });
  }

  // Status & Category Filter Listeners
  const filterEmergEl = document.getElementById('filter-emergency-status');
  if (filterEmergEl) {
    filterEmergEl.addEventListener('change', loadEmergencies);
  }

  const filterCatEl = document.getElementById('filter-emergency-category');
  if (filterCatEl) {
    filterCatEl.addEventListener('change', loadEmergencies);
  }

  const filterComplEl = document.getElementById('filter-complaint-status');
  if (filterComplEl) {
    filterComplEl.addEventListener('change', loadComplaints);
  }

  /**
   * Helper to clean alert recipients (Requirement 10: don't show raw mobile numbers)
   */
  function cleanRecipients(raw) {
    if (!raw) return 'Dr. Sumathi (Hostel Warden) and Hostel Management';
    let cleaned = raw.replace(/\s*\(\d{10}\)/g, '');
    cleaned = cleaned.replace(/\s*\(\+?\d[\d\s-]{8,}\)/g, '');
    cleaned = cleaned.replace(/Dr\.\s*R\.\s*Natarajan/gi, 'Dr. Sumathi');
    cleaned = cleaned.replace(/Chief Warden(?!\s*\(Dr)/gi, 'Dr. Sumathi (Chief Warden)');
    return cleaned;
  }

  // Initial Data Loads
  loadEmergencies();
  loadComplaints();
  loadStudents();

  /**
   * Load Emergencies and render with category & status filter and status update dropdown
   */
  async function loadEmergencies() {
    const tbody = document.getElementById('admin-emergencies-body');
    if (!tbody) return;
    const filterEl = document.getElementById('filter-emergency-status');
    const filter = filterEl ? filterEl.value : 'ALL';
    const catEl = document.getElementById('filter-emergency-category');
    const catFilter = catEl ? catEl.value : 'ALL';

    try {
      // GET /api/emergencies
      const emergencies = await apiRequest('/emergencies', 'GET');

      // Requirement 8: counts of pending, in progress, resolved
      const total = emergencies.length;
      const pending = emergencies.filter(e => e.status === 'Pending').length;
      const inProgress = emergencies.filter(e => e.status === 'In Progress').length;
      const resolved = emergencies.filter(e => e.status === 'Resolved').length;

      setElText('stat-total-emergencies', total);
      setElText('stat-pending-emergencies', pending);
      setElText('stat-inprogress-emergencies', inProgress);
      setElText('stat-resolved-emergencies', resolved);
      setElText('badge-emergencies-count', total);

      // Broadcast alert if pending emergencies exist
      const criticalBox = document.getElementById('admin-critical-alert');
      if (criticalBox) {
        if (pending > 0) {
          criticalBox.style.display = 'block';
          criticalBox.innerHTML = `
            <div class="dynamic-alert-box" style="background-color: #fee2e2; border-left-color: #dc2626; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
              <div>
                <div class="alert-title" style="color: #991b1b;">
                  <span>🚨</span> ACTION REQUIRED: ${pending} PENDING EMERGENCY ALERT(S)
                </div>
                <div class="alert-desc" style="color: #7f1d1d;">
                  Urgent student emergency calls awaiting resolution or status dispatch update.
                </div>
              </div>
              <button onclick="const f = document.getElementById('filter-emergency-status'); if (f) { f.value='Pending'; f.dispatchEvent(new Event('change')); }" class="btn btn-emergency btn-sm" style="width: auto;">
                View Pending Alerts (${pending})
              </button>
            </div>
          `;
        } else {
          criticalBox.style.display = 'none';
        }
      }

      let filtered = emergencies;
      if (catFilter !== 'ALL') {
        filtered = filtered.filter(e => {
          const category = (e.emergencyCategory || '').toLowerCase();
          const type = (e.emergencyType || '').toLowerCase();
          const target = catFilter.toLowerCase();
          return category.includes(target) || type.includes(target);
        });
      }
      if (filter !== 'ALL') {
        filtered = filtered.filter(e => e.status === filter);
      }

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #64748b; padding: 24px;">No emergencies match the selected filter.</td></tr>`;
        return;
      }

      tbody.innerHTML = '';
      filtered.forEach(item => {
        const tr = document.createElement('tr');
        const formattedDate = item.dateTime ? new Date(item.dateTime).toLocaleString() : 'Just now';
        const recipients = cleanRecipients(item.alertRecipients);

        let badgeClass = 'badge-pending';
        if (item.status === 'In Progress') badgeClass = 'badge-in-progress';
        if (item.status === 'Resolved') badgeClass = 'badge-resolved';

        // Requirement 4: Shows also the hostel name of each student
        tr.innerHTML = `
          <td><strong>#EMG-${item.id || item._id}</strong></td>
          <td>
            <strong>${escapeHtml(item.studentName || 'Student')}</strong><br/>
            <small style="color: #64748b;">ID: ${escapeHtml(item.studentId || 'N/A')}</small>
          </td>
          <td>
            <span class="badge" style="background: #e0e7ff; color: #3730a3; font-weight: 600;">
              ${escapeHtml(item.hostelName || 'Chellammal hostel')}
            </span>
          </td>
          <td><span style="font-weight: 700; color: #dc2626;">${escapeHtml(item.roomNumber || 'N/A')}</span></td>
          <td><span class="badge badge-emergency">${escapeHtml(item.emergencyType || 'Emergency')}</span></td>
          <td style="max-width: 180px; font-size: 0.88rem;">${escapeHtml(item.description || '')}</td>
          <td style="max-width: 220px; font-size: 0.82rem; color: #1e3a8a; background: #f8fafc; font-weight: 500;">
            <span>📢</span> ${escapeHtml(recipients)}
          </td>
          <td style="font-size: 0.82rem; color: #64748b;">${formattedDate}</td>
          <td><span class="badge ${badgeClass}">${escapeHtml(item.status || 'Pending')}</span></td>
          <td>
            <select class="status-select" data-id="${item.id || item._id}" onchange="window.updateEmergencyStatus('${item.id || item._id}', this.value)">
              <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="In Progress" ${item.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Resolved" ${item.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
            </select>
          </td>
        `;
        tbody.appendChild(tr);
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #dc2626; padding: 24px;">Failed to load emergencies: ${err.message}</td></tr>`;
    }
  }

  /**
   * Load Safety Complaints and render with status update dropdown
   */
  async function loadComplaints() {
    const tbody = document.getElementById('admin-complaints-body');
    if (!tbody) return;
    const filterEl = document.getElementById('filter-complaint-status');
    const filter = filterEl ? filterEl.value : 'ALL';

    try {
      const complaints = await apiRequest('/complaints', 'GET');
      
      const total = complaints.length;
      const pending = complaints.filter(c => c.status === 'Pending').length;
      const inProgress = complaints.filter(c => c.status === 'In Progress').length;
      const resolved = complaints.filter(c => c.status === 'Resolved').length;

      setElText('stat-total-complaints', total);
      setElText('stat-pending-complaints', pending);
      setElText('stat-inprogress-complaints', inProgress);
      setElText('stat-resolved-complaints', resolved);
      setElText('badge-complaints-count', total);

      let filtered = complaints;
      if (filter !== 'ALL') {
        filtered = complaints.filter(c => c.status === filter);
      }

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #64748b; padding: 24px;">No safety complaints match the filter.</td></tr>`;
        return;
      }

      tbody.innerHTML = '';
      filtered.forEach(item => {
        const tr = document.createElement('tr');
        const formattedDate = item.dateTime ? new Date(item.dateTime).toLocaleString() : 'Recent';
        const recipients = cleanRecipients(item.alertRecipients);

        let badgeClass = 'badge-pending';
        if (item.status === 'In Progress') badgeClass = 'badge-in-progress';
        if (item.status === 'Resolved') badgeClass = 'badge-resolved';

        // Requirement 4: Shows also the hostel name of each student
        tr.innerHTML = `
          <td><strong>#CMP-${item.id || item._id}</strong></td>
          <td><strong>${escapeHtml(item.studentId || 'N/A')}</strong></td>
          <td>
            <span class="badge" style="background: #e0e7ff; color: #3730a3; font-weight: 600;">
              ${escapeHtml(item.hostelName || 'Chellammal hostel')}
            </span>
          </td>
          <td><strong style="color: #1e40af;">${escapeHtml(item.roomNumber || 'N/A')}</strong></td>
          <td><span style="font-weight: 600; color: #1e40af;">${escapeHtml(item.complaintType || 'Complaint')}</span></td>
          <td style="max-width: 180px; font-size: 0.88rem;">${escapeHtml(item.description || '')}</td>
          <td style="max-width: 220px; font-size: 0.82rem; color: #1e3a8a; background: #f8fafc; font-weight: 500;">
            <span>📢</span> ${escapeHtml(recipients)}
          </td>
          <td style="font-size: 0.82rem; color: #64748b;">${formattedDate}</td>
          <td><span class="badge ${badgeClass}">${escapeHtml(item.status || 'Pending')}</span></td>
          <td>
            <select class="status-select" data-id="${item.id || item._id}" onchange="window.updateComplaintStatus('${item.id || item._id}', this.value)">
              <option value="Pending" ${item.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="In Progress" ${item.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Resolved" ${item.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
            </select>
          </td>
        `;
        tbody.appendChild(tr);
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #dc2626; padding: 24px;">Failed to load complaints: ${err.message}</td></tr>`;
    }
  }

  /**
   * Load Registered Students Directory
   */
  async function loadStudents() {
    const tbody = document.getElementById('admin-students-body');
    if (!tbody) return;

    try {
      const students = await apiRequest('/students', 'GET');
      
      setElText('stat-total-students', students.length);
      setElText('badge-students-count', students.length);

      if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 24px;">No students registered yet.</td></tr>`;
        return;
      }

      tbody.innerHTML = '';
      students.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${escapeHtml(s.studentId)}</strong></td>
          <td><strong>${escapeHtml(s.studentName)}</strong></td>
          <td>
            <span class="badge" style="background: #e0e7ff; color: #3730a3; font-weight: 600;">
              ${escapeHtml(s.hostelName || 'Chellammal hostel')}
            </span>
          </td>
          <td><span style="font-weight: 700; color: #1e40af;">${escapeHtml(s.roomNumber || 'N/A')}</span></td>
          <td>${escapeHtml(s.phoneNumber || 'N/A')}</td>
          <td>${escapeHtml(s.email || 'N/A')}</td>
        `;
        tbody.appendChild(tr);
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #dc2626; padding: 24px;">Failed to load students: ${err.message}</td></tr>`;
    }
  }

  // Global functions for updating status via PUT APIs
  window.updateEmergencyStatus = async function(id, newStatus) {
    try {
      // PUT /api/emergencies/{id}/status
      await apiRequest(`/emergencies/${id}/status`, 'PUT', { status: newStatus });
      showToast(`Emergency #EMG-${id} status updated to: ${newStatus}`, 'success');
      loadEmergencies();
    } catch (err) {
      showToast(`Failed to update emergency status: ${err.message}`, 'error');
    }
  };

  window.updateComplaintStatus = async function(id, newStatus) {
    try {
      // PUT /api/complaints/{id}/status
      await apiRequest(`/complaints/${id}/status`, 'PUT', { status: newStatus });
      showToast(`Complaint #CMP-${id} status updated to: ${newStatus}`, 'success');
      loadComplaints();
    } catch (err) {
      showToast(`Failed to update complaint status: ${err.message}`, 'error');
    }
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
