/**
 * JavaScript handler for Safety Complaint Submission
 * Connects frontend form with Spring Boot REST API: POST /api/complaints
 */

document.addEventListener('DOMContentLoaded', () => {
  const complaintForm = document.getElementById('complaint-form');
  const studentIdInput = document.getElementById('studentId');
  const roomNumberInput = document.getElementById('roomNumber');
  const complaintTypeSelect = document.getElementById('complaintType');
  const descriptionInput = document.getElementById('complaintDescription');

  const hostelSelect = document.getElementById('hostelName');

  // Pre-fill logged in student info if available
  const loggedInStudent = AuthService.getStudent();
  if (loggedInStudent) {
    if (studentIdInput) studentIdInput.value = loggedInStudent.studentId || '';
    if (hostelSelect && loggedInStudent.hostelName) {
      hostelSelect.value = loggedInStudent.hostelName;
    }
    if (roomNumberInput && loggedInStudent.roomNumber) {
      roomNumberInput.value = loggedInStudent.roomNumber;
    }
  }

  const alertRecipientsText = document.getElementById('complaint-alert-recipients');

  function getComplaintRecipients(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('plumb') || t.includes('water') || t.includes('pipe') || t.includes('drain')) {
      return 'Plumber, Dr. Sumathi (Hostel Warden) and Hostel Management';
    } else if (t.includes('light') || t.includes('socket') || t.includes('wiring') || t.includes('power')) {
      return 'Electrician, Dr. Sumathi (Chief Warden) and Hostel Management';
    } else {
      return 'Dr. Sumathi (Hostel Warden) and Hostel Management';
    }
  }

  if (complaintTypeSelect && alertRecipientsText) {
    complaintTypeSelect.addEventListener('change', () => {
      const selected = complaintTypeSelect.value;
      const rec = getComplaintRecipients(selected);
      alertRecipientsText.innerHTML = `<strong>${rec}</strong>`;
    });
  }

  if (complaintForm) {
    complaintForm.addEventListener('submit', async (e) => {
      e.preventDefault();

    const studentId = studentIdInput.value.trim();
    const hostelName = hostelSelect ? hostelSelect.value : '';
    const roomNumber = roomNumberInput.value.trim();
    const complaintType = complaintTypeSelect.value;
    const description = descriptionInput.value.trim();

    if (!studentId || !roomNumber || !complaintType || !description) {
      showToast('Please fill all required complaint fields.', 'error');
      return;
    }

    const assignedRecipients = getComplaintRecipients(complaintType);

    const submitBtn = document.getElementById('btn-submit-complaint');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳</span> Submitting Complaint...';

    const complaintPayload = {
      studentId: studentId,
      hostelName: hostelName || 'Chellammal hostel',
      roomNumber: roomNumber,
      complaintType: complaintType,
      description: description,
      status: 'Pending',
      dateTime: new Date().toISOString(),
      alertRecipients: assignedRecipients
    };

    try {
      // POST to Spring Boot REST API: /api/complaints
      await apiRequest('/complaints', 'POST', complaintPayload);
      
      showToast(`🛡️ Safety complaint registered! Alert sent to: ${assignedRecipients}`, 'success');
      
      complaintForm.reset();
      if (alertRecipientsText) {
        alertRecipientsText.innerHTML = '<strong>Hostel Warden and Hostel Management</strong>';
      }

      setTimeout(() => {
        window.location.href = 'student-dashboard.html';
      }, 1500);

    } catch (error) {
      showToast(error.message || 'Failed to submit safety complaint. Please try again.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
    });
  }
});
