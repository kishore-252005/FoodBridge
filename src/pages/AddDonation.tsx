import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { platformService } from '../services/platform';
import { 
  Heart, 
  ArrowLeft, 
  Upload, 
  Clock, 
  MapPin, 
  Utensils, 
  ShieldAlert, 
  Loader, 
  CheckCircle2, 
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function AddDonation() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [foodName, setFoodName] = useState('');
  const [category, setCategory] = useState('Cooked Meal');
  const [quantity, setQuantity] = useState('');
  const [preparedTime, setPreparedTime] = useState('');
  const [expiryTime, setExpiryTime] = useState('');
  const [pickupAddress, setPickupAddress] = useState(user?.pickupAddress || user?.area ? `${user.area}, ${user.city}` : '');
  const [description, setDescription] = useState('');
  
  // Image states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragover, setDragover] = useState(false);

  // Status flags
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragover(true);
  };

  const handleDragLeave = () => {
    setDragover(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragover(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setupFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setupFile(e.target.files[0]);
    }
  };

  const setupFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please provide a valid image format file.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSelectImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = await platformService.takePhoto();
    if (file) {
      setupFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // --- Validation Checks ---
    if (!foodName.trim() || !quantity.trim() || !preparedTime || !expiryTime || !pickupAddress.trim()) {
      setError('Please provide all mandatory form entries (marked with asterisks).');
      return;
    }

    const prepDate = new Date(preparedTime);
    const expDate = new Date(expiryTime);
    const now = new Date();

    if (expDate <= prepDate) {
      setError('Expiry time must be set to occur after the prepared time.');
      return;
    }

    if (expDate <= now) {
      setError('This food item has already expired. Only share safe, non-expired food.');
      return;
    }

    setLoading(true);
    try {
      await dbService.createDonation({
        foodName: foodName.trim(),
        category,
        quantity: quantity.trim(),
        preparedTime,
        expiryTime,
        pickupAddress: pickupAddress.trim(),
        description: description.trim(),
        imageUrl: '', // Managed by the service
        donorId: user?.uid || '',
        donorName: user?.fullName || 'Anonymous Donor',
        city: user?.city || '',
        area: user?.area || ''
      }, imageFile || undefined);

      setSuccess(true);
      void platformService.triggerSuccessHaptic();
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving donation details.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Cooked Meal',
    'Grains & Pasta',
    'Vegetables & Greens',
    'Fresh Fruits',
    'Dairy products',
    'Bakery & Bread',
    'Canned / Preserved Food',
    'Beverages',
    'Infant formula / Care items'
  ];

  return (
    <div className="flex-1 bg-gray-50 p-8" id="add-donation-page">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Clean Corporate Minimal Banner Header */}
        <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 text-slate-600 transition-colors"
              id="back-donor-dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Post Surplus Food</h1>
              <p className="text-xs text-slate-500 mt-0.5">Share premium quality meal resources with volunteer associations</p>
            </div>
          </div>
          <Heart className="w-5 h-5 text-emerald-500 fill-emerald-50" />
        </div>

        {/* Global Alerts */}
        {error && (
          <div className="m-6 p-4 bg-rose-50 border border-rose-150 text-rose-800 rounded-2xl flex items-start gap-3 text-xs animate-fade-in animate-once duration-300" id="add-donation-error">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {success && (
          <div className="m-6 p-4 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-2xl flex items-start gap-3 text-xs animate-fade-in" id="add-donation-success">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
            <p className="font-semibold">Donation posted successfully! Informing matched area volunteers...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Food Name */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Food Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Utensils className="w-4 h-4" />
                </span>
                <input
                  id="add-food-name"
                  type="text"
                  required
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g. Freshly packed lentil wraps & soup"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/75 border border-gray-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Food Category */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Food Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="add-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50/75 border border-gray-200 rounded-xl text-sm text-slate-800 cursor-pointer focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Quantity & Servings <span className="text-rose-500">*</span>
              </label>
              <input
                id="add-quantity"
                type="text"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 12 packages / 4 kg"
                className="w-full px-4 py-2.5 bg-gray-50/75 border border-gray-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            {/* Pickup Address */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Pickup Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <input
                  id="add-address"
                  type="text"
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Building No, Street state Landmark"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/75 border border-gray-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Prepared Time */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Prepared Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  id="add-prep-time"
                  type="datetime-local"
                  required
                  value={preparedTime}
                  onChange={(e) => setPreparedTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/75 border border-gray-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Expiry Time */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Expiry Time <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Clock className="w-4 h-4" />
                </span>
                <input
                  id="add-expiry-time"
                  type="datetime-local"
                  required
                  value={expiryTime}
                  onChange={(e) => setExpiryTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/75 border border-gray-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Specific Instructions</label>
            <textarea
              id="add-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide temperature requirements, allergens details or guidelines for pick-up agents here..."
              className="w-full px-4 py-3 bg-gray-50/75 border border-gray-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Upload Food Image */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Illustrative Food Image</label>
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleSelectImage}
              className={`border border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                dragover 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
              }`}
              id="drop-zone-image"
            >
              <input 
                type="file" 
                id="file-upload-input"
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange} 
              />
              
              <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center text-xs">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Local Preview" 
                      referrerPolicy="no-referrer"
                      className="max-h-36 rounded-xl object-contain border border-gray-100 mb-2 shadow-sm" 
                    />
                    <span className="text-2xs text-emerald-600 font-semibold block mt-1">Image loaded successfully. Click to replace.</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-slate-700 font-semibold block">Click to select or drag & drop image illustration</span>
                    <span className="text-slate-400 mt-1 block">Compatible standard formats: JPEG, PNG, WEBP</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <button
            id="btn-submit-donation"
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Publishing Food Listing...</span>
              </>
            ) : (
              <span>Publish Listing</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
