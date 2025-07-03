// theme.js
// Handles dark/light theme switching and user options dropdown

document.addEventListener('DOMContentLoaded', function() {
    const optionsBtn = document.getElementById('options-btn');
    const optionsDropdown = document.getElementById('user-options-dropdown');
    const themeToggle = document.getElementById('theme-toggle');

    // Show/hide user options dropdown
    if (optionsBtn && optionsDropdown) {
        optionsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            optionsDropdown.classList.toggle('hidden');
            // Position dropdown below the button
            const rect = optionsBtn.getBoundingClientRect();
            optionsDropdown.style.top = (rect.bottom + window.scrollY + 8) + 'px';
            optionsDropdown.style.left = (rect.left + window.scrollX) + 'px';
        });
        // Hide dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!optionsDropdown.contains(e.target) && e.target !== optionsBtn) {
                optionsDropdown.classList.add('hidden');
            }
        });
    }

    // Theme toggle logic
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeToggle) themeToggle.checked = (theme === 'dark');
    }

    // Load theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    if (themeToggle) {
        themeToggle.checked = (savedTheme === 'dark');
        themeToggle.addEventListener('change', function() {
            setTheme(this.checked ? 'dark' : 'light');
        });
    }
});
