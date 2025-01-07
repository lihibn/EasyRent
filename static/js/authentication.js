
//Authencation
//Sign up
document
    .querySelector(".submit-btn")
    .addEventListener("click", async function (e) {
        e.preventDefault();

        const fullName = document.getElementById("name_signup").value.trim();
        const email = document.getElementById("email_signup").value.trim();
        const password = document.getElementById("password_signup").value;
        const role = document.getElementById("accountType").value;

        // Validate inputs
        if (!fullName || !email || !password) {
            showErrorMessage("All fields are required!");
            return;
        }
        if (!validateEmail(email)) {
            showErrorMessage("Invalid email format!");
            return;
        }

        const userData = {
            full_name: fullName,
            email: email,
            password: password,
            role: role,
        };

        try {
            const response = await fetch("/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            });

            const result = await response.json();
            if (response.status === 200) {
                document.getElementById("signup-modal").classList.add("hidden");
                showSuccessMessage(result.message);
                resetForm();
            } else {
                showErrorMessage(result.message);
            }
        } catch (error) {
            showErrorMessage("An error occurred. Please try again.");
        }
    });
//sign in
document
    .getElementById("signin-form")
    .addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("email_login").value.trim();
        const password = document.getElementById("password_login").value;
        const signUpButton = document.getElementById("signUpButton");

        // Validate inputs
        if (!email || !password) {
            showErrorMessage("All fields are required!");
            return;
        }
        if (!validateEmail(email)) {
            showErrorMessage("Invalid email format!");
            return;
        }

        const userData = {
            email: email,
            password: password,
        };

        try {
            const response = await fetch("/auth/login", {
                // Ensure it's POST request
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData), // Send email and password as JSON body
            });

            console.log(response);
            const result = await response.json();
            if (response.status === 200) {
                console.log(response);
                window.location.href = "/";

                document.getElementById("signin-modal").classList.add("hidden");
                signUpButton.classList.add("hidden");
                showSuccessMessage(result.message);
                resetForm();
            } else {
                showErrorMessage(result.message);
            }
        } catch (error) {
            console.error("Error logging in:", error);
            showErrorMessage("An error occurred. Please try again.");
        }
    });
// Function to reset the form
function resetFormLogin() {
    document.getElementById("email_login").value = "";
    document.getElementById("password_login").value = "";
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function resetForm() {
    document.getElementById("name_signup").value = "";
    document.getElementById("email_signup").value = "";
    document.getElementById("password_signup").value = "";
    document.getElementById("accountType").value = "";
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

// modal
const signUpButton = document.getElementById("signUpButton");
const signUpModalButton = document.getElementById("signUpModalButton");
const signInButton = document.getElementById("loginButton");
const signupModal = document.getElementById("signup-modal");
const loginModal = document.getElementById("signin-modal");
const closeModalSignUpButton = document.getElementById("closeModalSignUp");
const closeModalLoginButton = document.getElementById("closeModalLogin");

// Utility to toggle modals
const toggleModal = (openModal, closeModal) => {
    if (openModal) {
        openModal.classList.add("show");
        openModal.classList.remove("hidden");
    }
    if (closeModal) {
        closeModal.classList.remove("show");
        closeModal.classList.add("hidden");
    }
};

// Event listener for signup button
if (signUpButton && signupModal && loginModal) {
    signUpButton.addEventListener("click", (event) => {
        event.preventDefault();
        toggleModal(signupModal, loginModal);
    });
}
// Event listener for signup button
if (signUpButton && signupModal && loginModal) {
    signUpModalButton.addEventListener("click", (event) => {
        event.preventDefault();
        toggleModal(signupModal, loginModal);
    });
}

// Event listener for signin button
if (signInButton && loginModal && signupModal) {
    signInButton.addEventListener("click", (event) => {
        event.preventDefault();
        toggleModal(loginModal, signupModal);
    });
}

// Close signup modal
if (closeModalSignUpButton) {
    closeModalSignUpButton.addEventListener("click", () => {
        signupModal.classList.remove("show");
        signupModal.classList.add("hidden");
    });
}

// Close login modal
if (closeModalLoginButton) {
    closeModalLoginButton.addEventListener("click", () => {
        loginModal.classList.remove("show");
        loginModal.classList.add("hidden");
    });
}

// Close modals with Escape key
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        signupModal.classList.remove("show");
        signupModal.classList.add("hidden");
        loginModal.classList.remove("show");
        loginModal.classList.add("hidden");
    }
});

// password togglity
document
    .getElementById("togglePassword_signup")
    .addEventListener("click", function () {
        const passwordInput = document.getElementById("password_signup");
        const hideIcon = document.getElementById("hide-password-icon");
        const showIcon = document.getElementById("show-password-icon");

        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            hideIcon.classList.remove("hidden");
            showIcon.classList.add("hidden");
        } else {
            passwordInput.type = "password";
            hideIcon.classList.add("hidden");
            showIcon.classList.remove("hidden");
        }
    });
document
    .getElementById("togglePassword_login")
    .addEventListener("click", function () {
        const passwordInput = document.getElementById("password_login");
        const hideIcon = document.getElementById("hide-password-icon-login");
        const showIcon = document.getElementById("show-password-icon-login");

        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            hideIcon.classList.remove("hidden");
            showIcon.classList.add("hidden");
        } else {
            passwordInput.type = "password";
            hideIcon.classList.add("hidden");
            showIcon.classList.remove("hidden");
        }
    });