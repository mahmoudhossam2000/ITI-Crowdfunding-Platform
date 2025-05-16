// Function to load and insert footer
export function loadFooter() {
    return `
    <footer>
        <div class="container">
            <div class="row g-4">
                <div class="col-lg-4 mb-4">
                    <h5>About CrowdFund</h5>
                    <p class="text-muted">
                        Empowering people to help others and make a positive impact in the
                        world through crowdfunding. Join our community of changemakers
                        today.
                    </p>
                    <div class="social-links d-flex gap-3 mt-4">
                        <a href="#"><i class="fab fa-facebook"></i></a>
                        <a href="#"><i class="fab fa-twitter"></i></a>
                        <a href="#"><i class="fab fa-instagram"></i></a>
                        <a href="#"><i class="fab fa-linkedin"></i></a>
                    </div>
                </div>
                <div class="col-lg-4 mb-4">
                    <h5>Quick Links</h5>
                    <ul class="list-unstyled quick-links">
                        <li>
                            <a href="#" class="text-muted text-decoration-none">About Us</a>
                        </li>
                        <li>
                            <a href="#" class="text-muted text-decoration-none">How It Works</a>
                        </li>
                        <li>
                            <a href="#" class="text-muted text-decoration-none">Support</a>
                        </li>
                        <li>
                            <a href="#" class="text-muted text-decoration-none">Terms of Service</a>
                        </li>
                        <li>
                            <a href="#" class="text-muted text-decoration-none">Privacy Policy</a>
                        </li>
                    </ul>
                </div>
                <div class="col-lg-4 mb-4">
                    <h5>Contact Us</h5>
                    <ul class="list-unstyled quick-links">
                        <li>
                            <a href="mailto:support@crowdfund.com" class="text-muted text-decoration-none">
                                <i class="fas fa-envelope me-2"></i>support@crowdfund.com
                            </a>
                        </li>
                        <li>
                            <a href="tel:+1234567890" class="text-muted text-decoration-none">
                                <i class="fas fa-phone me-2"></i>+1 (234) 567-890
                            </a>
                        </li>
                        <li>
                            <a href="#" class="text-muted text-decoration-none">
                                <i class="fas fa-map-marker-alt me-2"></i>123 Funding Street,
                                NY 10001
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <hr />
            <div class="text-center text-muted">
                <small>&copy; 2024 CrowdFund. All rights reserved.</small>
            </div>
        </div>
    </footer>
    `;
} 