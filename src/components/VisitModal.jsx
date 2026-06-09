import { useCallback, useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useApp } from '../context/AppContext';
import { VISIT_STATUS, VISIT_TYPES } from '../utils/constants';

const EMPTY_FORM = {
  visitDate: '',
  durationHours: '',
  durationMinutes: '',
  clientCompany: '',
  parentCompany: '',
  payoutAmount: '',
  visitType: VISIT_TYPES[0],
  keyTask: '',
  status: VISIT_STATUS.PENDING,
};

function getTodayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function VisitModal({ isOpen, onClose }) {
  const { addVisit } = useApp();
  const signatureRef = useRef(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, visitDate: getTodayISO() });
  const [errors, setErrors] = useState({});
  const [savedSignature, setSavedSignature] = useState(null);
  const [signatureSavedFlag, setSignatureSavedFlag] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setForm({ ...EMPTY_FORM, visitDate: getTodayISO() });
    setErrors({});
    setSavedSignature(null);
    setSignatureSavedFlag(false);
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    resetForm();
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
    setSavedSignature(null);
    setSignatureSavedFlag(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.signature;
      return next;
    });
  };

  const handleSaveSignature = () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setErrors((prev) => ({
        ...prev,
        signature: 'Please draw a signature before saving.',
      }));
      setSavedSignature(null);
      setSignatureSavedFlag(false);
      return;
    }
    const dataUrl = signatureRef.current.toDataURL('image/png');
    setSavedSignature(dataUrl);
    setSignatureSavedFlag(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.signature;
      return next;
    });
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.visitDate) {
      nextErrors.visitDate = 'Date of visit is required.';
    }

    const hours = form.durationHours === '' ? NaN : Number(form.durationHours);
    const minutes =
      form.durationMinutes === '' ? NaN : Number(form.durationMinutes);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      minutes < 0 ||
      minutes > 59
    ) {
      nextErrors.duration = 'Enter valid hours (≥0) and minutes (0–59).';
    } else if (hours === 0 && minutes === 0) {
      nextErrors.duration = 'Duration must be greater than zero.';
    } else if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
      nextErrors.duration = 'Hours and minutes must be whole numbers.';
    }

    if (!form.clientCompany.trim()) {
      nextErrors.clientCompany = 'Client company name is required.';
    }

    if (!form.parentCompany.trim()) {
      nextErrors.parentCompany = 'Parent/vendor company name is required.';
    }

    const payout = form.payoutAmount === '' ? NaN : Number(form.payoutAmount);
    if (Number.isNaN(payout) || payout < 0) {
      nextErrors.payoutAmount = 'Enter a valid payout amount (₹0 or more).';
    }

    if (!VISIT_TYPES.includes(form.visitType)) {
      nextErrors.visitType = 'Select a valid visit type.';
    }

    if (!form.keyTask.trim()) {
      nextErrors.keyTask = 'Key task performed is required.';
    } else if (form.keyTask.trim().length < 10) {
      nextErrors.keyTask = 'Please provide at least 10 characters.';
    }

    if (!savedSignature) {
      nextErrors.signature = 'Save the client/manager signature before submitting.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || submitting) return;

    setSubmitting(true);
    const success = await addVisit({
      visitDate: form.visitDate,
      durationHours: Number(form.durationHours),
      durationMinutes: Number(form.durationMinutes),
      clientCompany: form.clientCompany,
      parentCompany: form.parentCompany,
      payoutAmount: Number(form.payoutAmount),
      visitType: form.visitType,
      keyTask: form.keyTask,
      status: form.status,
      signature: savedSignature,
    });
    setSubmitting(false);

    if (success) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="visit-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-royal-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-label="Close modal"
      />

      <div className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-modal flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-premium-gray-mid/50 flex-shrink-0">
          <div>
            <h2
              id="visit-modal-title"
              className="text-lg font-semibold text-royal-800 tracking-tight"
            >
              Log New Visit
            </h2>
            <p className="text-xs text-premium-gray-dark mt-0.5">
              Complete all fields and capture signature
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-premium-gray text-slate-600 hover:bg-premium-gray-mid transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6 space-y-5"
          noValidate
        >
          <div>
            <label
              htmlFor="visit-date"
              className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2"
            >
              Date of Visit
            </label>
            <input
              id="visit-date"
              type="date"
              value={form.visitDate}
              max={getTodayISO()}
              onChange={(e) => updateField('visitDate', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border bg-premium-gray/50 text-sm transition-all focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 ${
                errors.visitDate ? 'border-red-300' : 'border-transparent'
              }`}
            />
            {errors.visitDate && (
              <p className="mt-1.5 text-xs text-red-600">{errors.visitDate}</p>
            )}
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
              On-Site Duration
            </span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="duration-hours" className="sr-only">
                  Hours
                </label>
                <input
                  id="duration-hours"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Hours"
                  value={form.durationHours}
                  onChange={(e) => updateField('durationHours', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border bg-premium-gray/50 text-sm focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 ${
                    errors.duration ? 'border-red-300' : 'border-transparent'
                  }`}
                />
              </div>
              <div>
                <label htmlFor="duration-minutes" className="sr-only">
                  Minutes
                </label>
                <input
                  id="duration-minutes"
                  type="number"
                  min="0"
                  max="59"
                  step="1"
                  placeholder="Minutes"
                  value={form.durationMinutes}
                  onChange={(e) => updateField('durationMinutes', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border bg-premium-gray/50 text-sm focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 ${
                    errors.duration ? 'border-red-300' : 'border-transparent'
                  }`}
                />
              </div>
            </div>
            {errors.duration && (
              <p className="mt-1.5 text-xs text-red-600">{errors.duration}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="client-company"
                className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2"
              >
                Client Company
              </label>
              <input
                id="client-company"
                type="text"
                value={form.clientCompany}
                onChange={(e) => updateField('clientCompany', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border bg-premium-gray/50 text-sm focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 ${
                  errors.clientCompany ? 'border-red-300' : 'border-transparent'
                }`}
                placeholder="Acme Industries Ltd."
              />
              {errors.clientCompany && (
                <p className="mt-1.5 text-xs text-red-600">{errors.clientCompany}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="parent-company"
                className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2"
              >
                Parent / Vendor Company
              </label>
              <input
                id="parent-company"
                type="text"
                value={form.parentCompany}
                onChange={(e) => updateField('parentCompany', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border bg-premium-gray/50 text-sm focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 ${
                  errors.parentCompany ? 'border-red-300' : 'border-transparent'
                }`}
                placeholder="Global Vendor Corp."
              />
              {errors.parentCompany && (
                <p className="mt-1.5 text-xs text-red-600">{errors.parentCompany}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="payout"
                className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2"
              >
                Visit Payout (₹)
              </label>
              <input
                id="payout"
                type="number"
                min="0"
                step="0.01"
                value={form.payoutAmount}
                onChange={(e) => updateField('payoutAmount', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border bg-premium-gray/50 text-sm focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 ${
                  errors.payoutAmount ? 'border-red-300' : 'border-transparent'
                }`}
                placeholder="0.00"
              />
              {errors.payoutAmount && (
                <p className="mt-1.5 text-xs text-red-600">{errors.payoutAmount}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="visit-type"
                className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2"
              >
                Visit Type
              </label>
              <select
                id="visit-type"
                value={form.visitType}
                onChange={(e) => updateField('visitType', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-transparent bg-premium-gray/50 text-sm focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 appearance-none cursor-pointer"
              >
                {VISIT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="key-task"
              className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2"
            >
              Key Task Performed
            </label>
            <textarea
              id="key-task"
              rows={4}
              value={form.keyTask}
              onChange={(e) => updateField('keyTask', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border bg-premium-gray/50 text-sm resize-none focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 ${
                errors.keyTask ? 'border-red-300' : 'border-transparent'
              }`}
              placeholder="Describe inspections, installations, or consultations performed…"
            />
            {errors.keyTask && (
              <p className="mt-1.5 text-xs text-red-600">{errors.keyTask}</p>
            )}
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-3">
              Visit Status
            </span>
            <div className="inline-flex rounded-xl bg-premium-gray p-1">
              <button
                type="button"
                onClick={() => updateField('status', VISIT_STATUS.PENDING)}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  form.status === VISIT_STATUS.PENDING
                    ? 'bg-white text-amber-700 shadow-soft ring-1 ring-amber-200'
                    : 'text-premium-gray-dark hover:text-slate-700'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => updateField('status', VISIT_STATUS.PAID)}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  form.status === VISIT_STATUS.PAID
                    ? 'bg-white text-emerald-700 shadow-soft ring-1 ring-emerald-200'
                    : 'text-premium-gray-dark hover:text-slate-700'
                }`}
              >
                Paid
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Client / Manager Signature
              </span>
              {signatureSavedFlag && (
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Saved
                </span>
              )}
            </div>
            <div className="rounded-xl border-2 border-dashed border-premium-gray-mid bg-premium-gray/30 overflow-hidden">
              <SignatureCanvas
                ref={signatureRef}
                penColor="#1E3A8A"
                canvasProps={{
                  className: 'w-full h-36 sm:h-40 touch-none cursor-crosshair bg-white',
                }}
                backgroundColor="rgba(255,255,255,1)"
              />
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              <button
                type="button"
                onClick={handleClearSignature}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-premium-gray rounded-xl hover:bg-premium-gray-mid transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSaveSignature}
                className="px-4 py-2 text-sm font-medium text-royal-700 bg-royal-50 rounded-xl hover:bg-royal-100 border border-royal-100 transition-colors"
              >
                Save Signature
              </button>
            </div>
            {savedSignature && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <p className="text-xs text-emerald-800 mb-2 font-medium">Preview</p>
                <img
                  src={savedSignature}
                  alt="Saved signature preview"
                  className="h-14 object-contain bg-white rounded-lg border border-emerald-100 px-2"
                />
              </div>
            )}
            {errors.signature && (
              <p className="mt-1.5 text-xs text-red-600">{errors.signature}</p>
            )}
          </div>
        </form>

        <div className="flex gap-3 px-6 py-5 border-t border-premium-gray-mid/50 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-600 bg-premium-gray hover:bg-premium-gray-mid transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-royal-700 hover:bg-royal-800 shadow-soft transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving…' : 'Save Visit'}
          </button>
        </div>
      </div>
    </div>
  );
}
