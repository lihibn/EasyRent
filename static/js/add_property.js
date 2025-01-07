// Sets the minimum date for date inputs to today to prevent selecting past dates.
const today = new Date().toISOString().split("T")[0];
document.getElementById("entry-date").setAttribute("min", today);
document.getElementById("calendar").setAttribute("min", today);

// Tracks the total number of meetings added.
let totalMeetings = 0;
// Holds the meeting currently being edited (if any).
let editingMeeting = null;

// Maximum number of meetings visible before "View More" is required.
const maxVisibleMeetings = 6;


// Adds a new meeting to the list.
// Checks for duplicate meetings and validates the date and time input fields.
// If successful, creates a new meeting card and adds it to the list.
function addTimeSlot() {
    const dateValue = document.getElementById("calendar").value;
    const timeValue = document.getElementById("time-slot").value;

    // Ensures both date and time are selected.
    if (!dateValue || !timeValue) {
        showErrorMessage("Please select both a date and a time.");
        return;
    }

    const meetingList = document.getElementById("meeting-list");

    // Checks if the same meeting slot already exists.
    const existingMeeting = Array.from(meetingList.children).find(item =>
        item.dataset.date === dateValue && item.dataset.time === timeValue
    );
    if (existingMeeting) {
        showErrorMessage("This meeting slot has already been added.");
        return;
    }

    // Formats the date and time for display.
    const dateObj = new Date(dateValue);
    const formattedWeekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
    const formattedDate = dateObj.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
    });
    const formattedTime = convertTo12HourFormat(timeValue);

    // Creates a new list item (meeting card).
    const listItem = document.createElement("li");
    listItem.className = "flex items-center bg-gray-100 rounded-md shadow space-x-2 meeting-card ml-0";
    listItem.dataset.date = dateValue;
    listItem.dataset.time = timeValue;

    listItem.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3M4 11h16M10 16h4" />
        </svg>
        <div class="flex-1 mr-2">
            <div class="font-semibold text-[12px]">${formattedWeekday}, ${formattedDate}</div>
            <div class="text-sm text-gray-600">${formattedTime}</div>
        </div>
        <div class="flex space-x-2">
            <button class="bg-green-500 text-white px-3 py-1 rounded" onclick="editMeeting(this)" aria-label="Edit Meeting">Edit</button>
            <button class="bg-red-500 text-white px-3 py-1 rounded" onclick="removeMeeting(this)" aria-label="Remove Meeting">Remove</button>
        </div>
    `;

    // Adds the new meeting card to the list.
    meetingList.appendChild(listItem);
    totalMeetings++;

    // Hides additional meetings if the total exceeds the maximum visible count.
    if (totalMeetings > maxVisibleMeetings) {
        document.getElementById("view-more").classList.remove("hidden");
        listItem.classList.add("hidden");
    }

    // Clears the input fields for the next entry.
    document.getElementById("calendar").value = '';
    document.getElementById("time-slot").value = '';

}


// Converts a 24-hour time format to a 12-hour format with "a.m." or "p.m.".
function convertTo12HourFormat(time) {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "p.m." : "a.m.";
    const adjustedHours = hours % 12 || 12;
    return `${adjustedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Populates the input fields with the details of a meeting to allow editing.
// Updates the "Add Meeting" button to act as an "Update Meeting" button.
function editMeeting(button) {
    const listItem = button.closest("li");
    const date = listItem.querySelector('.font-semibold').innerText;
    const time = listItem.querySelector('.text-sm').innerText;

    // Parses and reformats the date and time for the input fields.
    const [weekday, monthDay, year] = date.split(", ");
    const [month, day] = monthDay.split(" ");
    const currentYear = new Date().getFullYear();
    const dateString = `${month} ${day}, ${currentYear}`;
    const dateObj = new Date(`${month} ${day}, ${currentYear} 00:00:00 GMT`);

    if (isNaN(dateObj)) {
        console.error("Invalid date format:", dateString);
        return;
    }

    const formattedDate = dateObj.toISOString().split('T')[0];
    const [hours, minutesAndPeriod] = time.split(":");
    const [minutes, period] = minutesAndPeriod.split(" ");
    let hours24 = parseInt(hours);

    if (period.toLowerCase() === "p.m." && hours24 !== 12) {
    } else if (period.toLowerCase() === "a.m." && hours24 === 12) {
        hours24 = 0;
    }

    const formattedTime = `${hours24.toString().padStart(2, "0")}:${minutes}`;
    
    // Updates the input fields with the selected meeting details.
    const calendarInput = document.getElementById("calendar");
    const timeSlotInput = document.getElementById("time-slot");
    calendarInput.value = formattedDate;
    timeSlotInput.value = formattedTime;

    // Updates the "Add Meeting" button to "Update Meeting".
    const addButton = document.querySelector("button[onclick='addTimeSlot()']");
    addButton.textContent = "Update Meeting";
    addButton.setAttribute("onclick", "updateMeeting(this)");
    editingMeeting = listItem;
}

function updateMeeting(button) {
    const listItem = editingMeeting;
    const dateValue = document.getElementById("calendar").value;
    const timeValue = document.getElementById("time-slot").value;

    if (!dateValue || !timeValue) {
        showErrorMessage("Please select both a date and a time.");
        return;
    }

    // Creates a Date object from the selected date value and formats it for display.
    const dateObj = new Date(dateValue);
    const formattedWeekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
    const formattedDate = dateObj.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
    });
    const formattedTime = convertTo12HourFormat(timeValue);
    
    // Updates the text content of the meeting's time fields.
    listItem.querySelector('.font-semibold').textContent = `${formattedWeekday}, ${formattedDate}`;
    listItem.querySelector('.text-sm').textContent = formattedTime;

    // Resets the "Update Meeting" button to its original "Add Meeting" state.
    button.textContent = "Add Meeting";
    button.setAttribute("onclick", "addTimeSlot()");

    // Clears the date and time input fields after updating.
    document.getElementById("calendar").value = '';
    document.getElementById("time-slot").value = '';

    // Clears the reference to the meeting being edited.
    editingMeeting = null;
}

// Shows all hidden meeting cards in the list and updates the view buttons.
function viewMore() {
    const meetingList = document.getElementById("meeting-list");
    const viewMoreButton = document.getElementById("view-more");
    const viewLessButton = document.getElementById("view-less");

    // Finds all hidden meeting cards and makes them visible.
    const hiddenCards = meetingList.querySelectorAll(".meeting-card.hidden");
    hiddenCards.forEach(card => {
        card.classList.remove("hidden");
    });

    // Hides the "View More" button and shows the "View Less" button.
    viewMoreButton.classList.add("hidden");
    viewLessButton.classList.remove("hidden");
}

// Hides all meeting cards that exceed the maximum visible count and updates the view buttons.
function viewLess() {
    const meetingList = document.getElementById("meeting-list");
    const viewMoreButton = document.getElementById("view-more");
    const viewLessButton = document.getElementById("view-less");

    // Finds all meeting cards and hides those exceeding the maximum visible count.
    const allCards = meetingList.querySelectorAll(".meeting-card");
    allCards.forEach((card, index) => {
        if (index >= maxVisibleMeetings) {
            card.classList.add("hidden");
        }
    });

    // Shows the "View More" button and hides the "View Less" button.
    viewMoreButton.classList.remove("hidden");
    viewLessButton.classList.add("hidden");
}

// Removes a meeting card from the list and updates the total meetings count.
function removeMeeting(button) {
    const listItem = button.closest("li");
    listItem.remove();
    totalMeetings--;

    // Hides the "View More" button if the total meetings are less than or equal to the maximum visible count.
    if (totalMeetings <= 6) {
        document.getElementById("view-more").classList.add("hidden");
    }

    ;
}

// Updates the progress bar and initializes the first step on page load.
window.addEventListener('load', function () {
    updateProgressBar(1, 4);
});

// Validates the current step and progresses to the next step if valid.
function validateStep(step) {
    const currentStep = document.getElementById(`step-${step}`);
    const nextStep = document.getElementById(`step-${step + 1}`);
    const progressBar = document.getElementById(`progress-bar-step-${step}`);

    // Validate inputs.
    const inputs = currentStep.querySelectorAll("input, select, textarea");
    let isValid = validateInputs(inputs);

    // Additional validations for specific steps.
    if (step === 1) {
        isValid = validatePhotos(isValid);
    }

    if (step === 3) {
        isValid = validateMeetings(isValid);
    }

    if (step === 4) {
        isValid = validateContract(isValid);
    }

    // Proceed or show error.
    if (isValid) {
        progressBar.style.width = "100%";
        currentStep.classList.add("hidden");
        if (nextStep) nextStep.classList.remove("hidden");
        updateProgressBar(step + 1, 4);
    } else {
        showErrorMessage("Please fill in all required fields.");
    }
}

// Validate all inputs for the current step.
function validateInputs(inputs) {
    let isValid = true;
    inputs.forEach(input => {
        if (!input.checkValidity()) {
            isValid = false;
        }
    });
    return isValid;
}

// Validate property photos.
function validatePhotos(isValid) {
    const photos = document.getElementById("property-photos").files;
    if (photos.length === 0) {
        isValid = false;
        showErrorMessage("Please upload at least one property photo.");
    }
    return isValid;
}

// Validate meetings in step 3.
function validateMeetings(isValid) {
    const meetingList = document.getElementById("meeting-list");
    const meetings = meetingList.querySelectorAll("li");
    if (meetings.length === 0) {
        isValid = false;
        showErrorMessage("Please add at least one meeting.");
    }
    return isValid;
}

// Validate contract file in step 4.
function validateContract(isValid) {
    const contractUpload = document.getElementById("contract-upload").files[0];
    if (!contractUpload) {
        isValid = false;
        showErrorMessage("Please upload a valid contract file.");
    }
    return isValid;
}

function goBackToListing() {
    document.querySelectorAll('.step').forEach(step => step.classList.add('hidden'));

    document.getElementById('step-2').classList.remove('hidden');

    updateProgressBar(2);
}

// Function to go back one step.
function goBack(stepNumber) {
    document.querySelectorAll('.step').forEach(step => step.classList.add('hidden'));

    document.getElementById('step-' + stepNumber).classList.remove('hidden');

    updateProgressBar(stepNumber);
}

// Function to update the progress bar based on the current step.
function updateProgressBar(step) {
    for (let i = 1; i <= 4; i++) {
        let progressBar = document.getElementById('progress-bar-step-' + i);
        if (i <= step) {
            progressBar.style.width = '100%';
        } else {
            progressBar.style.width = '0%';
        }
    }
}

// Collects input values from the form.
document.getElementById("propertyForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const propertyName = document.getElementById("property-name").value;
    const city = document.getElementById("city").value;
    const street = document.getElementById("street").value;
    const houseNumber = document.getElementById("house-number").value;
    const entrance = document.getElementById("entrance").value;
    const floor = document.getElementById("floor").value;
    const propertyType = document.getElementById("property-type").value;
    const airflow = document.getElementById("airflow").value;
    const rooms = document.getElementById("rooms").value;
    const squareMeters = document.getElementById("square-meters").value;
    const photos = document.getElementById("property-photos").files;
    const comments = document.getElementById("comments").value;
    const monthlyRent = document.getElementById("monthly-rent").value;
    const buildingMaintenance = document.getElementById("building-maintenance").value;
    const entryDate = document.getElementById("entry-date").value;
    const contractUpload = document.getElementById("contract-upload").files[0];
    const formData = new FormData();

    // Appends form fields to the FormData object.
    formData.append("propertyName", propertyName);
    formData.append("city", city);
    formData.append("street", street);
    formData.append("house_number", houseNumber);
    formData.append("entrance", entrance);
    formData.append("floor", floor);
    formData.append("property_type", propertyType);
    formData.append("airflow", airflow);
    formData.append("rooms", rooms);
    formData.append("square_meters", squareMeters);
    formData.append("comments", comments);
    formData.append("monthly_rent", monthlyRent);
    formData.append("building_maintenance", buildingMaintenance);
    formData.append("entry_date", entryDate);
    formData.append("contract_path", contractUpload);

    // Collects all meeting details from the meeting list.
    const meetings = [];
    const meetingList = document.getElementById("meeting-list").children;
    for (let i = 0; i < meetingList.length; i++) {
        const meetingItem = meetingList[i];
        const date = meetingItem.dataset.date;
        const time = meetingItem.dataset.time;
        meetings.push({ date, time });
    }
    console.log(meetings);

    // Adds meeting details to FormData if meetings exist.
    if (meetings.length > 0) {
        formData.append("meetings", JSON.stringify(meetings));
    }

    // Adds property photos to FormData.
    if (photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
            formData.append("property_photos", photos[i]);
        }
    } else {
        showErrorMessage("Please upload property photo.");
        return;
    }
    

    // Sends the form data to the server using a POST request.
    try {
        const response = await fetch("/property/add-property", {
            method: "POST",
            body: formData,
        });
        if (!response.ok) {
            const errorData = await response.json();
            showErrorMessage(`Error: ${errorData.error}`);
            return;
        }
        const responseData = await response.json();
        console.log(responseData);

        // Shows a success message and redirects the user.
        showSuccessMessage(responseData.message);
        window.location.href = "/property";
        document.getElementById("propertyForm").reset();
    } catch (error) {
        console.error();
        showErrorMessage("Error submitting form:", error);
    }
});

// Function to display a success message.
function showSuccessMessage(message) {
    const successMessageElement = document.getElementById("success-message");
    successMessageElement.innerHTML = message;
    successMessageElement.classList.remove("hidden");
    setTimeout(() => successMessageElement.classList.add("hidden"), 5000);
}

// Function to display an error message.
function showErrorMessage(message) {
    const errorMessageElement = document.getElementById("error-message");
    errorMessageElement.innerHTML = message;
    errorMessageElement.classList.remove("hidden");
    setTimeout(() => errorMessageElement.classList.add("hidden"), 5000);
}

