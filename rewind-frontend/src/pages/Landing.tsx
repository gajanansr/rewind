import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    Target,
    Calendar,
    Code2,
    Mic,
    Sparkles,
    RefreshCw,
    ArrowRight,
    Play,
    ChevronDown,
    Coffee
} from 'lucide-react';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
    const navigate = useNavigate();
    const [daysCount, setDaysCount] = useState(90);
    const sectionRef = useRef<HTMLElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Animate countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setDaysCount(prev => prev <= 45 ? 45 : prev - 1);
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // GSAP ScrollTrigger horizontal scroll
    useEffect(() => {
        const timer = setTimeout(() => {
            const ctx = gsap.context(() => {
                const container = containerRef.current;
                const section = sectionRef.current;
                if (!container || !section) return;

                // Get scroll distance based on actual content width
                const getScrollDistance = () => container.scrollWidth - window.innerWidth;

                gsap.to(container, {
                    x: () => -getScrollDistance(),
                    ease: 'none',
                    scrollTrigger: {
                        trigger: section,
                        pin: true,
                        pinSpacing: true,
                        scrub: 1,
                        start: 'top top',
                        end: () => `+=${getScrollDistance()}`,
                        anticipatePin: 1,
                        invalidateOnRefresh: true,
                        snap: {
                            snapTo: 1 / 5,
                            duration: 0.3,
                            ease: 'power1.inOut'
                        }
                    }
                });
            });

            return () => ctx.revert();
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const steps = [
        {
            icon: Target,
            title: "Set Your Goal",
            desc: "Pick your timeline. We'll create a personalized path to interview readiness.",
            color: "#6366f1",
            visual: (
                <div className="card-visual">
                    <div className="goal-buttons">
                        <span className="goal-btn">30 days</span>
                        <span className="goal-btn active">90 days</span>
                        <span className="goal-btn">120 days</span>
                    </div>
                </div>
            )
        },
        {
            icon: Calendar,
            title: "Track Progress",
            desc: "Every solved problem brings your ready date closer. Stay consistent.",
            color: "#8b5cf6",
            visual: (
                <div className="card-visual">
                    <div className="countdown-display">
                        <span className="countdown-num">{daysCount}</span>
                        <span className="countdown-label">days left</span>
                    </div>
                </div>
            )
        },
        {
            icon: Code2,
            title: "Solve Problems",
            desc: "169 curated problems across 21 patterns. Real interview questions.",
            color: "#a855f7",
            visual: (
                <div className="card-visual code-visual">
                    <code>def twoSum(nums):</code>
                    <code>  seen = {"{}"}</code>
                    <code>  for i, n in nums:</code>
                    <code className="cursor">▊</code>
                </div>
            )
        },
        {
            icon: Mic,
            title: "Explain Out Loud",
            desc: "Record your thought process. The skill that wins interviews.",
            color: "#d946ef",
            visual: (
                <div className="card-visual">
                    <div className="wave-visual">
                        {[30, 70, 100, 60, 80, 40, 90, 50].map((h, i) => (
                            <div key={i} className="wave-bar" style={{ height: `${h}%` }} />
                        ))}
                    </div>
                </div>
            )
        },
        {
            icon: Sparkles,
            title: "Get AI Feedback",
            desc: "Instant analysis of your code and explanation. Know what to improve.",
            color: "#ec4899",
            visual: (
                <div className="card-visual feedback-visual">
                    <div className="feedback-line good">✓ O(n) time complexity</div>
                    <div className="feedback-line warn">↑ Explain space usage</div>
                    <div className="feedback-line good">✓ Clear explanation</div>
                </div>
            )
        },
        {
            icon: RefreshCw,
            title: "Revise & Master",
            desc: "Spaced repetition ensures you remember. Long-term mastery, not cramming.",
            color: "#f43f5e",
            visual: (
                <div className="card-visual">
                    <div className="revision-visual">
                        <span className="rev-day done">Day 1 ✓</span>
                        <span className="rev-day done">Day 3 ✓</span>
                        <span className="rev-day current">Day 7</span>
                        <span className="rev-day">Day 14</span>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="landing">
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="landing-nav-content">
                    <div className="landing-logo">
                        <span className="logo-icon">↻</span>
                        <span className="logo-text">Rewind</span>
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/login')}>
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <section className="landing-hero">
                <h1 className="hero-title">
                    Stop <span className="strike">memorizing</span>
                    <br />
                    Start <span className="highlight">understanding</span>
                </h1>
                <p className="hero-subtitle">
                    The interview prep that actually works. Set a goal, solve problems, explain your thinking, get AI feedback.
                </p>
                <button className="btn btn-primary btn-xl hero-cta" onClick={() => navigate('/login')}>
                    <Play size={20} />
                    Start Your Journey
                </button>
                <button className="scroll-hint" onClick={() => sectionRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                    <ChevronDown size={24} />
                    <span>See how it works</span>
                </button>
            </section>

            {/* Horizontal Scroll Section */}
            <section className="horizontal-section" ref={sectionRef}>
                <h2 className="section-title">The Process That Works</h2>
                <div className="horizontal-wrapper">
                    <div className="horizontal-cards" ref={containerRef}>
                        {steps.map((step, i) => (
                            <div key={i} className="h-card">
                                <div className="h-card-visual">
                                    {step.visual}
                                </div>
                                <div className="h-card-info">
                                    <div className="h-card-icon" style={{ background: step.color }}>
                                        <step.icon size={24} color="white" />
                                    </div>
                                    <div className="h-card-step">Step {i + 1}</div>
                                    <h3 className="h-card-title">{step.title}</h3>
                                    <p className="h-card-desc">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="landing-values">
                <div className="value-item">
                    <div className="value-number">169</div>
                    <div className="value-label">Curated problems</div>
                </div>
                <div className="value-item">
                    <div className="value-number">21</div>
                    <div className="value-label">Core patterns</div>
                </div>
                <div className="value-item">
                    <div className="value-number">AI</div>
                    <div className="value-label">Powered feedback</div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="landing-final">
                <h2>Ready to actually prepare?</h2>
                <p>Free to use. No credit card required.</p>
                <button className="btn btn-primary btn-xl" onClick={() => navigate('/login')}>
                    Start Now <ArrowRight size={20} />
                </button>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-left">
                        <div className="footer-brand">↻ Rewind</div>
                        <p className="footer-tagline">Master DSA. Crack FAANG.</p>
                    </div>
                    <div className="footer-links">
                        <Link to="/privacy">Privacy Policy</Link>
                        <Link to="/terms">Terms of Service</Link>
                        <Link to="/refund">Refund Policy</Link>
                        <Link to="/contact">Contact</Link>
                    </div>
                    <a href="https://www.buymeacoffee.com/gajanansr" target="_blank" rel="noopener noreferrer" className="footer-support">
                        <Coffee size={16} /> Buy me a coffee
                    </a>
                </div>
                <div className="footer-bottom">© 2026 Rewind. All rights reserved.</div>
            </footer>
        </div>
    );
}
