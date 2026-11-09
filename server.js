// Server nhỏ: phục vụ website tĩnh + API chatbot (/api/chat) gọi Hugging Face.
// Token HF nằm trong file .env ở phía server, KHÔNG đưa vào code frontend.
// Chạy: npm start  (cần Node 20.6 trở lên)

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = process.env.HF_MODEL || "llama-3.3-70b-versatile";
const HF_URL =
  process.env.AI_URL || "https://router.huggingface.co/v1/chat/completions";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

// ---------- Tạo "kiến thức" cho bot từ db/phonedb2.json ----------
// Chỉ lấy phonelist + prices + quantities. KHÔNG đưa users/orders/cart vào bot.
function buildSystemPrompt() {
  const db = JSON.parse(
    fs.readFileSync(path.join(__dirname, "db", "phonedb2.json"), "utf8"),
  );
  const lines = db.phonelist.map((p) => {
    const price = db.prices.find((x) => x.phone_id === p.id);
    const stock = db.quantities.find((x) => x.phone_id === p.id);
    return (
      `- ${p.name} | ${p.storage} | màu ${p.color} | màn hình: ${p.screen_resolution} | ` +
      `chip: ${p.cpu} | pin: ${p.battery_capacity} | camera sau ${p.main_camera}, trước ${p.front_camera} | ` +
      `mạng: ${p.networks} | giá: ${price ? price.price.trim() + " đ" : "liên hệ"} | ` +
      `còn: ${stock ? stock.quantity : "?"} máy | xem tại: http://localhost:3000/phone_detail.html?id=${p.id}`
    );
  });
  return [
    "Bạn là trợ lý tư vấn bán hàng của cửa hàng điện thoại BCPhone.",
    "Luôn trả lời bằng tiếng Việt, ngắn gọn, thân thiện (tối đa 5 câu).",
    "Chỉ tư vấn dựa trên danh sách sản phẩm bên dưới. Không bịa thông số hoặc giá.",
    "Nếu khách hỏi máy không có trong danh sách, hãy nói cửa hàng chưa bán và gợi ý máy gần giống.",
    "Nếu câu hỏi không liên quan đến điện thoại/cửa hàng, từ chối lịch sự.",
    "Liên hệ: 0913178258. Tư vấn và bảo hành: 0918447477.",
    "",
    "DANH SÁCH SẢN PHẨM:",
    ...lines,
  ].join("\n");
}

// ---------- Giới hạn số request (20 lần/phút mỗi IP) ----------
const hits = new Map();
function isLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 20;
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*", // cho phép gọi từ Live Server (cổng khác)
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 20000) {
        reject(new Error("Body quá lớn"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

// ---------- POST /api/chat ----------
async function handleChat(req, res) {
  if (!HF_TOKEN)
    return sendJson(res, 500, { error: "Server chưa cấu hình HF_TOKEN." });
  if (isLimited(req.socket.remoteAddress))
    return sendJson(res, 429, { error: "Bạn gửi quá nhanh, thử lại sau." });

  try {
    const { messages } = JSON.parse(await readBody(req));
    if (!Array.isArray(messages) || messages.length === 0) {
      return sendJson(res, 400, { error: "Thiếu tin nhắn." });
    }

    // Chỉ nhận role user/assistant, cắt độ dài, giữ 10 tin gần nhất
    const history = messages
      .filter(
        (m) =>
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string",
      )
      .map((m) => ({ role: m.role, content: m.content.slice(0, 500) }))
      .slice(-10);

    const hfRes = await fetch(HF_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: HF_MODEL,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          ...history,
        ],
        max_tokens: 400,
        temperature: 0.5,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!hfRes.ok) {
      console.error("HF lỗi:", hfRes.status, await hfRes.text());
      return sendJson(res, 502, {
        error: "Model AI đang bận, vui lòng thử lại.",
      });
    }
    const data = await hfRes.json();
    sendJson(res, 200, {
      reply:
        data.choices?.[0]?.message?.content?.trim() ||
        "Mình chưa có câu trả lời.",
    });
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: "Có lỗi xảy ra, vui lòng thử lại." });
  }
}

// ---------- Phục vụ file tĩnh ----------
function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const rel = urlPath === "/" ? "index.html" : urlPath.slice(1);
  const filePath = path.join(__dirname, rel);

  // Chặn thoát thư mục, file ẩn (.env, .git) và file cấu hình server
  const blocked =
    rel.split("/").some((s) => s.startsWith(".")) ||
    ["server.js", "package.json"].includes(rel);
  if (!filePath.startsWith(__dirname) || blocked) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, {
      "Content-Type":
        MIME[path.extname(filePath).toLowerCase()] ||
        "application/octet-stream",
    });
    res.end(content);
  });
}

http
  .createServer((req, res) => {
    if (req.url.startsWith("/api/chat")) {
      if (req.method === "OPTIONS") return sendJson(res, 204, {});
      if (req.method === "POST") return handleChat(req, res);
      return sendJson(res, 405, { error: "Method not allowed" });
    }
    serveStatic(req, res);
  })
  .listen(PORT, () => console.log(`BCPhone chạy tại http://localhost:${PORT}`));
