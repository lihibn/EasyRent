const navBar = document.querySelector("nav");
const menuBtns = document.querySelectorAll(".menu-icon");
const midNavbar = document.getElementById("mid_nav");
const overlay = document.getElementById("overlay");

menuBtns.forEach((menuBtn) => {
  menuBtn.addEventListener("click", () => {
    navBar.classList.toggle("open");
  });
});

function updateUrl(action) {
  window.location.href = action;
}

///////////////// Report Page
function showReportForm() {
  document.getElementById("report-table-container").style.display = "none";
  document.getElementById("report-form-container").style.display = "block";
  document.getElementById("add-report-btn").style.display = "none";
}

function showReportTable() {
  document.getElementById("report-table-container").style.display = "block";
  document.getElementById("report-form-container").style.display = "none";
  document.getElementById("add-report-btn").style.display = "block";
}
document
  .getElementById("rating-stars")
  .addEventListener("click", function (event) {
    if (event.target && event.target.classList.contains("star")) {
      const ratingValue = event.target.getAttribute("data-value");

      document.getElementById("professional_rating").value = ratingValue;

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

document
  .getElementById("report-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const propertyId = document.getElementById("property_name").value;
    const faultDescription = document.getElementById("fault_description").value;
    const faultDetails = document.getElementById("fault_details").value;
    const professionalName = document.getElementById("professional_name").value;
    const professionalRating = document.getElementById(
      "professional_rating"
    ).value; // Get selected rating
    const photos = document.getElementById("fault_image").files; // Get files from the input field

    const formData = new FormData();
    formData.append("property_id", propertyId);
    formData.append("fault_description", faultDescription);
    formData.append("fault_details", faultDetails);
    formData.append("professional_name", professionalName);
    formData.append("professional_rating", professionalRating);

    // Check if photos are selected
    if (photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        formData.append("fault_image", photos[i]); // Append each file as "fault_image"
      }
    } else {
      showErrorMessage("Please upload fault property photo.");
      return;
    }

    // Send data to the server
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

// Function to populate the report table with fetched data
function populateReportTable(reports) {
  const tableBody = document.getElementById("report-table-body");
  tableBody.innerHTML = ""; // Clear existing rows

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

// Utility function to generate rating stars based on professional rating
function getRatingStars(rating) {
  return Array.from({ length: 5 }, (_, i) => (i < rating ? "★" : "☆")).join("");
}

window.onload = function () {
  fetchFaultReports();
};

function showSuccessMessage(message) {
  const successMessageElement = document.getElementById("success-message");
  successMessageElement.innerHTML = message;
  successMessageElement.classList.remove("hidden");
  setTimeout(() => successMessageElement.classList.add("hidden"), 5000);
}

function showErrorMessage(message) {
  const errorMessageElement = document.getElementById("error-message");
  errorMessageElement.innerHTML = message;
  errorMessageElement.classList.remove("hidden");
  setTimeout(() => errorMessageElement.classList.add("hidden"), 5000);
}
