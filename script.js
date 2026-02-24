document.addEventListener('DOMContentLoaded', () => {
    // Mascot Hover Logic - simplified side-to-side movement is handled by CSS keyframes
    // This script now handles landing page specific interactions if needed.

    // --- Original Scroll Reveal Logic ---
    const revealElements = document.querySelectorAll('.reveal');
    const revealOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    revealElements.forEach(el => revealOnScroll.observe(el));
});
