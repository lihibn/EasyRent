const navBar = document.querySelector("nav");
const menuBtns = document.querySelectorAll(".menu-icon");
const midNavbar = document.getElementById("mid_nav");
const overlay = document.getElementById("overlay");

menuBtns.forEach((menuBtn) => {
    menuBtn.addEventListener("click", () => {
        navBar.classList.toggle("open");
    });
});


const likedProperties = document.getElementById("liked-properties");
const calendarContainer = document.getElementById("calendar-container");
const timeSlotContainer = document.getElementById("time-slot-container");
const sendRequestButton = document.getElementById("send-request");
const timeSlotsContainer = document.getElementById("time-slots-container");
likedProperties.addEventListener("change", function () {
    const propertyId = likedProperties.value;

    if (propertyId) {
        console.log(propertyId);

        calendarContainer.classList.remove("hidden");

        fetch(`/meeting_slots/${propertyId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) {
                    showErrorMessage("Failed to fetch meeting slots. Please try again.");
                    throw new Error("Failed to fetch meeting slots");
                }
                return response.json();
            })
            .then(data => {
                console.log(data);

                if (Array.isArray(data)) {
                    populateCalendar(data);
                    showSuccessMessage("Meeting slots fetched successfully.");
                } else {
                    showErrorMessage("Unexpected response format received.");
                }
            })
            .catch(error => {
                showErrorMessage("An error occurred while fetching meeting slots.");
            });
    }
});


function populateCalendar(slots) {
    console.log(slots);

    const calendarDays = [...new Set(slots.map(slot => slot.date))];
    const calendarGrid = calendarContainer.querySelector(".calendar");
    calendarGrid.innerHTML = '';

    calendarDays.forEach(day => {
        const formattedDate = formatDate(day);
        const dayDiv = document.createElement('div');
        dayDiv.classList.add(
            'day', 'p-3', 'border', 'rounded-md', 'cursor-pointer',
            'text-center', 'text-lg', 'font-medium', 'text-black',
            'hover:bg-white', "hover:text-black", 'transition', 'duration-300'
        );
        dayDiv.textContent = formattedDate;
        dayDiv.dataset.date = day;
        dayDiv.addEventListener('click', () => selectDate(day, slots.filter(slot => slot.date === day)));
        calendarGrid.appendChild(dayDiv);
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });

    return `${day} ${month}`;
}


function selectDate(selectedDate, timeSlots) {
    calendarContainer.classList.add("hidden");
    timeSlotContainer.classList.remove("hidden");
    populateTimeSlots(selectedDate, timeSlots);
}

function populateTimeSlots(date, slots) {
    console.log(date);
    console.log(slots);


    const timeSlots = slots.filter(slot => slot.date === date);
    const timeSlotsContainer = document.getElementById('time-slots-container');
    timeSlotsContainer.innerHTML = '';

    timeSlots.forEach((slot) => {

        const slotDiv = document.createElement('div');
        slotDiv.classList.add('w-full', 'p-2', 'border', 'rounded-md', 'text-left', 'items-center', 'text-md', 'font-medium', 'flex', 'justify-between');

        slotDiv.textContent = `${formatDate(slot.date)}, ${slot.time} - ${slot.attendee ? 'Booked' : 'Available'}`;

        if (slot.attendee) {
            slotDiv.classList.add('bg-gray-300', 'text-gray-500');
        } else {
            slotDiv.classList.add('bg-white', 'text-black');
        }

        if (!slot.attendee) {
            const sendRequestButton = document.createElement('button');
            sendRequestButton.classList.add('bg-black', 'text-white', 'p-2', 'rounded-sm', 'hover:bg-gray-800');
            sendRequestButton.textContent = 'Send Request';
            sendRequestButton.addEventListener('click', function (event) {
                event.preventDefault();
                sendRequest(slot.id);
            });
            slotDiv.appendChild(sendRequestButton);
        }

        timeSlotsContainer.appendChild(slotDiv);
    });

    document.getElementById('time-slot-container').classList.remove('hidden');
}

function sendRequest(slotId) {
    console.log(slotId);

    fetch('/request_meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slotId }),
    })
        .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
        .then(({ ok, data }) => {
            if (ok) {
                showSuccessMessage(data.message);
            } else {
                showErrorMessage(data.message || "An error occurred.");
            }
            location.reload();
        })
        .catch((error) => {
            console.error("Error sending request:", error);
            showErrorMessage("An error occurred. Please try again.");
        });

}

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

