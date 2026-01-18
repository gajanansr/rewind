import { useNavigate } from 'react-router-dom';
import {
    Target,
    Calendar,
    TrendingUp,
    RefreshCw,
    BookOpen,
    Code2,
    Mic,
    Sparkles,
    ChevronRight,
    Brain,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';

export default function Landing() {
    const navigate = useNavigate();

    const features = [
        {
            icon: Target,
            title: "Set Your Goal",
            description: "Choose your timeline - 30, 60, 90, or 120 days. We'll create a personalized roadmap to get you interview-ready."
        },
        {
            icon: Calendar,
            title: "Dynamic Target Date",
            description: "Watch your target date adjust as you progress. Solve more, reach your goal faster. Skip days? We'll recalculate."
        },
        {
            icon: TrendingUp,
            title: "Track Your Progress",
            description: "Visualize your journey with beautiful progress charts. Know exactly where you stand at any moment."
        },
        {
            icon: BookOpen,
            title: "Pattern-Based Learning",
            description: "169 curated problems organized by 14 core patterns. Master the building blocks of DSA."
        },
        {
            icon: Code2,
            title: "Solve & Paste",
            description: "Solve on LeetCode, paste your solution here. We'll track everything and analyze your approach."
        },
        {
            icon: Mic,
            title: "Think Out Loud",
            description: "Record yourself explaining your solution. Practice the critical interview skill of verbal communication."
        },
        {
            icon: Sparkles,
            title: "AI Feedback",
            description: "Get instant feedback on your solution's optimality and your communication clarity. Improve with every attempt."
        },
        {
            icon: RefreshCw,
            title: "Smart Revisions",
            description: "Spaced repetition powered by AI. We'll remind you to revisit problems before you forget them."
        }
    ];

    const journey = [
        { step: 1, text: "Set your interview timeline" },
        { step: 2, text: "Learn patterns through video explanations" },
        { step: 3, text: "Solve curated problems" },
        { step: 4, text: "Record your verbal explanation" },
        { step: 5, text: "Get AI feedback on approach & communication" },
        { step: 6, text: "Revise intelligently at optimal intervals" },
        { step: 7, text: "Track progress as your target date approaches" },
    ];

    return (
        <div className="landing">
            {/* Hero Section */}
            <section className="landing-hero">
                <div className="landing-hero-content">
                    <div className="landing-badge">
                        <Brain size={16} />
                        <span>AI-Powered Interview Prep</span>
                    </div>

                    <h1 className="landing-title">
                        Master DSA.
                        <br />
                        <span className="landing-title-accent">Crack FAANG.</span>
                    </h1>

                    <p className="landing-subtitle">
                        The intelligent way to prepare for coding interviews.
                        Set a goal, solve curated problems, practice thinking out loud,
                        and get AI feedback on your solutions.
                    </p>

                    <div className="landing-hero-cta">
                        <button
                            className="btn btn-primary btn-xl"
                            onClick={() => navigate('/login')}
                        >
                            Start Your Journey
                            <ArrowRight size={20} />
                        </button>
                        <p className="landing-cta-note">Free to use. No credit card required.</p>
                    </div>
                </div>

                <div className="landing-hero-visual">
                    <div className="landing-hero-card">
                        <div className="landing-countdown">
                            <span className="landing-countdown-number">43</span>
                            <span className="landing-countdown-label">days to FAANG ready</span>
                        </div>
                        <div className="landing-progress-demo">
                            <div className="landing-progress-bar">
                                <div className="landing-progress-fill" style={{ width: '68%' }} />
                            </div>
                            <span className="landing-progress-text">68% complete</span>
                        </div>
                        <div className="landing-trend">
                            <TrendingUp size={18} className="text-success" />
                            <span>IMPROVING - Keep it up!</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Journey Section */}
            <section className="landing-journey">
                <h2 className="landing-section-title">Your Path to Success</h2>
                <p className="landing-section-subtitle">A structured approach to interview mastery</p>

                <div className="landing-journey-steps">
                    {journey.map((item, index) => (
                        <div key={item.step} className="landing-journey-step">
                            <div className="landing-journey-number">{item.step}</div>
                            <div className="landing-journey-text">{item.text}</div>
                            {index < journey.length - 1 && (
                                <ChevronRight size={20} className="landing-journey-arrow" />
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Grid */}
            <section className="landing-features">
                <h2 className="landing-section-title">Everything You Need</h2>
                <p className="landing-section-subtitle">Tools designed for interview success</p>

                <div className="landing-features-grid">
                    {features.map((feature) => (
                        <div key={feature.title} className="landing-feature-card">
                            <div className="landing-feature-icon">
                                <feature.icon size={24} />
                            </div>
                            <h3 className="landing-feature-title">{feature.title}</h3>
                            <p className="landing-feature-description">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Stats Section */}
            <section className="landing-stats">
                <div className="landing-stat">
                    <span className="landing-stat-number">169</span>
                    <span className="landing-stat-label">Curated Problems</span>
                </div>
                <div className="landing-stat">
                    <span className="landing-stat-number">14</span>
                    <span className="landing-stat-label">Core Patterns</span>
                </div>
                <div className="landing-stat">
                    <span className="landing-stat-number">90</span>
                    <span className="landing-stat-label">Days Average</span>
                </div>
            </section>

            {/* Final CTA */}
            <section className="landing-final-cta">
                <div className="landing-final-cta-content">
                    <CheckCircle2 size={48} className="landing-final-icon" />
                    <h2>Ready to Get Started?</h2>
                    <p>Join hundreds of developers preparing smarter, not harder.</p>
                    <button
                        className="btn btn-primary btn-xl"
                        onClick={() => navigate('/login')}
                    >
                        Start Free
                        <ArrowRight size={20} />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <p>Built with ❤️ for aspiring engineers</p>
                <p className="landing-footer-links">
                    <a href="https://www.buymeacoffee.com/gajanansr" target="_blank" rel="noopener noreferrer">
                        Support the Project
                    </a>
                </p>
            </footer>
        </div>
    );
}
