import { Link } from 'react-router-dom';

export default function TermsOfService() {
    return (
        <div className="page">
            <div className="policy-container">
                <h1>Terms of Service</h1>
                <p className="policy-updated">Last updated: January 24, 2026</p>

                <section className="policy-section">
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using Rewind ("the Service"), you agree to be bound by these
                        Terms of Service. If you do not agree to these terms, please do not use our Service.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>2. Description of Service</h2>
                    <p>
                        Rewind is an interview preparation platform that helps users practice DSA
                        (Data Structures and Algorithms) problems through voice explanations, AI-powered
                        feedback, and spaced repetition learning.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>3. User Accounts</h2>
                    <ul>
                        <li>You must provide accurate information when creating an account</li>
                        <li>You are responsible for maintaining the security of your account</li>
                        <li>You must be at least 13 years old to use this Service</li>
                        <li>One person may not maintain multiple accounts</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>4. Subscription and Payments</h2>
                    <h3>4.1 Free Trial</h3>
                    <p>
                        New users receive a 14-day free trial with full access to all features. No
                        payment information is required for the trial.
                    </p>

                    <h3>4.2 Paid Plans</h3>
                    <ul>
                        <li><strong>Monthly Plan:</strong> ₹149/month</li>
                        <li><strong>Quarterly Plan:</strong> ₹299/3 months (Save ₹148)</li>
                    </ul>

                    <h3>4.3 Payment Processing</h3>
                    <p>
                        All payments are processed securely through Razorpay. We do not store your
                        credit/debit card information on our servers.
                    </p>

                    <h3>4.4 Subscription Renewal</h3>
                    <p>
                        Subscriptions do not auto-renew. You will need to manually renew your
                        subscription before it expires to continue accessing premium features.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>5. User Content</h2>
                    <p>
                        You retain ownership of all content you create, including audio recordings
                        and code solutions. By using our Service, you grant us a limited license to:
                    </p>
                    <ul>
                        <li>Store and process your content to provide the Service</li>
                        <li>Analyze your recordings using AI to provide feedback</li>
                        <li>Use anonymized, aggregated data to improve our Service</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>6. Acceptable Use</h2>
                    <p>You agree not to:</p>
                    <ul>
                        <li>Share your account credentials with others</li>
                        <li>Use the Service for any illegal purpose</li>
                        <li>Attempt to reverse engineer or hack the Service</li>
                        <li>Upload malicious content or code</li>
                        <li>Resell or redistribute our content without permission</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>7. Intellectual Property</h2>
                    <p>
                        The Service, including its design, features, and content (excluding user-generated
                        content), is owned by Rewind and protected by intellectual property laws.
                        Question content from LeetCode is used for educational purposes with proper attribution.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>8. Disclaimer of Warranties</h2>
                    <p>
                        The Service is provided "as is" without warranties of any kind. We do not
                        guarantee that using our Service will result in passing interviews or getting jobs.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>9. Limitation of Liability</h2>
                    <p>
                        To the maximum extent permitted by law, Rewind shall not be liable for any
                        indirect, incidental, special, consequential, or punitive damages arising from
                        your use of the Service.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>10. Account Termination</h2>
                    <p>
                        We reserve the right to suspend or terminate your account if you violate these
                        Terms. You may also delete your account at any time through the Settings page.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>11. Changes to Terms</h2>
                    <p>
                        We may modify these Terms at any time. Continued use of the Service after
                        changes constitutes acceptance of the modified Terms.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>12. Governing Law</h2>
                    <p>
                        These Terms shall be governed by the laws of India. Any disputes shall be
                        resolved in the courts of Bangalore, Karnataka.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>13. Contact</h2>
                    <p>
                        For questions about these Terms, contact us at{' '}
                        <a href="mailto:gajanan1055@gmail.com">gajanan1055@gmail.com</a>
                    </p>
                </section>

                <div className="policy-footer">
                    <Link to="/" className="btn btn-secondary">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
}
