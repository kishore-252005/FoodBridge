import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { dbService } from '../services/db';
import { Donation, RequestRecord, UserProfile } from '../types';
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ClipboardCheck, 
  User, 
  AlertTriangle,
  Loader,
  Phone,
  Package,
  Heart,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [allRequests, setAllRequests] = useState<RequestRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  // Load datasets dynamically from firestore
  const loadWorkspaceData = async () => {
    try {
      const [donationsData, requestsData, usersData] = await Promise.all([
        dbService.getAllDonations(),
        dbService.getAllRequests(),
        dbService.getAllUsers()
      ]);
      setAllDonations(donationsData);
      setAllRequests(requestsData);
      setAllUsers(usersData);
    } catch (err) {
      console.error("Could not load volunteer dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  // Update status flows
  const handleAcceptCargo = async (donationId: string) => {
    if (!user) {
      setActionError(t('volunteerDashboard.errorAuth'));
      return;
    }

    setActionError('');
    setActionLoading(donationId);

    try {
      const request = await dbService.createRequest(donationId, null, user.uid, 'Accepted');
      setAllRequests((current) => [...current, request]);
      setAllDonations((current) => current.map((donation) =>
        donation.donationId === donationId ? { ...donation, status: 'Accepted' } : donation
      ));
    } catch (err: any) {
      console.error('Cargo claim failed', err);
      setActionError(err?.message || t('volunteerDashboard.errorAccept'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeStatus = async (donationId: string, nextStatus: 'Collected' | 'Distributed') => {
    if (!user) return;
    setActionError('');
    setActionLoading(donationId);
    try {
      // 1. Update donation document status in DB
      await dbService.updateDonationStatus(donationId, nextStatus);
      
      // 2. Track request document state
      const matchingRequest = allRequests.find(r => r.donationId === donationId && r.volunteerId === user.uid);
      if (matchingRequest) {
        // Update the status on existing request
        await dbService.createRequest(donationId, matchingRequest.ngoId, user.uid, nextStatus);
      } else {
        // Create matching request if fallback tracking
        await dbService.createRequest(donationId, null, user.uid, nextStatus);
      }

      // Re-fetch data to reflect status change visually
      await loadWorkspaceData();
    } catch (err: any) {
      console.error("Status state transition failed", err);
      setActionError(err?.message || t('volunteerDashboard.errorStatus'));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8 min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-500">{t('volunteerDashboard.loading')}</p>
        </div>
      </div>
    );
  }

  // --- Calculations for Volunteer dashboard panels ---

  // 1. Get associated donation IDs claimed by *this* volunteer
  const myVolunteerRequests = allRequests.filter(r => r.volunteerId === user?.uid);
  const myAssignedIds = myVolunteerRequests.map(r => r.donationId);

  // 2. Assigned Pickups: Active deliveries currently under 'Accepted' or 'Collected'
  const assignedPickups = allDonations.filter(d => 
    myAssignedIds.includes(d.donationId) && (d.status === 'Accepted' || d.status === 'Collected')
  );

  // 3. Completed Deliveries: Deliveries completed and status is 'Distributed'
  const completedDeliveries = allDonations.filter(d => 
    myAssignedIds.includes(d.donationId) && d.status === 'Distributed'
  );

  // Option: Show available items nearby to claim easily
  const availableItemsToClaim = allDonations.filter(d => d.status === 'Available');

  return (
    <div className="flex-1 bg-gray-50 p-8" id="volunteer-dashboard-page">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('volunteerDashboard.title')}</h1>
          <p className="text-slate-500 mt-1">{t('volunteerDashboard.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Col Span 2): Assigned Pickups and Completed History */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Assigned Pickups Section */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm" id="assigned-pickups-panel">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Truck className="w-5 h-5 text-amber-500" />
              {t('volunteerDashboard.activeTasks')} ({assignedPickups.length})
            </h2>

            {assignedPickups.length === 0 ? (
              <div className="text-center py-12 px-6">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t('volunteerDashboard.noActiveTasks')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignedPickups.map((item) => {
                  const donorProfile = allUsers.find(u => u.uid === item.donorId);
                  return (
                    <div key={item.donationId} className="border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors bg-gray-50/50">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">{item.foodName}</h3>
                          <span className="text-[10px] font-mono text-slate-400">{t('volunteerDashboard.expiry')}: {new Date(item.expiryTime).toLocaleString()}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-2xs font-bold font-mono border ${
                          item.status === 'Accepted' ? 'bg-blue-50 text-blue-700 border-blue-105' : 'bg-amber-50 text-amber-800 border-amber-105'
                        }`}>
                          {t(`status.${item.status.toLowerCase()}`)}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-slate-650 mb-4">
                        <p className="flex items-center gap-1.5 leading-snug">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{t('volunteerDashboard.pickup')} <strong>{item.pickupAddress}</strong> ({item.area}, {item.city})</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{t('volunteerDashboard.donorContact')} {item.donorName}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{t('volunteerDashboard.donorMobile')} <strong>{donorProfile?.phone || t('volunteerDashboard.notAvailable')}</strong></span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{t('volunteerDashboard.quantity')} {item.quantity}</span>
                        </p>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="flex flex-wrap gap-2.5 pt-1">
                        {item.status === 'Accepted' && (
                          <button
                            id={`btn-collect-${item.donationId}`}
                            onClick={() => handleChangeStatus(item.donationId, 'Collected')}
                            disabled={actionLoading === item.donationId}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                          >
                            {actionLoading === item.donationId ? (
                              <>
                                <Loader className="w-3.5 h-3.5 animate-spin" />
                                <span>{t('volunteerDashboard.updating')}</span>
                              </>
                            ) : (
                              <>
                                <Package className="w-4 h-4" />
                                <span>{t('volunteerDashboard.confirmCollect')}</span>
                              </>
                            )}
                          </button>
                        )}

                        {item.status === 'Collected' && (
                          <button
                            id={`btn-distribute-${item.donationId}`}
                            onClick={() => handleChangeStatus(item.donationId, 'Distributed')}
                            disabled={actionLoading === item.donationId}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                          >
                            {actionLoading === item.donationId ? (
                              <>
                                <Loader className="w-3.5 h-3.5 animate-spin" />
                                <span>{t('volunteerDashboard.updating')}</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{t('volunteerDashboard.deliver')}</span>
                              </>
                            )}
                          </button>
                        )}

                        <Link
                          to={`/donations/${item.donationId}`}
                          className="px-4 py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
                          id={`btn-chat-${item.donationId}`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{t('volunteerDashboard.openChat')}</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Deliveries list */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm" id="completed-deliveries-panel">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
              <ClipboardCheck className="w-5 h-5 text-emerald-600" />
              {t('volunteerDashboard.completedLog')} ({completedDeliveries.length})
            </h2>

            {completedDeliveries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-slate-400">{t('volunteerDashboard.noCompleted')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">{t('volunteerDashboard.table.foodDesc')}</th>
                      <th className="py-3 px-4 font-semibold">{t('volunteerDashboard.table.quantity')}</th>
                      <th className="py-3 px-4 font-semibold">{t('volunteerDashboard.table.donor')}</th>
                      <th className="py-3 px-4 font-semibold">{t('volunteerDashboard.table.deliveryTime')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {completedDeliveries.map((item) => (
                      <tr key={item.donationId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{item.foodName}</td>
                        <td className="py-3.5 px-4 font-medium">{item.quantity}</td>
                        <td className="py-3.5 px-4 text-slate-500">{item.donorName}</td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          {new Date(item.expiryTime).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Claim Center (Quick Available listings map) */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm self-start" id="volunteer-claim-center">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Heart className="w-4 h-4 text-emerald-600" />
            {t('volunteerDashboard.claimCenter')}
          </h2>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            {t('volunteerDashboard.claimSub')}
          </p>

          {availableItemsToClaim.length === 0 ? (
            <div className="text-center py-10">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">{t('volunteerDashboard.noSurplus')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableItemsToClaim.map((item) => (
                <div key={item.donationId} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{item.foodName}</h4>
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block mt-0.5">{item.category}</span>
                  </div>

                  <div className="space-y-1.5 text-2xs text-slate-500">
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.pickupAddress}</span>
                    </p>
                    <p className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{t('volunteerDashboard.expires')} {new Date(item.expiryTime).toLocaleDateString()}</span>
                    </p>
                  </div>

                  <button
                    id={`btn-claim-v-${item.donationId}`}
                    onClick={() => handleAcceptCargo(item.donationId)}
                    disabled={actionLoading === item.donationId}
                    className="w-full py-2 bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl text-center cursor-pointer block transition-colors disabled:opacity-60"
                  >
                    {actionLoading === item.donationId ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                        {t('volunteerDashboard.processing')}
                      </span>
                    ) : (
                      t('volunteerDashboard.acceptCargo')
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
