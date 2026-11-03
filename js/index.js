function phoneDisplay(data) {
    const displayZone = document.getElementById("productList");
    if (!displayZone || !Array.isArray(data)) {
        return;
    }

    displayZone.replaceChildren(...data.map((item) => {
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

phoneDisplay(window.phoneList);