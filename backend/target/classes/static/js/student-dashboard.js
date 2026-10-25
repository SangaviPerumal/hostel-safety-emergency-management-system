/**
 * JavaScript for Student Dashboard
 * Fetches and displays all hostel emergency reports and safety complaints
 * Endpoints:
 * - GET /api/emergencies
 * - GET /api/complaints
 */

document.addEventListener('DOMContentLoaded', () => {
  const student = AuthService.getStudent();
  
  // Require valid registered student session
  if (!student) {
    const dashCard = document.getElementById('student-dash-card');
    if (dashCard) dashCard.style.display = 'none';

    const admin = AuthService.getAdmin();
    if (admin) {
      showToast('You are logged in as Warden. Redirecting to Warden Control Room...', 'info');
      setTimeout(() => {
        window.location.href = 'admin-dashboard.html';
      }, 800);
      return;
    }

    showToast('Please sign in with your registered student account to access dashboard.', 'error');
    setTimeout(() => {
      window.location.href = 'login.html?role=student';
    }, 900);
    return;
  }

  function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // Update Profile details in header with registered student details
  setElText('profile-name', student.studentName || 'Registered Student');
  setElText('profile-id', student.studentId || 'N/A');
  setElText('profile-room', student.roomNumber || 'N/A');
  setElText('profile-hostel', student.hostelName || 'Hostel Campus');

  // Tab Elements
  const tabEmergencies = document.getElementById('tab-student-emergencies');
  const tabComplaints = document.getElementById('tab-student-complaints');
  const sectionEmergencies = document.getElementById('section-emergencies');
  const sectionComplaints = document.getElementById('section-complaints');

  if (tabEmergencies && sectionEmergencies && tabComplaints && sectionComplaints) {
    tabEmergencies.addEventListener('click', () => {
      tabEmergencies.classList.add('active');
      tabComplaints.classList.remove('active');
      sectionEmergencies.style.display = 'block';
      sectionComplaints.style.display = 'none';
    });

    tabComplaints.addEventListener('click', () => {
      tabComplaints.classList.add('active');
      tabEmergencies.classList.remove('active');
      sectionComplaints.style.display = 'block';
      sectionEmergencies.style.display = 'none';
    });
  }

  // Logout button handler
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      AuthService.logoutStudent();
    });
  }

  const refreshEmergBtn = document.getElementById('btn-refresh-emergencies');
  if (refreshEmergBtn) {
    refreshEmergBtn.addEventListener('click', () => {
      loadAllEmergencies();
    });
  }

  const refreshComplBtn = document.getElementById('btn-refresh-complaints');
  if (refreshComplBtn) {
    refreshComplBtn.addEventListener('click', () => {
      loadAllComplaints();
    });
  }

  // Keep track of counts for combined total in-progress
  let emergencyInProgressCount = 0;
  let complaintInProgressCount = 0;

  function updateCombinedInProgress() {
    const el = document.getElementById('student-inprogress-total');
    if (el) {
      el.textContent = emergencyInProgressCount + complaintInProgressCount;
    }
  }

  // Initial Load
  loadAllEmergencies();
  loadAllComplaints();

  /**
   * Clean recipients string: strip raw phone numbers if present
   */
  function cleanRecipients(raw) {
    if (!raw) return 'Dr. Sumathi (Hostel Warden) and Hostel Management';
    // Remove (7305004032), (8148850319), etc.
    let cleaned = raw.replace(/\s*\(\d{10}\)/g, '');
    cleaned = cleaned.replace(/\s*\(\+?\d[\d\s-]{8,}\)/g, '');
    // Ensure Dr. Sumathi is reflected
    cleaned = cleaned.replace(/Dr\.\s*R\.\s*Natarajan/gi, 'Dr. Sumathi');
    cleaned = cleaned.replace(/Chief Warden(?!\s*\(Dr)/gi, 'Dr. Sumathi (Chief Warden)');
    return cleaned;
  }

  /**
   * Load all emergency reports across the hostel
   */
  async function loadAllEmergencies() {
    const tbody = document.getElementById('student-emergencies-body');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #64748b; padding: 24px;">🔄 Fetching emergency reports...</td></tr>`;

    try {
      // GET /api/emergencies from Spring Boot REST API
      const allEmergencies = await apiRequest('/emergencies', 'GET');

      // Update counters
      const total = allEmergencies.length;
      const pending = allEmergencies.filter(e => e.status === 'Pending').length;
      emergencyInProgressCount = allEmergencies.filter(e => e.status === 'In Progress').length;
      const resolved = allEmergencies.filter(e => e.status === 'Resolved').length;

      setElText('student-total-emergencies', total);
      setElText('student-pending-emergencies', pending);
      setElText('student-resolved-emergencies', resolved);
      setElText('count-tab-emergencies', total);
      updateCombinedInProgress();

      // Active SOS banner if any pending emergency exists
      const activeBanner = document.getElementById('active-sos-banner');
      if (activeBanner) {
        if (pending > 0) {
          activeBanner.style.display = 'block';
          activeBanner.innerHTML = `
            <div class="dynamic-alert-box" style="background-color: #fef2f2; border-left-color: #dc2626; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
              <div>
                <div class="alert-title" style="color: #991b1b;">
                  <span>🚨</span> Active Emergency Alerts in Hostel!
                </div>
                <div class="alert-desc" style="color: #7f1d1d;">
                  There are ${pending} pending emergency alerts awaiting warden response. Response teams have been dispatched.
                </div>
              </div>
              <a href="emergency.html" class="btn btn-emergency btn-sm" style="width: auto;">Submit New SOS</a>
            </div>
          `;
        } else {
          activeBanner.style.display = 'none';
        }
      }

      if (allEmergencies.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="10" style="text-align: center; color: #64748b; padding: 32px;">
              No emergency reports found. If you face an immediate hazard, <a href="emergency.html" style="color: #dc2626; font-weight: 700;">Report an Emergency here</a>.
            </td>
          </tr>
        `;
        return;
      }

      // Render Rows
      tbody.innerHTML = '';
      allEmergencies.forEach(item => {
        const tr = document.createElement('tr');
        
        let statusBadgeClass = 'badge-pending';
        let statusEmoji = '⏳';
        if (item.status === 'In Progress') {
          statusBadgeClass = 'badge-in-progress';
          statusEmoji = '⚡';
        } else if (item.status === 'Resolved') {
          statusBadgeClass = 'badge-resolved';
          statusEmoji = '✅';
        }

        const formattedDate = item.dateTime ? new Date(item.dateTime).toLocaleString() : 'Just now';
        const recipients = cleanRecipients(item.alertRecipients);
        const isSelf = student && item.studentId && item.studentId.toUpperCase() === student.studentId.toUpperCase();

        tr.innerHTML = `
          <td>
            <strong>#EMG-${item.id || item._id || '001'}</strong>
            ${isSelf ? '<span class="badge" style="background: #dbeafe; color: #1e40af; font-size: 0.72rem; display: block; margin-top: 2px;">Your Report</span>' : ''}
          </td>
          <td>
            <strong>${escapeHtml(item.studentName || 'Student')}</strong><br/>
            <small style="color: #64748b;">${escapeHtml(item.studentId || '')}</small>
          </td>
          <td>
            <span class="badge" style="background: #e0e7ff; color: #3730a3; font-weight: 600;">
              ${escapeHtml(item.hostelName || 'Chellammal hostel')}
            </span>
          </td>
          <td><strong style="color: #dc2626;">${escapeHtml(item.roomNumber || 'N/A')}</strong></td>
          <td><span class="badge badge-emergency">${escapeHtml(item.emergencyType || 'Emergency')}</span></td>
          <td style="max-width: 200px;">${escapeHtml(item.description || '')}</td>
          <td style="max-width: 200px; font-size: 0.82rem; color: #1e3a8a; background: #f8fafc; font-weight: 500;">
            <span>📢</span> ${escapeHtml(recipients)}
          </td>
          <td style="font-size: 0.85rem; color: #64748b;">${formattedDate}</td>
          <td><span class="badge ${statusBadgeClass}">${statusEmoji} ${escapeHtml(item.status || 'Pending')}</span></td>
          <td style="font-size: 0.88rem; color: #334155;">${escapeHtml(item.adminRemarks || 'Warden team dispatched')}</td>
        `;
        tbody.appendChild(tr);
      });

    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #dc2626; padding: 24px;">Failed to load emergency reports: ${error.message}</td></tr>`;
    }
  }

  /**
   * Load all safety complaints across the hostel
   */
  async function loadAllComplaints() {
    const tbody = document.getElementById('student-complaints-body');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #64748b; padding: 24px;">🔄 Fetching safety complaints...</td></tr>`;

    try {
      // GET /api/complaints from Spring Boot REST API
      const allComplaints = await apiRequest('/complaints', 'GET');

      const total = allComplaints.length;
      const pendingComplaints = allComplaints.filter(c => c.status === 'Pending').length;
      complaintInProgressCount = allComplaints.filter(c => c.status === 'In Progress').length;

      // Update counters (Requirement 8 & 9)
      setElText('student-total-complaints', total);
      setElText('student-pending-complaints', pendingComplaints);
      setElText('count-tab-complaints', total);
      updateCombinedInProgress();

      if (allComplaints.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="10" style="text-align: center; color: #64748b; padding: 32px;">
              No safety complaints registered. <a href="complaint.html" style="color: #2563eb; font-weight: 600;">Submit a Safety Complaint</a>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = '';
      allComplaints.forEach(item => {
        const tr = document.createElement('tr');
        
        let statusBadgeClass = 'badge-pending';
        let statusEmoji = '⏳';
        if (item.status === 'In Progress') {
          statusBadgeClass = 'badge-in-progress';
          statusEmoji = '🛠️';
        } else if (item.status === 'Resolved') {
          statusBadgeClass = 'badge-resolved';
          statusEmoji = '✅';
        }

        const formattedDate = item.dateTime ? new Date(item.dateTime).toLocaleString() : 'Recent';
        const recipients = cleanRecipients(item.alertRecipients);
        const isSelf = student && item.studentId && item.studentId.toUpperCase() === student.studentId.toUpperCase();

        tr.innerHTML = `
          <td>
            <strong>#CMP-${item.id || item._id || '001'}</strong>
            ${isSelf ? '<span class="badge" style="background: #dbeafe; color: #1e40af; font-size: 0.72rem; display: block; margin-top: 2px;">Your Report</span>' : ''}
          </td>
          <td><strong>${escapeHtml(item.studentId || 'N/A')}</strong></td>
          <td>
            <span class="badge" style="background: #e0e7ff; color: #3730a3; font-weight: 600;">
              ${escapeHtml(item.hostelName || 'Chellammal hostel')}
            </span>
          </td>
          <td><strong>${escapeHtml(item.roomNumber || 'N/A')}</strong></td>
          <td><span style="font-weight: 600; color: #1e40af;">${escapeHtml(item.complaintType || 'Complaint')}</span></td>
          <td style="max-width: 200px;">${escapeHtml(item.description || '')}</td>
          <td style="max-width: 200px; font-size: 0.82rem; color: #1e3a8a; background: #f8fafc; font-weight: 500;">
            <span>📢</span> ${escapeHtml(recipients)}
          </td>
          <td style="font-size: 0.85rem; color: #64748b;">${formattedDate}</td>
          <td><span class="badge ${statusBadgeClass}">${statusEmoji} ${escapeHtml(item.status || 'Pending')}</span></td>
          <td style="font-size: 0.88rem; color: #334155;">${escapeHtml(item.adminRemarks || 'Assigned to hostel maintenance technician')}</td>
        `;
        tbody.appendChild(tr);
      });

    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #dc2626; padding: 24px;">Failed to load complaints: ${error.message}</td></tr>`;
    }
  }

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
