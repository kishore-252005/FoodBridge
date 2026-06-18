import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { platformService } from '../services/platform';
import { Donation } from '../types';
import { 
  ArrowLeft, 
  Heart, 
  MapPin, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  BookOpen,
  Loader,
  Phone,
  Truck,
  Building,
  ShieldAlert,
  Share2,
  MessageSquare,
  MessageCircle,
  Mail
} from 'lucide-react';

export default function DonationDetails() {
  const { donationId } = useParams<{ donationId: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [donation, setDonation] = useState<Donation | null>(null);
  const [donorProfile, setDonorProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');

  // Poll for new chat messages
  useEffect(() => {
    if (donation?.status === 'Accepted' || donation?.status === 'Collected') {
      const loadMessages = async () => {
        try {
          const list = await dbService.getChatMessages(donation.donationId);
          setMessages(list);
        } catch (err) {
          console.warn(err);
        }
      };

      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [donation]);

  // Auto scroll to bottom
  useEffect(() => {
    const chatEnd = document.getElementById('chat-scroll-end');
    chatEnd?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donation || !user || !newMessageText.trim()) return;

    const text = newMessageText.trim();
    setNewMessageText('');

    try {
      await dbService.sendChatMessage(
        donation.donationId,
        user.uid,
        user.fullName,
        text
      );
      const list = await dbService.getChatMessages(donation.donationId);
      setMessages(list);
    } catch (err) {
      console.error(err);
    }
  };
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadDetails() {
      if (!donationId) return;
      try {
        const item = await dbService.getDonation(donationId);
        if (item) {
          setDonation(item);
          // Fetch donor mobile phone number securely
          const donor = await dbService.getUserProfile(item.donorId);
          if (donor) {
            setDonorProfile(donor);
          }
        } else {
          setError(t('donationDetails.errorNotFound'));
        }
      } catch (err) {
        console.error("Could not fetch details", err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [donationId]);

  const handleShare = async () => {
    if (!donation) return;
    const title = `FoodBridge: ${donation.foodName}`;
    const text = `A surplus food listing for "${donation.foodName}" (${donation.quantity}) is listed near ${donation.pickupAddress}.`;
    const url = window.location.href;
    await platformService.shareDonation(title, text, url);
  };

  // Handle donation acceptance (NGO or Volunteer role claims)
  const handleAcceptDonation = async () => {
    if (!donation || !user) return;
    setError('');
    setSuccessMsg('');
    setActionLoading(true);

    try {
      const isNGO = user.role === 'NGO';
      const isVolunteer = user.role === 'Volunteer';

      if (!isNGO && !isVolunteer) {
        setError(t('donationDetails.onlyRegistered'));
        setActionLoading(false);
        return;
      }

      const ngoId = isNGO ? user.uid : null;
      const volunteerId = isVolunteer ? user.uid : null;

      // Update status to "Accepted"
      await dbService.createRequest(donation.donationId, ngoId, volunteerId, 'Accepted');
      
      // Refresh local state to view changes instantly
      const updatedItem = await dbService.getDonation(donation.donationId);
      if (updatedItem) {
        setDonation(updatedItem);
      }

      setSuccessMsg(t('donationDetails.successClaim'));
      void platformService.triggerSuccessHaptic();
      setTimeout(() => {
        // Redirect to their respective dashboards
        if (isNGO) navigate('/');
        if (isVolunteer) navigate('/');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Verification or update error during donation acceptance.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8 min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-500">{t('donationDetails.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div className="flex-1 bg-gray-50 p-8 min-h-screen">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-gray-200 shadow-sm text-center mt-12">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800">{t('donationDetails.errorMismatch')}</h2>
          <p className="text-xs text-slate-500 mt-2">{error || t('donationDetails.errorNotFound')}</p>
          <button 
            onClick={() => navigate('/donations')} 
            className="mt-6 px-4 py-2 bg-slate-900 border border-slate-950 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            {t('donationDetails.goBack')}
          </button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(donation.expiryTime) < new Date();

  return (
    <div className="flex-1 bg-gray-50 p-8" id="donation-details-page">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Banner Top navigation bar - High Contrast Light Mode */}
        <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 text-slate-600 transition-colors"
              id="back-list-btn"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">{t('donationDetails.title')}</h1>
              <span className="text-[10px] text-slate-400 font-mono">{t('donationDetails.refId')} {donation.donationId}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 text-slate-600 transition-colors text-xs font-semibold cursor-pointer"
              title="Share Listing"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('donationDetails.share')}</span>
            </button>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono border ${
              donation.status === 'Available' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
              donation.status === 'Accepted' ? 'bg-blue-50 text-blue-800 border-blue-100' :
              donation.status === 'Collected' ? 'bg-amber-50 text-amber-850 border-amber-100' :
              'bg-gray-50 text-slate-600 border-gray-150'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {t(`status.${donation.status.toLowerCase()}`)}
            </span>
          </div>
        </div>

        {/* Global Action Alerts */}
        {error && (
          <div className="m-6 p-4 bg-rose-50 border border-rose-150 text-rose-800 rounded-2xl flex items-start gap-3 text-xs animate-fade-in" id="details-error">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="m-6 p-4 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-2xl flex items-start gap-3 text-xs animate-fade-in" id="details-success">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
            <p className="font-semibold">{successMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8" id="details-view-layout">
          {/* Left Column: Image Media & Description */}
          <div className="space-y-6">
            <div className="h-64 w-full bg-slate-900 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner shrink-0">
              {donation.imageUrl ? (
                <img 
                  src={donation.imageUrl} 
                  alt={donation.foodName} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="text-center p-6 text-slate-400 font-mono text-xs">
                  <Heart className="w-12 h-12 text-emerald-500 mx-auto mb-2 fill-emerald-50" />
                  <span>{t('donationDetails.noMedia')}</span>
                </div>
              )}
            </div>

            {/* Description Text Box */}
            <div className="bg-gray-50/75 p-6 rounded-2xl border border-gray-200">
              <h3 className="text-xs uppercase font-bold text-slate-400 flex items-center gap-2 mb-3 tracking-wider font-mono">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                {t('donationDetails.instructionsTitle')}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                {donation.description || t('donationDetails.noInstructions')}
              </p>
            </div>
          </div>

          {/* Right Column: Information segments and Claim Buttons */}
          <div className="space-y-6">
            {/* Surplus Food Info Block */}
            <div className="border border-gray-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 font-sans tracking-tight border-b border-gray-100 pb-3 uppercase tracking-wider font-mono">{t('donationDetails.foodDescTitle')}</h3>
              
              <div className="space-y-2.5">
                <div className="flex items-center text-xs">
                  <span className="text-slate-400 font-medium w-24">{t('donationDetails.foodName')}</span>
                  <span className="text-slate-800 font-bold">{donation.foodName}</span>
                </div>
                <div className="flex items-center text-xs">
                  <span className="text-slate-400 font-medium w-24">{t('donationDetails.category')}</span>
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-mono text-[10px] uppercase font-bold border border-slate-200">{t(`categories.${donation.category.toLowerCase()}`, donation.category)}</span>
                </div>
                <div className="flex items-center text-xs">
                  <span className="text-slate-400 font-medium w-24">{t('donationDetails.quantity')}</span>
                  <span className="text-slate-800 font-semibold">{donation.quantity}</span>
                </div>
              </div>
            </div>

            {/* Delivery / Safety Timestamp Block */}
            <div className="border border-gray-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 font-sans tracking-tight border-b border-gray-100 pb-3 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                <Clock className="w-4 h-4 text-amber-500" /> {t('donationDetails.timingTitle')}
              </h3>
              
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center">
                  <span className="text-slate-400 font-medium w-28 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {t('donationDetails.prepared')}
                  </span>
                  <span className="font-semibold text-slate-800">{new Date(donation.preparedTime).toLocaleString()}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-slate-400 font-medium w-28 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {t('donationDetails.expires')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{new Date(donation.expiryTime).toLocaleString()}</span>
                    {isExpired && (
                      <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-mono font-bold border border-rose-100">
                        {t('donationDetails.expired')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Donor & Pickup location Info Blocks */}
            <div className="border border-gray-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 font-sans tracking-tight border-b border-gray-100 pb-3 uppercase tracking-wider font-mono">{t('donationDetails.donorLocTitle')}</h3>
              
              <div className="space-y-3 text-xs text-slate-650">
                <div className="flex items-center">
                  <span className="text-slate-400 font-medium w-24">{t('donationDetails.donorName')}</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {donation.donorName}
                  </span>
                </div>

                {donorProfile?.phone && (
                  <div className="flex items-center">
                    <span className="text-slate-400 font-medium w-24">{t('donationDetails.mobilePhone')}</span>
                    <span className="font-mono text-slate-850 font-bold flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      {donorProfile.phone}
                    </span>
                  </div>
                )}

                <div className="flex items-start">
                  <span className="text-slate-400 font-medium w-24 shrink-0">{t('donationDetails.pickup')}</span>
                  <span className="font-medium text-slate-800 flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    {donation.pickupAddress}
                  </span>
                </div>
              </div>
            </div>

            {/* Coordinate Pickup Messenger */}
            {donorProfile && user && user.uid !== donation.donorId && (
              <div className="border border-gray-205 rounded-2xl p-6 space-y-4 bg-gray-50/50">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono">{t('donationDetails.coordPickupTitle')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* WhatsApp */}
                  {donorProfile.phone && (
                    <a
                      href={`https://wa.me/${donorProfile.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${donation.donorName}, I am ${user.fullName} from FoodBridge. I would like to coordinate the pickup of your food donation "${donation.foodName}" (${donation.quantity}) listed at ${donation.pickupAddress}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-150 rounded-xl text-2xs font-bold transition-all text-center"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {/* SMS */}
                  {donorProfile.phone && (
                    <a
                      href={`sms:${donorProfile.phone.replace(/[^0-9+]/g, '')}?body=${encodeURIComponent(`Hello ${donation.donorName}, I am ${user.fullName} from FoodBridge. I would like to coordinate the pickup of your food listing "${donation.foodName}".`)}`}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-850 border border-amber-150 rounded-xl text-2xs font-bold transition-all text-center"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>SMS</span>
                    </a>
                  )}

                  {/* Email */}
                  {donorProfile.email && (
                    <a
                      href={`mailto:${donorProfile.email}?subject=${encodeURIComponent(`FoodBridge Pickup: ${donation.foodName}`)}&body=${encodeURIComponent(`Hello ${donation.donorName},\n\nI am ${user.fullName} from FoodBridge. I would like to coordinate the pickup of your food donation "${donation.foodName}" (${donation.quantity}).\n\nPickup Address: ${donation.pickupAddress}\n\nBest regards,\n${user.fullName}`)}`}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-750 border border-blue-150 rounded-xl text-2xs font-bold transition-all text-center"
                    >
                      <Mail className="w-4 h-4 shrink-0 text-blue-600" />
                      <span>Email</span>
                    </a>
                  )}

                </div>
              </div>
            )}

            {/* Direct App Coordination Chat */}
            {(donation.status === 'Accepted' || donation.status === 'Collected') && user && (
              <div className="border border-gray-205 rounded-2xl p-6 bg-white shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  {t('donationDetails.chatTitle')}
                </h3>
                
                {/* Scrollable Message history block */}
                <div className="h-60 overflow-y-auto border border-gray-150 rounded-2xl p-4 bg-gray-50/50 space-y-3 flex flex-col" id="chat-messages-container">
                  {messages.length === 0 ? (
                    <div className="text-center text-slate-450 text-2xs py-16 flex-1 flex flex-col justify-center">
                      <span>{t('donationDetails.noMessages1')}</span>
                      <span>{t('donationDetails.noMessages2')}</span>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === user.uid;
                      return (
                        <div key={msg.messageId} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                          {!isMe && (
                            <span className="text-[9px] font-bold text-slate-450 mb-0.5 ml-1">{msg.senderName}</span>
                          )}
                          <div className={`px-3 py-2 rounded-2xl text-xs leading-normal ${
                            isMe 
                              ? 'bg-emerald-600 text-white rounded-tr-none' 
                              : 'bg-slate-200/75 text-slate-850 rounded-tl-none'
                          }`}>
                            {msg.text}
                          </div>
                          <span className="text-[8px] text-slate-450 font-mono mt-0.5 mx-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div id="chat-scroll-end" />
                </div>

                {/* Sending form */}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder={t('donationDetails.typeMessage')}
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-slate-850 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-md shadow-emerald-500/10"
                  >
                    {t('donationDetails.send')}
                  </button>
                </form>
              </div>
            )}

            {/* Action Segment - NGO / Volunteer Accepting Claims */}
            {donation.status === 'Available' && !isExpired && user && (user.role === 'NGO' || user.role === 'Volunteer') && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 space-y-2.5">
                <h4 className="text-xs font-bold uppercase text-emerald-800 tracking-wider">{t('donationDetails.acceptTitle')}</h4>
                <p className="text-2xs text-emerald-600 leading-relaxed mb-3">
                  {t('donationDetails.acceptDesc')}
                </p>
                <button
                  id="btn-accept-donation"
                  onClick={handleAcceptDonation}
                  disabled={actionLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? (
                    <>
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('donationDetails.locking')}</span>
                    </>
                  ) : (
                    <>
                      {user.role === 'NGO' ? <Building className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                      <span>{t('donationDetails.acceptListing')}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Expired Item notification */}
            {isExpired && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center text-rose-800">
                <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2 animate-bounce-slow" />
                <h4 className="text-xs font-bold uppercase tracking-wider">{t('donationDetails.expiredTitle')}</h4>
                <p className="text-2xs text-rose-600 mt-1">{t('donationDetails.expiredDesc')}</p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
