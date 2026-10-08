'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  PRICING_PLANS,
  PricingPlan,
  PlanId,
  UPI_CONFIG,
  buildUpiDeepLink,
  buildMobileAppUpiLinks,
  buildVerificationTelegramUrl,
} from '@/lib/pricingPlans';
import {
  X, Check, Copy, ExternalLink, QrCode, Smartphone,
  Send, ShieldCheck, Sparkles, AlertCircle, Loader2, ArrowRight, Upload,
  Image as ImageIcon, Trash2, Clock, Laptop, HelpCircle,
} from 'lucide-react';
import { auth } from '@/lib/firebase/client';

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName?: string;
  userEmail?: string;
  initialPlanId?: PlanId;
  onPaymentSubmitted?: () => void;
}

export default function UpiPaymentModal({
  isOpen,
  onClose,
  workspaceId,
  workspaceName = 'Creator Studio',
  userEmail = '',
  initialPlanId = 'pro',
  onPaymentSubmitted,
}: UpiPaymentModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(initialPlanId);
  const [activePayTab, setActivePayTab] = useState<'qr' | 'mobile'>('qr');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // Verification step state
  const [utrNumber, setUtrNumber] = useState('');
  const [userNote, setUserNote] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedPayment, setSubmittedPayment] = useState<any | null>(null);
  const [telegramUrl, setTelegramUrl] = useState<string | null>(null);

  const [uploadMethod, setUploadMethod] = useState<'device' | 'phone_qr'>('device');
  const [phoneUploadQr, setPhoneUploadQr] = useState<string>('');

  // Auto-detect mobile device on mount to optimize tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
      if (isMobile) {
        setActivePayTab('mobile');
      }
    }
  }, [isOpen]);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Screenshot file size must be less than 5MB');
      return;
    }
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotFile(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const selectedPlan = PRICING_PLANS.find(p => p.id === selectedPlanId) || PRICING_PLANS[1];
  const upiId = UPI_CONFIG.upiId; // priydarshankishnawat@axl

  // Target pre-filled UPI link
  const upiDeepLink = buildUpiDeepLink({
    amount: selectedPlan.priceINR,
    planName: selectedPlan.name,
    workspaceId,
    email: userEmail,
  });

  const appLinks = buildMobileAppUpiLinks(selectedPlan.priceINR, selectedPlan.name);
  const tgDeepLink = `https://t.me/${UPI_CONFIG.telegramBotUsername || 'DIGICAST_BOT'}?start=pay_${workspaceId}_${selectedPlan.id}`;

  // Handler for the "Pay on Phone" button (redirects on mobile)
  const handlePayOnPhoneClick = () => {
    setActivePayTab('mobile');
    if (typeof window !== 'undefined') {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
      if (isMobile) {
        window.location.href = upiDeepLink;
      }
    }
  };

  // Generate QR Code dynamically when selected plan changes
  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(upiDeepLink, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('QR generation error:', err));

    // Generate phone quick-upload QR code
    QRCode.toDataURL(tgDeepLink, {
      width: 220,
      margin: 1,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then(url => setPhoneUploadQr(url))
      .catch(err => console.error('Phone upload QR error:', err));
  }, [selectedPlanId, upiDeepLink, tgDeepLink, isOpen]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(String(selectedPlan.priceINR));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2500);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim();
    const hasScreenshot = Boolean(screenshotFile);
    const hasNote = Boolean(userNote.trim());

    if (!cleanUtr && !hasScreenshot && !hasNote) {
      setSubmitError('Please enter your 12-digit UPI UTR number or attach a payment receipt screenshot.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const token = (await auth.currentUser?.getIdToken()) || '';

      const res = await fetch('/api/payments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId,
          planId: selectedPlan.id,
          utrNumber: cleanUtr,
          note: userNote.trim(),
          screenshotUrl: screenshotFile || null,
          userEmail: userEmail || auth.currentUser?.email || '',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit payment verification');
      }

      setSubmittedPayment(data.payment);
      setTelegramUrl(data.telegramUrl);
      if (onPaymentSubmitted) onPaymentSubmitted();
    } catch (err: any) {
      setSubmitError(err.message || 'Error submitting payment verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="bg-[#0B0F19]/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 relative text-white"
      >
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition z-20"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-5 sm:p-7 md:p-8 border-b border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-t-3xl">
          <div className="pr-8">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                INSTANT UPI ACTIVATION
              </span>
              <span className="text-xs text-slate-300 font-mono">Workspace: {workspaceName}</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">Choose Your Digicast Plan</h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Exact amount is pre-filled. Scan QR code or tap to pay directly on your phone.
            </p>
          </div>

          {/* Plan Selector Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mt-5">
            {PRICING_PLANS.map((plan) => {
              const isSelected = plan.id === selectedPlanId;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    setSubmittedPayment(null);
                  }}
                  className={`relative p-3 sm:p-4 rounded-xl sm:rounded-2xl text-left transition-all duration-200 border-2 ${
                    isSelected
                      ? 'border-emerald-400 bg-white/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-2 ring-emerald-400/30 scale-[1.02]'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'
                  }`}
                >
                  {plan.badge && (
                    <span
                      className="absolute -top-2 right-2 text-[8px] sm:text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider text-white shadow-sm"
                      style={{ backgroundColor: plan.color }}
                    >
                      {plan.badge}
                    </span>
                  )}
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-300 truncate">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg sm:text-2xl font-black text-white">₹{plan.priceINR}</span>
                    <span className="text-[10px] sm:text-xs text-slate-400 font-medium">{plan.periodLabel}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-300/80 mt-1 line-clamp-2 leading-relaxed hidden sm:block">
                    {plan.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 md:p-8">
          {!submittedPayment ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
              {/* Left Column: Payment Trigger (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col items-center text-center p-4 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 shadow-xl">
                
                {/* Mobile vs PC View Switcher */}
                <div className="w-full flex rounded-xl bg-white/[0.05] border border-white/10 p-1 mb-4">
                  <button
                    type="button"
                    onClick={() => setActivePayTab('qr')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition ${
                      activePayTab === 'qr'
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan QR (PC)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePayOnPhoneClick}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition ${
                      activePayTab === 'mobile'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Pay on Phone</span>
                  </button>
                </div>

                {activePayTab === 'qr' ? (
                  /* ─── SCAN QR CODE VIEW (Clean Pre-filled Amount QR) ─── */
                  <div className="w-full flex flex-col items-center">
                    <div className="relative p-3 bg-white rounded-2xl shadow-md border-2 border-slate-200">
                      {qrDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={qrDataUrl}
                          alt="UPI Payment QR Code"
                          className="w-56 h-56 sm:w-60 sm:h-60 rounded-xl object-contain mx-auto"
                        />
                      ) : (
                        <div className="w-56 h-56 sm:w-60 sm:h-60 flex items-center justify-center text-slate-400">
                          <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                      )}

                      {/* Payee name & amount indicator */}
                      <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
                        <span className="px-3.5 py-1 rounded-full text-xs font-black bg-slate-900 text-white shadow-lg border border-slate-700">
                          Pre-filled: ₹{selectedPlan.priceINR}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-3 font-medium">
                      Scan with PhonePe, Google Pay, Paytm, or BHIM. Amount ₹{selectedPlan.priceINR} is pre-filled.
                    </p>
                  </div>
                ) : (
                  /* ─── PAY ON PHONE VIEW (1-Tap Direct UPI Apps) ─── */
                  <div className="w-full space-y-3">
                    {/* Primary Direct Pay Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.location.href = upiDeepLink;
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-black text-white shadow-md transition hover:opacity-95 active:scale-98"
                      style={{ backgroundColor: selectedPlan.color }}
                    >
                      <Smartphone className="w-5 h-5" />
                      <span>Open UPI App (Pay ₹{selectedPlan.priceINR})</span>
                    </button>

                    <p className="text-[11px] text-slate-500 text-left">
                      Tap above or choose an installed app below to open directly with ₹{selectedPlan.priceINR} pre-filled:
                    </p>

                    {/* Specific App Launch Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <a
                        href={appLinks.phonepe}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#5f259f] hover:bg-[#4d1d82] transition shadow-sm"
                      >
                        <span>⚡ PhonePe</span>
                      </a>
                      <a
                        href={appLinks.gpay}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] transition shadow-sm"
                      >
                        <span>⚡ Google Pay</span>
                      </a>
                      <a
                        href={appLinks.paytm}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#002e6e] hover:bg-[#002252] transition shadow-sm"
                      >
                        <span>⚡ Paytm</span>
                      </a>
                      <a
                        href={appLinks.standard}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-sm"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Any UPI App</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* 1-Tap Copy UPI Details (Single clean VPA) */}
                <div className="w-full mt-4 pt-4 border-t border-white/10 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs bg-white/[0.04] p-2.5 rounded-xl border border-white/10 shadow-sm">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Verified UPI ID</p>
                      <p className="font-mono font-bold text-white text-[11px] sm:text-xs">
                        {upiId}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyUpi}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition flex items-center gap-1 shrink-0"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Copied
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-white/[0.04] p-2.5 rounded-xl border border-white/10 shadow-sm">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Plan Amount</p>
                      <p className="font-mono font-bold text-white">₹{selectedPlan.priceINR}.00</p>
                    </div>
                    <button
                      onClick={handleCopyAmount}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition flex items-center gap-1 shrink-0"
                      title="Copy Amount"
                    >
                      {copiedAmount ? (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Copied
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Plan Perks & UTR Confirmation Form (7 Cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* Plan Highlights Box */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>{selectedPlan.name} Includes:</span>
                    </h3>
                    <span className="text-xs font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      ₹{selectedPlan.priceINR} {selectedPlan.periodLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {selectedPlan.features.slice(0, 6).map((feat, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300 bg-white/[0.03] p-2 rounded-xl border border-white/[0.07]">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 2: Submit UTR Reference Form */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center text-xs font-bold">2</span>
                    <h4 className="text-sm font-bold text-white">Enter Payment UTR / Reference ID</h4>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    After completing payment of ₹{selectedPlan.priceINR}, enter the 12-digit UPI UTR number from your payment receipt to activate.
                  </p>

                  {submitError && (
                    <div className="p-3 text-xs rounded-xl bg-red-500/10 text-red-300 border border-red-500/20 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmitProof} className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-300">
                          12-Digit UPI Transaction ID / UTR Number
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Optional if Receipt Attached
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. 428190382910 (or leave empty if on receipt)"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:border-cyan-400 transition"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-300">
                          Attach Payment Screenshot (Optional)
                        </label>
                        <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          UTR is 100% Sufficient
                        </span>
                      </div>

                      {/* Method Switcher: Upload on PC vs Send via Phone QR */}
                      <div className="flex rounded-xl bg-white/[0.05] p-1 mb-2.5 text-[11px] font-semibold border border-white/10">
                        <button
                          type="button"
                          onClick={() => setUploadMethod('device')}
                          className={`flex-1 py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                            uploadMethod === 'device'
                              ? 'bg-white/15 text-white shadow-sm font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Laptop className="w-3.5 h-3.5" />
                          <span>Upload from this PC / Device</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadMethod('phone_qr')}
                          className={`flex-1 py-1.5 px-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                            uploadMethod === 'phone_qr'
                              ? 'bg-white/15 text-white shadow-sm font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Paid on Phone? Scan to Send</span>
                        </button>
                      </div>

                      {uploadMethod === 'device' ? (
                        !screenshotFile ? (
                          <label className="cursor-pointer border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-xl p-3.5 flex flex-col items-center justify-center text-center bg-white/[0.02] hover:bg-white/[0.05] transition group">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-1 group-hover:scale-105 transition">
                              <Upload className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-white">
                              Click or Drag to Upload Payment Screenshot
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              PNG, JPG or JPEG up to 5MB (Optional)
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleScreenshotChange}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="p-3 bg-white/[0.04] border border-white/10 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={screenshotFile}
                                alt="Receipt thumbnail"
                                className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">
                                  {screenshotName || 'receipt_screenshot.jpg'}
                                </p>
                                <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  Attached for Admin Verification
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <label className="cursor-pointer text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded hover:bg-white/10 transition">
                                Change
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleScreenshotChange}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setScreenshotFile(null);
                                  setScreenshotName(null);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-white/10 transition"
                                title="Remove receipt"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                          {phoneUploadQr ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={phoneUploadQr}
                              alt="Scan to upload from phone"
                              className="w-24 h-24 rounded-lg border border-white/20 shrink-0 bg-white p-1"
                            />
                          ) : (
                            <div className="w-24 h-24 flex items-center justify-center bg-white/5 rounded-lg">
                              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                            </div>
                          )}
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1">
                              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Scan with Phone Camera</span>
                            </p>
                            <p className="text-[11px] text-slate-400 leading-snug">
                              Opens Telegram (@{UPI_CONFIG.telegramBotUsername || 'DIGICAST_BOT'}) on your phone to drop the screenshot directly — zero file transfer needed!
                            </p>
                            <a
                              href={tgDeepLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:underline pt-0.5"
                            >
                              <Send className="w-3 h-3" /> Or click to open Telegram Web
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Telegram Bot Direct Upload & Help Link */}
                      <div className="mt-2 p-2 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-slate-400">
                          Having questions or prefer Telegram?
                        </span>
                        <a
                          href={tgDeepLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 font-bold text-cyan-400 hover:text-cyan-300 shrink-0 text-[11px] hover:underline"
                        >
                          <Send className="w-3 h-3 text-cyan-400" />
                          <span>Chat with Bot</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </a>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Sender UPI Name / Note (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Paid via PhonePe / GPay"
                        value={userNote}
                        onChange={(e) => setUserNote(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:border-cyan-400 transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || (!utrNumber.trim() && !screenshotFile && !userNote.trim())}
                      className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting Proof...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-emerald-950" />
                          Submit Proof &amp; Verify Plan
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* Step 3: Success Screen with Thank You, Instant Access & Support */
            <div className="max-w-xl mx-auto text-center py-6 space-y-5 animate-fade-in text-white">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 tracking-wide uppercase">
                  ✓ Proof Received
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
                  Thank You for Subscribing to Digicast!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  We received your UTR: <code className="bg-white/10 text-cyan-300 font-mono font-bold px-2 py-0.5 rounded border border-white/10">{submittedPayment.utrNumber}</code> for the <span className="font-bold text-white">{selectedPlan.name} (₹{selectedPlan.priceINR})</span>.
                </p>
              </div>

              {/* Instant Access Activated Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-slate-900/80 border border-indigo-500/30 text-left shadow-xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      Instant Access Activated
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Enjoy uninterrupted streaming while our team finalizes your verification.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium bg-white/[0.04] p-3 rounded-xl border border-white/10">
                  🎉 You have <b className="text-white">immediate full access</b> to all platform features, YouTube live stream auto-sync, and on-device trimming!
                </p>
              </div>

              {/* Payment Summary */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-left text-xs space-y-1.5 font-mono shadow-inner">
                <div className="flex justify-between">
                  <span className="text-slate-400">Purchased Plan:</span>
                  <span className="font-bold text-white">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Paid:</span>
                  <span className="font-bold text-emerald-400">₹{selectedPlan.priceINR}.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Receiver VPA:</span>
                  <span className="font-bold text-cyan-400">{upiId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-emerald-400 uppercase">🟢 Active (Verification in Progress)</span>
                </div>
              </div>

              {/* Queries & Support on Both Telegram and Discord */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-300">
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Have any questions or queries? Message us anytime:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href={`https://t.me/${UPI_CONFIG.telegramBotUsername || 'DIGICAST_BOT'}?start=query_${workspaceId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#229ED9] hover:bg-[#1E88C7] transition shadow-lg shadow-[#229ED9]/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Message on Telegram</span>
                  </a>

                  <a
                    href={UPI_CONFIG.discordSupportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#5865F2] hover:bg-[#4752C4] transition shadow-lg shadow-[#5865F2]/20"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Message on Discord</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full mt-2 py-3 px-5 text-sm font-bold text-white rounded-xl shadow-lg transition hover:opacity-95 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-cyan-500/20"
                >
                  Done • Return to Workspace &amp; Enjoy Platform
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
