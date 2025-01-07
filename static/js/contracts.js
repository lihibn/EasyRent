const navBar = document.querySelector("nav");
const menuBtns = document.querySelectorAll(".menu-icon");
const midNavbar = document.getElementById("mid_nav");
const overlay = document.getElementById("overlay"); // Ensure this element exists in your HTML.

menuBtns.forEach((menuBtn) => {
  menuBtn.addEventListener("click", () => {
    navBar.classList.toggle("open");
  });
});

document
  .getElementById("liked-properties")
  .addEventListener("change", function () {
    const selectedProperty = this.value;
    console.log(`Selected Property: ${selectedProperty}`);

    const contractTable = document.getElementById("contract-table-container");
    const tableBody = contractTable.querySelector("tbody");

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

          // Clear existing table rows
          tableBody.innerHTML = "";

          if (data.contracts && data.contracts.length > 0) {
            // Populate table with new data
            data.contracts.forEach((contract) => {
              const row = document.createElement("tr");
              row.innerHTML = `
        <td class="py-3 px-4 border-b text-gray-600">${contract.property_name
                }</td>
        <td class="py-3 px-4 border-b text-gray-600">
            ${getStatusLabel(contract.status)}
        </td>
        <td class="py-3 px-4 border-b text-gray-600">${contract.date_uploaded
                }</td>
        <td class="py-3 px-4 border-b text-gray-600">
            <button class="text-blue-500"
                onclick="showContractModal('${contract.property_name.replace(
                  /'/g,
                  "\\'"
                )}',
                                           '${contract.date_uploaded}',
                                           '${contract.contract_file
                  ? contract.contract_file
                    .replace(/\\/g, "\\\\")
                    .replace(/'/g, "\\'")
                  : ""
                }',
                                           ${contract.id},
                                           '${contract.status}')">
                View Contract
            </button>
        </td>
    `;

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
            // If no contracts found, show a message
            tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="py-3 px-4 border-b text-gray-600 text-center">
                            No contracts found for this property.
                        </td>
                    </tr>
                    `;
          }

          // Show table if contracts are loaded
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
      // Hide table if no property is selected
      contractTable.classList.add("hidden");
      tableBody.innerHTML = "";
    }
  });

// Function to return the status label with correct styling based on the contract status
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

  // Populate modal content
  document.getElementById("modal-contract-name").innerText = contractName;
  document.getElementById("modal-upload-date").innerText = uploadDate;
  document.getElementById("modal-contract-viewer").src = filePath;

  // Show modal
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

function closeContractModal() {
  document.getElementById("contract-modal").classList.add("hidden");
  document.body.style.overflow = "auto";
}

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
          location.reload(); // Reload the page to reflect changes
        } else {
          showErrorMessage("An error occurred while deleting the contract.");
        }
      })
      .catch((error) => console.error("Error:", error));
  }
}

function signDocument(contractId) {
  console.log(`Initiating signing process for contract ID: ${contractId}`);
  const loadingMessage = "Fetching signing link...";
  showLoadingMessage(loadingMessage);
  showSuccessMessage("Initiating signing process for contract! Wait few secs");

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
function showLoadingMessage(message) {
  const loadingDiv = document.getElementById("loading-message");
  loadingDiv.style.display = "block";
  loadingDiv.querySelector("p").textContent = message;
}

function hideLoadingMessage() {
  const loadingDiv = document.getElementById("loading-message");
  loadingDiv.style.display = "none";
}
