import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { supabase } from '../utils/auth';

export default function SettingsView({ setActiveTab }) {
  const { t, i18n } = useTranslation();
  const { user, updateProfileAvatar, logout } = useApp();
  const [uploading, setUploading] = useState(false);

  const isHindi = i18n.language && i18n.language.startsWith('hi');

  const avatarUrl =
    user?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    'https://via.placeholder.com/150?text=User';

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id || 'user'}_${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      // 1. Supabase Storage Bucket 'avatars' mein upload karo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Public URL nikalo
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // 3. User profile metadata update karo
      const res = await updateProfileAvatar(publicUrl);
      if (res.success) {
        alert(isHindi ? 'प्रोफ़ाइल फोटो अपडेट हो गई!' : 'Profile photo updated successfully!');
      } else {
        alert(res.error || 'Failed to update user profile');
      }
    } catch (error) {
      alert(error.message || 'Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-bold text-slate-900">
          ⚙️ {isHindi ? 'खाता और सेटिंग्स' : 'Account & Settings'}
        </h2>
        <button
          onClick={() => setActiveTab('home')}
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          ← {isHindi ? 'होम पर वापस जाएं' : 'Back to Home'}
        </button>
      </div>

      {/* 📸 PROFILE PHOTO SECTION */}
      <div className="space-y-4">
        <h3 className="text-md font-semibold text-slate-700">
          📸 {isHindi ? 'प्रोफ़ाइल फोटो (Profile Picture)' : 'Profile Picture'}
        </h3>
        <div className="flex items-center gap-6">
          <img
            src={avatarUrl}
            alt="Profile Avatar"
            className="w-24 h-24 rounded-full object-cover border-2 border-blue-600 shadow-sm"
          />
          <div className="space-y-2">
            <label className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all inline-block">
              {uploading
                ? isHindi
                  ? 'अपलोड हो रहा है...'
                  : 'Uploading...'
                : isHindi
                ? 'फोटो बदलें'
                : 'Upload New Photo'}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <p className="text-xs text-slate-500">JPG, PNG allowed (Max 5MB)</p>
          </div>
        </div>
      </div>

      {/* 🌐 LANGUAGE SELECTION */}
      <div className="border-t pt-6 space-y-3">
        <h3 className="text-md font-semibold text-slate-700">
          🌐 {isHindi ? 'भाषा चुनें (Select Language)' : 'App Language'}
        </h3>
        <div className="flex gap-4">
          <button
            onClick={() => changeLanguage('en')}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm border transition-all ${
              !isHindi
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            🇬🇧 English
          </button>
          <button
            onClick={() => changeLanguage('hi')}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm border transition-all ${
              isHindi
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            🇮🇳 हिंदी (Hindi)
          </button>
        </div>
      </div>

      {/* 👤 ACCOUNT DETAILS */}
      <div className="border-t pt-6 space-y-3">
        <h3 className="text-md font-semibold text-slate-700">
          👤 {isHindi ? 'खाता जानकारी' : 'Account Details'}
        </h3>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1 text-sm">
          <p>
            <strong>Name:</strong> {user?.name || user?.user_metadata?.name || 'User'}
          </p>
          <p>
            <strong>Email:</strong> {user?.email || 'N/A'}
          </p>
          <p>
            <strong>Role:</strong> Site Engineer / Manager
          </p>
        </div>
      </div>

      {/* 🚪 LOGOUT */}
      {logout && (
        <div className="border-t pt-6">
          <button
            onClick={logout}
            className="bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-600 transition-all"
          >
            🚪 {isHindi ? 'लॉगआउट करें' : 'Logout'}
          </button>
        </div>
      )}
    </div>
  );
}