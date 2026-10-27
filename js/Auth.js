(function () {
    const USERS_KEY = "bcphone.users";
    const SESSION_KEY = "bcphone.session";
    const ITERATIONS = 210000;

    function getUsers() {
        const storedUsers = localStorage.getItem(USERS_KEY);
        if (!storedUsers) {
            return [];
        }

        const users = JSON.parse(storedUsers);
        if (!Array.isArray(users)) {
            throw new Error("Dữ liệu tài khoản không hợp lệ.");
        }
        return users;
    }

    function encodeBase64(bytes) {
        let binary = "";
        bytes.forEach(function (byte) {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary);
    }

    function decodeBase64(value) {
        return Uint8Array.from(atob(value), function (character) {
            return character.charCodeAt(0);
        });
    }

    async function hashPassword(password, salt) {
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(password),
            "PBKDF2",
            false,
            ["deriveBits"]
        );
        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: ITERATIONS,
                hash: "SHA-256"
            },
            keyMaterial,
            256
        );
        return new Uint8Array(derivedBits);
    }

    function hashesMatch(first, second) {
        if (first.length !== second.length) {
            return false;
        }
        let difference = 0;
        for (let index = 0; index < first.length; index += 1) {
            difference |= first[index] ^ second[index];
        }
        return difference === 0;
    }

    function setSession(username) {
        sessionStorage.setItem(SESSION_KEY, username);
    }

    async function register(username, password) {
        const normalizedUsername = username.trim().toLowerCase();
        const users = getUsers();
        if (users.some(function (user) {
            return user.username === normalizedUsername;
        })) {
            throw new Error("Tên đăng nhập này đã được sử dụng.");
        }

        const salt = crypto.getRandomValues(new Uint8Array(16));
        const passwordHash = await hashPassword(password, salt);
        users.push({
            username: normalizedUsername,
            salt: encodeBase64(salt),
            passwordHash: encodeBase64(passwordHash),
            iterations: ITERATIONS
        });
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        setSession(normalizedUsername);
    }

    async function login(username, password) {
        const normalizedUsername = username.trim().toLowerCase();
        const user = getUsers().find(function (account) {
            return account.username === normalizedUsername;
        });
        if (!user) {
            throw new Error("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }

        const passwordHash = await hashPassword(password, decodeBase64(user.salt));
        if (!hashesMatch(passwordHash, decodeBase64(user.passwordHash))) {
            throw new Error("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }
        setSession(user.username);
    }

    function initializeNavigation() {
        const signupLink = document.getElementById("nav-button-signup");
        const signinLink = document.getElementById("nav-button-signin");
        const username = sessionStorage.getItem(SESSION_KEY);

        if (!username || !signinLink) {
            return;
        }

        const signupContainer = signupLink && signupLink.closest(".nav-button");
        if (signupContainer) {
            signupContainer.hidden = true;
        }
        signinLink.href = "#";
        const button = signinLink.querySelector("button");
        if (button) {
            button.textContent = "Xin chào, " + username + " · Đăng xuất";
        }
        signinLink.addEventListener("click", function (event) {
            event.preventDefault();
            sessionStorage.removeItem(SESSION_KEY);
            window.location.href = "index.html";
        });
    }

    function initializeForm(formId, handler) {
        const form = document.getElementById(formId);
        if (!form) {
            return;
        }

        const message = form.querySelector("[data-auth-message]");
        form.addEventListener("submit", async function (event) {
            event.preventDefault();
            message.textContent = "";
            message.classList.remove("auth-message-error", "auth-message-success");
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;

            try {
                await handler(form);
                message.textContent = "Thành công! Đang chuyển về trang chủ...";
                message.classList.add("auth-message-success");
                window.location.href = "index.html";
            } catch (error) {
                message.textContent = error instanceof Error
                    ? error.message
                    : "Không thể xử lý yêu cầu. Vui lòng thử lại.";
                message.classList.add("auth-message-error");
                submitButton.disabled = false;
            }
        });
    }

    window.BCPhoneAuth = {
        initializeForm: initializeForm,
        login: login,
        register: register
    };

    document.addEventListener("DOMContentLoaded", initializeNavigation);
})();
