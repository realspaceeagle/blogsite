/**
 * Table of Contents Scroll Spy
 * Highlights the current section in TOC as user scrolls
 */
document.addEventListener('DOMContentLoaded', function() {
    const toc = document.querySelector('.toc');
    const tocLinks = document.querySelectorAll('.toc a');
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (!toc || tocLinks.length === 0 || headings.length === 0) {
        return; // No TOC or headings found
    }
    
    // Create intersection observer for headings
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0% -35% 0%', // Trigger when heading is in middle of viewport
        threshold: 0
    };
    
    let currentActiveLink = null;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const headingId = entry.target.id;
            const tocLink = document.querySelector(`.toc a[href="#${headingId}"]`);
            
            if (entry.isIntersecting) {
                // Remove active class from all links
                tocLinks.forEach(link => link.classList.remove('active'));
                
                // Add active class to current link
                if (tocLink) {
                    tocLink.classList.add('active');
                    currentActiveLink = tocLink;
                }
            }
        });
    }, observerOptions);
    
    // Observe all headings with IDs
    headings.forEach((heading) => {
        if (heading.id) {
            observer.observe(heading);
        }
    });
    
    // Smooth scrolling for TOC links
    tocLinks.forEach((link) => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Remove active class from all links
                tocLinks.forEach(link => link.classList.remove('active'));
                
                // Add active class to clicked link
                this.classList.add('active');
                currentActiveLink = this;
                
                // Smooth scroll to target
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Handle scroll to top case
    window.addEventListener('scroll', function() {
        if (window.scrollY === 0) {
            tocLinks.forEach(link => link.classList.remove('active'));
            currentActiveLink = null;
        }
    });
});