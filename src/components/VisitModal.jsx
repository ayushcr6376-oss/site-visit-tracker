import { useCallback, useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useApp } from '../context/AppContext';
import { VISIT_STATUS, VISIT_TYPES } from '../utils/constants';

const EMPTY_FORM = {
  visitDate: '',
  inHour: '09',
  inMinute: '00',
  inPeriod: 'AM',
  outHour: '06',
  outMinute: '00',
  outPeriod: 'PM',
  clientCompany: '',
  parentCompany: '',
  payoutAmount: '',
  visitType: VISIT_TYPES[0],
  keyTask: '',
  status: VISIT_STATUS.PENDING,
};

const HOURS_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function getTodayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Helper function to calculate total dynamic hours & minutes
function calculateDuration(inH, inM, inP, outH, outM, outP) {
  let inHours24 = Number(inH);
  if (inP === 'PM' && inHours24 !== 12) inHours24 += 12;
  if (inP === 'AM' && inHours24 === 12) inHours24 = 0;

  let outHours24 = Number(outH);
  if (outP === 'PM' && outHours24 !== 12) outHours24 += 12;
  if (outP === 'AM' && outHours24 === 12) outHours24 = 0;

  let inTotalMinutes = inHours24 * 60 + Number(inM);
  let outTotalMinutes = outHours24 * 60 + Number(outM);

  // Night shift logic: if out time is less than in time, it means it's the next day
  if (outTotalMinutes < inTotalMinutes) {
    outTotalMinutes += 24 * 60;
  }

  const diffMinutes = outTotalMinutes - inTotalMinutes;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  return { hours, minutes };
}

export default function VisitModal({ isOpen, onClose }) {
  const { addVisit } = useApp();
  const signatureRef = useRef(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, visitDate: getTodayISO() });
  const [errors, setErrors] = useState({});
  const [savedSignature, setSavedSignature] = useState(null);
  const [signatureSavedFlag, setSignatureSavedFlag] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Live duration calculation based on selections
  const { hours: calculatedHours, minutes: calculatedMinutes } = calculateDuration(
    form.inHour, form.inMinute, form.inPeriod,
    form.outHour, form.outMinute, form.outPeriod
  );

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
      delete next.duration; // Clear duration error when time segments are clicked
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

    if (calculatedHours === 0 && calculatedMinutes === 0) {
      nextErrors.duration = 'IN Time and OUT Time cannot be exactly the same.';
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
      nextErrors.keyTask = 'Please provide at least 10 characters description.';
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
    
    // Formatting strings for Database so it records time stamps beautifully
    const inTimeFormatted = `${form.inHour}:${form.inMinute} ${form.inPeriod}`;
    const outTimeFormatted = `${form.outHour}:${form.outMinute} ${form.outPeriod}`;

    const success = await addVisit({
      visitDate: form.visitDate,
      durationHours: calculatedHours,      // Auto saves the calculated hours
      durationMinutes: calculatedMinutes,  // Auto saves the calculated minutes
      clientCompany: form.clientCompany.trim(),
      parentCompany: form.parentCompany.trim(),
      payoutAmount: Number(form.payoutAmount),
      visitType: form.visitType,
      keyTask: `[IN: ${inTimeFormatted} | OUT: ${outTimeFormatted}] ${form.keyTask.trim()}`,
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
              Specify log timings and capture supervisor sign
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
          {/* Date of visit */}
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
                errors.visitDate ? 'border-red-500 ring-1 ring-red-200 bg-red-50/10' : 'border-transparent'
              }`}
            />
            {errors.visitDate && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.visitDate}</p>
            )}
          </div>

          {/* Premium IN and OUT Timing Selectors */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
            <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Site Work Timings
            </span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* IN TIME */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium">IN Time (Aagman)</label>
                <div className="flex gap-1.5">
                  <select
                    value={form.inHour}
                    onChange={(e) => updateField('inHour', e.target.value)}
                    className="flex-1 px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-royal-500 focus:ring-1 focus:ring-royal-500"
                  >
                    {HOURS_OPTIONS.map(h => <option key={`in-h-${h}`} value={h}>{h}</option>)}
                  </select>
                  <select
                    value={form.inMinute}
                    onChange={(e) => updateField('inMinute', e.target.value)}
                    className="flex-1 px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-royal-500 focus:ring-1 focus:ring-royal-500"
                  >
                    {MINUTES_OPTIONS.map(m => <option key={`in-m-${m}`} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={form.inPeriod}
                    onChange={(e) => updateField('inPeriod', e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-royal-700 focus:border-royal-500"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {/* OUT TIME */}
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium">OUT Time (Prasthan)</label>
                <div className="flex gap-1.5">
                  <select
                    value={form.outHour}
                    onChange={(e) => updateField('outHour', e.target.value)}
                    className="flex-1 px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-royal-500 focus:ring-1 focus:ring-royal-500"
                  >
                    {HOURS_OPTIONS.map(h => <option key={`out-h-${h}`} value={h}>{h}</option>)}
                  </select>
                  <select
                    value={form.outMinute}
                    onChange={(e) => updateField('outMinute', e.target.value)}
                    className="flex-1 px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:border-royal-500 focus:ring-1 focus:ring-royal-500"
                  >
                    {MINUTES_OPTIONS.map(m => <option key={`out-m-${m}`} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={form.outPeriod}
                    onChange={(e) => updateField('outPeriod', e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-royal-700 focus:border-royal-500"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Automatic Calculation Badge */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 text-sm font-medium text-royal-700">
              <svg className="w-4 h-4 text-royal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>⏱️ Total Duration:</span>
              <span className="px-2.5 py-0.5 text-xs bg-royal-100 text-royal-800 rounded-full font-bold">
                {calculatedHours} Hours {calculatedMinutes} Mins
              </span>
            </div>
            {errors.duration && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.duration}</p>
            )}
          </div>

          {/* Client Company and Parent Company info */}
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
                  errors.clientCompany ? 'border-red-500 ring-1 ring-red-200 bg-red-50/10' : 'border-transparent'
                }`}
                placeholder="Acme Industries Ltd."
              />
              {errors.clientCompany && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.clientCompany}</p>
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
                  errors.parentCompany ? 'border-red-500 ring-1 ring-red-200 bg-red-50/10' : 'border-transparent'
                }`}
                placeholder="Global Vendor Corp."
              />
              {errors.parentCompany && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.parentCompany}</p>
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
                  errors.payoutAmount ? 'border-red-500 ring-1 ring-red-200 bg-red-50/10' : 'border-transparent'
                }`}
                placeholder="0.00"
              />
              {errors.payoutAmount && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.payoutAmount}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="visit-type"
                className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2"
              >
                Visit Type
              </label>
              <div className="relative">
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
                errors.keyTask ? 'border-red-500 ring-1 ring-red-200 bg-red-50/10' : 'border-transparent'
              }`}
              placeholder="Describe inspections, installations, or consultations performed…"
            />
            {errors.keyTask && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.keyTask}</p>
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
              <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.signature}</p>
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