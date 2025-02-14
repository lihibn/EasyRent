// EasyRent - 20251W87


// Selects the navbar, menu buttons, and overlay elements from the DOM.
const navBar = document.querySelector("nav");
const menuBtns = document.querySelectorAll(".menu-icon");
const midNavbar = document.getElementById("mid_nav");
const overlay = document.getElementById("overlay"); 

// Adds a click event listener to each menu button to toggle the "open" class on the navbar.
menuBtns.forEach((menuBtn) => {
  menuBtn.addEventListener("click", () => {
    navBar.classList.toggle("open");
  });
});

// Waits for the DOM to fully load before adding functionality to the filter form.
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("filter-form")
    .addEventListener("submit", function (e) {
      e.preventDefault(); 

      // Retrieves the filter values entered by the user.
      const city = document.getElementById("city").value.trim();
      const minPrice = document.getElementById("price-min").value || 0;
      const maxPrice = document.getElementById("price-max").value || 9999999;
      console.log(minPrice);
      const propertyType = document
        .getElementById("property-type")
        .value.trim();
      const rooms = document.getElementById("rooms").value;

      const queryParams = new URLSearchParams({
        city,
        price_min: minPrice,
        price_max: maxPrice,
        property_type: propertyType,
        rooms,
      });
      
      // Validates that all filter values are greater than zero.
      if (minPrice <= 0 || maxPrice <= 0 || rooms <= 0) {
        showErrorMessage("The values for Price-Min, Price-Max, and Rooms must be greater than zero");
      } else {
        // Sends a GET request to the server with the query parameters for property filtering.
        fetch(`/property/filter-search?${queryParams.toString()}`)
          .then((response) => {
            console.log(response);

            // Checks if the response is not successful and displays an error message if no properties are found.
            if (!response.ok) {
              showErrorMessage("No properties found matching the criteria.");
            }
            return response.json();
          })
          .then((data) => {
            console.log(data);

            // Extracts properties from the server response or sets an empty array if none exist.
            const properties = data.properties || [];
            const filteredSection = document.getElementById("filteredProperties");
            const propertyCardsContainer = filteredSection.querySelector(".grid");
            propertyCardsContainer.innerHTML = "";

            // Iterates over the array of properties and creates a card for each property.
            if (properties.length > 0) {
              properties.forEach((property) => {
                console.log(property.square_meters);

                const propertyCard = document.createElement("div");
                propertyCard.classList.add(
                  "bg-white",
                  "border",
                  "border-gray-200",
                  "rounded-sm",
                  "overflow-hidden"
                );
                // Populates the property card with property details such as name, city, rooms, and price.
                propertyCard.innerHTML = `
             <div class="relative">
              <img src=${property.propertyImg
                  } alt="Property Image" class="w-full h-56 object-cover" />
            </div>
           <div class="p-4">
        <h3 class="text-lg font-bold text-gray-800 mb-2 text-start">${property.propertyName
                  }</h3>
        <div class="flex justify-between text-gray-600 mb-4 text-xs">
            <div class="flex justify-between space-x-2">
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="#878787" viewBox="0 0 24 24">
                    <path
                        d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
                </svg>
                <p clas="text-[12px]">${property.city}</p>
            </div>
            <div class="flex justify-between space-x-2 mr-1">
                <svg fill="#878787" viewBox="0 0 50 50" class="w-4 h-4" xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                        <path
                            d="M5 10C3.355469 10 2 11.355469 2 13L2 28.1875C2.003906 28.25 2.015625 28.3125 2.03125 28.375C2.03125 28.386719 2.03125 28.394531 2.03125 28.40625C1.582031 29.113281 1.214844 29.867188 0.9375 30.6875C0.316406 32.519531 0.0507813 34.621094 0 37L0 38C0 38.03125 0 38.0625 0 38.09375L0 50L7 50L7 46C7 45.167969 7.203125 44.734375 7.46875 44.46875C7.734375 44.203125 8.167969 44 9 44L41 44C41.832031 44 42.265625 44.203125 42.53125 44.46875C42.796875 44.734375 43 45.167969 43 46L43 50L50 50L50 38.15625C50.003906 38.105469 50.003906 38.050781 50 38C50 37.65625 50.007813 37.332031 50 37C49.949219 34.621094 49.683594 32.519531 49.0625 30.6875C48.785156 29.875 48.414063 29.136719 47.96875 28.4375C47.988281 28.355469 48 28.273438 48 28.1875L48 13C48 11.355469 46.644531 10 45 10 Z M 5 12L45 12C45.5625 12 46 12.4375 46 13L46 26.15625C45.753906 25.949219 45.492188 25.75 45.21875 25.5625C44.550781 25.101563 43.824219 24.671875 43 24.3125L43 20C43 19.296875 42.539063 18.75 42.03125 18.40625C41.523438 18.0625 40.902344 17.824219 40.125 17.625C38.570313 17.226563 36.386719 17 33.5 17C30.613281 17 28.429688 17.226563 26.875 17.625C26.117188 17.820313 25.5 18.042969 25 18.375C24.5 18.042969 23.882813 17.820313 23.125 17.625C21.570313 17.226563 19.386719 17 16.5 17C13.613281 17 11.429688 17.226563 9.875 17.625C9.097656 17.824219 8.476563 18.0625 7.96875 18.40625C7.460938 18.75 7 19.296875 7 20L7 24.3125C6.175781 24.671875 5.449219 25.101563 4.78125 25.5625C4.507813 25.75 4.246094 25.949219 4 26.15625L4 13C4 12.4375 4.4375 12 5 12 Z M 16.5 19C19.28125 19 21.34375 19.234375 22.625 19.5625C23.265625 19.726563 23.707031 19.925781 23.90625 20.0625C23.988281 20.117188 23.992188 20.125 24 20.125L24 22C17.425781 22.042969 12.558594 22.535156 9 23.625L9 20.125C9.007813 20.125 9.011719 20.117188 9.09375 20.0625C9.292969 19.925781 9.734375 19.726563 10.375 19.5625C11.65625 19.234375 13.71875 19 16.5 19 Z M 33.5 19C36.28125 19 38.34375 19.234375 39.625 19.5625C40.265625 19.726563 40.707031 19.925781 40.90625 20.0625C40.988281 20.117188 40.992188 20.125 41 20.125L41 23.625C37.441406 22.535156 32.574219 22.042969 26 22L26 20.125C26.007813 20.125 26.011719 20.117188 26.09375 20.0625C26.292969 19.925781 26.734375 19.726563 27.375 19.5625C28.65625 19.234375 30.71875 19 33.5 19 Z M 24.8125 24C24.917969 24.015625 25.019531 24.015625 25.125 24C25.15625 24 25.1875 24 25.21875 24C35.226563 24.015625 41.007813 25.0625 44.09375 27.1875C45.648438 28.257813 46.589844 29.585938 47.1875 31.34375C47.707031 32.875 47.917969 34.761719 47.96875 37L2.03125 37C2.082031 34.761719 2.292969 32.875 2.8125 31.34375C3.410156 29.585938 4.351563 28.257813 5.90625 27.1875C8.992188 25.058594 14.785156 24.011719 24.8125 24 Z M 2 39L48 39L48 48L45 48L45 46C45 44.832031 44.703125 43.765625 43.96875 43.03125C43.234375 42.296875 42.167969 42 41 42L9 42C7.832031 42 6.765625 42.296875 6.03125 43.03125C5.296875 43.765625 5 44.832031 5 46L5 48L2 48Z">
                        </path>
                    </g>
                </svg>
                <p>${property.rooms} Bedroom</p>
            </div>
            <div class="flex justify-between space-x-2 mr-1">
                <svg viewBox="0 0 48 48" fill="none" class="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M9 18C8.44772 18 8 18.4477 8 19V42H6V19C6 17.3431 7.34315 16 9 16H21C22.6569 16 24 17.3431 24 19V42H22V19C22 18.4477 21.5523 18 21 18H9Z"
                            fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M39 20H32V18H39C40.6569 18 42 19.3431 42 21V42H40V21C40 20.4477 39.5523 20 39 20Z"
                            fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M18 6C17.4477 6 17 6.44772 17 7V17H15V7C15 5.34315 16.3431 4 18 4H30C31.6569 4 33 5.34315 33 7V42H31V7C31 6.44772 30.5523 6 30 6H18Z"
                            fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M44 44H4V42H44V44Z" fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M20 8C19.4477 8 19 8.44772 19 9V11C19 11.5523 19.4477 12 20 12H22C22.5523 12 23 11.5523 23 11V9C23 8.44772 22.5523 8 22 8H20Z"
                            fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M11 20C10.4477 20 10 20.4477 10 21V23C10 23.5523 10.4477 24 11 24H13C13.5523 24 14 23.5523 14 23V21C14 20.4477 13.5523 20 13 20H11Z"
                            fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M17 20C16.4477 20 16 20.4477 16 21V23C16 23.5523 16.4477 24 17 24H19C19.5523 24 20 23.5523 20 23V21C20 20.4477 19.5523 20 19 20H17Z"
                            fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M20 14C19.4477 14 19 14.4477 19 15V17C19 17.5523 19.4477 18 20 18H22C22.5523 18 23 17.5523 23 17V15C23 14.4477 22.5523 14 22 14H20Z"
                            fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M11 26C10.4477 26 10 26.4477 10 27V29C10 29.5523 10.4477 30 11 30H13C13.5523 30 14 29.5523 14 29V27C14 26.4477 13.5523 26 13 26H11Z"
                            fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M11 32C10.4477 32 10 32.4477 10 33V35C10 35.5523 10.4477 36 11 36H13C13.5523 36 14 35.5523 14 35V33C14 32.4477 13.5523 32 13 32H11Z"
                            fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M17 26C16.4477 26 16 26.4477 16 27V29C16 29.5523 16.4477 30 17 30H19C19.5523 30 20 29.5523 20 29V27C20 26.4477 19.5523 26 19 26H17Z"
                            fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M17 32C16.4477 32 16 32.4477 16 33V35C16 35.5523 16.4477 36 17 36H19C19.5523 36 20 35.5523 20 35V33C20 32.4477 19.5523 32 19 32H17Z"
                            fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M26 8C25.4477 8 25 8.44772 25 9V11C25 11.5523 25.4477 12 26 12H28C28.5523 12 29 11.5523 29 11V9C29 8.44772 28.5523 8 28 8H26Z"
                            fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M26 14C25.4477 14 25 14.4477 25 15V17C25 17.5523 25.4477 18 26 18H28C28.5523 18 29 17.5523 29 17V15C29 14.4477 28.5523 14 28 14H26Z"
                            fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M26 20C25.4477 20 25 20.4477 25 21V23C25 23.5523 25.4477 24 26 24H28C28.5523 24 29 23.5523 29 23V21C29 20.4477 28.5523 20 28 20H26Z"
                            fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M26 26C25.4477 26 25 26.4477 25 27V29C25 29.5523 25.4477 30 26 30H28C28.5523 30 29 29.5523 29 29V27C29 26.4477 28.5523 26 28 26H26Z"
                            fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M35 22C34.4477 22 34 22.4477 34 23V25C34 25.5523 34.4477 26 35 26H37C37.5523 26 38 25.5523 38 25V23C38 22.4477 37.5523 22 37 22H35Z"
                            fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M35 28C34.4477 28 34 28.4477 34 29V31C34 31.5523 34.4477 32 35 32H37C37.5523 32 38 31.5523 38 31V29C38 28.4477 37.5523 28 37 28H35Z"
                            fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M35 34C34.4477 34 34 34.4477 34 35V37C34 37.5523 34.4477 38 35 38H37C37.5523 38 38 37.5523 38 37V35C38 34.4477 37.5523 34 37 34H35Z"
                            fill="#878787"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M26 32C25.4477 32 25 32.4477 25 33V35C25 35.5523 25.4477 36 26 36H28C28.5523 36 29 35.5523 29 35V33C29 32.4477 28.5523 32 28 32H26Z"
                            fill="#878787"></path>
                    </g>
                </svg>
                <p> ${property.type}</p>
            </div>
        </div>
               <div class="flex items-center justify-between">
              <p class="text-gray-700 text-2xl font-medium">
                $${property.price}
              </p>

              <button onclick="viewMoreInfo(
  '${property.propertyName}',
  '${property.city}',
  ${property.price},
  ${property.rooms},
  '${property.type}',
  '${property.street}',
  '${property.floor}',
  '${property.airflow}',
  '${property.square_meters}',
  '${property.entry_date}',
  '${property.house_number}',
  '${property.entrance}',
  '${property.building_maintenance}',
  '${property.propertyImg.replace(/\\/g, "/").replace(/'/g, "\\'")}',
  '${data.userType}'
)"
                class="px-4 py-2 hover:bg-[#45a049] bg-black text-white text-sm font-medium rounded-md  transition duration-300">
                View More
              </button>
            </div>
            </div>
            `;
                
                // Appends the newly created card to the container.
                propertyCardsContainer.appendChild(propertyCard);
              });
              
              // Reveals the filtered properties section and hides the featured property section.
              filteredSection.classList.remove("hidden");
              showSuccessMessage(data.message);
              document
                .getElementById("featured-property")
                .classList.add("hidden");
            } else {
              // Displays a message if no properties are found.
              propertyCardsContainer.innerHTML =
                "<p class='text-gray-600'>No properties found.</p>";
              showErrorMessage(data.message);
            }
          })

          // Logs the error and displays an error message to the user.
          .catch((error) => {
            console.error("Error fetching properties:", error);
            showSuccessMessage(error);
            
            // Updates the UI to indicate an error occurred.
            const filteredSection = document.getElementById("filteredProperties");
            const propertyCardsContainer = filteredSection.querySelector(".grid");
            propertyCardsContainer.innerHTML = `<p class='text-red-600'>Error: ${error.message}</p>`;
          });
      }
    });
});

// Handles the "View More" button click to display detailed information about a property in a popup.
function viewMoreInfo(
  name,
  city,
  price,
  rooms,
  type,
  street,
  floor,
  airflow,
  square_meters,
  entry_date,
  house_number,
  entrance,
  building_maintenance,
  imageUrl
) {

  // Calls a function to show the popup with the property information.
  showPopupWithPropertyInfo(
    name,
    city,
    price,
    rooms,
    type,
    street,
    floor,
    airflow,
    square_meters,
    entry_date,
    house_number,
    entrance,
    building_maintenance,
    imageUrl
  );
}

// Creates and displays a popup containing the detailed information about a property.
function showPopupWithPropertyInfo(
  name,
  city,
  price,
  rooms,
  type,
  street,
  floor,
  airflow,
  square_meters,
  entry_date,
  house_number,
  entrance,
  building_maintenance,
  imageUrl
) {
  // Generates the HTML content for the popup with property details.
  const popupContent = `
  <div class="popup-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
    <div class="popup-content bg-white rounded-lg shadow-lg w-full max-w-lg md:max-w-xl lg:max-w-md p-0 relative transform transition-all duration-300 scale-95 hover:scale-100">
      <!-- Close Button -->
      <button class="close-popup absolute top-[-50px] right-[-14px] p-2 mb-2 px-3 rounded-full bg-black text-white shadow-lg hover:bg-red-600 transition" aria-label="Close">
        X
      </button>
      <div class="relative">
        <img src="${imageUrl}" alt="Property Image" class="w-full h-56 object-cover rounded-t-lg" />
        <div class="absolute bottom-0 left-0 p-4 bg-transparent	text-gray-500
         text-lg font-semibold">
        ${name}
      </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tabs flex border-b border-gray-300">
        <button class="tab-button active-tab py-2 px-4 text-gray-700 hover:bg-gray-200 font-medium hover:text-black transition" data-tab="1" aria-selected="true">Property Details</button>
        <button class="tab-button py-2 px-4 text-gray-700 font-medium hover:bg-gray-200 hover:text-black transition" data-tab="2" aria-selected="false">More Info</button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content py-2 px-4 space-y-6">
        <!-- Property Details Tab -->
        <div class="tab-panel tab-1 block">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-800 text-sm">
            <div class="flex items-center space-x-2">
            <svg fill="#878787" class="w-4 h-4"  viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M22,11H19V2a1,1,0,0,0-1-1H6A1,1,0,0,0,5,2V7H2A1,1,0,0,0,1,8V22a1,1,0,0,0,1,1H22a1,1,0,0,0,1-1V12A1,1,0,0,0,22,11Zm-9,1v9H3V9H13Zm1-5H7V3H17v8H15V8A1,1,0,0,0,14,7Zm7,14H19V19a1,1,0,0,0-2,0v2H15V13h6ZM4,10H6v2H4Zm4,0h4v2H8ZM4,14H6v2H4Zm4,0h4v2H8ZM4,18H6v2H4Zm4,0h4v2H8Z"></path></g></svg>
              <p class="text-[13px]">${city}</p>
            </div>
            <div class="flex items-center space-x-2">
            <svg fill="#878787" class="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M21,12.184V4a1,1,0,0,0-2,0V5H5V4A1,1,0,0,0,3,4v8.184A3,3,0,0,0,1,15v5a1,1,0,0,0,2,0V19H21v1a1,1,0,0,0,2,0V15A3,3,0,0,0,21,12.184ZM19,12H18V10a1,1,0,0,0-1-1H7a1,1,0,0,0-1,1v2H5V7H19ZM8,12V11h3v1Zm5-1h3v1H13ZM3,15a1,1,0,0,1,1-1H20a1,1,0,0,1,1,1v2H3Z"></path></g></svg>
              <p>${rooms}</p>
            </div>
            <div class="flex items-center space-x-2">
            <svg version="1.0" class="w-4 h-4" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve" fill="#878787"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <rect x="16" y="34" fill="#878787" width="6" height="6"></rect> <rect x="42" y="34" fill="#878787" width="6" height="6"></rect> <path fill="#878787" d="M63.211,29.789L34.438,1.015c0,0-0.937-1.015-2.43-1.015s-2.376,0.991-2.376,0.991L20,10.604V5 c0-0.553-0.447-1-1-1h-6c-0.553,0-1,0.447-1,1v13.589L0.783,29.783C0.24,30.326,0,31.172,0,32c0,1.656,1.343,3,3,3 c0.828,0,1.662-0.251,2.205-0.794L6,33.411V60c0,2.211,1.789,4,4,4h44c2.211,0,4-1.789,4-4V33.394l0.804,0.804 C59.347,34.739,60.172,35,61,35c1.657,0,3-1.343,3-3C64,31.171,63.754,30.332,63.211,29.789z M24,41c0,0.553-0.447,1-1,1h-8 c-0.553,0-1-0.447-1-1v-8c0-0.553,0.447-1,1-1h8c0.553,0,1,0.447,1,1V41z M38,62.002H26v-15c0-0.553,0.447-1,1-1h10 c0.553,0,1,0.447,1,1V62.002z M50,41c0,0.553-0.447,1-1,1h-8c-0.553,0-1-0.447-1-1v-8c0-0.553,0.447-1,1-1h8c0.553,0,1,0.447,1,1 V41z M61,33c-0.276,0-0.602-0.036-0.782-0.217L32.716,5.281c-0.195-0.195-0.451-0.293-0.707-0.293s-0.512,0.098-0.707,0.293 L3.791,32.793C3.61,32.974,3.276,33,3,33c-0.553,0-1-0.447-1-1c0-0.276,0.016-0.622,0.197-0.803L31.035,2.41 c0,0,0.373-0.41,0.974-0.41s0.982,0.398,0.982,0.398l28.806,28.805C61.978,31.384,62,31.724,62,32C62,32.552,61.553,33,61,33z"></path> </g> </g></svg>
              <p>${type}</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-800 text-sm mt-1">
            <div class="flex items-center space-x-2">
            <svg viewBox="0 -0.5 25 25" class="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 7V17C7.5 18.1046 8.39543 19 9.5 19H17.5C18.6046 19 19.5 18.1046 19.5 17V7C19.5 5.89543 18.6046 5 17.5 5H9.5C8.39543 5 7.5 5.89543 7.5 7Z" stroke="#878787" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M15.5 10C15.5 11.1046 14.6046 12 13.5 12C12.3954 12 11.5 11.1046 11.5 10C11.5 8.89543 12.3954 8 13.5 8C14.6046 8 15.5 8.89543 15.5 10Z" stroke="#878787" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M7.05108 16.3992C6.71926 16.6471 6.65126 17.1171 6.89919 17.4489C7.14713 17.7807 7.61711 17.8487 7.94892 17.6008L7.05108 16.3992ZM19.0511 17.6008C19.3829 17.8487 19.8529 17.7807 20.1008 17.4489C20.3487 17.1171 20.2807 16.6471 19.9489 16.3992L19.0511 17.6008ZM5.5 8.25C5.08579 8.25 4.75 8.58579 4.75 9C4.75 9.41421 5.08579 9.75 5.5 9.75V8.25ZM7.5 9.75C7.91421 9.75 8.25 9.41421 8.25 9C8.25 8.58579 7.91421 8.25 7.5 8.25V9.75ZM5.5 11.25C5.08579 11.25 4.75 11.5858 4.75 12C4.75 12.4142 5.08579 12.75 5.5 12.75V11.25ZM7.5 12.75C7.91421 12.75 8.25 12.4142 8.25 12C8.25 11.5858 7.91421 11.25 7.5 11.25V12.75ZM5.5 14.25C5.08579 14.25 4.75 14.5858 4.75 15C4.75 15.4142 5.08579 15.75 5.5 15.75V14.25ZM7.5 15.75C7.91421 15.75 8.25 15.4142 8.25 15C8.25 14.5858 7.91421 14.25 7.5 14.25V15.75ZM7.94892 17.6008C11.2409 15.141 15.7591 15.141 19.0511 17.6008L19.9489 16.3992C16.1245 13.5416 10.8755 13.5416 7.05108 16.3992L7.94892 17.6008ZM5.5 9.75H7.5V8.25H5.5V9.75ZM5.5 12.75H7.5V11.25H5.5V12.75ZM5.5 15.75H7.5V14.25H5.5V15.75Z" fill="#878787"></path> </g></svg>
              <p> ${house_number}</p>
            </div>
            <div class="flex items-center space-x-2">
            <svg class="w-4 h-4"  version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <style type="text/css"> .st0{fill:#878787;} </style> <g> <polygon class="st0" points="311.237,83.453 311.237,225.912 140.574,225.912 140.574,368.357 0,368.357 0,428.547 200.757,428.547 200.757,286.088 371.42,286.088 371.42,143.631 512,143.631 512,83.453 "></polygon> </g> </g></svg>
              <p> ${floor} floor</p>
            </div>
            <div class="flex items-center space-x-2">
            <svg fill="#878787" class="w-4 h-4"  viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg" id="entrance"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M7,6.5v-1a1,1,0,0,0-2,0v3ZM5,3A1,1,0,1,1,6,4,1,1,0,0,1,5,3m9,3h0a1,1,0,0,1-1,1H11.42a1,1,0,0,0-.71.29L5.29,12.71a1,1,0,0,1-.7.29H2a1,1,0,0,1-1-1H1a1,1,0,0,1,1-1H3.59a1,1,0,0,0,.7-.29L9.71,5.29A1,1,0,0,1,10.42,5H13A1,1,0,0,1,14,6Z"></path> </g></svg>
              <p>${entrance}</p>
            </div>
          </div>
        </div>

        <div class="tab-panel tab-2 hidden" style="margin-top: 0px;">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-800 text-sm">
            <div class="flex items-center space-x-2">
            <svg fill="#878787" class="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M22,19H20.693L14.937,3.648A1,1,0,0,0,14,3H10a1,1,0,0,0-.937.648L3.307,19H2a1,1,0,0,0,0,2H22a1,1,0,0,0,0-2ZM10.693,5h2.614l1.125,3H9.568ZM8.818,10h6.364l.75,2H8.068ZM5.443,19l1.875-5h9.364l1.875,5Z"></path></g></svg>
              <p>${street}</p>
            </div>
            <div class="flex items-center space-x-2">
            <svg viewBox="0 0 24 24 " class="w-6 h-6" fill="#878787" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M18.9762 5.5914L14.6089 18.6932C14.4726 19.1023 13.8939 19.1023 13.7575 18.6932L11.7868 12.7808C11.6974 12.5129 11.4871 12.3026 11.2192 12.2132L5.30683 10.2425C4.89772 10.1061 4.89772 9.52743 5.30683 9.39106L18.4086 5.0238C18.7594 4.90687 19.0931 5.24061 18.9762 5.5914Z" stroke="#878787" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
              <p> ${airflow}</p>
            </div>
            <div class="flex items-center space-x-2">
            <svg fill="#878787" class="w-6 h-6" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 455.664 455.664" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="XMLID_1492_"> <path id="XMLID_1495_" d="M388.933,66.73C345.901,23.698,288.688,0,227.832,0C166.976,0,109.762,23.698,66.731,66.73 S0,166.976,0,227.832s23.699,118.069,66.73,161.102s100.245,66.73,161.101,66.73c60.856,0,118.069-23.698,161.102-66.73 s66.73-100.245,66.73-161.102S431.966,109.763,388.933,66.73z M227.832,425.664C118.747,425.664,30,336.917,30,227.832 S118.747,30,227.832,30s197.832,88.747,197.832,197.832S336.917,425.664,227.832,425.664z"></path> <path id="XMLID_1498_" d="M227.832,158.808c-38.06,0-69.024,30.964-69.024,69.024s30.964,69.024,69.024,69.024 c38.061,0,69.024-30.964,69.024-69.024S265.892,158.808,227.832,158.808z M227.832,266.856c-21.518,0-39.024-17.506-39.024-39.024 s17.506-39.024,39.024-39.024c21.519,0,39.024,17.506,39.024,39.024S249.35,266.856,227.832,266.856z"></path> </g> </g></svg>
              <p> ${square_meters}m²</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-800 text-sm mt-1">
            <div class="flex items-center space-x-2">
              <svg viewBox="0 0 48 48" class="w-6 h-6" id="b" xmlns="http://www.w3.org/2000/svg" fill="#878787"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><defs><style>.c{fill:none;stroke:#878787;stroke-linecap:round;stroke-linejoin:round;}</style></defs><path class="c" d="m19.9013,12.5414c-3.3535-.4968-4.9682,1.3662-7.328,3.1051l-8.0732,6.2102,1.4904.7452c1.9873.9936,4.7197.621,6.5828-.7452l11.0541-8.6943-3.7261-.621Z"></path><path class="c" d="m33.6879,16.8886l-4.0987-.7452s-2.8567-.7452-5.465,1.1178l-12.793,10.0605,1.9873,1.1178c1.9873.9936,4.5955.621,6.4586-.7452l14.035-10.8057"></path><path class="c" d="m43.5,20.9873l-4.4713-.7452c-2.6083-.4968-3.9745.3726-6.4586,2.3599l-13.7866,11.1783,1.9873,1.1178c1.9873.9936,4.7818.8694,6.5828-.621l16.1465-13.2898Z"></path></g></svg>
              <p> ${building_maintenance}</p>
            </div>
          </div>
        </div>


      </div>
      <div class="popup-buttons p-4">
        <p class="text-gray-700 text-2xl font-medium ">$${price}</p>
        <button
          class="schedule-meeting bg-black"
          onclick="redirectToMeetings()"
        >
          Schedule Meeting
        </button>
      </div>
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML("beforeend", popupContent);
  document.querySelector(".close-popup").addEventListener("click", () => {
    document.querySelector(".popup-overlay").remove();
  });

  // Selects all tab buttons and tab panels from the document.
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabPanels = document.querySelectorAll(".tab-panel");

  // Adds an event listener to each tab button to handle tab switching.
  tabButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const targetTab = button.getAttribute("data-tab");

      // Loops through all tab buttons to remove the 'active-tab' class and set `aria-selected` to false.
      tabButtons.forEach((btn) => {
        btn.classList.remove("active-tab");
        btn.setAttribute("aria-selected", "false");
      });
      tabPanels.forEach((panel) => panel.classList.add("hidden"));

      // Adds the 'active-tab' class and sets `aria-selected` to true for the clicked button.
      button.classList.add("active-tab");
      button.setAttribute("aria-selected", "true");
      // Removes the 'hidden' class from the tab panel corresponding to the clicked button.
      document.querySelector(`.tab-${targetTab}`).classList.remove("hidden");
    });
  });
}

// Redirects the user to the "/meeting" page.
function redirectToMeetings() {
  window.location.href = "/meeting";
}

// Displays a success message to the user.
function showSuccessMessage(message) {
  const successMessageElement = document.getElementById("success-message");
  successMessageElement.innerHTML = message;
  successMessageElement.classList.remove("hidden");
  setTimeout(() => successMessageElement.classList.add("hidden"), 5000);
}

// Displays an error message to the user.
function showErrorMessage(message) {
  const errorMessageElement = document.getElementById("error-message");
  errorMessageElement.innerHTML = message;
  errorMessageElement.classList.remove("hidden");
  setTimeout(() => errorMessageElement.classList.add("hidden"), 5000);
}

// Ensures that the input value is a positive number greater than zero.
function validatePositiveNumber(input) {
  if (input.value === "") {
    return;
  }

  if (input.value < 1) {
    input.value = "";
    showErrorMessage("Please enter a number greater than 0.");
  }
}
