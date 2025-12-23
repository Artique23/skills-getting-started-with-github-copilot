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

      // Clear loading message and reset activity select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        let participantsHtml = "";
        if (details.participants && details.participants.length > 0) {
          participantsHtml = `<ul class="participants-list">` +
            details.participants.map(p => {
              const safe = escapeHtml(p);
              const initials = initialsFromEmail(p);
              return `<li><span class="participant-badge">${initials}</span><span class="participant-name">${safe}</span><button class="participant-remove" data-activity="${escapeHtml(name)}" data-email="${escapeHtml(p)}" aria-label="Remove participant">&times;</button></li>`;
            }).join("") +
            `</ul>`;
        } else {
          participantsHtml = `<p class="participants-empty">No participants yet</p>`;
        }

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants-section">
            <div class="section-title"><strong>Participants</strong></div>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
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
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show the newly signed-up participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Add helper to escape HTML and get initials
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initialsFromEmail(email) {
    // Use part before @, split on non-alnum, take up to two initials
    const name = (email || "").split("@")[0];
    const parts = name.split(/[^a-zA-Z0-9]+/).filter(Boolean);
    if (parts.length === 0) return email.slice(0,1).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Delegate clicks on participant remove buttons to unregister participants
  activitiesList.addEventListener("click", async (evt) => {
    const btn = evt.target.closest(".participant-remove");
    if (!btn) return;

    const activity = btn.dataset.activity;
    const email = btn.dataset.email;
    if (!activity || !email) return;

    if (!confirm(`Unregister ${email} from ${activity}?`)) return;

    try {
      const res = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        messageDiv.textContent = json.message;
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
        // Refresh activities to reflect change
        fetchActivities();
      } else {
        messageDiv.textContent = json.detail || "Failed to remove participant";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }
      setTimeout(() => messageDiv.classList.add("hidden"), 4000);
    } catch (err) {
      console.error("Error removing participant:", err);
      messageDiv.textContent = "Failed to remove participant. Try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 4000);
    }
  });

  // Initialize app
  fetchActivities();
});
