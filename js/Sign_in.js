document.addEventListener("DOMContentLoaded", function () {
    window.BCPhoneAuth.initializeForm("login-form", async function (form) {
        await window.BCPhoneAuth.login(
            form.elements.username.value,
            form.elements.password.value
        );
    });
});
