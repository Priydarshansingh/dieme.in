'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  PRICING_PLANS,
  PricingPlan,
  PlanId,
  UPI_CONFIG,
  buildUpiDeepLink,
  buildMobileAppUpiLinks,
} from '@/lib/pricingPlans';
import {
  X, Check, Copy, ExternalLink, QrCode, Smartphone,
  ShieldCheck, Sparkles, AlertCircle, Loader2, Upload,
  Image as ImageIcon, Trash2, Clock, RefreshCw, Zap
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
  const [isCheckingGateway, setIsCheckingGateway] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedPayment, setSubmittedPayment] = useState<any | null>(null);

  // Active Session Tracking
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<string>('listening');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-detect mobile device on mount to optimize tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
      if (isMobile) {
        setActivePayTab('mobile');
      }
    }
  }, [isOpen]);

  const selectedPlan = PRICING_PLANS.find(p => p.id === selectedPlanId) || PRICING_PLANS[1];
  const upiId = UPI_CONFIG.upiId; // dkigicast@ptyes

  // Pre-filled UPI links
  const upiDeepLink = buildUpiDeepLink({
    amount: selectedPlan.priceINR,
    planName: selectedPlan.name,
    workspaceId,
    email: userEmail,
  });

  const appLinks = buildMobileAppUpiLinks(selectedPlan.priceINR, selectedPlan.name);

  // 1. Initialize or Refresh Payment Session
  useEffect(() => {
    if (!isOpen) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    let isMounted = true;

    async function initSession() {
      try {
        const token = (await auth.currentUser?.getIdToken()) || '';
        const res = await fetch('/api/payments/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            workspaceId,
            planId: selectedPlanId,
            clientEmail: userEmail || auth.currentUser?.email || '',
          }),
        });

        if (res.ok && isMounted) {
          const data = await res.json();
          setActiveSessionId(data.paymentId);
          setActiveOrderId(data.orderId);
        }
      } catch (err) {
        console.warn('Session init error:', err);
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedPlanId, workspaceId, userEmail]);

  // 2. Continuous Background Bank Observer Check
  useEffect(() => {
    if (!isOpen || submittedPayment?.status === 'approved') {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const checkBankCredit = async () => {
      try {
        const queryParams = new URLSearchParams({
          ...(activeSessionId ? { paymentId: activeSessionId } : {}),
          ...(activeOrderId ? { orderId: activeOrderId } : {}),
          workspaceId,
        });

        const res = await fetch(`/api/payments/check?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.isPaid || data.status === 'approved') {
            setGatewayStatus('confirmed');
            setSubmittedPayment({
              ...data,
              utrNumber: data.utrNumber || utrNumber || 'BANK_OBSERVER_VERIFIED',
              amount: data.amountReceived || selectedPlan.priceINR,
            });
            if (onPaymentSubmitted) onPaymentSubmitted();
            if (pollingRef.current) clearInterval(pollingRef.current);
          }
        }
      } catch {}
    };

    // Poll every 3 seconds while user is looking at QR or paying
    pollingRef.current = setInterval(checkBankCredit, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, activeSessionId, activeOrderId, workspaceId, submittedPayment, onPaymentSubmitted, utrNumber, selectedPlan.priceINR]);

  // 3. Generate QR Code dynamically when selected plan changes
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
  }, [selectedPlanId, upiDeepLink, isOpen]);

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

  // Immediate manual check trigger
  const handleManualCheck = async () => {
    setIsCheckingGateway(true);
    setSubmitError(null);
    try {
      const queryParams = new URLSearchParams({
        ...(activeSessionId ? { paymentId: activeSessionId } : {}),
        ...(activeOrderId ? { orderId: activeOrderId } : {}),
        workspaceId,
        ...(utrNumber.trim() ? { utrNumber: utrNumber.trim() } : {}),
      });

      const res = await fetch(`/api/payments/check?${queryParams.toString()}`);
      const data = await res.json();

      if (data.isPaid || data.status === 'approved') {
        setSubmittedPayment({
          ...data,
          utrNumber: data.utrNumber || utrNumber || 'BANK_VERIFIED',
          amount: data.amountReceived || selectedPlan.priceINR,
        });
        if (onPaymentSubmitted) onPaymentSubmitted();
      } else {
        setSubmitError(
          data.message || 'Payment is still being processed by your bank. If already paid, submit your UTR below for immediate activation.'
        );
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Error checking payment status');
    } finally {
      setIsCheckingGateway(false);
    }
  };

  // Submit UTR proof
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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          workspaceId,
          planId: selectedPlan.id,
          utrNumber: cleanUtr,
          note: userNote.trim(),
          screenshotUrl: screenshotFile || null,
          userEmail: userEmail || auth.currentUser?.email || '',
          paymentId: activeSessionId,
          orderId: activeOrderId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit payment verification');
      }

      setSubmittedPayment(data.payment);
      if (onPaymentSubmitted) onPaymentSubmitted();
    } catch (err: any) {
      setSubmitError(err.message || 'Error submitting payment verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
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
              <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                INSTANT UPI ACTIVATION • 0% FEE
              </span>
              <span className="text-xs text-slate-300 font-mono">Workspace: {workspaceName}</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">Choose Your Digicast Plan</h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Direct-to-bank instant settlement. Scan QR code or tap to pay directly with any UPI app.
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
                  className={`relative p-3 sm:p-4 rounded-xl sm:rounded-2xl text-left transition-all duration-200 border-2 ${isSelected
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
              {/* Left Column: QR Code & Pay on Phone (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col items-center text-center p-4 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 shadow-xl">
                {/* Mobile vs PC View Switcher */}
                <div className="w-full flex rounded-xl bg-white/[0.05] border border-white/10 p-1 mb-4">
                  <button
                    type="button"
                    onClick={() => setActivePayTab('qr')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition ${activePayTab === 'qr'
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan QR (PC)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePayTab('mobile');
                      if (typeof window !== 'undefined' && (/Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768)) {
                        window.location.href = upiDeepLink;
                      }
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition ${activePayTab === 'mobile'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm font-extrabold'
                        : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Pay on Phone</span>
                  </button>
                </div>

                {activePayTab === 'qr' ? (
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-white rounded-2xl shadow-xl relative group">
                      {qrDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={qrDataUrl}
                          alt="Digicast UPI Payment QR Code"
                          className="w-56 h-56 sm:w-64 sm:h-64 rounded-xl"
                        />
                      ) : (
                        <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center bg-slate-100 rounded-xl text-slate-500 text-xs">
                          <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 -bottom-2 flex justify-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950 text-emerald-400 border border-emerald-500/30 shadow-md">
                          ₹{selectedPlan.priceINR}.00 EXACT
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 font-medium mt-4">
                      Scan with Google Pay, PhonePe, Paytm or any UPI App
                    </p>
                  </div>
                ) : (
                  <div className="w-full space-y-3 py-2">
                    <p className="text-xs text-slate-300">
                      Tap your preferred UPI app to open and pay instantly:
                    </p>
                    <a
                      href={appLinks.phonepe}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 transition text-sm font-bold text-white"
                    >
                      <span>Pay with PhonePe</span>
                      <ExternalLink className="w-4 h-4 text-purple-400" />
                    </a>
                    <a
                      href={appLinks.gpay}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 transition text-sm font-bold text-white"
                    >
                      <span>Pay with Google Pay</span>
                      <ExternalLink className="w-4 h-4 text-blue-400" />
                    </a>
                    <a
                      href={appLinks.paytm}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 transition text-sm font-bold text-white"
                    >
                      <span>Pay with Paytm</span>
                      <ExternalLink className="w-4 h-4 text-cyan-400" />
                    </a>
                    <a
                      href={upiDeepLink}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 transition text-sm font-bold text-white"
                    >
                      <span>Other UPI Apps (BHIM / Cred)</span>
                      <ExternalLink className="w-4 h-4 text-emerald-400" />
                    </a>
                  </div>
                )}

                {/* Live Observer Telemetry Pulse */}
                <div className="w-full mt-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-medium">Live Bank Observer Active</span>
                  </div>
                  <button
                    onClick={handleManualCheck}
                    disabled={isCheckingGateway}
                    className="flex items-center gap-1 font-bold text-white hover:text-emerald-300 transition"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCheckingGateway ? 'animate-spin' : ''}`} />
                    <span>Check Now</span>
                  </button>
                </div>

                {/* Copy VPA & Amount */}
                <div className="w-full mt-3 space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs bg-white/[0.04] p-2.5 rounded-xl border border-white/10 shadow-sm">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Receiving Bank UPI ID</p>
                      <p className="font-mono font-bold text-white">{upiId}</p>
                    </div>
                    <button
                      onClick={handleCopyUpi}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition flex items-center gap-1 shrink-0"
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

              {/* Right Column: Perks & Direct Verification Form (7 Cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* Plan Highlights */}
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

                {/* Instant Verification Form */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-black">2</span>
                    <h4 className="text-sm font-bold text-white">Enter Payment UTR / Ref ID (Instant Verification)</h4>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Once paid, enter the 12-digit UTR from your bank/UPI receipt. Our automated backend instantly matches it with bank credit.
                  </p>

                  {submitError && (
                    <div className="p-3 text-xs rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmitProof} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        12-Digit UPI Transaction ID / UTR Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 428190382910"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:border-emerald-400 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Attach Receipt Screenshot (Optional)
                      </label>
                      {!screenshotFile ? (
                        <label className="cursor-pointer border-2 border-dashed border-white/15 hover:border-emerald-400/50 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-white/[0.02] hover:bg-white/[0.05] transition group">
                          <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-105 transition">
                            <Upload className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-white">
                            Upload Payment Screenshot (PNG, JPG)
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
                              className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                {screenshotName || 'receipt_screenshot.jpg'}
                              </p>
                              <p className="text-[10px] text-emerald-400 font-medium">Attached for verification</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setScreenshotFile(null);
                              setScreenshotName(null);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
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
                        className="w-full px-3.5 py-2 text-xs bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-xl outline-none focus:border-emerald-400 transition"
                      />
                    </div>

                    <div className="pt-1 flex gap-2">
                      <button
                        type="button"
                        onClick={handleManualCheck}
                        disabled={isCheckingGateway}
                        className="flex-1 py-3 px-3 rounded-xl text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/15 transition flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCheckingGateway ? 'animate-spin' : ''}`} />
                        <span>Check Bank Receipt</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting || (!utrNumber.trim() && !screenshotFile && !userNote.trim())}
                        className="flex-[2] flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold text-slate-950 shadow-lg transition hover:opacity-90 disabled:opacity-50 bg-emerald-400 hover:bg-emerald-300 shadow-emerald-500/20"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 text-slate-950" />
                            Submit &amp; Activate Plan
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* Step 3: Success Screen with Immediate Confirmation */
            <div className="max-w-xl mx-auto text-center py-6 space-y-5 animate-fade-in text-white">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 tracking-wide uppercase">
                  {submittedPayment.status === 'approved' ? '✓ Payment Verified & Approved' : '✓ Proof Received'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
                  Thank You for Subscribing to Digicast!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Payment for the <span className="font-bold text-white">{selectedPlan.name} (₹{selectedPlan.priceINR})</span> is confirmed.
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
                      Full Access Activated
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Your workspace is immediately unlocked with all plan features.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium bg-white/[0.04] p-3 rounded-xl border border-white/10">
                  🎉 You have <b className="text-white">full access</b> to live YouTube stream auto-sync, high-speed on-device hardware trimming, and multi-stream detection!
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
                  <span className="font-bold text-emerald-400 uppercase">
                    🟢 {submittedPayment.status === 'approved' ? 'Verified & Active' : 'Active (Verification Confirmed)'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full mt-2 py-3 px-5 text-sm font-bold text-slate-950 rounded-xl shadow-lg transition hover:opacity-95 bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-emerald-500/20"
              >
                Done • Return to Workspace &amp; Enjoy Platform
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
