import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { Donation, RequestRecord } from '../types';
import { 
  Building, 
  Heart, 
  Clock, 
  CheckCircle2, 
  Search, 
  MapPin, 
  ClipboardList, 
  ArrowRight, 
  History,
  AlertTriangle
} from 'lucide-react';

export default function NgoDashboard() {
  const { user } = useAuth();
  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [allRequests, setAllRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'claimed' | 'history'>('available');

  useEffect(() => {
    async function loadData() {
      try {
        const [donationsData, requestsData] = await Promise.all([
          dbService.getAllDonations(),
          dbService.getAllRequests()
        ]);
        setAllDonations(donationsData);
        setAllRequests(requestsData);
      } catch (err) {
        console.error("Could not fetch data for NGO Dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8 min-h-screen">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Syncing database records...</p>
        </div>
      </div>
    );
  }

  // Filter datasets
  // tab 1: Available donations
  const availableDonations = allDonations.filter(d => d.status === 'Available');

  // get requestId associations for current NGO
  const myNgoRequests = allRequests.filter(r => r.ngoId === user?.uid);
  const myClaimedIds = myNgoRequests.map(r => r.donationId);

  // tab 2: Accepted Donations claimed by this NGO
  const acceptedDonations = allDonations.filter(d => 
    myClaimedIds.includes(d.donationId) && (d.status === 'Accepted' || d.status === 'Collected')
  );

  // tab 3: Donation History (Distributed by this NGO)
  const donationHistory = allDonations.filter(d => 
    myClaimedIds.includes(d.donationId) && d.status === 'Distributed'
  );

  return (
    <div className="flex-1 bg-gray-50 p-8" id="ngo-dashboard-page">
      
      {/* Welcoming header banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">NGO Partner Hub</h1>
          <p className="text-slate-500 mt-1">Claim, track, and coordinate redistribution of available meals in your city</p>
        </div>
      </div>

      {/* Tabs navigation panel - pill button theme matching minimalist design */}
      <div className="flex flex-wrap gap-2 mb-8 bg-gray-100 p-1.5 rounded-2xl max-w-fit" id="ngo-tabs-navigation">
        <button
          id="tab-btn-available"
          onClick={() => setActiveTab('available')}
          className={`px-5 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'available' 
              ? 'bg-white text-emerald-800 shadow-sm border border-gray-200' 
              : 'text-slate-500 hover:text-slate-900 border border-transparent'
          }`}
        >
          <Building className="w-4 h-4" />
          Browse Surplus ({availableDonations.length})
        </button>

        <button
          id="tab-btn-claimed"
          onClick={() => setActiveTab('claimed')}
          className={`px-5 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'claimed' 
              ? 'bg-white text-emerald-800 shadow-sm border border-gray-200' 
              : 'text-slate-500 hover:text-slate-900 border border-transparent'
          }`}
        >
          <Clock className="w-4 h-4" />
          Claims Pending ({acceptedDonations.length})
        </button>

        <button
          id="tab-btn-history"
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'history' 
              ? 'bg-white text-emerald-800 shadow-sm border border-gray-200' 
              : 'text-slate-500 hover:text-slate-900 border border-transparent'
          }`}
        >
          <History className="w-4 h-4" />
          My History ({donationHistory.length})
        </button>
      </div>

      {/* Tab: Available Donations content */}
      {activeTab === 'available' && (
        <div id="ngo-available-content">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Surplus Ready to Claim
            </h2>
            <Link 
              to="/donations" 
              className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
            >
              Advanced Filtering <ArrowRight className="w-3" />
            </Link>
          </div>

          {availableDonations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 px-6">
              <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No surplus food currently listed</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2.5">
                Matched area donor resources are empty right now. Active notifications will trigger instantly when donors share surplus food.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {availableDonations.map((item) => (
                <div key={item.donationId} className="bg-white rounded-3xl border border-gray-205 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-2.5 mb-4">
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] uppercase font-bold font-mono px-2.5 py-0.5 rounded-full border border-emerald-100">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {item.donationId.slice(0, 6)}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 truncate mb-3">{item.foodName}</h3>
                    
                    <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Quantity:</span>
                        <span className="font-semibold text-slate-800">{item.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Donor:</span>
                        <span className="font-semibold text-slate-800">{item.donorName}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 pt-1">
                        <span className="text-slate-400 font-medium">Collection Place:</span>
                        <span className="font-medium text-slate-700 truncate block">{item.pickupAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-gray-50/75 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-2xs text-amber-600 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Expires {new Date(item.expiryTime).toLocaleDateString()}
                    </span>
                    <Link 
                      to={`/donations/${item.donationId}`}
                      className="px-4 py-1.5 bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white rounded-xl text-3xs font-bold uppercase tracking-wider transition-all"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Claimed / Accepted pending collection content */}
      {activeTab === 'claimed' && (
        <div id="ngo-claimed-content">
          <h2 className="text-base font-bold text-slate-800 tracking-tight mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            Claimed Listings in Dispatch
          </h2>

          {acceptedDonations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-250 px-6">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No active pickup operations</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2.5">
                You haven't claimed or accepted any pending food items yet. Match with available listings to start redistributing.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {acceptedDonations.map((item) => (
                <div key={item.donationId} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">{item.foodName}</h3>
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">{item.category}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-2xs font-bold font-mono ${
                      item.status === 'Accepted' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-705 border border-amber-100'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-3.5 border-t border-gray-100 text-xs text-slate-650">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Quantity:</span>
                      <span className="font-semibold text-slate-800">{item.quantity}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Pickup Address:</span>
                      <span className="font-semibold text-slate-800 truncate block">{item.pickupAddress}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3.5 border-t border-gray-100">
                    <span className="text-2xs text-slate-400">
                      Created: {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <Link 
                      to={`/donations/${item.donationId}`}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
                    >
                      Update transit details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: History distributed content */}
      {activeTab === 'history' && (
        <div id="ngo-history-content">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Successfully Distributed Listings
          </h2>

          {donationHistory.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 px-6">
              <History className="w-12 h-12 text-slate-350 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">No completed delivery records</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2.5">
                Complete distribution actions or change status values to view metrics on finished donation records here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="py-4 px-6 text-xs uppercase font-bold text-slate-400">Food Item</th>
                      <th className="py-4 px-6 text-xs uppercase font-bold text-slate-400">Category</th>
                      <th className="py-4 px-6 text-xs uppercase font-bold text-slate-400">Quantity</th>
                      <th className="py-4 px-6 text-xs uppercase font-bold text-slate-400">Donor</th>
                      <th className="py-4 px-6 text-xs uppercase font-bold text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {donationHistory.map((item) => (
                      <tr key={item.donationId} className="hover:bg-gray-55/50 transition-colors">
                        <td className="py-4 px-6 text-xs text-slate-800 font-semibold">{item.foodName}</td>
                        <td className="py-4 px-6 text-[10px] text-slate-400 font-mono uppercase">{item.category}</td>
                        <td className="py-4 px-6 text-xs text-slate-600 font-medium">{item.quantity}</td>
                        <td className="py-4 px-6 text-xs text-slate-600">{item.donorName}</td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-850 px-2.5 py-1 rounded-full text-2xs font-bold font-mono border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
