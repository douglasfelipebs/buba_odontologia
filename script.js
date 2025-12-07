// ============================================
// SMOOTH SCROLL FUNCTIONALITY
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll for navigation links
    const navLinks = document.querySelectorAll('.nav-link, .logo');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Only handle anchor links
            if (href && href.startsWith('#')) {
                e.preventDefault();
                
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = targetElement.offsetTop - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    const mobileMenu = document.getElementById('main-nav');
                    const menuToggle = document.getElementById('mobile-menu-toggle');
                    if (mobileMenu.classList.contains('active')) {
                        mobileMenu.classList.remove('active');
                        menuToggle.setAttribute('aria-expanded', 'false');
                    }
                }
            }
        });
    });
    
    // ============================================
    // MOBILE HAMBURGER MENU TOGGLE
    // ============================================
    
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.getElementById('main-nav');
    
    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            
            if (isExpanded) {
                mainNav.classList.remove('active');
                this.setAttribute('aria-expanded', 'false');
                this.setAttribute('aria-label', 'Abrir menu');
            } else {
                mainNav.classList.add('active');
                this.setAttribute('aria-expanded', 'true');
                this.setAttribute('aria-label', 'Fechar menu');
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mainNav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                if (mainNav.classList.contains('active')) {
                    mainNav.classList.remove('active');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                    mobileMenuToggle.setAttribute('aria-label', 'Abrir menu');
                }
            }
        });
    }
    
    // ============================================
    // FEEDBACK CAROUSEL FUNCTIONALITY
    // ============================================
    
    const carouselTrack = document.getElementById('carousel-track');
    const carouselDotsContainer = document.getElementById('carousel-dots');
    const prevButton = document.getElementById('carousel-prev');
    const nextButton = document.getElementById('carousel-next');
    
    if (carouselTrack && carouselDotsContainer) {
        let testimonials = [];
        let currentSlide = 0;
        let totalSlides = 0;
        let autoSlideInterval = null;
        let isUserInteracting = false;
        let carouselDots = [];
        
        // Format date from YYYY-MM-DD to DD/MM/YYYY
        function formatDate(dateString) {
            const date = new Date(dateString + 'T00:00:00');
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
        
        // Generate star rating HTML
        function generateStars(rating) {
            let starsHTML = '<div class="testimonial-stars">';
            for (let i = 1; i <= 5; i++) {
                if (i <= rating) {
                    starsHTML += '<span class="star star-filled">★</span>';
                } else {
                    starsHTML += '<span class="star star-empty">☆</span>';
                }
            }
            starsHTML += '</div>';
            return starsHTML;
        }
        
        // Generate initials from patient name
        function getInitials(paciente) {
            if (!paciente) return '??';
            
            // Split by space and get first letters of first and last words
            const words = paciente.trim().split(/\s+/);
            if (words.length === 0) return '??';
            
            if (words.length === 1) {
                // Only one word, take first two letters
                return words[0].substring(0, 2).toUpperCase();
            }
            
            // Multiple words, take first letter of first and last word
            const firstInitial = words[0].charAt(0).toUpperCase();
            const lastInitial = words[words.length - 1].charAt(0).toUpperCase();
            return firstInitial + lastInitial;
        }
        
        // Sort testimonials by date (most recent first)
        function sortTestimonialsByDate(testimonials) {
            return [...testimonials].sort((a, b) => {
                const dateA = new Date(a.data + 'T00:00:00');
                const dateB = new Date(b.data + 'T00:00:00');
                return dateB - dateA; // Descending order (most recent first)
            });
        }
        
        // Generate avatar HTML (image or initials)
        function generateAvatar(paciente, imgUrl) {
            if (imgUrl) {
                const initials = getInitials(paciente);
                // Use data attribute for fallback initials
                return `<img src="${imgUrl}" alt="Avatar de ${paciente}" class="testimonial-avatar-img" data-initials="${initials}" onerror="handleImageError(this)">`;
            } else {
                const initials = getInitials(paciente);
                return `<span class="testimonial-initials">${initials}</span>`;
            }
        }
        
        // Handle image loading error - replace with initials
        function handleImageError(imgElement) {
            const initials = imgElement.getAttribute('data-initials') || '??';
            imgElement.outerHTML = `<span class="testimonial-initials">${initials}</span>`;
        }
        
        // Make handleImageError available globally for inline onerror handler
        window.handleImageError = function(imgElement) {
            const initials = imgElement.getAttribute('data-initials') || '??';
            imgElement.outerHTML = `<span class="testimonial-initials">${initials}</span>`;
        };
        
        // Load testimonials from JSON
        async function loadTestimonials() {
            try {
                const response = await fetch('assets/depoimentos.json');
                if (!response.ok) {
                    throw new Error('Failed to load testimonials');
                }
                const data = await response.json();
                let loadedTestimonials = data.depoimentos || [];
                
                if (loadedTestimonials.length === 0) {
                    carouselTrack.innerHTML = '<p class="testimonial-error">Nenhum depoimento disponível no momento.</p>';
                    return;
                }
                
                // Sort testimonials by date (most recent first)
                testimonials = sortTestimonialsByDate(loadedTestimonials);
                
                // Generate testimonial cards
                generateTestimonialCards();
                
                // Generate carousel dots
                generateCarouselDots();
                
                // Initialize carousel
                totalSlides = testimonials.length;
                initCarousel();
            } catch (error) {
                console.error('Error loading testimonials:', error);
                carouselTrack.innerHTML = '<p class="testimonial-error">Erro ao carregar depoimentos. Por favor, tente novamente mais tarde.</p>';
            }
        }
        
        // Generate testimonial cards HTML
        function generateTestimonialCards() {
            carouselTrack.innerHTML = testimonials.map((testimonial, index) => {
                const formattedDate = formatDate(testimonial.data);
                const avatar = generateAvatar(testimonial.paciente, testimonial.imgUrl);
                const stars = generateStars(testimonial.estrelas || 5);
                
                return `
                    <div class="testimonial-card">
                        <div class="testimonial-avatar">
                            ${avatar}
                        </div>
                        <div class="testimonial-content">
                            ${stars}
                            <p class="testimonial-text">"${testimonial.texto}"</p>
                            <p class="testimonial-author">— ${testimonial.paciente}</p>
                            <p class="testimonial-date">${formattedDate}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        // Generate carousel dots HTML
        function generateCarouselDots() {
            carouselDotsContainer.innerHTML = testimonials.map((_, index) => {
                return `
                    <button class="carousel-dot ${index === 0 ? 'active' : ''}" 
                            data-index="${index}" 
                            aria-label="Ir para depoimento ${index + 1}" 
                            role="tab" 
                            aria-selected="${index === 0 ? 'true' : 'false'}">
                    </button>
                `;
            }).join('');
            
            // Get fresh reference to dots
            carouselDots = document.querySelectorAll('.carousel-dot');
            
            // Add event listeners to dots
            carouselDots.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    goToSlide(index);
                });
                
                dot.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        goToSlide(index);
                    }
                });
            });
        }
        
        // Initialize carousel
        function initCarousel() {
            updateCarousel();
            startAutoSlide();
            
            // Pause auto-slide on hover
            const carouselContainer = carouselTrack.closest('.carousel-container');
            if (carouselContainer) {
                carouselContainer.addEventListener('mouseenter', pauseAutoSlide);
                carouselContainer.addEventListener('mouseleave', startAutoSlide);
            }
        }
        
        // Update carousel position
        function updateCarousel() {
            const translateX = -currentSlide * 100;
            carouselTrack.style.transform = `translateX(${translateX}%)`;
            
            // Update dots
            carouselDots.forEach((dot, index) => {
                if (index === currentSlide) {
                    dot.classList.add('active');
                    dot.setAttribute('aria-selected', 'true');
                } else {
                    dot.classList.remove('active');
                    dot.setAttribute('aria-selected', 'false');
                }
            });
        }
        
        // Go to specific slide
        function goToSlide(index) {
            if (index < 0 || index >= totalSlides) return;
            currentSlide = index;
            updateCarousel();
            isUserInteracting = true;
            resetAutoSlide();
        }
        
        // Go to previous slide
        function goToPrevSlide() {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            updateCarousel();
            isUserInteracting = true;
            resetAutoSlide();
        }
        
        // Go to next slide
        function goToNextSlide() {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateCarousel();
            isUserInteracting = true;
            resetAutoSlide();
        }
        
        // Auto-slide functionality
        function startAutoSlide() {
            if (!isUserInteracting && totalSlides > 1) {
                autoSlideInterval = setInterval(() => {
                    if (!isUserInteracting) {
                        goToNextSlide();
                    }
                }, 5000); // Change slide every 5 seconds
            }
        }
        
        function pauseAutoSlide() {
            if (autoSlideInterval) {
                clearInterval(autoSlideInterval);
                autoSlideInterval = null;
            }
        }
        
        function resetAutoSlide() {
            pauseAutoSlide();
            setTimeout(() => {
                isUserInteracting = false;
                startAutoSlide();
            }, 3000); // Resume auto-slide after 3 seconds of no interaction
        }
        
        // Event listeners for buttons
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                goToPrevSlide();
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                goToNextSlide();
            });
        }
        
        // Keyboard navigation for carousel
        document.addEventListener('keydown', (e) => {
            const carouselContainer = carouselTrack.closest('.carousel-container');
            if (carouselContainer && carouselContainer.contains(document.activeElement)) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    goToPrevSlide();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    goToNextSlide();
                }
            }
        });
        
        // Touch/swipe support for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        carouselTrack.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        carouselTrack.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    // Swipe left - next slide
                    goToNextSlide();
                } else {
                    // Swipe right - previous slide
                    goToPrevSlide();
                }
            }
        }
        
        // Load testimonials and initialize
        loadTestimonials();
    }
    
    // ============================================
    // HEADER SCROLL BEHAVIOR (Optional enhancement)
    // ============================================
    
    const header = document.querySelector('.header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add/remove shadow on scroll
        if (currentScroll > 10) {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.15)';
        } else {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
        
        lastScroll = currentScroll;
    }, { passive: true });
    
    // ============================================
    // BUTTON ACTIONS (Doctoralia & WhatsApp)
    // ============================================
    
    // All Doctoralia and WhatsApp links are already set with proper target="_blank"
    // and rel attributes in HTML, so no additional JavaScript is needed.
    // However, we can add analytics tracking or confirmations if needed in the future.
    
    // ============================================
    // ACCESSIBILITY ENHANCEMENTS
    // ============================================
    
    // Add keyboard navigation support for service cards
    const serviceCards = document.querySelectorAll('.service-card a');
    serviceCards.forEach(card => {
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    });
    
    // Ensure all interactive elements are keyboard accessible
    const interactiveElements = document.querySelectorAll('a, button');
    interactiveElements.forEach(element => {
        if (!element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '0') {
            // Elements are keyboard accessible by default
            // Just ensure focus styles are visible
        }
    });
});

// ============================================
// PERFORMANCE OPTIMIZATION
// ============================================

// Lazy load images (if needed for production)
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    });
    
    // Observe all images with data-src attribute
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}
