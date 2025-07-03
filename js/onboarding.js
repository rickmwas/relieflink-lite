// onboarding.js
// Simple user onboarding with tooltips for first-time users

document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('onboardingComplete')) return;

    const steps = [
        {
            selector: '.language-toggle',
            text: 'Switch between English and Kiswahili here!'
        },
        {
            selector: '.action-cards',
            text: 'Choose to request or offer help, or view the map.'
        },
        {
            selector: '.user-options-dropdown, #options-btn',
            text: 'Access your user settings and dark mode here.'
        }
    ];

    let currentStep = 0;
    let tooltip = null;

    function showStep(step) {
        if (tooltip) tooltip.remove();
        const el = document.querySelector(step.selector);
        if (!el) return;
        tooltip = document.createElement('div');
        tooltip.className = 'onboarding-tooltip';
        tooltip.innerHTML = `<span>${step.text}</span><button class="onboarding-next">Next</button>`;
        document.body.appendChild(tooltip);
        const rect = el.getBoundingClientRect();
        tooltip.style.top = (rect.bottom + window.scrollY + 8) + 'px';
        tooltip.style.left = (rect.left + window.scrollX) + 'px';
        tooltip.querySelector('.onboarding-next').onclick = nextStep;
    }

    function nextStep() {
        currentStep++;
        if (currentStep < steps.length) {
            showStep(steps[currentStep]);
        } else {
            if (tooltip) tooltip.remove();
            localStorage.setItem('onboardingComplete', '1');
        }
    }

    showStep(steps[currentStep]);
});
