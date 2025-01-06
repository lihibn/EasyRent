const today = new Date().toISOString().split("T")[0];
document.getElementById("entry-date").setAttribute("min", today);
document.getElementById("calendar").setAttribute("min", today);

let totalMeetings = 0;
let editingMeeting = null;

const maxVisibleMeetings = 6;

function addTimeSlot() {
    const dateValue = document.getElementById("calendar").value;
    const timeValue = document.getElementById("time-slot").value;

    if (!dateValue || !timeValue) {
        showErrorMessage("Please select both a date and a time.");
        return;
    }

    const meetingList = document.getElementById("meeting-list");

    const existingMeeting = Array.from(meetingList.children).find(item =>
        item.dataset.date === dateValue && item.dataset.time === timeValue
    );
    if (existingMeeting) {
        showErrorMessage("This meeting slot has already been added.");
        return;
    }

    const dateObj = new Date(dateValue);
    const formattedWeekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
    const formattedDate = dateObj.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
    });
    const formattedTime = convertTo12HourFormat(timeValue);

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

    meetingList.appendChild(listItem);
    totalMeetings++;

    if (totalMeetings > maxVisibleMeetings) {
        document.getElementById("view-more").classList.remove("hidden");
        listItem.classList.add("hidden");
    }

    document.getElementById("calendar").value = '';
    document.getElementById("time-slot").value = '';

}


function convertTo12HourFormat(time) {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "p.m." : "a.m.";
    const adjustedHours = hours % 12 || 12;
    return `${adjustedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function editMeeting(button) {
    const listItem = button.closest("li");
    const date = listItem.querySelector('.font-semibold').innerText;
    const time = listItem.querySelector('.text-sm').innerText;

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

    const calendarInput = document.getElementById("calendar");
    const timeSlotInput = document.getElementById("time-slot");

    calendarInput.value = formattedDate;
    timeSlotInput.value = formattedTime;

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

    const dateObj = new Date(dateValue);
    const formattedWeekday = dateObj.toLocaleDateString("en-US", { weekday: "short" });
    const formattedDate = dateObj.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
    });
    const formattedTime = convertTo12HourFormat(timeValue);

    listItem.querySelector('.font-semibold').textContent = `${formattedWeekday}, ${formattedDate}`;
    listItem.querySelector('.text-sm').textContent = formattedTime;

    button.textContent = "Add Meeting";
    button.setAttribute("onclick", "addTimeSlot()");

    document.getElementById("calendar").value = '';
    document.getElementById("time-slot").value = '';

    editingMeeting = null;

}

function viewMore() {
    const meetingList = document.getElementById("meeting-list");
    const viewMoreButton = document.getElementById("view-more");
    const viewLessButton = document.getElementById("view-less");

    const hiddenCards = meetingList.querySelectorAll(".meeting-card.hidden");
    hiddenCards.forEach(card => {
        card.classList.remove("hidden");
    });

    viewMoreButton.classList.add("hidden");
    viewLessButton.classList.remove("hidden");
}

function viewLess() {
    const meetingList = document.getElementById("meeting-list");
    const viewMoreButton = document.getElementById("view-more");
    const viewLessButton = document.getElementById("view-less");

    const allCards = meetingList.querySelectorAll(".meeting-card");
    allCards.forEach((card, index) => {
        if (index >= maxVisibleMeetings) {
            card.classList.add("hidden");
        }
    });

    viewMoreButton.classList.remove("hidden");
    viewLessButton.classList.add("hidden");
}

function removeMeeting(button) {
    const listItem = button.closest("li");
    listItem.remove();
    totalMeetings--;

    if (totalMeetings <= 6) {
        document.getElementById("view-more").classList.add("hidden");
    }

    ;
}

window.addEventListener('load', function () {
    updateProgressBar(1, 4);
});

function validateStep(step) {
    const currentStep = document.getElementById(`step-${step}`);
    const nextStep = document.getElementById(`step-${step + 1}`);
    const progressBar = document.getElementById(`progress-bar-step-${step}`);

    // Validate inputs
    const inputs = currentStep.querySelectorAll("input, select, textarea");
    let isValid = validateInputs(inputs);

    // Additional validations for specific steps
    if (step === 1) {
        isValid = validatePhotos(isValid);
    }

    if (step === 3) {
        isValid = validateMeetings(isValid);
    }

    if (step === 4) {
        isValid = validateContract(isValid);
    }

    // Proceed or show error
    if (isValid) {
        progressBar.style.width = "100%";
        currentStep.classList.add("hidden");
        if (nextStep) nextStep.classList.remove("hidden");
        updateProgressBar(step + 1, 4);
    } else {
        showErrorMessage("Please fill in all required fields.");
    }
}

// Validate all inputs for the current step
function validateInputs(inputs) {
    let isValid = true;
    inputs.forEach(input => {
        if (!input.checkValidity()) {
            isValid = false;
        }
    });
    return isValid;
}

// Validate property photos
function validatePhotos(isValid) {
    const photos = document.getElementById("property-photos").files;
    if (photos.length === 0) {
        isValid = false;
        showErrorMessage("Please upload at least one property photo.");
    }
    return isValid;
}

// Validate meetings in step 3
function validateMeetings(isValid) {
    const meetingList = document.getElementById("meeting-list");
    const meetings = meetingList.querySelectorAll("li");
    if (meetings.length === 0) {
        isValid = false;
        showErrorMessage("Please add at least one meeting.");
    }
    return isValid;
}

// Validate contract file in step 4
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

// Function to go back one step
function goBack(stepNumber) {
    document.querySelectorAll('.step').forEach(step => step.classList.add('hidden'));

    document.getElementById('step-' + stepNumber).classList.remove('hidden');

    updateProgressBar(stepNumber);
}

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

    const meetings = [];
    const meetingList = document.getElementById("meeting-list").children;
    for (let i = 0; i < meetingList.length; i++) {
        const meetingItem = meetingList[i];
        const date = meetingItem.dataset.date;
        const time = meetingItem.dataset.time;
        meetings.push({ date, time });
    }
    console.log(meetings);


    if (meetings.length > 0) {
        formData.append("meetings", JSON.stringify(meetings));
    }

    if (photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
            formData.append("property_photos", photos[i]);
        }
    } else {
        showErrorMessage("Please upload property photo.");
        return;
    }

    // Add contract file to FormData
    // if (contractUpload) {
    //     formData.append("contract_path", contractUpload);
    // } else {
    //     showErrorMessage("Please upload a valid contract file.");
    //     return;
    // }



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

        showSuccessMessage(responseData.message);
        window.location.href = "/property";
        document.getElementById("propertyForm").reset();
    } catch (error) {
        console.error();
        showErrorMessage("Error submitting form:", error);
    }
});

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

