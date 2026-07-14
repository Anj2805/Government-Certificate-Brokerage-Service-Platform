import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { Activity, BarChart2, Star, Calendar } from 'lucide-react';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const response = await adminApi.getAnalytics({ days });
        if (response.data) {
          setAnalytics(response.data);
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || 'An error occurred');
        console.error("Failed to load admin analytics", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [days]);

  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-8">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight">
              Platform Analytics
            </h1>
            <p className="text-[14.5px] text-gray-500 font-semibold mt-0.5">
              Deep dive into requests, services, and operational health.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600">Time Range:</span>
            <select 
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-[#13448a] outline-none"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center w-full">
            <div className="h-10 w-10 border-4 border-[#13448a] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Request Status Breakdown */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-[16px] font-extrabold text-[#0f294a] flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Request Status Breakdown
                </h3>
              </div>
              <div className="space-y-4">
                {analytics?.requestsByStatus?.map((statusData, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-gray-50 bg-gray-50 rounded-xl hover:border-blue-100 transition-colors">
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">{statusData._id}</span>
                    <span className="text-lg font-extrabold text-blue-700">{statusData.count}</span>
                  </div>
                ))}
                {!analytics?.requestsByStatus?.length && (
                  <p className="text-gray-500 text-sm font-medium">No requests in this period.</p>
                )}
              </div>
            </div>

            {/* Popular Services */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-[16px] font-extrabold text-[#0f294a] flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  Most Requested Services
                </h3>
              </div>
              <div className="space-y-4">
                {analytics?.popularServices?.map((service, i) => (
                  <div key={i} className="flex flex-col gap-2 p-3 border border-gray-50 bg-gray-50 rounded-xl hover:border-amber-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700">{service.name}</span>
                      <span className="text-sm font-extrabold text-amber-700">{service.count} requests</span>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-amber-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (service.count / (analytics.popularServices[0]?.count || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {!analytics?.popularServices?.length && (
                  <p className="text-gray-500 text-sm font-medium">No services requested in this period.</p>
                )}
              </div>
            </div>

            {/* Daily Requests Activity */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                <h3 className="text-[16px] font-extrabold text-[#0f294a] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Daily Activity
                </h3>
              </div>
              
              <div className="h-64 flex items-end gap-2 px-2">
                {analytics?.requestsOverTime?.map((day, i) => {
                  const maxCount = Math.max(...analytics.requestsOverTime.map(d => d.count), 1);
                  const heightPercentage = Math.max(5, (day.count / maxCount) * 100);
                  
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-xs font-bold py-1 px-2 rounded-md transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {day._id}: {day.count}
                      </div>
                      
                      {/* Bar */}
                      <div 
                        className="w-full bg-emerald-100 group-hover:bg-emerald-400 rounded-t-sm transition-colors border-b-2 border-emerald-500" 
                        style={{ height: `${heightPercentage}%` }}
                      ></div>
                      
                      {/* Label for sparse graphs */}
                      {analytics.requestsOverTime.length <= 15 && (
                        <span className="text-[10px] text-gray-400 mt-2 rotate-45 transform origin-top-left font-semibold">
                          {new Date(day._id).getDate()}/{new Date(day._id).getMonth()+1}
                        </span>
                      )}
                    </div>
                  );
                })}
                {!analytics?.requestsOverTime?.length && (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-500 text-sm font-medium">No daily activity data available for this period.</p>
                  </div>
                )}
              </div>
              <div className="mt-8 flex justify-between border-t border-gray-100 pt-4">
                <span className="text-xs font-bold text-gray-400">Start of Period</span>
                <span className="text-xs font-bold text-gray-400">Today</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
