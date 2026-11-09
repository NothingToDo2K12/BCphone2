// Chatbot AI BCPhone: tự chèn nút chat + khung chat vào mọi trang có nạp file này.

// Địa chỉ API. Chạy bằng "npm start" (cổng 3000) thì dùng cùng địa chỉ,
// còn mở bằng Live Server (cổng khác) thì trỏ về server Node ở cổng 3000.
// Khi deploy thật, đổi thành địa chỉ server của bạn.
const CHAT_API_URL = location.port === "3000"
    ? "/api/chat"
    : "http://localhost:3000/api/chat";

const CHAT_API_URL_DEPLOY = "https://chatbot.chinh.site";

// Nạp file CSS (cùng thư mục gốc với thư mục js/)
const chatCssLink = document.createElement("link");
chatCssLink.rel = "stylesheet";
chatCssLink.href = new URL("../chatbot-style.css", document.currentScript.src).href;
document.head.appendChild(chatCssLink);

// Lịch sử hội thoại gửi lên server (để bot nhớ ngữ cảnh)
const chatHistory = [];

function addChatMessage(text, role) {
    const messages = document.getElementById("bc-chat-messages");
    const item = document.createElement("div");
    item.className = `bc-msg ${role}`;
    item.textContent = text; // dùng textContent để tránh chèn HTML độc hại
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
}

async function sendChatMessage(text) {
    addChatMessage(text, "user");
    chatHistory.push({ role: "user", content: text });
    const waiting = addChatMessage("Đang trả lời...", "bot");

    try {
        const response = await fetch(CHAT_API_URL_DEPLOY, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: chatHistory })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Lỗi không xác định");

        waiting.textContent = data.reply;
        chatHistory.push({ role: "assistant", content: data.reply });
    } catch (error) {
        console.error("Chatbot error:", error);
        waiting.textContent = "Xin lỗi, hiện không kết nối được trợ lý AI. Vui lòng thử lại sau.";
        chatHistory.pop(); // bỏ tin vừa gửi lỗi khỏi lịch sử
    }
}

function initializeChatbot() {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
        <button id="bc-chat-toggle" type="button" aria-label="Mở chat tư vấn">💬</button>
        <div id="bc-chat-box" hidden>
            <div class="bc-chat-header">Tư vấn BCPhone</div>
            <div id="bc-chat-messages"></div>
            <form id="bc-chat-form">
                <input id="bc-chat-input" type="text" maxlength="300" placeholder="Nhập câu hỏi..." autocomplete="off" />
                <button type="submit">Gửi</button>
            </form>
        </div>`;
    document.body.appendChild(wrapper);

    const box = document.getElementById("bc-chat-box");
    const input = document.getElementById("bc-chat-input");
    const form = document.getElementById("bc-chat-form");

    addChatMessage("Xin chào! Mình là trợ lý AI của BCPhone. Bạn cần tư vấn điện thoại nào?", "bot");

    document.getElementById("bc-chat-toggle").addEventListener("click", () => {
        box.hidden = !box.hidden;
        if (!box.hidden) input.focus();
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        input.value = "";
        form.querySelector("button").disabled = true;
        await sendChatMessage(text);
        form.querySelector("button").disabled = false;
        input.focus();
    });
}

document.addEventListener("DOMContentLoaded", initializeChatbot, { once: true });
