'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminCmsPage() {
  const [activeTab, setActiveTab] = useState<
    'LANDING' | 'SECTIONS' | 'FOOTER' | 'LEGAL' | 'FAQS'
  >('LANDING');

  const [cms, setCms] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    fetch('/api/cms?draft=true')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.cms) {
          setCms(data.cms);
        }
      })
      .catch((err) => console.error('Error fetching CMS data:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (action: 'DRAFT' | 'PUBLISH') => {
    if (!cms) return;
    setSaving(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('printporter_token') : null;
      const res = await fetch('/api/cms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action,
          cms,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      showToast(
        action === 'PUBLISH'
          ? '🎉 Changes published live to Prinly.in!'
          : 'Draft saved successfully.'
      );
      if (data.cms) setCms(data.cms);
    } catch (err: any) {
      showToast(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-purple-400">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent mb-2" />
          <p className="text-xs font-bold">Loading Prinly Zero-Code CMS...</p>
        </div>
      </div>
    );
  }

  const hero = cms?.hero || {};
  const footer = cms?.footer || {};
  const legal = cms?.legal || {};
  const sections = cms?.sections || [];
  const faqs = cms?.faqs || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-purple-600 text-white font-black px-4 py-2.5 text-xs shadow-xl animate-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition"
            title="Back to Admin Dashboard"
          >
            &larr;
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-lg font-black text-white">
                Prinly Content Management System
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-extrabold uppercase">
                Zero-Code Live Editor
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Modifications immediately update public landing, footer, and legal pages
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            target="_blank"
            className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
          >
            Preview Live Site ↗
          </Link>

          <button
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition disabled:opacity-50"
          >
            Save Draft
          </button>

          <button
            onClick={() => handleSave('PUBLISH')}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-black shadow-lg shadow-purple-600/30 transition active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Publishing...' : 'Publish Live Now ✨'}
          </button>
        </div>
      </header>

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('LANDING')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'LANDING'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Hero & Headings
          </button>

          <button
            onClick={() => setActiveTab('SECTIONS')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'SECTIONS'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Modular Sections Builder
          </button>

          <button
            onClick={() => setActiveTab('FAQS')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'FAQS'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            FAQs Management
          </button>

          <button
            onClick={() => setActiveTab('FOOTER')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'FOOTER'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Footer & Socials
          </button>

          <button
            onClick={() => setActiveTab('LEGAL')}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === 'LEGAL'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Legal Policies (/terms, /privacy)
          </button>
        </div>
      </div>

      {/* Content Form Container */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* ======================================================== */}
        {/* TAB 1: HERO & HEADINGS                                   */}
        {/* ======================================================== */}
        {activeTab === 'LANDING' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-heading text-lg font-black text-white">
                Landing Page Hero Copy
              </h2>
              <p className="text-xs text-slate-400">
                Control the primary value proposition, badge, and hero call-to-actions
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Hero Top Pill Badge
                </label>
                <input
                  type="text"
                  value={hero.badge || ''}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      hero: { ...hero, badge: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Headline Part 1
                  </label>
                  <input
                    type="text"
                    value={hero.headlinePart1 || ''}
                    onChange={(e) =>
                      setCms({
                        ...cms,
                        hero: { ...hero, headlinePart1: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Headline Part 2 (Accent)
                  </label>
                  <input
                    type="text"
                    value={hero.headlinePart2 || ''}
                    onChange={(e) =>
                      setCms({
                        ...cms,
                        hero: { ...hero, headlinePart2: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Supporting Subheading
                </label>
                <textarea
                  rows={3}
                  value={hero.subheading || ''}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      hero: { ...hero, subheading: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Primary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={hero.primaryCtaText || ''}
                    onChange={(e) =>
                      setCms({
                        ...cms,
                        hero: { ...hero, primaryCtaText: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Secondary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={hero.secondaryCtaText || ''}
                    onChange={(e) =>
                      setCms({
                        ...cms,
                        hero: { ...hero, secondaryCtaText: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Statistics Metrics */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
                  Live Metric Cards (3 Display Counters)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <input
                      type="text"
                      value={hero.stat1Number || ''}
                      onChange={(e) =>
                        setCms({
                          ...cms,
                          hero: { ...hero, stat1Number: e.target.value },
                        })
                      }
                      className="w-full bg-transparent font-black text-sm text-white outline-none mb-1"
                    />
                    <input
                      type="text"
                      value={hero.stat1Label || ''}
                      onChange={(e) =>
                        setCms({
                          ...cms,
                          hero: { ...hero, stat1Label: e.target.value },
                        })
                      }
                      className="w-full bg-transparent text-[11px] text-slate-400 outline-none"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <input
                      type="text"
                      value={hero.stat2Number || ''}
                      onChange={(e) =>
                        setCms({
                          ...cms,
                          hero: { ...hero, stat2Number: e.target.value },
                        })
                      }
                      className="w-full bg-transparent font-black text-sm text-cyan-400 outline-none mb-1"
                    />
                    <input
                      type="text"
                      value={hero.stat2Label || ''}
                      onChange={(e) =>
                        setCms({
                          ...cms,
                          hero: { ...hero, stat2Label: e.target.value },
                        })
                      }
                      className="w-full bg-transparent text-[11px] text-slate-400 outline-none"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <input
                      type="text"
                      value={hero.stat3Number || ''}
                      onChange={(e) =>
                        setCms({
                          ...cms,
                          hero: { ...hero, stat3Number: e.target.value },
                        })
                      }
                      className="w-full bg-transparent font-black text-sm text-emerald-400 outline-none mb-1"
                    />
                    <input
                      type="text"
                      value={hero.stat3Label || ''}
                      onChange={(e) =>
                        setCms({
                          ...cms,
                          hero: { ...hero, stat3Label: e.target.value },
                        })
                      }
                      className="w-full bg-transparent text-[11px] text-slate-400 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: MODULAR SECTIONS BUILDER                          */}
        {/* ======================================================== */}
        {activeTab === 'SECTIONS' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-heading text-lg font-black text-white">
                Modular Section Visibility & Ordering
              </h2>
              <p className="text-xs text-slate-400">
                Enable or disable sections on the homepage without altering layout code
              </p>
            </div>

            <div className="space-y-3">
              {sections.map((section: any, idx: number) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-lg bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-white text-xs block">
                        {section.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ID: #{section.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const updated = sections.map((s: any) =>
                          s.id === section.id ? { ...s, visible: !s.visible } : s
                        );
                        setCms({ ...cms, sections: updated });
                      }}
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold transition ${
                        section.visible !== false
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {section.visible !== false ? '● VISIBLE' : '○ HIDDEN'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: FAQS MANAGEMENT                                   */}
        {/* ======================================================== */}
        {activeTab === 'FAQS' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-black text-white">
                  Frequently Asked Questions
                </h2>
                <p className="text-xs text-slate-400">
                  Update questions and answers displayed in the public accordion
                </p>
              </div>

              <button
                onClick={() => {
                  const newFaq = {
                    id: `faq_${Date.now()}`,
                    question: 'New Question Title',
                    answer: 'Provide a helpful answer to common inquiries here.',
                  };
                  setCms({ ...cms, faqs: [...faqs, newFaq] });
                }}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
              >
                + Add FAQ
              </button>
            </div>

            <div className="space-y-4">
              {faqs.map((faq: any, idx: number) => (
                <div
                  key={faq.id}
                  className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500">FAQ #{idx + 1}</span>
                    <button
                      onClick={() => {
                        const updated = faqs.filter((f: any) => f.id !== faq.id);
                        setCms({ ...cms, faqs: updated });
                      }}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>

                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => {
                      const updated = faqs.map((f: any) =>
                        f.id === faq.id ? { ...f, question: e.target.value } : f
                      );
                      setCms({ ...cms, faqs: updated });
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-bold outline-none focus:border-purple-500"
                  />

                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => {
                      const updated = faqs.map((f: any) =>
                        f.id === faq.id ? { ...f, answer: e.target.value } : f
                      );
                      setCms({ ...cms, faqs: updated });
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-purple-500 leading-relaxed"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: FOOTER & SOCIALS                                  */}
        {/* ======================================================== */}
        {activeTab === 'FOOTER' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-heading text-lg font-black text-white">
                Footer Brand & Support Contacts
              </h2>
              <p className="text-xs text-slate-400">
                Contact details, taglines, and social media references
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Footer Logo Text
                  </label>
                  <input
                    type="text"
                    value={footer.logoText || ''}
                    onChange={(e) =>
                      setCms({
                        ...cms,
                        footer: { ...footer, logoText: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={footer.tagline || ''}
                    onChange={(e) =>
                      setCms({
                        ...cms,
                        footer: { ...footer, tagline: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Footer Description
                </label>
                <textarea
                  rows={2}
                  value={footer.description || ''}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      footer: { ...footer, description: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={footer.contactEmail || ''}
                    onChange={(e) =>
                      setCms({
                        ...cms,
                        footer: { ...footer, contactEmail: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Helpline Phone
                  </label>
                  <input
                    type="text"
                    value={footer.contactPhone || ''}
                    onChange={(e) =>
                      setCms({
                        ...cms,
                        footer: { ...footer, contactPhone: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Headquarters Physical Address
                </label>
                <input
                  type="text"
                  value={footer.contactAddress || ''}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      footer: { ...footer, contactAddress: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: LEGAL POLICIES                                    */}
        {/* ======================================================== */}
        {activeTab === 'LEGAL' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-heading text-lg font-black text-white">
                Legal Policies Editor (Markdown Supported)
              </h2>
              <p className="text-xs text-slate-400">
                Directly affects public routes: /terms, /privacy-policy, /refund-policy
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-purple-400">
                    Terms & Conditions (/terms)
                  </label>
                  <Link href="/terms" target="_blank" className="text-[11px] text-slate-400 hover:underline">
                    View Public Page ↗
                  </Link>
                </div>
                <textarea
                  rows={8}
                  value={legal.termsAndConditions || ''}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      legal: { ...legal, termsAndConditions: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-cyan-400">
                    Privacy Policy (/privacy-policy)
                  </label>
                  <Link href="/privacy-policy" target="_blank" className="text-[11px] text-slate-400 hover:underline">
                    View Public Page ↗
                  </Link>
                </div>
                <textarea
                  rows={8}
                  value={legal.privacyPolicy || ''}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      legal: { ...legal, privacyPolicy: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-emerald-400">
                    Refund & Cancellation Policy (/refund-policy)
                  </label>
                  <Link href="/refund-policy" target="_blank" className="text-[11px] text-slate-400 hover:underline">
                    View Public Page ↗
                  </Link>
                </div>
                <textarea
                  rows={8}
                  value={legal.refundPolicy || ''}
                  onChange={(e) =>
                    setCms({
                      ...cms,
                      legal: { ...legal, refundPolicy: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
