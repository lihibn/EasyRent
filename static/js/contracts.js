// EasyRent - 20251W87


// Toggles the visibility of the navigation bar when the menu icon is clicked.
const navBar = document.querySelector("nav");
const menuBtns = document.querySelectorAll(".menu-icon");
const midNavbar = document.getElementById("mid_nav");
const overlay = document.getElementById("overlay"); 

menuBtns.forEach((menuBtn) => {
  menuBtn.addEventListener("click", () => {
    navBar.classList.toggle("open");
  });
});

// Contract Management
// Event listener for when a property is selected from the dropdown menu.
document
  .getElementById("liked-properties")
  .addEventListener("change", function () {
    const selectedProperty = this.value;
    console.log(`Selected Property: ${selectedProperty}`);
    const contractTable = document.getElementById("contract-table-container");
    const tableBody = contractTable.querySelector("tbody");

    // Fetch contract data for the selected property.
    if (selectedProperty) {
      fetch(`/contract/${selectedProperty}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch contract data.");
          }
          return response.json();
        })
        .then((data) => {
          const userType = data["userType"].trim();
          console.log("Fetched Contracts:", data);
          tableBody.innerHTML = "";

          // Populate the table with contract data.
          if (data.contracts && data.contracts.length > 0) {
            data.contracts.forEach((contract) => {
              const row = document.createElement("tr");
              row.innerHTML = `
        <td class="py-3 px-4 border-b text-gray-600">${contract.property_name}</td>
        <td class="py-3 px-4 border-b text-gray-600">
            ${getStatusLabel(contract.status)}
        </td>
        <td class="py-3 px-4 border-b text-gray-600">${contract.date_uploaded}</td>
        <td class="py-3 px-4 border-b text-gray-600">
            <button class="text-blue-500"
                onclick="showContractModal('${contract.property_name.replace(/'/g,"\\'")}',
                                           '${contract.date_uploaded}',
                                           '${contract.contract_file
                  ? contract.contract_file
                    .replace(/\\/g, "\\\\")
                    .replace(/'/g, "\\'")
                  : ""}',
                  ${contract.id},
                  '${contract.status}')">
                View Contract
            </button>
        </td>
    `;

              // Adds a delete button if the user is not a tenant.
              if (userType !== "Tenant" && userType !== "tenant") {
                const deleteButton = `
            <td class="py-3 px-4 border-b text-gray-600">
                <button onclick="deleteContract(${contract.id})" class="text-red-500">Delete Contract</button>
            </td>
        `;
                row.innerHTML += deleteButton;
              }
              tableBody.appendChild(row);
            });
          } else {
            // If no contracts are found, display a message.
            tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="py-3 px-4 border-b text-gray-600 text-center">
                            No contracts found for this property.
                        </td>
                    </tr>
                    `;
          }

          // Show the table if contracts are loaded.
          contractTable.classList.remove("hidden");
        })
        .catch((error) => {
          console.error("Error fetching contract data:", error);
          tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-3 px-4 border-b text-gray-600 text-center">
                        Failed to load contracts. Please try again later.
                    </td>
                </tr>
                `;
          contractTable.classList.remove("hidden");
        });
    } else {
      // Hide the table and clear rows if no property is selected.
      contractTable.classList.add("hidden");
      tableBody.innerHTML = "";
    }
  });

// Returns the status label with correct styling based on the contract status.
function getStatusLabel(status) {
  switch (status) {
    case "signed":
      return '<span class="text-green-500">Signed</span>';
    case "pending":
      return '<span class="text-yellow-500">Pending</span>';
    case "awaiting_tenant":
      return '<span class="text-blue-500">Awaiting Tenant Action</span>';
    default:
      return `<span>${status}</span>`;
  }
}

// Displays the contract modal with contract details.
function showContractModal(
  contractName,
  uploadDate,
  filePath,
  contractId,
  contractStatus
) {
  console.log(
    "Contract Modal Params:",
    { contractName, uploadDate, filePath },
    contractStatus
  );

  // Populates modal content with contract details.
  document.getElementById("modal-contract-name").innerText = contractName;
  document.getElementById("modal-upload-date").innerText = uploadDate;
  document.getElementById("modal-contract-viewer").src = filePath;

  // Show modal and manage sign button visibility.
  const modal = document.getElementById("contract-modal");
  if (modal) {
    modal.classList.remove("hidden");
    const signButton = document.getElementById("sign-contract-btn");
    signButton.onclick = () => signDocument(contractId);
    if (signButton) {
      if (contractStatus !== "signed") {
        signButton.classList.remove("hidden");
      } else {
        signButton.classList.add("hidden");
      }
    } else {
      console.error("Sign button not found!");
    }
  } else {
    console.error("Modal element not found");
  }
  document.body.style.overflow = "hidden";
}

// Hides the contract modal and restores page scrolling.
function closeContractModal() {
  document.getElementById("contract-modal").classList.add("hidden");
  document.body.style.overflow = "auto";
}

// Deletes a contract after user confirmation.
function deleteContract(contractId) {
  const confirmation = confirm(
    "Are you sure you want to delete this contract?"
  );
  if (confirmation) {
    fetch(`/contract/delete/${contractId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contract_id: contractId,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          showSuccessMessage(data.message);
          location.reload(); 
        } else {
          showErrorMessage("An error occurred while deleting the contract.");
        }
      })
      .catch((error) => console.error("Error:", error));
  }
}

// Initiates the document signing process for a contract.
function signDocument(contractId) {
  console.log(`Initiating signing process for contract ID: ${contractId}`);
  const loadingMessage = "Fetching signing link...";
  showLoadingMessage(loadingMessage);
  showSuccessMessage("Initiating signing process for contract! Wait a few seconds");

  fetch(`/sign_document/${contractId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      hideLoadingMessage();
      hideLoadingMessage();
      if (data && data.envelope_url) {
        console.log("Opening signing URL:", data.envelope_url);
        showSuccessMessage(data.message);
        if (data.envelope_url) {
          showSuccessMessage("Docusign invited an email");
        }
      } else {
        showErrorMessage(data.message);
        console.error("Error data:", data);
      }
    })
    .catch((err) => {
      hideLoadingMessage();
      showErrorMessage("Failed to fetch signing URL.");
      console.error("Error:", err);
    });
}

// Displays a success message.
function showSuccessMessage(message) {
  const successMessageElement = document.getElementById("success-message");
  successMessageElement.innerHTML = message;
  successMessageElement.classList.remove("hidden");
  setTimeout(() => successMessageElement.classList.add("hidden"), 5000);
}

// Displays an error message.
function showErrorMessage(message) {
  const errorMessageElement = document.getElementById("error-message");
  errorMessageElement.innerHTML = message;
  errorMessageElement.classList.remove("hidden");
  setTimeout(() => errorMessageElement.classList.add("hidden"), 5000);
}

// Shows a loading message.
function showLoadingMessage(message) {
  const loadingDiv = document.getElementById("loading-message");
  loadingDiv.style.display = "block";
  loadingDiv.querySelector("p").textContent = message;
}

// Hides the loading message.
function hideLoadingMessage() {
  const loadingDiv = document.getElementById("loading-message");
  loadingDiv.style.display = "none";
}
