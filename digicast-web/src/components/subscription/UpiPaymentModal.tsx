'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  PRICING_PLANS,
  PricingPlan,
  PlanId,
  UPI_CONFIG,
  UPI_HANDLES,
  UpiHandleId,
  buildUpiDeepLink,
  buildUniversalUpiLink,
  buildMobileAppUpiLinks,
  buildVerificationTelegramUrl,
} from '@/lib/pricingPlans';
import {
  X, Check, Copy, ExternalLink, QrCode, Smartphone,
  Send, ShieldCheck, Sparkles, AlertCircle, Loader2, ArrowRight, Upload,
  Info, Shield, RefreshCw
} from 'lucide-react';

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
  const [selectedHandleId, setSelectedHandleId] = useState<UpiHandleId>('axl');
  const [qrMode, setQrMode] = useState<'universal' | 'amount'>('universal');
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

  // Auto-detect mobile device on mount to optimize tab
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setActivePayTab('mobile');
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
  const activeHandle = UPI_HANDLES.find(h => h.id === selectedHandleId) || UPI_HANDLES[0];
  const selectedUpiId = activeHandle.vpa;

  // Build the target QR URI based on mode and active handle
  const currentQrUri = qrMode === 'universal'
    ? buildUniversalUpiLink(selectedUpiId)
    : buildUpiDeepLink({
        amount: selectedPlan.priceINR,
        planName: selectedPlan.name,
        workspaceId,
        email: userEmail,
        includeAmount: true,
        upiId: selectedUpiId,
      });

  const appLinks = buildMobileAppUpiLinks(selectedPlan.priceINR, selectedPlan.name, selectedUpiId);

  // Generate QR Code dynamically when selected plan, mode, or handle changes
  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(currentQrUri, {
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
  }, [selectedPlanId, qrMode, selectedHandleId, currentQrUri, isOpen]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(selectedUpiId);
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
    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      setSubmitError('Please enter a valid 12-digit UPI UTR / Reference ID');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const token = await (window as any)?.__FIREBASE_AUTH__?.currentUser?.getIdToken?.() || '';

      const res = await fetch('/api/payments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId,
          planId: selectedPlan.id,
          utrNumber: utrNumber.trim(),
          note: `${userNote.trim()} [Paid via ${selectedUpiId}]`.trim(),
          screenshotUrl: screenshotFile || null,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 relative text-gray-900"
      >
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition z-20"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-5 sm:p-7 md:p-8 border-b border-gray-100 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-t-3xl">
          <div className="pr-8">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                INSTANT UPI ACTIVATION
              </span>
              <span className="text-xs text-slate-300 font-mono">Workspace: {workspaceName}</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">Choose Your Digicast Plan</h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Supports PhonePe, Google Pay, Paytm, &amp; BHIM. Switch between @axl, @ibl, or @ybl extensions anytime.
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
                      ? 'border-emerald-400 bg-white/10 shadow-lg ring-2 ring-emerald-400/20 scale-[1.02]'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
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
                    <span className="text-[10px] sm:text-xs text-slate-400 font-medium">/mo</span>
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
              <div className="lg:col-span-5 flex flex-col items-center text-center p-4 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-sm">
                
                {/* Mobile vs PC View Switcher */}
                <div className="w-full flex rounded-xl bg-slate-200/80 p-1 mb-3">
                  <button
                    type="button"
                    onClick={() => setActivePayTab('qr')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                      activePayTab === 'qr'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan QR (PC)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePayTab('mobile')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                      activePayTab === 'mobile'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Pay on Phone</span>
                  </button>
                </div>

                {/* Bank / Extension Selector: @axl, @ibl, @ybl */}
                <div className="w-full bg-white p-2.5 rounded-xl border border-slate-200 text-left mb-3 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">UPI Server / Extension:</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                      {activeHandle.handle} ({activeHandle.bank})
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {UPI_HANDLES.map((h) => {
                      const active = h.id === selectedHandleId;
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setSelectedHandleId(h.id)}
                          className={`py-1.5 px-1.5 rounded-lg text-xs font-bold transition flex flex-col items-center border ${
                            active
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-1 ring-slate-900'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <span className="font-mono text-xs font-black">{h.handle}</span>
                          <span className="text-[9px] opacity-80 font-medium">{h.bank.replace(' Bank', '')}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
                    Pick Axis (@axl), ICICI (@ibl), or YES Bank (@ybl) depending on which server your UPI app connects to best.
                  </p>
                </div>

                {activePayTab === 'qr' ? (
                  /* ─── SCAN QR CODE VIEW (Optimized for PC & Dual Devices) ─── */
                  <div className="w-full flex flex-col items-center">
                    {/* QR Mode Switcher (Universal vs Auto-Amount) */}
                    <div className="w-full mb-3 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQrMode('universal')}
                        className={`text-[11px] font-bold px-3 py-1 rounded-full border transition flex items-center gap-1 ${
                          qrMode === 'universal'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        <span>Universal QR (100% PhonePe)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrMode('amount')}
                        className={`text-[11px] font-bold px-3 py-1 rounded-full border transition flex items-center gap-1 ${
                          qrMode === 'amount'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Pre-filled ₹{selectedPlan.priceINR}</span>
                      </button>
                    </div>

                    {/* The QR Container */}
                    <div className="relative p-3 bg-white rounded-2xl shadow-md border-2 border-slate-200">
                      {qrDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={qrDataUrl}
                          alt="UPI Payment QR Code"
                          className="w-52 h-52 sm:w-60 sm:h-60 rounded-xl object-contain mx-auto"
                        />
                      ) : (
                        <div className="w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center text-slate-400">
                          <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                      )}

                      {/* Payee name & amount indicator */}
                      <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-900 text-white shadow-lg border border-slate-700">
                          {qrMode === 'amount' ? `Pre-filled: ₹${selectedPlan.priceINR}` : 'Digicast Official UPI'}
                        </span>
                      </div>
                    </div>

                    {/* Friendly Explanatory Note for PhonePe */}
                    <div className="w-full mt-3 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-left text-[11px] text-emerald-950 flex items-start gap-2">
                      <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        {qrMode === 'universal' ? (
                          <p>
                            <strong>PhonePe Verified:</strong> Scan with PhonePe, GPay, or Paytm and enter <strong>₹{selectedPlan.priceINR}</strong>. This avoids the &quot;QR invalid&quot; block.
                          </p>
                        ) : (
                          <p>
                            <strong>Auto-Amount Mode:</strong> Amount ₹{selectedPlan.priceINR} is locked in. If PhonePe shows &quot;QR is invalid&quot;, switch to <em>Universal QR</em> above.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ─── PAY ON PHONE VIEW (1-Tap Direct UPI Apps) ─── */
                  <div className="w-full space-y-3">
                    <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 text-left">
                      <p className="text-xs font-bold text-indigo-950">Pay directly from this device</p>
                      <p className="text-[11px] text-indigo-800/80 mt-0.5">
                        Tap an app below to open your payment app with ₹{selectedPlan.priceINR} ready to pay.
                      </p>
                    </div>

                    {/* Direct App Launch Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <a
                        href={appLinks.phonepe}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#5f259f] hover:bg-[#4d1d82] transition shadow-sm"
                      >
                        <span>⚡ Pay via PhonePe</span>
                      </a>
                      <a
                        href={appLinks.gpay}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#1a73e8] hover:bg-[#1557b0] transition shadow-sm"
                      >
                        <span>⚡ Pay via Google Pay</span>
                      </a>
                      <a
                        href={appLinks.paytm}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#002e6e] hover:bg-[#002252] transition shadow-sm"
                      >
                        <span>⚡ Pay via Paytm</span>
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

                {/* 1-Tap Copy UPI Details (Always accessible) */}
                <div className="w-full mt-4 pt-4 border-t border-slate-200 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Verified UPI ID ({activeHandle.handle})</p>
                      <p className="font-mono font-bold text-slate-800 text-[11px] sm:text-xs truncate max-w-[200px] sm:max-w-none">
                        {selectedUpiId}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyUpi}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition flex items-center gap-1 shrink-0"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Copied
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Plan Amount</p>
                      <p className="font-mono font-bold text-slate-800">₹{selectedPlan.priceINR}.00</p>
                    </div>
                    <button
                      onClick={handleCopyAmount}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition flex items-center gap-1 shrink-0"
                      title="Copy Amount"
                    >
                      {copiedAmount ? (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Copied
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
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
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>{selectedPlan.name} Includes:</span>
                    </h3>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      ₹{selectedPlan.priceINR}/month
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {selectedPlan.features.slice(0, 6).map((feat, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-slate-700 bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 2: Submit UTR Reference Form */}
                <div className="p-5 sm:p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                    <h4 className="text-sm font-bold text-slate-900">Enter Payment UTR / Reference ID</h4>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    After completing payment of ₹{selectedPlan.priceINR}, enter the 12-digit UPI UTR number from your payment receipt to activate.
                  </p>

                  {submitError && (
                    <div className="p-3 text-xs rounded-xl bg-red-50 text-red-700 border border-red-200 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmitProof} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        12-Digit UPI Transaction ID / UTR Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 428190382910"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-600 transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Attach Payment Screenshot (Optional / Recommended)
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="cursor-pointer flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs">
                          <Upload className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{screenshotName ? 'Change Receipt' : 'Upload Receipt Screenshot'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleScreenshotChange}
                            className="hidden"
                          />
                        </label>
                        {screenshotName && (
                          <span className="text-[11px] font-mono text-emerald-600 truncate max-w-[200px] bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                            ✓ {screenshotName}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Upload receipt screenshot for instant verification by admin.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Sender UPI Name / Note (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Paid via PhonePe / GPay"
                        value={userNote}
                        onChange={(e) => setUserNote(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-600 transition shadow-2xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !utrNumber.trim()}
                      className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: '#1B2237' }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting Proof...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          Submit Proof &amp; Verify Plan
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* Step 3: Success Screen with Telegram/Discord Redirection */
            <div className="max-w-xl mx-auto text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">Payment Submitted for Verification!</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  We received your UTR: <code className="bg-slate-100 font-mono font-bold px-2 py-0.5 rounded text-indigo-700">{submittedPayment.utrNumber}</code> for the <span className="font-bold text-slate-900">{selectedPlan.name} (₹{selectedPlan.priceINR})</span>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 font-mono shadow-2xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan:</span>
                  <span className="font-bold text-slate-800">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-bold text-emerald-600">₹{selectedPlan.priceINR}.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Receiver VPA:</span>
                  <span className="font-bold text-indigo-600">{selectedUpiId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-amber-600 uppercase">Pending Admin Approval</span>
                </div>
              </div>

              {/* Action Buttons to Telegram & Discord */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold text-slate-700">
                  Speed up verification! Send your receipt directly to our bot:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={`https://t.me/${UPI_CONFIG.telegramBotUsername || 'DIGICAST_BOT'}?start=pay_${workspaceId}_${selectedPlan.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#1B2237] hover:bg-black transition shadow-md col-span-full sm:col-span-2"
                  >
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span>Send Screenshot to Telegram Bot (@{UPI_CONFIG.telegramBotUsername || 'DIGICAST_BOT'})</span>
                  </a>

                  {telegramUrl && (
                    <a
                      href={telegramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#229ED9] hover:bg-[#1E88C7] transition shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Post in Channel
                    </a>
                  )}

                  <a
                    href={UPI_CONFIG.discordSupportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#5865F2] hover:bg-[#4752C4] transition shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Verify on Discord
                  </a>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 px-6 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  Done &amp; Return to Workspace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
