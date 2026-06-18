import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { Donation } from '../types';
import { PlusCircle, Heart, CheckCircle2, History, ArrowRight, ClipboardList, Clock, AlertTriangle } from 'lucide-react';

export default function DonorDashboard() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDonorDonations() {
      if (!user) return;
      try {
        const all = await dbService.getAllDonations();
        // Filter elements belonging strictly to this user
        const donorDocs = all.filter(d => d.donorId === user.uid);
        setDonations(donorDocs);
      } catch (err) {
        console.error("Could not fetch donor donations", err);
      } finally {
        setLoading(false);
      }
    }
    loadDonorDonations();
  }, [user]);

  // Calculations from actual data
  const totalDonationsCount = donations.length;
  const activeDonationsCount = donations.filter(d => d.status === 'Available' || d.status === 'Accepted').length;
  const collectedDonationsCount = donations.filter(d => d.status === 'Collected').length;
  const distributedDonationsCount = donations.filter(d => d.status === 'Distributed').length;

  return (
    <div className="flex-1 bg-gray-50 p-8" id="donor-dashboard-page">
      {/* Upper Welcoming Layout */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Donor Hub</h1>
          <p className="text-slate-500 mt-1">Manage and track your surplus food contributions efficiently</p>
        </div>
        <Link 
          to="/add-donation" 
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all self-start md:self-auto"
          id="btn-donor-add-donation"
        >
          <PlusCircle className="w-5 h-5" />
          Add Donation
        </Link>
      </div>

      {/* Numerical Metric Counters (Calculated strictly from Firestore) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        {/* Total Metric Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between" id="metric-total">
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 block tracking-wider">Total Contributions</p>
            <p className="text-3xl font-bold text-slate-900 mt-2" id="total-count-val">
              {totalDonationsCount}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Heart className="w-6 h-6 fill-emerald-50" />
          </div>
        </div>

        {/* Active Metric Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between" id="metric-active">
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 block tracking-wider font-semibold">Active Items</p>
            <p className="text-3xl font-bold text-amber-600 mt-2" id="active-count-val">
              {activeDonationsCount}
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Collected Metric Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between" id="metric-collected">
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 block tracking-wider font-semibold">Ready for Pickup</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {collectedDonationsCount}
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <History className="w-6 h-6" />
          </div>
        </div>

        {/* Distributed Metric Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between" id="metric-distributed">
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 block tracking-wider font-semibold">Fully Distributed</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">
              {distributedDonationsCount}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Grid of Past/Current Donations */}
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-slate-500" />
        My Donation Listings
      </h2>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-gray-200">
          <Clock className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading donor items...</p>
        </div>
      ) : donations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 px-6" id="empty-donor-alert">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
          <h3 className="text-base font-semibold text-slate-700">No Food Donations Posted</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2.5">
            You haven't posted any food surplus listings yet. Click the "Add Donation" button above to share quality nutritious meals.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-250 shadow-sm overflow-hidden p-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="donor-donations-table">
              <thead>
                <tr className="bg-gray-55 border-b border-gray-100">
                  <th className="py-4 px-6 text-xs uppercase font-bold text-slate-400 tracking-wider">Food Listing</th>
                  <th className="py-4 px-6 text-xs uppercase font-bold text-slate-400 tracking-wider">Quantity</th>
                  <th className="py-4 px-6 text-xs uppercase font-bold text-slate-400 tracking-wider">Expiry timeframe</th>
                  <th className="py-4 px-6 text-xs uppercase font-bold text-slate-400 tracking-wider">State status</th>
                  <th className="py-4 px-6 text-xs uppercase font-bold text-slate-400 tracking-wider">Prepared Time</th>
                  <th className="py-4 px-6 text-xs uppercase font-bold text-slate-400 tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {donations.map((item) => (
                  <tr key={item.donationId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.foodName} 
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded-lg border border-gray-100 shrink-0" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs shrink-0 font-bold border border-emerald-100">
                            {item.foodName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-semibold text-slate-800 block">{item.foodName}</span>
                          <span className="text-[10px] text-slate-400 font-mono block uppercase">{item.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-650 font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-xs text-slate-605">
                        <span>{new Date(item.expiryTime).toLocaleString()}</span>
                        {new Date(item.expiryTime) < new Date() && (
                          <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-mono font-semibold flex items-center gap-0.5 border border-rose-100">
                            <AlertTriangle className="w-2.5 h-2.5" /> EXP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold font-mono ${
                        item.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        item.status === 'Accepted' ? 'bg-blue-50 text-blue-700 border border-blue-105' :
                        item.status === 'Collected' ? 'bg-amber-50 text-amber-800 border border-amber-105' :
                        'bg-gray-150 text-slate-650'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.status === 'Available' ? 'bg-emerald-500' :
                          item.status === 'Accepted' ? 'bg-blue-500' :
                          item.status === 'Collected' ? 'bg-amber-500' :
                          'bg-slate-500'
                        }`} />
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-450 font-mono">
                      {new Date(item.preparedTime).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <Link 
                        to={`/donations/${item.donationId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                      >
                        Inspect
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
