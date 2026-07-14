import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { PATHS } from '../../config/paths';
import { serviceApi } from '../../api/serviceApi';

export default function Services() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState(5000);
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [services, setServices] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchServices = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await serviceApi.listServices({
        page: currentPage,
        limit: 9,
        search: searchQuery || undefined,
        maxFee: priceRange,
        timeFilters: selectedTimes.length > 0 ? selectedTimes.join(',') : undefined
      });
      setServices(response.data.services);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.total);
    } catch (err) {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchServices();
    }, searchQuery ? 300 : 0);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, currentPage, priceRange, selectedTimes]);

  // Time filter criteria handler
  const handleTimeChange = (timeRange) => {
    setSelectedTimes((prev) => 
      prev.includes(timeRange)
        ? prev.filter((t) => t !== timeRange)
        : [...prev, timeRange]
    );
    setCurrentPage(1);
  };

  // Filter logic applied client-side on the retrieved page for processing time and fee range
  // Client-side filter removed as it broke pagination. We now pass filters directly to the backend API.
  const displayedServices = services;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#111827]">


      <main className="flex-1 max-w-[1240px] w-full mx-auto px-6 py-12">
        
        {/* Page Title & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0f294a]">Service Catalog</h1>
            <p className="text-[14px] text-gray-500 font-medium mt-1">
              Browse and apply for official government certificates and licenses.
            </p>
          </div>
          
          {/* Live Search Input */}
          <div className="relative w-full md:w-[360px]">
            <input
              type="text"
              placeholder="Search services, categories..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full h-11 pl-10 pr-4 text-[14px] font-medium bg-white rounded-lg border border-[#cbd5e1] focus:border-[#13448a] focus:ring-1 focus:ring-[#13448a] outline-none transition-all shadow-sm"
            />
            <svg className="absolute left-3.5 top-3.5 h-5 w-5 text-[#94a3b8]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Column (Sidebar Filters) */}
          <aside className="w-full lg:w-[280px] shrink-0 space-y-6">
            
            {/* Filter Panel Container */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
              <h2 className="text-[15px] font-extrabold text-[#0f294a] pb-4 border-b border-gray-100 flex items-center gap-2">
                <svg className="h-5 w-5 text-[#13448a]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filters
              </h2>

              {/* Processing Time Filter */}
              <div className="mt-5">
                <h3 className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-3">Processing Time</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2.5 text-[14px] font-semibold text-[#4b5563] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTimes.includes('7d')}
                      onChange={() => handleTimeChange('7d')}
                      className="h-4 w-4 rounded border-[#cbd5e1] text-[#13448a] focus:ring-[#13448a]"
                    />
                    Within 7 Days
                  </label>
                  <label className="flex items-center gap-2.5 text-[14px] font-semibold text-[#4b5563] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTimes.includes('1-2w')}
                      onChange={() => handleTimeChange('1-2w')}
                      className="h-4 w-4 rounded border-[#cbd5e1] text-[#13448a] focus:ring-[#13448a]"
                    />
                    1-2 Weeks
                  </label>
                  <label className="flex items-center gap-2.5 text-[14px] font-semibold text-[#4b5563] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTimes.includes('2-4w')}
                      onChange={() => handleTimeChange('2-4w')}
                      className="h-4 w-4 rounded border-[#cbd5e1] text-[#13448a] focus:ring-[#13448a]"
                    />
                    2-4 Weeks
                  </label>
                  <label className="flex items-center gap-2.5 text-[14px] font-semibold text-[#4b5563] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTimes.includes('1m+')}
                      onChange={() => handleTimeChange('1m+')}
                      className="h-4 w-4 rounded border-[#cbd5e1] text-[#13448a] focus:ring-[#13448a]"
                    />
                    Above 1 Month
                  </label>
                </div>
              </div>

              {/* Service Charge Filter */}
              <div className="mt-8">
                <h3 className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-4">Service Charge</h3>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="50"
                  value={priceRange}
                  onChange={(e) => { setPriceRange(Number(e.target.value)); setCurrentPage(1); }}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#13448a]"
                />
                <div className="flex justify-between text-[12px] font-bold text-gray-500 mt-2">
                  <span>₹0</span>
                  <span className="text-[#13448a]">Max: ₹{priceRange}</span>
                  <span>₹5,000+</span>
                </div>
              </div>
            </div>

            {/* Need Help Blue Box Card */}
            <div className="bg-[#0c316a] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
              {/* Subtle background graphics */}
              <div className="absolute right-[-10px] bottom-[-10px] w-28 h-28 bg-white/5 rounded-full pointer-events-none" />
              
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <svg className="h-5 w-5 text-[#f58220]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <h3 className="text-[16px] font-extrabold text-white mt-4">Need Help?</h3>
              <p className="text-[12px] text-gray-200 mt-2 leading-relaxed font-medium">
                Confused about which document to apply for? Our AI assistant can help you find the right service.
              </p>
              <button className="mt-5 h-10 w-full rounded-lg border border-white/20 hover:border-white bg-white/10 hover:bg-white/20 text-[13px] font-bold text-white transition-all transform active:scale-[0.98]">
                Start Guide
              </button>
            </div>
          </aside>

          {/* Right Column (Services Grid) */}
          <div className="flex-1 w-full space-y-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
                <div className="h-10 w-10 border-4 border-[#13448a] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-[14.5px] text-gray-500 font-bold">Loading services catalog...</p>
              </div>
            ) : isError ? (
              <div className="bg-[#f0f4fa]/30 border border-red-100 rounded-2xl p-16 text-center shadow-sm relative overflow-hidden flex flex-col items-center justify-center min-h-[350px]">
                <div className="h-20 w-20 mx-auto rounded-3xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shadow-sm transform -rotate-3 transition-transform hover:rotate-0 mb-6 relative z-10">
                  <svg className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="text-[22px] font-extrabold text-[#0f294a] tracking-tight relative z-10">Failed to Load Services</h3>
                <p className="text-[14.5px] text-gray-500 font-medium mt-2 max-w-sm mx-auto relative z-10">
                  We encountered an issue while retrieving the service catalog. Please try again.
                </p>
                <button
                  onClick={fetchServices}
                  className="mt-8 h-12 px-8 rounded-xl bg-[#13448a] hover:bg-[#0c316a] text-[14px] font-extrabold text-white shadow-md shadow-[#13448a]/20 transition-all hover:-translate-y-0.5 relative z-10 flex items-center justify-center gap-2"
                >
                  Retry Loading
                </button>
              </div>
            ) : displayedServices.length === 0 ? (
              <div className="bg-gray-50/30 border border-[#dbeafe] rounded-2xl p-16 text-center shadow-sm relative overflow-hidden flex flex-col items-center justify-center min-h-[350px]">
                <div className="h-20 w-20 mx-auto rounded-3xl bg-blue-50 text-[#13448a] flex items-center justify-center border border-blue-100 shadow-sm transform -rotate-3 transition-transform hover:rotate-0 mb-6 relative z-10">
                  <svg className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3 className="text-[20px] font-extrabold text-[#0f294a] tracking-tight relative z-10">No Services Found</h3>
                <p className="text-[14.5px] text-gray-500 font-medium mt-2 max-w-sm mx-auto relative z-10">
                  We couldn't find any services matching your search or filter settings.
                </p>
                {(searchTerm || priceRange < 5000) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setPriceRange(5000);
                      setCurrentPage(1);
                    }}
                    className="mt-6 text-[13.5px] font-bold text-[#13448a] hover:text-[#0c316a] hover:underline relative z-10"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedServices.map((service) => (
                  <article key={service._id} className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      {/* Category Badge */}
                      <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#eff6ff] text-[#1e40af] capitalize">
                        {service.category}
                      </span>
                      
                      {/* Title */}
                      <h3 
                        onClick={() => navigate(PATHS.SERVICE_DETAILS.replace(':id', service._id))}
                        className="text-[17px] font-extrabold text-[#0f294a] mt-3.5 hover:text-[#13448a] cursor-pointer transition-colors leading-snug"
                      >
                        {service.name}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-[13px] text-gray-500 font-medium mt-2 leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-50">
                      {/* Meta Row (Processing Time & Cost) */}
                      <div className="flex gap-2">
                        <div className="flex items-center justify-center gap-1.5 bg-[#f8fafc] border border-gray-100 rounded-lg py-2 px-1 flex-1 text-[11px] font-bold text-gray-700">
                          <svg className="h-3.5 w-3.5 text-[#f58220] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {service.estimatedProcessingDays} Days
                        </div>
                        <div className="flex items-center justify-center gap-1.5 bg-[#f8fafc] border border-gray-100 rounded-lg py-2 px-1 flex-1 text-[11px] font-bold text-gray-700">
                          <svg className="h-3.5 w-3.5 text-[#10b981] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
                            <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
                            <path d="M18 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4v-6z" />
                          </svg>
                          {service.serviceCharge === 0 ? 'Free' : `₹${service.serviceCharge.toFixed(2)}`}
                        </div>
                      </div>

                      {/* View Details Button */}
                      <button 
                        onClick={() => navigate(PATHS.SERVICE_DETAILS.replace(':id', service._id))}
                        className="mt-4 h-11 w-full rounded-lg border border-gray-200 hover:border-[#13448a] bg-white hover:bg-[#13448a] text-[13px] font-bold text-gray-800 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        View Details
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {!isLoading && !isError && totalPages > 1 && (
              <div className="flex flex-col items-center gap-3 pt-6">
                <div className="flex items-center gap-1.5" role="navigation" aria-label="Pagination">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-all"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-9 w-9 flex items-center justify-center rounded-lg font-bold text-[14px] transition-all ${
                        currentPage === page
                          ? 'bg-[#0c316a] text-white'
                          : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none transition-all"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
                <p className="text-[12.5px] italic font-semibold text-gray-400">
                  Showing {(currentPage - 1) * 9 + 1} - {Math.min(currentPage * 9, totalItems)} of {totalItems} available services
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Can't Find Service Helpline Banner */}
        <section className="mt-16 bg-[#f0f4fa] border-l-4 border-[#f58220] rounded-r-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div>
            <h2 className="text-[17px] font-extrabold text-[#0f294a]">
              Can't find the service you're looking for?
            </h2>
            <p className="text-[13.5px] text-gray-500 font-semibold mt-1 max-w-[700px] leading-relaxed">
              Some regional services might be listed under local department portals. Try our advanced department search or contact support.
            </p>
          </div>
          <button className="h-11 px-6 rounded-lg bg-[#0c316a] hover:bg-[#08224b] text-[13.5px] font-bold text-white transition-all transform active:scale-[0.98] shrink-0">
            Contact Helpline
          </button>
        </section>
      </main>

    </div>
  );
}
