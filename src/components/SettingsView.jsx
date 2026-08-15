import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User, Briefcase, Camera, Sparkles, X, Check } from 'lucide-react';

const DESIGNATIONS = [
  // --- Field & Site Roles ---
  'Site Engineer',
  'Field Service Specialist',
  'Maintenance Supervisor',
  'Safety Officer',
  'Instrumentation Engineer',
  'Electrical Consultant',
  'Operations Manager',
  'HVAC Technician',
  'Contractor / Freelancer',

  // --- Sales & Business Development Roles ---
  'Sales Executive',
  'Field Sales Officer (FSO)',
  'Key Account Manager (KAM)',
  'Business Development Executive (BDE)',
  'Business Development Manager (BDM)',
  'Technical Sales Engineer',
  'Area Sales Manager (ASM)',
  'Regional Sales Manager (RSM)',
  'Channel Partner Specialist'
];

export default function SettingsModal({ isOpen, onClose }) {
  const { user, userProfile, updateProfile } = useApp();

  const [fullName, setFullName] = useState('');
  const [designation, setDesignation] = useState(DESIGNATIONS[0]);
  const [avatar, setAvatar] = useState(null);
  const [appMode, setAppMode] = useState('individual');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || user?.name || '');
      setDesignation(userProfile.designation || DESIGNATIONS[0]);
      setAvatar(userProfile.avatar || null);
      setAppMode(userProfile.appMode || 'individual');
    }
  }, [userProfile, user, isOpen]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile({
      fullName: fullName.trim(),
      designation,
      avatar,
      appMode
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button 
        type="button"
        aria-label="Close modal overlay"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm border-none cursor-default" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Account & Preferences</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage your identity and workspace modes</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Avatar Section */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-blue-50 border-2 border-slate-100 flex items-center justify-center overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-blue-500" />
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl shadow-md cursor-pointer transition-all">
                <Camera size={14} />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Profile Picture</h4>
              <p className="text-xs text-slate-400 mt-0.5">JPG or PNG (Recommended 1:1 ratio)</p>
            </div>
          </div>

          {/* Name & Designation */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Designation / Role</label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-blue-500"
              >
                <optgroup label="Sales & Business Development">
                  <option value="Sales Executive">Sales Executive</option>
                  <option value="Field Sales Officer (FSO)">Field Sales Officer (FSO)</option>
                  <option value="Key Account Manager (KAM)">Key Account Manager (KAM)</option>
                  <option value="Business Development Executive (BDE)">Business Development Executive (BDE)</option>
                  <option value="Business Development Manager (BDM)">Business Development Manager (BDM)</option>
                  <option value="Technical Sales Engineer">Technical Sales Engineer</option>
                  <option value="Area Sales Manager (ASM)">Area Sales Manager (ASM)</option>
                  <option value="Regional Sales Manager (RSM)">Regional Sales Manager (RSM)</option>
                  <option value="Channel Partner Specialist">Channel Partner Specialist</option>
                </optgroup>
                <optgroup label="Field & Engineering Operations">
                  <option value="Site Engineer">Site Engineer</option>
                  <option value="Field Service Specialist">Field Service Specialist</option>
                  <option value="Maintenance Supervisor">Maintenance Supervisor</option>
                  <option value="Safety Officer">Safety Officer</option>
                  <option value="Instrumentation Engineer">Instrumentation Engineer</option>
                  <option value="Electrical Consultant">Electrical Consultant</option>
                  <option value="Operations Manager">Operations Manager</option>
                  <option value="HVAC Technician">HVAC Technician</option>
                  <option value="Contractor / Freelancer">Contractor / Freelancer</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Workspace Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div 
                onClick={() => setAppMode('individual')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  appMode === 'individual' 
                    ? 'border-blue-600 bg-blue-50/50 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                    <User size={18} />
                  </div>
                  {appMode === 'individual' && <Check size={16} className="text-blue-600 font-bold" />}
                </div>
                <h5 className="text-sm font-bold text-slate-800">Individual Mode</h5>
                <p className="text-xs text-slate-500 mt-1">Single user tracker, direct log & PDF reports.</p>
              </div>

              <div 
                onClick={() => setAppMode('business')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative ${
                  appMode === 'business' 
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <Sparkles size={10} /> PRO
                </span>
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl mb-2 w-fit">
                  <Briefcase size={18} />
                </div>
                <h5 className="text-sm font-bold text-slate-800">Business Mode</h5>
                <p className="text-xs text-slate-500 mt-1">Team management, multi-user logs & GST billings.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              {savedSuccess ? <><Check size={16} /> Saved!</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}