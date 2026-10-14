/**
 * JavaScript handler for Emergency Reporting Form
 * Connects frontend form with Spring Boot REST API
 */

document.addEventListener('DOMContentLoaded', () => {
  const typeSelect = document.getElementById('emergencyType');
  const alertRecipientText = document.getElementById('alert-recipient-text');
  const emergencyForm = document.getElementById('emergency-form');
  const studentNameInput = document.getElementById('studentName');
  const studentIdInput = document.getElementById('studentId');
  const roomNumberInput = document.getElementById('roomNumber');
  const descriptionInput = document.getElementById('description');
  const hostelSelect = document.getElementById('hostelName');

  // Pre-fill student data if logged in
  const loggedInStudent = AuthService.getStudent();
  if (loggedInStudent) {
    if (studentNameInput) studentNameInput.value = loggedInStudent.studentName || '';
    if (studentIdInput) studentIdInput.value = loggedInStudent.studentId || '';
    if (hostelSelect && loggedInStudent.hostelName) {
      hostelSelect.value = loggedInStudent.hostelName;
    }
    if (roomNumberInput && loggedInStudent.roomNumber) {
      roomNumberInput.value = loggedInStudent.roomNumber;
    }
  }

  // Exact Alert Destination Rules (Without displaying raw mobile numbers inside alert box)
  const recipientMap = {
    '': 'Please select an emergency type. Alert will be sent to Chief Warden & Hostel Management.',
    'Medical Emergency': 'Dr. Sumathi (Chief Warden), Hostel Management, Doctor and Nurse',
    'Fire Emergency': 'Dr. Sumathi (Hostel Warden), Hostel Management and Fire Emergency Team',
    'Security Emergency': 'Dr. Sumathi (Hostel Warden), Hostel Management, Hostel Security and Bouncers',
    'Electrical Emergency': 'Electrician, Dr. Sumathi (Chief Warden) and Hostel Management',
    'Other': 'Dr. Sumathi (Hostel Warden) and Hostel Management'
  };

  function getRecipientsForType(type) {
    if (type && recipientMap[type]) {
      return recipientMap[type];
    }
    const typ = (type || '').toLowerCase();
    if (typ.includes('medical') || typ.includes('illness') || typ.includes('injury')) {
      return recipientMap['Medical Emergency'];
    }
    if (typ.includes('electric') || typ.includes('spark')) {
      return recipientMap['Electrical Emergency'];
    }
    if (typ.includes('fire') || typ.includes('flame') || typ.includes('smoke')) {
      return recipientMap['Fire Emergency'];
    }
    if (typ.includes('security') || typ.includes('intruder')) {
      return recipientMap['Security Emergency'];
    }
    return recipientMap['Other'];
  }

  // Type dropdown change event
  if (typeSelect && alertRecipientText) {
    typeSelect.addEventListener('change', () => {
      const selectedType = typeSelect.value;
      if (selectedType && recipientMap[selectedType]) {
        alertRecipientText.innerHTML = `<strong>${recipientMap[selectedType]}</strong>`;
      } else {
        alertRecipientText.textContent = recipientMap[''];
      }
    });
  }

  // Emergency Form Submit Event
  if (emergencyForm) {
    emergencyForm.addEventListener('submit', async (e) => {
      e.preventDefault();

    const studentName = studentNameInput.value.trim();
    const studentId = studentIdInput.value.trim();
    const hostelName = hostelSelect ? hostelSelect.value : '';
    const emergencyType = typeSelect.value;
    const roomNumber = roomNumberInput.value.trim();
    const description = descriptionInput.value.trim();
    const imageUpload = document.getElementById('imageUpload');

    if (!studentName || !studentId || !emergencyType || !roomNumber || !description) {
      showToast('Please fill in all required emergency details.', 'error');
      return;
    }

    const assignedRecipients = getRecipientsForType(emergencyType);

    const submitBtn = document.getElementById('btn-submit-emergency');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳</span> DISPATCHING ALERT...';

    const emergencyPayload = {
      studentName: studentName,
      studentId: studentId,
      hostelName: hostelName || 'Chellammal hostel',
      emergencyCategory: emergencyType,
      emergencyType: emergencyType,
      roomNumber: roomNumber,
      description: description,
      status: 'Pending',
      dateTime: new Date().toISOString(),
      hasImage: !!(imageUpload && imageUpload.files.length > 0),
      alertRecipients: assignedRecipients
    };

    try {
      // POST to Spring Boot REST API: /api/emergencies
      const response = await apiRequest('/emergencies', 'POST', emergencyPayload);
      
      showToast(`🚨 Alert broadcasted to: ${assignedRecipients}`, 'success');
      
      if (response && response.id) {
        localStorage.setItem('last_reported_emergency_id', response.id);
      }

      emergencyForm.reset();
      typeSelect.value = '';
      if (alertRecipientText) {
        alertRecipientText.textContent = recipientMap[''];
      }

      setTimeout(() => {
        window.location.href = 'student-dashboard.html';
      }, 1500);

    } catch (error) {
      showToast(error.message || 'Failed to dispatch emergency alert. Please call warden helpline directly at 7305004032.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  });
}
});
