import { Link } from 'react-router-dom';
import { Mail, MapPin, Clock, MessageCircle } from 'lucide-react';

export default function Contact() {
    return (
        <div className="page">
            <div className="policy-container">
                <h1>Contact Us</h1>
                <p className="policy-updated">We'd love to hear from you!</p>

                <div className="contact-grid">
                    <div className="contact-card">
                        <div className="contact-icon">
                            <Mail size={24} />
                        </div>
                        <h3>Email Support</h3>
                        <p>For general inquiries and support</p>
                        <a href="mailto:support@rewind.app" className="contact-link">
                            support@rewind.app
                        </a>
                    </div>

                    <div className="contact-card">
                        <div className="contact-icon">
                            <MessageCircle size={24} />
                        </div>
                        <h3>Feedback</h3>
                        <p>Help us improve Rewind</p>
                        <a href="mailto:feedback@rewind.app" className="contact-link">
                            feedback@rewind.app
                        </a>
                    </div>

                    <div className="contact-card">
                        <div className="contact-icon">
                            <Clock size={24} />
                        </div>
                        <h3>Response Time</h3>
                        <p>We typically respond within</p>
                        <span className="contact-highlight">24-48 hours</span>
                    </div>

                    <div className="contact-card">
                        <div className="contact-icon">
                            <MapPin size={24} />
                        </div>
                        <h3>Location</h3>
                        <p>Based in</p>
                        <span className="contact-highlight">Bangalore, India</span>
                    </div>
                </div>

                <section className="policy-section">
                    <h2>Common Queries</h2>

                    <div className="faq-item">
                        <h4>How do I reset my password?</h4>
                        <p>
                            Since we use OAuth (Google/GitHub), there's no password to reset.
                            Simply sign in with your connected account.
                        </p>
                    </div>

                    <div className="faq-item">
                        <h4>How do I cancel my subscription?</h4>
                        <p>
                            Go to your Profile page and click on "Cancel Subscription". You'll
                            continue to have access until your current period ends.
                        </p>
                    </div>

                    <div className="faq-item">
                        <h4>I'm having issues with payment</h4>
                        <p>
                            If your payment failed, please try again or use a different payment method.
                            If issues persist, email us with your transaction details.
                        </p>
                    </div>

                    <div className="faq-item">
                        <h4>How do I delete my account?</h4>
                        <p>
                            Email us at support@rewind.app with your account deletion request.
                            We'll process it within 7 days.
                        </p>
                    </div>

                    <div className="faq-item">
                        <h4>My recordings aren't being analyzed</h4>
                        <p>
                            Make sure your recording is at least 30 seconds long and contains
                            clear audio. If issues persist, try re-recording.
                        </p>
                    </div>
                </section>

                <section className="policy-section">
                    <h2>Business Inquiries</h2>
                    <p>
                        For partnerships, collaborations, or business-related inquiries:
                    </p>
                    <p>
                        <a href="mailto:business@rewind.app">business@rewind.app</a>
                    </p>
                </section>

                <section className="policy-section">
                    <h2>Report Issues</h2>
                    <p>
                        Found a bug or security vulnerability? Please report it responsibly:
                    </p>
                    <p>
                        <a href="mailto:security@rewind.app">security@rewind.app</a>
                    </p>
                </section>

                <div className="policy-footer">
                    <Link to="/" className="btn btn-secondary">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
}
