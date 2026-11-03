const searchScriptUrl = new URL(document.currentScript.src);
const phoneDetailUrl = new URL("../phone_detail.html", searchScriptUrl);
let nextResultsId = 0;

const searchStyles = document.createElement("style");
searchStyles.textContent = `
    .phone-search {
        position: relative;
    }

    .phone-search-results {
        position: absolute;
        top: calc(100% + 0.25rem);
        left: 0;
        right: 0;
        z-index: 1080;
        max-height: 18rem;
        overflow-y: auto;
        padding: 0.25rem 0;
        background: #fff;
        border: 1px solid #dee2e6;
        border-radius: 0.375rem;
        box-shadow: 0 0.5rem 1rem rgb(0 0 0 / 15%);
    }

    .phone-search-results[hidden] {
        display: none;
    }

    .phone-search-results a,
    .phone-search-results p {
        display: block;
        margin: 0;
        padding: 0.5rem 0.75rem;
    }

    .phone-search-results a {
        color: inherit;
        text-decoration: none;
    }

    .phone-search-results a:hover,
    .phone-search-results a:focus {
        background: #f1f3f5;
    }
`;
document.head.appendChild(searchStyles);

function getPhones() {
    if (!Array.isArray(window.phoneList)) {
        throw new TypeError("Phone list is not available");
    }
    return window.phoneList;
}

function normalizePhoneName(value) {
    return value
        .toLocaleLowerCase("vi")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function showSearchMessage(results, message) {
    const item = document.createElement("p");
    item.textContent = message;
    results.replaceChildren(item);
    results.hidden = false;
}

function initializePhoneSearch(root = document) {
    const forms = [];
    if (root.matches?.('form[role="search"]')) {
        forms.push(root);
    }
    forms.push(...root.querySelectorAll('form[role="search"]'));

    forms.forEach((form) => {
        if (form.dataset.phoneSearchReady) {
            return;
        }

        const input = form.querySelector('input[type="search"]');
        if (!input) {
            return;
        }

        form.dataset.phoneSearchReady = "true";
        form.classList.add("phone-search");
        input.autocomplete = "off";

        const results = document.createElement("div");
        results.className = "phone-search-results";
        results.id = `phone-search-results-${++nextResultsId}`;
        results.setAttribute("role", "listbox");
        results.hidden = true;
        form.appendChild(results);
        input.setAttribute("aria-controls", results.id);
        input.setAttribute("aria-expanded", "false");

        const updateResults = async () => {
            const query = normalizePhoneName(input.value);
            if (!query) {
                results.hidden = true;
                input.setAttribute("aria-expanded", "false");
                return [];
            }

            try {
                const phones = getPhones();
                const matchedPhones = phones.filter((phone) =>
                    typeof phone.name === "string" &&
                    normalizePhoneName(phone.name).startsWith(query)
                );
                const uniquePhones = new Map();
                matchedPhones.forEach((phone) => {
                    const name = normalizePhoneName(phone.name);
                    if (!uniquePhones.has(name)) {
                        uniquePhones.set(name, phone);
                    }
                });
                const matches = Array.from(uniquePhones.values()).slice(0, 3);

                if (matches.length === 0) {
                    showSearchMessage(results, "Không tìm thấy điện thoại phù hợp.");
                } else {
                    const links = matches.map((phone) => {
                        const link = document.createElement("a");
                        const detailUrl = new URL(phoneDetailUrl);
                        detailUrl.searchParams.set("id", phone.id);
                        link.href = detailUrl.href;
                        link.textContent = phone.name;
                        link.setAttribute("role", "option");
                        return link;
                    });
                    results.replaceChildren(...links);
                    results.hidden = false;
                }
                input.setAttribute("aria-expanded", "true");
                return matches;
            } catch (error) {
                console.error("Error loading phone search data:", error);
                showSearchMessage(results, "Không tải được dữ liệu tìm kiếm.");
                input.setAttribute("aria-expanded", "true");
                return [];
            }
        };

        input.addEventListener("input", updateResults);
        input.addEventListener("focus", () => {
            if (input.value.trim()) {
                updateResults();
            }
        });
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const matches = await updateResults();
            const firstResult = results.querySelector("a");
            if (matches.length && firstResult) {
                window.location.href = firstResult.href;
            }
        });
        document.addEventListener("click", (event) => {
            if (!form.contains(event.target)) {
                results.hidden = true;
                input.setAttribute("aria-expanded", "false");
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initializePhoneSearch();

    const headerContainer = document.getElementById("header-container");
    if (headerContainer) {
        const observer = new MutationObserver(() => initializePhoneSearch(headerContainer));
        observer.observe(headerContainer, { childList: true, subtree: true });
    }
}, { once: true });