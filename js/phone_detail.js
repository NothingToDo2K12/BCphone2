const phoneId = new URLSearchParams(window.location.search).get("id");

async function loadPhoneDetail() {
    if (!phoneId) {
        showDetailError("Không tìm thấy mã điện thoại trong đường dẫn.");
        return;
    }
    
    let BASE_URL = "https://phonedb.chinh.site";
    try {
        let url = `${BASE_URL}/phonelist?id=${phoneId}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const phonedb = await response.json();
        if (!Array.isArray(phonedb) || phonedb.length === 0 ) {
            throw new TypeError("Invalid phone database");
        }
        let phone = phonedb[0];

        // Fetch the price for the phone
        let prices_url = `${BASE_URL}/prices?id=${phoneId}`;
        const priceRes = await fetch(prices_url);
        console.log("Price response:", priceRes);
        if (!priceRes.ok) {
            throw new Error(`Price request failed with status ${priceRes.status}`);
        } 

        const priceItem = await priceRes.json();
        console.log("Price item:", priceItem);
        displayPhoneDetail(phone, priceItem[0].price);

    } catch (error) {
        console.error("Error loading phone detail:", error);
        showDetailError("Không tải được thông tin điện thoại. Vui lòng thử lại.");
    }
}

function displayPhoneDetail(phone, price) {
    const carouselInner = document.querySelector("#phoneCarousel .carousel-inner");
    const carousel = carouselInner?.closest(".carousel");
    const indicators = carousel?.querySelector(".carousel-indicators");

    if (!carousel || !carouselInner || !indicators) {
        throw new Error("Phone image carousel elements were not found.");
    }

    document.querySelector(".product-name").textContent = phone.name;
    document.querySelector(".product-price").textContent = price
        ? `${price.trim()} đ`
        : "Liên hệ để biết giá";
    document.querySelector(".product-desc").textContent = phone.description || "";
    document.title = `Chi tiết ${phone.name}`;

    const phoneSpecs = {
        screen_resolution: phone.screen_resolution,
        os: phone.os,
        main_camera: phone.main_camera,
        front_camera: phone.front_camera,
        cpu: phone.cpu,
        storage: phone.storage,
        connected_port: phone.connected_port,
        battery_capacity: phone.battery_capacity,
        networks: phone.networks,
        material: phone.material
    };
    Object.entries(phoneSpecs).forEach(([key, value]) => {
        const spec = document.querySelector(`[data-spec="${key}"]`);
        if (spec) {
            spec.textContent = value || "Chưa cập nhật";
        }
    });

    const detailImages = Array.isArray(phone.image_detail_url)
        ? phone.image_detail_url
            .filter((url) => typeof url === "string" && url.trim())
            .map((url) => url.trim())
        : [];

    const images = detailImages.length
        ? detailImages
        : typeof phone.image_url === "string" && phone.image_url.trim()
            ? [phone.image_url.trim()]
            : [];

    carouselInner.replaceChildren();
    indicators.replaceChildren();

    if (images.length === 0) {
        showDetailError("Điện thoại này chưa có hình ảnh.");
        return;
    }

    images.forEach((imageUrl, index) => {
        const slide = document.createElement("div");
        slide.className = `carousel-item h-100${index === 0 ? " active" : ""}`;

        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = phone.name ? `${phone.name} image ${index + 1}` : `Phone image ${index + 1}`;
        image.className = "d-block w-100 h-100";
        slide.appendChild(image);
        carouselInner.appendChild(slide);

        const indicator = document.createElement("button");
        indicator.type = "button";
        indicator.dataset.bsTarget = `#${carousel.id}`;
        indicator.dataset.bsSlideTo = String(index);
        indicator.setAttribute("aria-label", `Slide ${index + 1}`);
        if (index === 0) {
            indicator.className = "active";
            indicator.setAttribute("aria-current", "true");
        }
        indicators.appendChild(indicator);
    });
}

function showDetailError(message) {
    const errorMessage = document.getElementById("detailMessage");
    if (errorMessage) {
        errorMessage.textContent = message;
    }
}

loadPhoneDetail();
