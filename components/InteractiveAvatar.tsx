'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CVIProvider } from '@/app/components/cvi/components/cvi-provider';
import { Conversation } from '@/app/components/cvi/components/conversation';

type TavusConversation = {
    conversation_id: string;
    conversation_url: string;
};

// Icons (Simple SVGs)
function IconArrowRight(props: React.SVGProps<SVGSVGElement>) {
    return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;
}
function IconCalendar(props: React.SVGProps<SVGSVGElement>) {
    return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function IconMail(props: React.SVGProps<SVGSVGElement>) {
    return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
}
function IconX(props: React.SVGProps<SVGSVGElement>) {
    return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}

function ShellBackground() {
    return (
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
            {/* Deep Navy/Black Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#020617] to-black" />
            {/* Gold Glows */}
            <div className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 h-[780px] w-[780px] rounded-full bg-[rgb(var(--gd-gold))]/10 blur-[120px]" />
            <div className="absolute right-[-180px] bottom-[-220px] h-[640px] w-[840px] rounded-full bg-blue-900/20 blur-[130px]" />
            <div className="absolute inset-0 gd-grid opacity-[0.3]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.6)_70%,rgba(0,0,0,0.9)_100%)]" />
        </div>
    );
}

// Added props for user identification
interface InteractiveAvatarProps {
    userName?: string;
    userEmail?: string;
}

export default function InteractiveAvatar({ userName, userEmail }: InteractiveAvatarProps) {
    const [conversation, setConversation] = useState<TavusConversation | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Contact Form
    const [showContactForm, setShowContactForm] = useState(false);
    const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', company: '', companyName: '', message: '' });
    const [contactSubmitting, setContactSubmitting] = useState(false);
    const [contactSuccess, setContactSuccess] = useState(false);

    const openCalendly = () => {
        window.open('https://www.insight.com/', '_blank', 'width=1000,height=800');
    };

    const startConversation = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/tavus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audio_only: false,
                    // Pass user identity for backend tools/webhooks
                    properties: {
                        user_name: userName,
                        user_email: userEmail
                    }
                }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({} as any));
                throw new Error((data as any).error || 'Failed to start conversation');
            }
            const data = (await response.json()) as TavusConversation;
            setConversation(data);
        } catch (err: any) {
            setError(err?.message || 'Connection failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const endConversation = async () => {
        if (!conversation) return;
        try {
            await fetch('/api/tavus/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversation_id: conversation.conversation_id }),
            });
        } catch (err) {
            console.error('Failed to end conversation:', err);
        } finally {
            setConversation(null);
        }
    };

    const handleConversationLeave = useCallback(() => {
        setConversation(null);
    }, []);

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setContactSubmitting(true);
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactForm),
            });
            if (response.ok) {
                setContactSuccess(true);
                setTimeout(() => {
                    setShowContactForm(false);
                    setContactSuccess(false);
                    setContactForm({ name: '', email: '', phone: '', company: '', companyName: '', message: '' });
                }, 2000);
            }
        } catch (err) {
            console.error('Contact error:', err);
        } finally {
            setContactSubmitting(false);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (!conversation?.conversation_id) return;
            fetch('/api/tavus/end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversation_id: conversation.conversation_id }),
                keepalive: true,
            }).catch(console.error);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [conversation]);

    return (
        <CVIProvider>
            <div className="relative h-screen w-full overflow-hidden text-white selection:bg-[rgb(var(--gd-gold))]/30">
                {/* ShellBackground removed for seamless gradient */}

                {/* HEADER */}
                <header className="fixed left-0 top-0 z-[300] w-full px-6 md:px-10 py-4">
                    <div className="mx-auto flex max-w-7xl items-center justify-between">
                        <div className="flex items-center gap-3 z-[1000] relative">
                            {/* Image Logo */}
                            <a href="https://www.insight.com/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                                <img src="/insight-logo-final.png" alt="Insight Enterprises" className="h-24 w-auto object-contain" />
                            </a>
                        </div>

                        <div className="flex items-center gap-3">
                            {!conversation && (
                                <>
                                    <button onClick={openCalendly} className="gd-btn" type="button">
                                        <IconCalendar className="h-4 w-4 text-[rgb(var(--gd-gold))]" />
                                        <span>Book Consultation</span>
                                    </button>
                                    <button onClick={() => setShowContactForm(true)} className="gd-btn" type="button">
                                        <IconMail className="h-4 w-4" />
                                        <span>Contact</span>
                                    </button>
                                </>
                            )}
                            {conversation && (
                                <button onClick={endConversation} className="gd-btn gd-btn-danger" type="button">
                                    <IconX className="h-5 w-5" />
                                    <span>End Session</span>
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {/* MAIN */}
                <main className={conversation ? "h-full w-full pt-[160px]" : "h-full w-full pt-[72px]"}>
                    <section className={conversation ? "flex h-[calc(100vh-160px)] w-full items-center justify-center px-6" : "flex h-[calc(100vh-72px)] w-full items-center justify-center px-6"}>
                        <div className={conversation ? 'w-full max-w-6xl' : 'w-full max-w-4xl h-full flex flex-col items-center justify-center py-10 transform translate-y-[-2%]'}>
                            {conversation ? (
                                <div className="gd-stage">
                                    <div className="bg-slate-900 border border-slate-700/50 rounded-lg overflow-hidden">
                                        <Conversation conversationUrl={conversation.conversation_url} onLeave={handleConversationLeave} />
                                    </div>
                                </div>
                            ) : (
                                <div className="mx-auto flex flex-col items-center justify-between text-center flex-1 py-10">
                                    <div className="flex flex-col items-center mt-6">
                                        <div className="relative mb-8 gd-float">
                                            <div className="absolute inset-0 rounded-full bg-[rgb(var(--gd-gold))]/20 blur-2xl" />
                                            <div className="rounded-full bg-gradient-to-tr from-[rgb(var(--gd-blue))]/30 to-[rgb(var(--gd-gold))]/30 p-2 border border-[rgb(var(--gd-gold))]/30 overflow-hidden">
                                                <img
                                                    src="/amy.png"
                                                    alt="Amy Headshot"
                                                    className="h-44 w-44 md:h-52 md:w-52 rounded-full object-cover object-top scale-[1.1] opacity-95"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <h1 className="text-balance text-4xl md:text-5xl font-light tracking-tight font-serif">
                                                Meet <span className="text-white font-semibold">Amy</span>
                                            </h1>
                                            <p className="mt-4 max-w-xl text-lg text-slate-300 leading-relaxed">
                                                Insight Public Sector SDR
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-3 mt-10">
                                        <button
                                            onClick={startConversation}
                                            disabled={loading}
                                            className="gd-btn px-8 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed text-white hover:bg-white/10 hover:shadow-[0_0_30px_rgba(var(--gd-gold),0.4)] transition-all duration-300"
                                            type="button"
                                        >
                                            <span>{loading ? 'Connecting...' : 'Speak with Amy'}</span>
                                            {!loading && <IconArrowRight className="h-5 w-5" />}
                                        </button>

                                        {error && (
                                            <div className="gd-badge border-red-500/25 bg-red-500/10 text-red-200 mt-4">
                                                <span className="h-2 w-2 rounded-full bg-red-400" />
                                                <span className="text-sm">{error}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-center mt-16">
                                        <p className="text-xs text-slate-400 max-w-md font-medium tracking-wide">
                                            Amy is an AI agent. Information provided is for discovery purposes only and does not constitute technical or legal advice.
                                        </p>

                                        {/* Footer - Only on Landing */}
                                        <footer className="mt-8 text-center px-4 pointer-events-none">
                                            <p className="text-[10px] text-black/70 uppercase tracking-widest">
                                                Insight Public Sector • SDR X-Agent (Amy v1.0) • Internal Demo Only
                                            </p>
                                        </footer>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </main>

                {/* CONTACT MODAL */}
                {showContactForm && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-6">
                        <div className="gd-glass w-full max-w-md p-7 md:p-8 border border-slate-700">
                            <div className="mb-5 flex items-center justify-between">
                                <h3 className="text-xl font-serif text-white">Contact Firm</h3>
                                <button onClick={() => setShowContactForm(false)} className="gd-btn p-2" type="button">
                                    <IconX className="h-5 w-5" />
                                </button>
                            </div>

                            {contactSuccess ? (
                                <div className="gd-badge border-[rgb(var(--gd-gold))]/25 bg-[rgb(var(--gd-gold))]/10 text-pink-100">
                                    <span className="h-2 w-2 rounded-full bg-[rgb(var(--gd-gold))]" />
                                    <span className="text-sm">Message received. We will contact you.</span>
                                </div>
                            ) : (
                                <form onSubmit={handleContactSubmit} className="space-y-4">
                                    <input className="w-full rounded bg-slate-950/50 border border-slate-700 px-4 py-3 text-white focus:border-[rgb(var(--gd-gold))] outline-none" placeholder="Your Name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required />
                                    <input className="w-full rounded bg-slate-950/50 border border-slate-700 px-4 py-3 text-white focus:border-[rgb(var(--gd-gold))] outline-none" placeholder="Email Address" type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} required />
                                    <input className="w-full rounded bg-slate-950/50 border border-slate-700 px-4 py-3 text-white focus:border-[rgb(var(--gd-gold))] outline-none" placeholder="Phone Number" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
                                    <textarea className="w-full rounded bg-slate-950/50 border border-slate-700 px-4 py-3 text-white focus:border-[rgb(var(--gd-gold))] outline-none min-h-[100px]" placeholder="How can we help?" value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} required />

                                    <button type="submit" disabled={contactSubmitting} className="gd-btn gd-btn-primary w-full py-3 disabled:opacity-50 text-white">
                                        {contactSubmitting ? 'Sending...' : 'Send Message'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </CVIProvider>
    );
}
