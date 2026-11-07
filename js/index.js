async function phoneDisplay() {
    const URL_BASE = "https://phonedb.chinh.site"
    const displayZone = document.getElementById("productList");
    const url = `${URL_BASE}/phonelist`;

    const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const phonedb = await response.json();
        if (!Array.isArray(phonedb) || phonedb.length === 0 ) {
            throw new TypeError("Invalid phone database");
        }
    
    if (!displayZone || !Array.isArray(phonedb)) {
        return;
    }

    displayZone.replaceChildren(...phonedb.map((item) => {
        const phone = document.createElement("div");
        phone.className = "phone";

        const image = document.createElement("img");
        image.src = item.image_url;
        image.alt = item.name;

        const name = document.createElement("p");
        name.textContent = item.name;

        const storage = document.createElement("p");
        storage.textContent = item.storage;

        const link = document.createElement("a");
        link.href = `phone_detail.html?id=${encodeURIComponent(item.id)}`;

        const button = document.createElement("button");
        button.textContent = "Detail";
        link.appendChild(button);

        phone.append(image, name, storage, link);
        return phone;
    }));
}

phoneDisplay();