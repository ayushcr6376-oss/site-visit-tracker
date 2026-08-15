import React, { useCallback, useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useApp } from '../context/AppContext';
import { VISIT_STATUS } from '../utils/constants';

const VISIT_TYPES = [
  // --- Sales & Client Visits ---
  'New Client Pitch / Discovery',
  'Product Demo & Presentation',
  'Quotation & Contract Negotiation',
  'Relationship & Account Review',
  'Payment & Billing Follow-up',
  
  // --- Site & Industrial Operations ---
  'Site Visit',
  'Breakdown / Repair',
  'Preventive Maintenance',
  'Installation & Commissioning',
  'Calibration & Testing',
  'Safety Audit & Inspection',
  'Emergency Callout'
];

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

export default function VisitModal({ isOpen, onClose }) {
  const { createVisit, addVisit } = useApp();
  const saveVisit = createVisit || addVisit;

  const signatureRef = useRef(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, visitDate: getTodayISO() });
  const [errors, setErrors] = useState({});
  const [savedSignature, setSavedSignature] = useState(null);
  const [signatureSavedFlag, setSignatureSavedFlag] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const inTimeFormatted = `${form.inHour}:${form.inMinute} ${form.inPeriod}`;
  const outTimeFormatted = `${form.outHour}:${form.outMinute} ${form.outPeriod}`;

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

    if (!form.visitDate) nextErrors.visitDate = 'Date of visit is required.';
    if (!form.clientCompany?.trim()) nextErrors.clientCompany = 'Client company name is required.';
    if (!form.keyTask?.trim()) nextErrors.keyTask = 'Key task performed is required.';
    if (!savedSignature) nextErrors.signature = 'Save the signature before submitting.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!validateForm()) {
      alert('Please complete all required fields: date, client company, key task, and signature.');
      return;
    }

    if (!saveVisit) {
      alert('Unable to save visit. App context is not ready.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        visitDate: form.visitDate,
        clientCompany: form.clientCompany.trim(),
        parentCompany: form.parentCompany.trim(),
        payoutAmount: Number(form.payoutAmount || 0),
        visitType: form.visitType,
        keyTask: form.keyTask.trim(),
        status: form.status,
        signature: savedSignature,
        inTime: inTimeFormatted,
        outTime: outTimeFormatted,
        site_name: form.clientCompany.trim(),
        parent_company: form.parentCompany.trim(),
        payout_amount: Number(form.payoutAmount || 0),
        key_task: form.keyTask.trim(),
        check_in: inTimeFormatted,
        check_out: outTimeFormatted,
      };

      await saveVisit(payload);
      resetForm();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save log. Please verify Supabase table columns and RLS policies.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm border-none"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-xl flex flex-col overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-6 py-5 border-b flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Log New Visit</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify log timings and capture supervisor sign
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5" noValidate>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Date of Visit
            </label>
            <input
              type="date"
              value={form.visitDate}
              max={getTodayISO()}
              onChange={(e) => updateField('visitDate', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-blue-500 ${
                errors.visitDate ? 'border-red-400' : 'border-slate-200'
              }`}
            />
            {errors.visitDate && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.visitDate}</p>
            )}
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
            <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Site / Meeting Timings
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium">IN Time</label>
                <div className="flex gap-1.5">
                  <select
                    value={form.inHour}
                    onChange={(e) => updateField('inHour', e.target.value)}
                    className="flex-1 px-2 py-2 rounded-xl border bg-white text-sm"
                  >
                    {HOURS_OPTIONS.map((h) => (
                      <option key={`in-h-${h}`} value={h}>{h}</option>
                    ))}
                  </select>
                  <select
                    value={form.inMinute}
                    onChange={(e) => updateField('inMinute', e.target.value)}
                    className="flex-1 px-2 py-2 rounded-xl border bg-white text-sm"
                  >
                    {MINUTES_OPTIONS.map((m) => (
                      <option key={`in-m-${m}`} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={form.inPeriod}
                    onChange={(e) => updateField('inPeriod', e.target.value)}
                    className="px-2 py-2 rounded-xl border bg-white text-sm"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5 font-medium">OUT Time</label>
                <div className="flex gap-1.5">
                  <select
                    value={form.outHour}
                    onChange={(e) => updateField('outHour', e.target.value)}
                    className="flex-1 px-2 py-2 rounded-xl border bg-white text-sm"
                  >
                    {HOURS_OPTIONS.map((h) => (
                      <option key={`out-h-${h}`} value={h}>{h}</option>
                    ))}
                  </select>
                  <select
                    value={form.outMinute}
                    onChange={(e) => updateField('outMinute', e.target.value)}
                    className="flex-1 px-2 py-2 rounded-xl border bg-white text-sm"
                  >
                    {MINUTES_OPTIONS.map((m) => (
                      <option key={`out-m-${m}`} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={form.outPeriod}
                    onChange={(e) => updateField('outPeriod', e.target.value)}
                    className="px-2 py-2 rounded-xl border bg-white text-sm"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Client / Company Name
              </label>
              <input
                type="text"
                value={form.clientCompany}
                onChange={(e) => updateField('clientCompany', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-sm ${
                  errors.clientCompany ? 'border-red-400' : 'border-slate-200'
                }`}
                placeholder="e.g. Tata Steel / Reliance"
              />
              {errors.clientCompany && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.clientCompany}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Parent / Vendor Company
              </label>
              <input
                type="text"
                value={form.parentCompany}
                onChange={(e) => updateField('parentCompany', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                placeholder="e.g. Siemens / ABB"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Visit Payout / Commission (₹)
              </label>
              <input
                type="number"
                min="0"
                value={form.payoutAmount}
                onChange={(e) => updateField('payoutAmount', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Visit Type
              </label>
              <select
                value={form.visitType}
                onChange={(e) => updateField('visitType', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <optgroup label="Sales & Business Deals">
                  <option value="New Client Pitch / Discovery">New Client Pitch / Discovery</option>
                  <option value="Product Demo & Presentation">Product Demo & Presentation</option>
                  <option value="Quotation & Contract Negotiation">Quotation & Contract Negotiation</option>
                  <option value="Relationship & Account Review">Relationship & Account Review</option>
                  <option value="Payment & Billing Follow-up">Payment & Billing Follow-up</option>
                </optgroup>
                <optgroup label="Field Operations & Technical">
                  <option value="Site Visit">Site Visit</option>
                  <option value="Breakdown / Repair">Breakdown / Repair</option>
                  <option value="Preventive Maintenance">Preventive Maintenance</option>
                  <option value="Installation & Commissioning">Installation & Commissioning</option>
                  <option value="Calibration & Testing">Calibration & Testing</option>
                  <option value="Safety Audit & Inspection">Safety Audit & Inspection</option>
                  <option value="Emergency Callout">Emergency Callout</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Key Task / Agenda Discussed
            </label>
            <textarea
              rows={3}
              value={form.keyTask}
              onChange={(e) => updateField('keyTask', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-sm ${
                errors.keyTask ? 'border-red-400' : 'border-slate-200'
              }`}
              placeholder="Summary of meeting, technical observations or deals made..."
            />
            {errors.keyTask && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.keyTask}</p>
            )}
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Visit Status
            </span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => updateField('status', VISIT_STATUS.PENDING)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all border-none ${
                  form.status === VISIT_STATUS.PENDING
                    ? 'bg-white text-amber-700 shadow-sm ring-1 ring-amber-200'
                    : 'text-slate-500'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => updateField('status', VISIT_STATUS.COMPLETED)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all border-none ${
                  form.status === VISIT_STATUS.COMPLETED
                    ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200'
                    : 'text-slate-500'
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Client / Supervisor Signature
              </span>
              {signatureSavedFlag && (
                <span className="text-xs text-emerald-600 font-bold">✓ Saved</span>
              )}
            </div>
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden">
              <SignatureCanvas
                ref={signatureRef}
                penColor="#1E3A8A"
                canvasProps={{ className: 'w-full h-40 bg-white' }}
              />
            </div>
            <div className="flex gap-3 mt-3">
              <button
                type="button"
                onClick={handleClearSignature}
                className="px-4 py-2 text-xs bg-slate-100 rounded-lg border-none"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSaveSignature}
                className="px-4 py-2 text-xs bg-blue-50 text-blue-700 rounded-lg border border-blue-100 font-medium"
              >
                Save Signature
              </button>
            </div>
            {errors.signature && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.signature}</p>
            )}
          </div>
        </form>

        <div className="flex gap-3 px-6 py-5 border-t bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 rounded-xl text-sm font-medium border-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md border-none disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save Visit'}
          </button>
        </div>
      </div>
    </div>
  );
}