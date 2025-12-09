document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select options (keep placeholder)
      if (activitySelect) activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <strong>Participants:</strong>
            <ul>
              ${details.participants.length > 0 ? details.participants.map(participant => `<li class="participant-item"><span class="participant-email">${participant}</span><button class="delete-btn" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(participant)}" title="Unregister">✕</button></li>`).join('') : '<li class="participant-item">No participants yet</li>'}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Attach delete handlers for this card
        const deleteButtons = activityCard.querySelectorAll('.delete-btn');
        deleteButtons.forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const email = decodeURIComponent(btn.getAttribute('data-email'));
            const activity = decodeURIComponent(btn.getAttribute('data-activity'));
            const li = btn.closest('li');

            try {
              const res = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
              const json = await res.json();

              if (res.ok) {
                // Remove the participant element from the DOM
                if (li) li.remove();
                showMessage(json.message || `Unregistered ${email} from ${activity}`, 'success');
                // Optionally refresh availability count by re-fetching activities
                // For now, just update the spots text by re-fetching full list
                // A conservative approach: refresh whole activities list
                setTimeout(fetchActivities, 300);
              } else {
                showMessage(json.detail || 'Failed to unregister participant', 'error');
              }
            } catch (err) {
              console.error('Error unregistering participant:', err);
              showMessage('Failed to unregister participant', 'error');
            }
          });
        });

        // Add option to select dropdown
        if (activitySelect) {
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          activitySelect.appendChild(option);
        }
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function showMessage(text, type) {
    if (!messageDiv) return;
    messageDiv.textContent = text;
    messageDiv.className = type === 'success' ? 'message success' : 'message error';
    messageDiv.classList.remove('hidden');
    setTimeout(() => messageDiv.classList.add('hidden'), 4000);
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, 'success');
        signupForm.reset();
        // Refresh activities list so UI reflects the new participant
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", 'error');
      }
      
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", 'error');
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
