import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dbService } from '../services/db';
import { Donation, DonationStatus } from '../types';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Heart, 
  User, 
  Calendar,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  HelpCircle
} from 'lucide-react';

export default function DonationList() {
  const { t } = useTranslation();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter variables
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  useEffect(() => {
    async function loadDonations() {
      try {
        const all = await dbService.getAllDonations();
        setDonations(all);
      } catch (err) {
        console.error("Could not load donations", err);
      } finally {
        setLoading(false);
      }
    }
    loadDonations();
  }, []);

  const categories = [
    'All',
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

  const statuses = ['All', 'Available', 'Accepted', 'Collected', 'Distributed'];

  // Filter Logic
  const filteredDonations = donations.filter((d) => {
    const matchesSearch = d.foodName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || d.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="flex-1 bg-gray-50 p-8" id="donation-list-page">
      
      {/* Header text */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('donationList.title')}</h1>
          <p className="text-slate-500 mt-1">{t('donationList.subtitle')}</p>
        </div>
      </div>

      {/* Search and Filters Segment with custom border radius and high-end feel */}
      <div className="bg-white p-6 rounded-3xl border border-gray-250/75 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="search-filter-layout">
          
          {/* Search by name */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t('donationList.searchLabel')}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                id="search-by-name"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('donationList.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Filter by Category */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t('donationList.categoryFilter')}</label>
            <select
              id="filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-slate-800 cursor-pointer focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat === 'All' ? t(`categories.${cat.toLowerCase()}`, cat) : cat}</option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">{t('donationList.statusFilter')}</label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-slate-800 cursor-pointer focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            >
              {statuses.map((st) => (
                <option key={st} value={st}>{st === 'All' ? t('donationList.allRoles') : t(`status.${st.toLowerCase()}`)}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Grid of Donations */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200">
          <Clock className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-500">{t('donationList.loading')}</p>
        </div>
      ) : filteredDonations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 px-6" id="empty-listings-state">
          <HelpCircle className="w-12 h-12 text-slate-350 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">{t('donationList.emptyTitle')}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2.5">
            {t('donationList.emptySub')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="donations-grid-wrap">
          {filteredDonations.map((item) => (
            <div 
              key={item.donationId} 
              className="bg-white rounded-3xl border border-gray-205 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative"
              id={`donation-card-${item.donationId}`}
            >
              {/* Media image illustration if uploaded */}
              <div className="h-44 w-full bg-slate-900 flex items-center justify-center relative overflow-hidden shrink-0">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.foodName} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="text-center p-6 text-white uppercase text-xs">
                    <Heart className="w-10 h-10 text-emerald-500 mx-auto mb-2 fill-emerald-50" />
                    <span>{item.category}</span>
                  </div>
                )}

                {/* Left floating status tag */}
                <div className="absolute top-4 left-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-bold font-mono tracking-wide border shadow-sm ${
                    item.status === 'Available' ? 'bg-emerald-500 text-white border-emerald-600' :
                    item.status === 'Accepted' ? 'bg-blue-500 text-white border-blue-600' :
                    item.status === 'Collected' ? 'bg-amber-500 text-amber-955 border-amber-600' :
                    'bg-slate-300 text-slate-800 border-slate-400'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    {t(`status.${item.status.toLowerCase()}`)}
                  </span>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-850 leading-snug line-clamp-1 mb-1">{item.foodName}</h3>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">{item.category}</span>

                  <div className="space-y-2.5 mt-4 pt-4 border-t border-gray-100">
                    {/* Quantity info */}
                    <div className="flex items-center gap-2 text-xs text-slate-650">
                      <span className="text-slate-400 text-2xs uppercase tracking-wide min-w-16 block font-medium">{t('donationList.quantity')}</span>
                      <span className="font-semibold text-slate-800">{item.quantity}</span>
                    </div>

                    {/* Donor information */}
                    <div className="flex items-center gap-2 text-xs text-slate-650">
                      <span className="text-slate-400 text-2xs uppercase tracking-wide min-w-16 block font-medium">{t('donationList.donor')}</span>
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.donorName}</span>
                      </div>
                    </div>

                    {/* Location Information */}
                    <div className="flex items-center gap-2 text-xs text-slate-650">
                      <span className="text-slate-400 text-2xs uppercase tracking-wide min-w-16 block font-medium">{t('donationList.location')}</span>
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 leading-tight">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.pickupAddress}</span>
                      </div>
                    </div>

                    {/* Expiry limit information */}
                    <div className="border-t border-gray-100 pt-3 mt-3">
                      <div className="flex items-center justify-between text-2xs text-slate-450 font-medium">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{t('donationList.expires')} {new Date(item.expiryTime).toLocaleString()}</span>
                        </div>
                        {new Date(item.expiryTime) < new Date() && (
                          <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-mono font-bold border border-rose-100">
                            {t('donationList.expired')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <Link 
                    to={`/donations/${item.donationId}`}
                    className="w-full py-2.5 bg-slate-900 border border-slate-950 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    id={`btn-inspect-${item.donationId}`}
                  >
                    <span>{t('donationList.inspect')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
