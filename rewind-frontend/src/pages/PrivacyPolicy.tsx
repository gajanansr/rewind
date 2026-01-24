import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
    return (
        <div className="page">
            <div className="policy-container">
                <h1>Privacy Policy</h1>
                <p className="policy-updated">Last updated: January 24, 2026</p>

                <section className="policy-section">
                    <h2>1. Introduction</h2>
                    <p>
                        Welcome to Rewind ("we," "our," or "us"). We are committed to protecting your
                        personal information and your right to privacy. This Privacy Policy explains how
                        we collect, use, disclose, and safeguard your information when you use our
                        interview preparation platform.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>2. Information We Collect</h2>
                    <h3>2.1 Personal Information</h3>
                    <p>We collect information that you provide directly to us:</p>
                    <ul>
                        <li><strong>Account Information:</strong> Email address, name, and profile picture (via Google/GitHub OAuth)</li>
                        <li><strong>Payment Information:</strong> Billing details processed securely through Razorpay</li>
                        <li><strong>User Content:</strong> Audio recordings of your explanations, solutions you submit</li>
                    </ul>

                    <h3>2.2 Automatically Collected Information</h3>
                    <ul>
                        <li>Device information (browser type, operating system)</li>
                        <li>Usage data (pages visited, features used, time spent)</li>
                        <li>IP address and approximate location</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>3. How We Use Your Information</h2>
                    <p>We use the collected information for:</p>
                    <ul>
                        <li>Providing and maintaining our services</li>
                        <li>Processing your payments and subscriptions</li>
                        <li>Analyzing your recordings to provide AI-powered feedback</li>
                        <li>Tracking your learning progress and scheduling revisions</li>
                        <li>Sending important updates about your account</li>
                        <li>Improving our platform and developing new features</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>4. Data Storage and Security</h2>
                    <p>
                        Your data is stored securely using industry-standard encryption. Audio recordings
                        are stored on secure cloud servers (Google Cloud/Supabase). We implement
                        appropriate technical and organizational measures to protect your personal data
                        against unauthorized access, alteration, disclosure, or destruction.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>5. Third-Party Services</h2>
                    <p>We use the following third-party services:</p>
                    <ul>
                        <li><strong>Supabase:</strong> Authentication and data storage</li>
                        <li><strong>Google Cloud:</strong> Audio file storage and AI processing</li>
                        <li><strong>Razorpay:</strong> Payment processing (we do not store card details)</li>
                        <li><strong>Google Gemini:</strong> AI analysis of your explanations</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>6. Data Retention</h2>
                    <p>
                        We retain your personal data for as long as your account is active or as needed
                        to provide services. You can request deletion of your account and associated data
                        at any time by contacting us.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>7. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your personal data</li>
                        <li>Correct inaccurate data</li>
                        <li>Request deletion of your data</li>
                        <li>Export your data in a portable format</li>
                        <li>Opt-out of marketing communications</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>8. Cookies</h2>
                    <p>
                        We use essential cookies for authentication and session management. We do not
                        use third-party tracking cookies for advertising purposes.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>9. Children's Privacy</h2>
                    <p>
                        Our service is not intended for users under 13 years of age. We do not knowingly
                        collect personal information from children under 13.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>10. Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time. We will notify you of any
                        changes by posting the new Privacy Policy on this page and updating the "Last
                        updated" date.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>11. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at:
                    </p>
                    <p>
                        <strong>Email:</strong> <a href="mailto:support@rewind.app">support@rewind.app</a><br />
                        <strong>Address:</strong> Bangalore, Karnataka, India
                    </p>
                </section>

                <div className="policy-footer">
                    <Link to="/" className="btn btn-secondary">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
}
