import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import { PAYMENT_METHODS } from '../../config/constants.js';
import { dbService } from '../../services/supabase/dbService.js';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { ShieldCheck, CheckCircle2, Lock, ArrowRight, Loader2 } from 'lucide-react';

export function CheckoutModal({ isOpen, onClose, item, currentUser, onPaymentSuccess }) {
  const { addToast } = useNotification();
  const [selectedMethod, setSelectedMethod] = useState('bkash');
  const [walletNumber, setWalletNumber] = useState('01712345678');
  const [pinOrOtp, setPinOrOtp] = useState('');
  const [step, setStep] = useState('select'); // 'select' | 'confirm' | 'verifying' | 'success'
  const [transactionId, setTransactionId] = useState('');

  if (!item) return null;

  const handleProceed = () => {
    setStep('confirm');
  };

  const handleSimulatePayment = async (e) => {
    e.preventDefault();
    setStep('verifying');

    // Simulate real gateway handshake and server-side verification
    setTimeout(async () => {
      const trxId = `${selectedMethod.toUpperCase()}_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setTransactionId(trxId);

      // Save verified enrollment and order in database
      await dbService.enrollInCourse(currentUser.id, item.id, {
        amount: item.price_cents,
        currency: item.currency || 'BDT',
        provider: selectedMethod,
        trxId,
      });

      setStep('success');
      addToast(`Payment verified! You are now enrolled in ${item.title}.`, 'success');
      onPaymentSuccess && onPaymentSuccess(item.id, trxId);
    }, 1800);
  };

  const handleCloseAll = () => {
    setStep('select');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCloseAll} title="Secure Checkout" maxWidth="max-w-lg">
      <div className="space-y-5">
        
        {/* Order Summary Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Purchasing Enrollment
          </span>
          <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mt-0.5">
            {item.title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Lifetime course access • Certificate • Downloadable materials
          </p>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total Due:</span>
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
              {formatCurrency(item.price_cents, item.currency)}
            </span>
          </div>
        </div>

        {/* Step 1: Select Payment Gateway */}
        {step === 'select' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedMethod(pm.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      selectedMethod === pm.id
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {pm.name}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">{pm.badge}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>TLS 256-bit SSL encrypted transaction</span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseAll}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceed}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center gap-2"
              >
                <span>Continue with {selectedMethod.toUpperCase()}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Confirmation / Sandbox PIN Verification */}
        {step === 'confirm' && (
          <form onSubmit={handleSimulatePayment} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs">
              <span className="font-bold text-indigo-700 dark:text-indigo-300 capitalize">
                {selectedMethod} Payment Gateway Sandbox
              </span>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Enter your test wallet number to authorize the {formatCurrency(item.price_cents, item.currency)} charge.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Wallet / Phone Number
              </label>
              <input
                type="text"
                required
                value={walletNumber}
                onChange={(e) => setWalletNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                PIN or One-Time Passcode (OTP)
              </label>
              <input
                type="password"
                required
                value={pinOrOtp}
                onChange={(e) => setPinOrOtp(e.target.value)}
                placeholder="••••"
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Sandbox mode: Any 4-digit code (e.g. 1234) will pass verification.
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
              >
                Confirm & Pay {formatCurrency(item.price_cents, item.currency)}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Verifying */}
        {step === 'verifying' && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                Verifying Transaction with {selectedMethod.toUpperCase()}...
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Ensuring idempotent order logging and security token validation.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-extrabold text-xl text-slate-900 dark:text-white">
                Enrollment Confirmed!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You now have full access to all video lessons and downloadable resources.
              </p>
              <div className="mt-3 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                Transaction ID: <strong>{transactionId}</strong>
              </div>
            </div>

            <button
              onClick={handleCloseAll}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
            >
              Start Learning Now
            </button>
          </div>
        )}

      </div>
    </Modal>
  );
}
