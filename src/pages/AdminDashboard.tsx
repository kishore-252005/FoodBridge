import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { Donation, UserProfile } from '../types';
import { 
  ShieldAlert, 
  Users, 
  Heart, 
  Building, 
  Truck, 
  Loader, 
  Shield, 
  Clock, 
  Calendar,
  Layers,
  MapPin,
  TrendingUp,
  CheckCircle,
  Award,
  PieChart,
  Activity
} from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [usersData, donationsData] = await Promise.all([
          dbService.getAllUsers(),
          dbService.getAllDonations()
        ]);
        setUsers(usersData);
        setDonations(donationsData);
      } catch (err) {
        console.error("Could not fetch admin data", err);
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
          <Loader className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Querying platform general state records...</p>
        </div>
      </div>
    );
  }

  // --- Real-Time Statistics Calculations ---
  const totalUsersCount = users.length;
  const totalDonationsCount = donations.length;
  const totalNgosCount = users.filter(u => u.role === 'NGO').length;
  const totalVolunteersCount = users.filter(u => u.role === 'Volunteer').length;
  const totalDonorsCount = users.filter(u => u.role === 'Donor').length;
  const totalAdminsCount = users.filter(u => u.role === 'Admin').length;

  // Summarized metrics
  const distributedCount = donations.filter(d => d.status === 'Distributed').length;
  const activeCount = donations.filter(d => d.status === 'Available' || d.status === 'Accepted' || d.status === 'Collected').length;
  
  const completionRate = totalDonationsCount > 0 
    ? Math.round((distributedCount / totalDonationsCount) * 100) 
    : 0;

  // Group by status
  const statusCounts = {
    Available: donations.filter(d => d.status === 'Available').length,
    Accepted: donations.filter(d => d.status === 'Accepted').length,
    Collected: donations.filter(d => d.status === 'Collected').length,
    Distributed: donations.filter(d => d.status === 'Distributed').length,
  };

  // Group by Category (top 5)
  const categoryCounts: Record<string, number> = {};
  donations.forEach(d => {
    categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
  });
  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Group by Last 7 Days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const donationsByDate = last7Days.map(date => {
    const count = donations.filter(don => don.createdAt?.startsWith(date)).length;
    const labelDate = new Date(date);
    const label = labelDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { date, label, count };
  });

  const maxCount = Math.max(...donationsByDate.map(d => d.count), 1);
  const chartHeight = 120;
  const chartWidth = 400;
  
  const points = donationsByDate.map((d, index) => {
    const x = 50 + (index * (310 / 6));
    const y = chartHeight - 20 - (d.count / maxCount) * 75;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, 
    ''
  );
  
  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - 18} L ${points[0].x} ${chartHeight - 18} Z`
    : '';

  return (
    <div className="flex-1 bg-gray-50 p-8" id="admin-dashboard-page">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Shield className="w-8 h-8 text-emerald-600" />
            Admin Control Center
          </h1>
          <p className="text-slate-500 mt-1">Real-time statistics, data visualization, and community audit trail.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        {/* Total Users */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 block tracking-wider">Active Members</p>
            <p className="text-3xl font-bold text-slate-900 mt-2" id="admin-count-users">
              {totalUsersCount}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Donations */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 block tracking-wider">Total Listings</p>
            <p className="text-3xl font-bold text-slate-900 mt-2" id="admin-count-donations">
              {totalDonationsCount}
            </p>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Heart className="w-6 h-6 fill-teal-50" />
          </div>
        </div>

        {/* Distribution Completion */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 block tracking-wider">Completion Rate</p>
            <p className="text-3xl font-bold text-emerald-700 mt-2">
              {completionRate}%
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Active Cargo */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-slate-400 block tracking-wider">Active in Transit</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">
              {activeCount}
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Visualizations Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Chart 1: SVG Trend Line Chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase text-slate-800 flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-emerald-600" />
              7-Day Listing Volume Trend
            </h3>
            <p className="text-2xs text-slate-400 mb-4">Total new surplus food listings shared over the last week</p>
          </div>
          
          <div className="w-full overflow-hidden mt-2">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full overflow-visible">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="380" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
              <line x1="40" y1="60" x2="380" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
              <line x1="40" y1="100" x2="380" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3" />
              <line x1="40" y1="102" x2="380" y2="102" stroke="#e2e8f0" strokeWidth="1.5" />

              {/* Area path */}
              {areaD && <path d={areaD} fill="url(#areaGrad)" />}

              {/* Line path */}
              {pathD && <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />}

              {/* Data points */}
              {points.map((p, i) => (
                <g key={i} className="group">
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="4" 
                    fill="#10b981" 
                    stroke="#ffffff" 
                    strokeWidth="1.5" 
                    className="hover:scale-150 transition-all cursor-pointer"
                  />
                  {/* Tooltip value */}
                  <text 
                    x={p.x} 
                    y={p.y - 8} 
                    textAnchor="middle" 
                    className="text-[8px] font-bold fill-slate-700 bg-white"
                  >
                    {p.count}
                  </text>
                  {/* Label Date */}
                  <text 
                    x={p.x} 
                    y={chartHeight - 3} 
                    textAnchor="middle" 
                    className="text-[7px] font-semibold fill-slate-400 font-mono"
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Chart 2: Status breakdown bar chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase text-slate-800 flex items-center gap-2 mb-1">
              <PieChart className="w-4 h-4 text-emerald-600" />
              Status Allocation
            </h3>
            <p className="text-2xs text-slate-400 mb-4">Breakdown of current donation workflow states</p>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {/* Available */}
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span>Available Listings</span>
                <span>{statusCounts.Available}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalDonationsCount > 0 ? (statusCounts.Available / totalDonationsCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Accepted */}
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span>Accepted Claims</span>
                <span>{statusCounts.Accepted}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalDonationsCount > 0 ? (statusCounts.Accepted / totalDonationsCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Collected */}
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span>Collected in Transit</span>
                <span>{statusCounts.Collected}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalDonationsCount > 0 ? (statusCounts.Collected / totalDonationsCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Distributed */}
            <div>
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                <span>Fully Distributed</span>
                <span>{statusCounts.Distributed}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalDonationsCount > 0 ? (statusCounts.Distributed / totalDonationsCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User list table (2/3 col span) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-2" id="user-audit-log-panel">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" /> Platform User Auditing Logs
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-slate-400 font-bold uppercase">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6">Role Package</th>
                    <th className="py-4 px-6">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-slate-650">
                  {users.map((profile) => (
                    <tr key={profile.uid} className="hover:bg-gray-55/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-800">{profile.fullName}</td>
                      <td className="py-4 px-6 font-mono text-[11px] text-slate-500">{profile.email}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border ${
                          profile.role === 'Donor' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                          profile.role === 'NGO' ? 'bg-blue-50 text-blue-800 border-blue-100' :
                          profile.role === 'Volunteer' ? 'bg-amber-50 text-amber-800 border-amber-100' :
                          'bg-rose-50 text-rose-800 border-rose-100'
                        }`}>
                          {profile.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-32">{profile.area}, {profile.city}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Side Panel: Demographics & Top Categories */}
        <div className="space-y-8">
          
          {/* User Demographics Breakdown */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6" id="demographics-pie-chart">
            <h2 className="text-sm font-bold uppercase text-slate-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-1.5 font-medium">
              <Layers className="w-4 h-4 text-emerald-600" />
              User Demographics
            </h2>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Donors (Surplus Handlers)</span>
                <span className="font-bold text-slate-850 font-mono bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-lg">{totalDonorsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">NGO Partners</span>
                <span className="font-bold text-slate-850 font-mono bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-lg">{totalNgosCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Logistics Volunteers</span>
                <span className="font-bold text-slate-850 font-mono bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-lg">{totalVolunteersCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">System Administrators</span>
                <span className="font-bold text-slate-850 font-mono bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-lg">{totalAdminsCount}</span>
              </div>
            </div>
          </div>

          {/* Top Food Categories */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-bold uppercase text-slate-800 border-b border-gray-100 pb-3 mb-4 flex items-center gap-1.5 font-medium">
              <Award className="w-4 h-4 text-emerald-600" />
              Top Categories
            </h2>
            
            {sortedCategories.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No categories data available.</p>
            ) : (
              <div className="space-y-4 pt-1">
                {sortedCategories.map(([category, count]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-2xs font-bold text-slate-600">
                      <span>{category}</span>
                      <span>{count} listings</span>
                    </div>
                    <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden border border-slate-100">
                      <div 
                        className="bg-teal-500 h-full rounded-full" 
                        style={{ width: `${totalDonationsCount > 0 ? (count / totalDonationsCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
