document.addEventListener('DOMContentLoaded', () => {
    const themeCheckbox = document.getElementById('theme-toggle-checkbox');
    const body = document.body;

    const lightCon = document.getElementById("lightIcon");
    const darkCon = document.getElementById("darkIcon");

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        themeCheckbox.checked = true;
    }
    themeCheckbox.addEventListener('change', () => {
        if (themeCheckbox.checked) {
            body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
            darkCon.style.opacity = 1;
            lightCon.style.opacity = 0.5;
        } else {
            body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
            lightCon.style.opacity = 1;
            darkCon.style.opacity= 0.5;
        }
    });
});