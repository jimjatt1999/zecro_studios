// Stripe integration
const stripe = Stripe('your_publishable_key');

document.getElementById('donate-btn').addEventListener('click', async () => {
    try {
        const response = await fetch('your_server_endpoint/create-donation-session', {
            method: 'POST',
        });
        const session = await response.json();
        
        const result = await stripe.redirectToCheckout({
            sessionId: session.id,
        });

        if (result.error) {
            alert(result.error.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Add scroll animation for elements
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        }
    });
});

document.querySelectorAll('.feature-card, .roadmap-item, .support-card').forEach((el) => observer.observe(el));