import { Link } from 'react-router-dom';

export default function RefundPolicy() {
    return (
        <div className="page">
            <div className="policy-container">
                <h1>Refund & Cancellation Policy</h1>
                <p className="policy-updated">Last updated: January 24, 2026</p>

                <section className="policy-section">
                    <h2>1. Overview</h2>
                    <p>
                        At Rewind, we want you to be completely satisfied with your subscription.
                        This policy outlines our refund and cancellation procedures.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>2. Free Trial</h2>
                    <p>
                        All new users receive a <strong>14-day free trial</strong> with full access
                        to all features. No payment is required during the trial period, and you can
                        cancel at any time without any charges.
                    </p>
                    <p>
                        We strongly encourage you to explore all features during the trial period
                        before subscribing to a paid plan.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>3. Refund Eligibility</h2>
                    <h3>3.1 Full Refund (Within 7 Days)</h3>
                    <p>
                        You are eligible for a <strong>full refund</strong> if you request it within
                        7 days of your payment, provided that:
                    </p>
                    <ul>
                        <li>It is your first paid subscription</li>
                        <li>You have not extensively used the platform (less than 10 questions attempted)</li>
                        <li>You provide a valid reason for the refund</li>
                    </ul>

                    <h3>3.2 Pro-rated Refund (After 7 Days)</h3>
                    <p>
                        After 7 days, we may offer a pro-rated refund based on the unused portion
                        of your subscription, at our discretion and on a case-by-case basis.
                    </p>

                    <h3>3.3 No Refund</h3>
                    <p>Refunds will not be provided in the following cases:</p>
                    <ul>
                        <li>After 30 days from the payment date</li>
                        <li>If your account has been suspended for Terms of Service violations</li>
                        <li>For renewals if you forgot to cancel before the renewal date</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>4. How to Request a Refund</h2>
                    <p>To request a refund:</p>
                    <ol>
                        <li>Email us at <a href="mailto:gajanan1055@gmail.com">gajanan1055@gmail.com</a></li>
                        <li>Include your registered email address</li>
                        <li>Provide your reason for requesting a refund</li>
                        <li>Include your payment receipt or transaction ID</li>
                    </ol>
                    <p>We will process your request within 5-7 business days.</p>
                </section>

                <section className="policy-section">
                    <h2>5. Refund Processing</h2>
                    <p>
                        Approved refunds will be credited back to your original payment method
                        within 5-10 business days, depending on your bank or payment provider.
                    </p>
                    <ul>
                        <li><strong>Credit/Debit Cards:</strong> 5-7 business days</li>
                        <li><strong>UPI:</strong> 3-5 business days</li>
                        <li><strong>Net Banking:</strong> 5-10 business days</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>6. Subscription Cancellation</h2>
                    <h3>6.1 How to Cancel</h3>
                    <p>
                        You can cancel your subscription at any time from your Profile page.
                        Cancellation will take effect at the end of your current billing period.
                    </p>

                    <h3>6.2 After Cancellation</h3>
                    <p>After cancellation:</p>
                    <ul>
                        <li>You will continue to have access until your subscription expires</li>
                        <li>Your data (recordings, progress) will be retained for 30 days</li>
                        <li>You can resubscribe at any time to regain access</li>
                    </ul>
                </section>

                <section className="policy-section">
                    <h2>7. Technical Issues</h2>
                    <p>
                        If you experience technical issues that prevent you from using the Service,
                        please contact our support team first. We will make every effort to resolve
                        the issue. If the issue cannot be resolved, you may be eligible for a refund.
                    </p>
                </section>

                <section className="policy-section">
                    <h2>8. Contact Us</h2>
                    <p>
                        For refund requests or questions about this policy:
                    </p>
                    <p>
                        <strong>Email:</strong> <a href="mailto:gajanan1055@gmail.com">gajanan1055@gmail.com</a><br />
                        <strong>Response Time:</strong> Within 24-48 hours
                    </p>
                </section>

                <div className="policy-footer">
                    <Link to="/" className="btn btn-secondary">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
}
