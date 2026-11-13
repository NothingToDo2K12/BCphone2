function highlightActiveLink() {
    const phoneLink = document.getElementById('phone-link');
    const newsLink = document.getElementById('news-link');
    const aboutLink = document.getElementById('about-link');
    const activeLink = {
        'index.html': phoneLink,
        'news.html': newsLink,
        'about.html': aboutLink
    }[window.location.pathname.split('/').pop().toLowerCase()];

    if (!activeLink || !phoneLink || !newsLink || !aboutLink) {
        return;
    }

    [phoneLink, newsLink, aboutLink].forEach(function (link) {
        link.classList.toggle('active', link === activeLink);
    });
}

window.highlightActiveLink = highlightActiveLink;