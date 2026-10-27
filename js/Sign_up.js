document.addEventListener("DOMContentLoaded", function () {
    window.BCPhoneAuth.initializeForm("signup-form", async function (form) {
        const username = form.elements.username.value.trim();
        const password = form.elements.password.value;

        if (!/^[a-zA-Z0-9._-]{3,24}$/.test(username)) {
            throw new Error("Tên đăng nhập cần có 3-24 ký tự: chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.");
        }
        if (password.length < 8) {
            throw new Error("Mật khẩu cần có ít nhất 8 ký tự.");
        }

        await window.BCPhoneAuth.register(username, password);
    });
});