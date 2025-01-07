const navBar = document.querySelector("nav");
const menuBtns = document.querySelectorAll(".menu-icon");
const midNavbar = document.getElementById("mid_nav");
const overlay = document.getElementById("overlay");

menuBtns.forEach((menuBtn) => {
  menuBtn.addEventListener("click", () => {
    navBar.classList.toggle("open");
  });
});
//paypment
document
  .getElementById("paypal-button")
  .addEventListener("click", async () => {
    const paymentAmount = document.getElementById("payment-amount").value;
    console.log(paymentAmount);
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


