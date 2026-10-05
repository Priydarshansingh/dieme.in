'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  PRICING_PLANS,
  PricingPlan,
  PlanId,
  UPI_CONFIG,
  buildUpiDeepLink,
  buildVerificationTelegramUrl,
} from '@/lib/pricingPlans';
import {
  X, Check, Copy, ExternalLink, QrCode, Smartphone,
  Send, ShieldCheck, Sparkles, AlertCircle, Loader2, ArrowRight, Upload
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
  const upiDeepLink = buildUpiDeepLink({
    amount: selectedPlan.priceINR,
    planName: selectedPlan.name,
    workspaceId,
    email: userEmail,
  });

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
  }, [selectedPlanId, upiDeepLink, isOpen]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_CONFIG.upiId);
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
      // Get Firebase auth token from window or localStorage if available
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
          note: userNote.trim(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 relative text-gray-900"
      >
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-t-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  INSTANT UPI SCAN & PAY
                </span>
                <span className="text-xs text-slate-400 font-mono">Workspace: {workspaceName}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">Choose Your Digicast Plan</h2>
              <p className="text-slate-300 text-sm mt-1">
                Amount is dynamically embedded in the QR. Scan with any UPI app to pay and activate your workspace.
              </p>
            </div>
          </div>

          {/* Plan Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
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
                  className={`relative p-4 rounded-2xl text-left transition-all duration-200 border-2 ${
                    isSelected
                      ? 'border-emerald-400 bg-white/10 shadow-lg ring-2 ring-emerald-400/20 scale-[1.02]'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {plan.badge && (
                    <span
                      className="absolute -top-2.5 right-3 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider text-white shadow-sm"
                      style={{ backgroundColor: plan.color }}
                    >
                      {plan.badge}
                    </span>
                  )}
                  <p className="text-xs font-semibold text-slate-300">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-white">₹{plan.priceINR}</span>
                    <span className="text-xs text-slate-400 font-medium">/month</span>
                  </div>
                  <p className="text-[11px] text-slate-300/80 mt-1 line-clamp-2 leading-relaxed">
                    {plan.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8">
          {!submittedPayment ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: QR Code & Mobile Direct Pay (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-3">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>Scan with GPay, PhonePe, Paytm, or BHIM</span>
                </div>

                {/* The QR Container */}
                <div className="relative p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt="UPI Payment QR"
                      className="w-56 h-56 md:w-60 md:h-60 rounded-xl object-contain mx-auto"
                    />
                  ) : (
                    <div className="w-60 h-60 flex items-center justify-center text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  )}

                  {/* Centered amount badge */}
                  <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-900 text-white shadow-md border border-slate-700">
                      Exact Amount: ₹{selectedPlan.priceINR}
                    </span>
                  </div>
                </div>

                {/* Direct UPI App Trigger for Mobile */}
                <div className="w-full mt-4 space-y-2">
                  <a
                    href={upiDeepLink}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white shadow-md transition hover:opacity-95 active:scale-98"
                    style={{ backgroundColor: selectedPlan.color }}
                  >
                    <Smartphone className="w-4 h-4" />
                    Pay ₹{selectedPlan.priceINR} on Mobile App
                  </a>
                  <p className="text-[11px] text-slate-400">
                    Tapping on mobile directly opens your installed UPI app with ₹{selectedPlan.priceINR} pre-filled.
                  </p>
                </div>

                {/* Copy UPI Details Helper */}
                <div className="w-full mt-4 pt-4 border-t border-slate-200 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">UPI ID</p>
                      <p className="font-mono font-bold text-slate-800">{UPI_CONFIG.upiId}</p>
                    </div>
                    <button
                      onClick={handleCopyUpi}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Pre-coded Amount</p>
                      <p className="font-mono font-bold text-slate-800">₹{selectedPlan.priceINR}.00</p>
                    </div>
                    <button
                      onClick={handleCopyAmount}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                      title="Copy Amount"
                    >
                      {copiedAmount ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Plan Perks & UTR Confirmation Form (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Plan Highlights */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Included in {selectedPlan.name} (₹{selectedPlan.priceINR}/month)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {selectedPlan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 2: Submit UTR Reference */}
                <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                    <h4 className="text-sm font-bold text-slate-900">Enter Payment UTR / Reference ID</h4>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    After scanning and paying ₹{selectedPlan.priceINR}, copy the 12-digit UTR/Ref number from your UPI receipt below.
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
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-600 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Attach Payment Screenshot (Optional / Recommended)
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
                          <Upload className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{screenshotName ? 'Change Receipt' : 'Upload Screenshot Image'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleScreenshotChange}
                            className="hidden"
                          />
                        </label>
                        {screenshotName && (
                          <span className="text-[11px] font-mono text-emerald-600 truncate max-w-[220px]">
                            ✓ {screenshotName}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Upload receipt image for fastest 1-click verification by admin.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Notes / Account Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Paid via GPay / Priydarshan"
                        value={userNote}
                        onChange={(e) => setUserNote(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-600 transition"
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
                          Submit Proof & Verify Plan
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
                <h3 className="text-2xl font-black text-slate-900">Payment Submitted for Verification!</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  We received your UTR: <code className="bg-slate-100 font-mono font-bold px-2 py-0.5 rounded text-indigo-700">{submittedPayment.utrNumber}</code> for the <span className="font-bold text-slate-900">{selectedPlan.name} (₹{selectedPlan.priceINR})</span>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan:</span>
                  <span className="font-bold text-slate-800">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-bold text-emerald-600">₹{selectedPlan.priceINR}.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-amber-600 uppercase">Pending Admin Approval</span>
                </div>
              </div>

              {/* Action Buttons to Telegram & Discord */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold text-slate-700">
                  Speed up verification! Send your receipt directly to our community channel:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={`https://t.me/${UPI_CONFIG.telegramBotUsername || 'DIGICAST_BOT'}?start=pay_${workspaceId}_${selectedPlan.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#1B2237] hover:bg-black transition shadow-md col-span-full sm:col-span-2"
                  >
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span>Send Screenshot in Private DM (@{UPI_CONFIG.telegramBotUsername || 'DIGICAST_BOT'})</span>
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
                  Done & Return to Workspace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
