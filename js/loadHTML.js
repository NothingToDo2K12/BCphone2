async function includeHTML(elementId, filePath) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`Không thể tải ${filePath}`);
    const data = await response.text();
    document.getElementById(elementId).innerHTML = data;
    if (elementId === 'header-container') {
      window.BCPhoneAuth.initializeNavigation();
      if (typeof window.highlightActiveLink === 'function') {
        window.highlightActiveLink();
      }
    }
  } catch (error) {
    console.error(error);
  }
}

// Tải header và footer vào DOM
document.addEventListener('DOMContentLoaded', () => {
  includeHTML('header-container', 'header.html');
  includeHTML('footer-container', 'footer.html');
});