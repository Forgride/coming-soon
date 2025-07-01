// ForGride - Main JavaScript File

// Smooth scrolling function
function scrollToSignup() {
    const element = document.getElementById('email-signup');
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Form submission handler
async function handleFormSubmit(formData) {
    const submitButton = document.getElementById('submit-btn');
    const originalText = submitButton.innerHTML;
    
    try {
        // Show loading state
        submitButton.innerHTML = 'Joining...';
        submitButton.disabled = true;
        
        // Track event for analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'generate_lead', {
                'event_category': 'engagement',
                'event_label': formData.role
            });
        }
        
        // Track Facebook Pixel event
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Lead', {
                content_category: 'signup',
                content_name: 'waitlist'
            });
        }
        
        // Primary submission to Formspree or your backend
        const response = await fetch('https://formspree.io/f/YOUR_FORMSPREE_ID', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: formData.email,
                role: formData.role,
                message: `ForGride Waitlist Signup - Role: ${formData.role}`,
                timestamp: new Date().toISOString(),
                referrer: document.referrer,
                userAgent: navigator.userAgent
            })
        });
        
        if (response.ok) {
            // Success - show confirmation
            showSuccessMessage();
            
            // Reset form
            document.getElementById('waitlist-form').reset();
            
        } else {
            throw new Error('Network response was not ok');
        }
        
    } catch (error) {
        console.error('Submission error:', error);
        
        // Fallback - store locally and show success
        storeSignupLocally(formData);
        showSuccessMessage();
        
        // Reset form
        document.getElementById('waitlist-form').reset();
        
    } finally {
        // Reset button state
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Store signup data locally as backup
function storeSignupLocally(formData) {
    try {
        const signups = JSON.parse(localStorage.getItem('forgride-signups') || '[]');
        signups.push({
            ...formData,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: document.referrer
        });
        localStorage.setItem('forgride-signups', JSON.stringify(signups));
    } catch (error) {
        console.error('Local storage error:', error);
    }
}

// Show success message
function showSuccessMessage() {
    // Create and show a better success message
    const message = document.createElement('div');
    message.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    message.innerHTML = `
        <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Thank you! You're on the waitlist for early access.</span>
        </div>
    `;
    
    document.body.appendChild(message);
    
    // Animate in
    setTimeout(() => {
        message.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        message.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(message);
        }, 300);
    }, 5000);
}

// Form validation
function validateForm(email, role) {
    const errors = [];
    
    if (!email || !email.trim()) {
        errors.push('Email address is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Please enter a valid email address');
    }
    
    if (!role || !role.trim()) {
        errors.push('Please select your role');
    }
    
    return errors;
}

// Intersection Observer for animations
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Stagger animation for multiple elements
                const delay = Array.from(entry.target.parentElement.children).indexOf(entry.target) * 100;
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, delay);
            }
        });
    }, observerOptions);

    // Observe all feature cards and animated elements
    document.querySelectorAll('.feature-card').forEach(card => {
        observer.observe(card);
    });
}

// Smooth scrolling for anchor links
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Performance monitoring
function initializePerformanceMonitoring() {
    // Monitor largest contentful paint
    if ('web-vitals' in window) {
        web-vitals.getLCP((metric) => {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'web_vital', {
                    name: 'LCP',
                    value: Math.round(metric.value),
                    event_category: 'Web Vitals'
                });
            }
        });
    }
}

// Main initialization function
function initialize() {
    // Initialize animations
    initializeAnimations();
    
    // Initialize smooth scrolling
    initializeSmoothScrolling();
    
    // Initialize performance monitoring
    initializePerformanceMonitoring();
    
    // Add form event listener
    const form = document.getElementById('waitlist-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const role = document.getElementById('role').value;
            
            // Validate form
            const errors = validateForm(email, role);
            if (errors.length > 0) {
                alert(errors.join('\n'));
                return;
            }
            
            // Submit form
            await handleFormSubmit({ email, role });
        });
    }
    
    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.classList.contains('feature-card')) {
            e.target.click();
        }
    });
}

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// Export functions for global access
window.scrollToSignup = scrollToSignup;
