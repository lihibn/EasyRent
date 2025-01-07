// Selects the navigation bar and menu button elements.
const navBar = document.querySelector("nav");
const menuBtns = document.querySelectorAll(".menu-icon");
const midNavbar = document.getElementById("mid_nav");
const overlay = document.getElementById("overlay");

// Adds an event listener to each menu button to toggle the `open` class on the navbar when clicked.
menuBtns.forEach((menuBtn) => {
  menuBtn.addEventListener("click", () => {
    navBar.classList.toggle("open");
  });
});

// Adds functionality for handling PayPal payments.
document
  .getElementById("paypal-button")
  .addEventListener("click", async () => {
    const paymentAmount = document.getElementById("payment-amount").value;
    console.log(paymentAmount);
    
    // Sends a POST request to the server to create a payment.
    try {
      const response = await fetch("/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: paymentAmount }),
      });

      const data = await response.json();
      if (data.approval_url) {
        window.location.href = data.approval_url;
      } else {
        alert("Error creating payment.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An unexpected error occurred.");
    }
  });

// Event listener for the "Make PayPal Payment Button" click.
document
  .getElementById("make-paypal-button")
  .addEventListener("click", async () => {
    const paymentAmount = document.getElementById("make-payment-amount").value;
    console.log(paymentAmount);
    try {
      const response = await fetch("/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: paymentAmount }),
      });

      // Parses the JSON response from the server.
      const data = await response.json();
      if (data.approval_url) {
        // Redirect to PayPal for payment approval
        window.location.href = data.approval_url;
      } else {
        alert("Error creating payment.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An unexpected error occurred.");
    }
  });

