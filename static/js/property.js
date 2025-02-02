// EasyRent - 20251W87


// Selects navigation bar and menu button elements.
const navBar = document.querySelector("nav");
const menuBtns = document.querySelectorAll(".menu-icon");
const midNavbar = document.getElementById("mid_nav");
const overlay = document.getElementById("overlay");

// Adds event listeners to each menu button to toggle the `open` class on the navbar when clicked.
menuBtns.forEach((menuBtn) => {
  menuBtn.addEventListener("click", () => {
    navBar.classList.toggle("open");
  });
});

// Redirects the user to a specified URL.
function updateUrl(action) {
  window.location.href = action;
}

// Hides the report table and displays the report form.
function showReportForm() {
  document.getElementById("report-table-container").style.display = "none";
  document.getElementById("report-form-container").style.display = "block";
  document.getElementById("add-report-btn").style.display = "none";
}

// Hides the report form and displays the report table.
function showReportTable() {
  document.getElementById("report-table-container").style.display = "block";
  document.getElementById("report-form-container").style.display = "none";
  document.getElementById("add-report-btn").style.display = "block";
}

// Adds functionality to select a rating by clicking on stars.
document
  .getElementById("rating-stars")
  .addEventListener("click", function (event) {
    if (event.target && event.target.classList.contains("star")) {
      const ratingValue = event.target.getAttribute("data-value");
      // Sets the selected rating in a hidden input field.
      document.getElementById("professional_rating").value = ratingValue;
      // Updates the star icons based on the selected rating.
      const stars = document.querySelectorAll(".star");
      stars.forEach((star) => {
        if (parseInt(star.getAttribute("data-value")) <= ratingValue) {
          star.textContent = "★";
        } else {
          star.textContent = "☆";
        }
      });
    }
  });

// Handles the submission of the report form.
document
  .getElementById("report-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    // Retrieves form input values.
    const propertyId = document.getElementById("property_name").value;
    const faultDescription = document.getElementById("fault_description").value;
    const faultDetails = document.getElementById("fault_details").value;
    const professionalName = document.getElementById("professional_name").value;
    const professionalRating = document.getElementById(
      "professional_rating"
    ).value; 
    const photos = document.getElementById("fault_image").files;
    const formData = new FormData();
    formData.append("property_id", propertyId);
    formData.append("fault_description", faultDescription);
    formData.append("fault_details", faultDetails);
    formData.append("professional_name", professionalName);
    formData.append("professional_rating", professionalRating);
    // Checks if photos are selected and appends them to the form data.
    if (photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        formData.append("fault_image", photos[i]); 
      }
    } else {
      showErrorMessage("Please upload fault property photo.");
      return;
    }

    // Sends the form data to the server.
    try {
      const response = await fetch("/property-add-fault", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to submit report: ${response.statusText}`);
      } else {
        const data = await response.json();
        showSuccessMessage(data.message);
        // Clears the form fields after submission.
        propertyId.value = "";
        faultDescription.value = "";
        faultDetails.value = "";
        professionalName.value = "";
        professionalRating.value = "";
        photos.value = "";
        window.location.href = "/property";
      }
    } catch (error) {
      console.error("Error submitting report:", error);
    }
  });

// Fetches fault reports from the server.
function fetchFaultReports() {
  fetch("/fetch-reports")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.fault_properties) {
        populateReportTable(data.fault_properties);
      } else {
        console.error("No fault properties received.");
      }
    })
    .catch((error) => console.error("Error fetching reports:", error));
}

// Adds rows to the report table based on the fetched fault reports.
function populateReportTable(reports) {
  const tableBody = document.getElementById("report-table-body");
  tableBody.innerHTML = "";
  reports.forEach((report) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td class="border px-4 py-2">${report.property_name}</td>
            <td class="border px-4 py-2">${report.fault_description}</td>
            <td class="border px-4 py-2">${report.fault_details}</td>
            <td class="border px-4 py-2">${report.status}</td>
            <td class="border px-4 py-2">${
              report.professional_name || "N/A"
            }</td>
            <td class="border px-4 py-2">${getRatingStars(
              report.professional_rating || 0
            )}</td>
        `;
    tableBody.appendChild(row);
  });
}

// Creates a string of star icons based on the professional rating.
function getRatingStars(rating) {
  return Array.from({ length: 5 }, (_, i) => (i < rating ? "★" : "☆")).join("");
}

// Fetches fault reports when the window loads.
window.onload = function () {
  fetchFaultReports();
};

// Displays a success message for 5 seconds.
function showSuccessMessage(message) {
  const successMessageElement = document.getElementById("success-message");
  successMessageElement.innerHTML = message;
  successMessageElement.classList.remove("hidden");
  setTimeout(() => successMessageElement.classList.add("hidden"), 5000);
}

// Displays an error message for 5 seconds.
function showErrorMessage(message) {
  const errorMessageElement = document.getElementById("error-message");
  errorMessageElement.innerHTML = message;
  errorMessageElement.classList.remove("hidden");
  setTimeout(() => errorMessageElement.classList.add("hidden"), 5000);
}
