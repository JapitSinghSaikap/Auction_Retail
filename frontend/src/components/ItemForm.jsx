import React, { useState, useRef } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_ITEM } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ItemForm({ categories = [], onSuccess }) {
  const { user, token } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '', description: '', startingPrice: '', endTime: '', categoryId: '',
  });
  const [imageFile, setImageFile] = useState(null);      // File object
  const [imagePreview, setImagePreview] = useState('');  // blob URL for preview
  const [imageUrl, setImageUrl] = useState('');          // final URL after upload
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');

  const [createItem, { loading: creating }] = useMutation(CREATE_ITEM);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setFormError('');
  };

  // Handle file selection — show local preview immediately
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image must be under 5 MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageUrl(''); // reset any previous upload
    setFormError('');
  };

  // Upload file to /api/upload and get back a server URL
  const uploadImage = async () => {
    if (!imageFile) return null;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed.');
      const fullUrl = `${API_URL}${data.url}`;
      setImageUrl(fullUrl);
      return fullUrl;
    } catch (err) {
      setFormError(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.startingPrice || !form.endTime || !form.categoryId) {
      setFormError('Please fill in all required fields.');
      return;
    }
    const price = parseFloat(form.startingPrice);
    if (isNaN(price) || price <= 0) { setFormError('Starting price must be positive.'); return; }
    const end = new Date(form.endTime);
    if (end <= new Date()) { setFormError('End time must be in the future.'); return; }

    // Upload image if one was selected
    let finalImageUrl = imageUrl;
    if (imageFile && !imageUrl) {
      finalImageUrl = await uploadImage();
      if (!finalImageUrl) return; // upload failed, error already set
    }

    try {
      await createItem({
        variables: {
          title: form.title.trim(),
          description: form.description.trim() || null,
          image: finalImageUrl || null,
          startingPrice: price,
          endTime: end.toISOString(),
          categoryId: form.categoryId,
          sellerId: user.id,
        },
      });
      // Reset
      setForm({ title: '', description: '', startingPrice: '', endTime: '', categoryId: '' });
      removeImage();
      if (onSuccess) onSuccess();
    } catch (err) {
      setFormError(err.message || 'Failed to create item.');
    }
  };

  const minDateTime = new Date(Date.now() + 60000).toISOString().slice(0, 16);
  const isLoading = uploading || creating;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Image upload zone */}
      <div>
        <label className="label-muted block mb-1.5">Item Photo</label>

        {imagePreview ? (
          /* Preview */
          <div className="relative rounded-card overflow-hidden bg-[#1a1a1a] h-44">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary text-xs py-1.5 px-3"
              >
                Change
              </button>
              <button
                type="button"
                onClick={removeImage}
                className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold py-1.5 px-3 rounded-pill hover:bg-white/30 transition-colors"
              >
                Remove
              </button>
            </div>
            {/* Upload status */}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {imageUrl && !uploading && (
              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        ) : (
          /* Drop zone */
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-36 rounded-card border-2 border-dashed border-[rgba(29,28,31,0.15)]
                       hover:border-accent hover:bg-accent-light/30 transition-all duration-200
                       flex flex-col items-center justify-center gap-2 text-secondary hover:text-accent"
          >
            <svg className="w-8 h-8 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-semibold">Click to upload photo</span>
            <span className="text-[11px] opacity-60">JPEG, PNG, WebP — max 5 MB</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Title */}
      <div>
        <label className="label-muted block mb-1.5">Item Title <span className="text-live-red">*</span></label>
        <input name="title" className="input" placeholder="e.g. Vintage Rolex Submariner"
          value={form.title} onChange={handleChange} maxLength={120} />
      </div>

      {/* Description */}
      <div>
        <label className="label-muted block mb-1.5">Description</label>
        <textarea name="description" className="input resize-none" rows={3}
          placeholder="Describe condition, features, provenance…"
          value={form.description} onChange={handleChange} />
      </div>

      {/* Price + Category */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-muted block mb-1.5">Starting Bid ($) <span className="text-live-red">*</span></label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary text-sm">₹</span>
            <input name="startingPrice" type="number" className="input pl-7"
              placeholder="0.00" min="0.01" step="0.01"
              value={form.startingPrice} onChange={handleChange} />
          </div>
        </div>
        <div>
          <label className="label-muted block mb-1.5">Category <span className="text-live-red">*</span></label>
          <select name="categoryId" className="input" value={form.categoryId} onChange={handleChange}>
            <option value="">Select…</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* End time */}
      <div>
        <label className="label-muted block mb-1.5">Auction End Time <span className="text-live-red">*</span></label>
        <input name="endTime" type="datetime-local" className="input"
          min={minDateTime} value={form.endTime} onChange={handleChange} />
      </div>

      {formError && (
        <p className="text-sm text-red-500 bg-red-50 rounded-input px-3 py-2">{formError}</p>
      )}

      <button type="submit" className="btn-primary w-full justify-center py-3" disabled={isLoading}>
        {uploading ? 'Uploading image…' : creating ? 'Listing…' : 'List Item for Auction'}
      </button>
    </form>
  );
}
