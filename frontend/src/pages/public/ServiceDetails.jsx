import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

import { PATHS } from '../../config/paths';
import { serviceApi } from '../../api/serviceApi';
import { useAuth } from '../../hooks/useAuth';

// Helpful general FAQs for fallback/placeholder
const DEFAULT_FAQS = [
  { q: 'What is the validity of the certificate?', a: 'Most certificates issued through SevaSetu have life-long validity or are valid for one financial year, depending on the department rules.' },
  { q: 'Can I apply for multiple family members?', a: 'Yes, separate applications must be submitted for each family member who requires a certificate.' },
  { q: 'Will I need to visit the government office physically?', a: 'No physical visit is necessary. The assigned agent will handle all verification and submission processes on your behalf.' },
  { q: 'Is there a refund if my application is rejected?', a: 'The service fee covers processing costs, so it is non-refundable. However, our agents will guide you to ensure all documents are correct before submission.' },
];

export default function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const [service, setService] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);

  // Accordion active index state
  const [activeFaq, setActiveFaq] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const fetchServiceDetails = async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorStatus(null);
    try {
      const data = await serviceApi.getServiceDetails(id);
      setService(data);
    } catch (err) {
      setIsError(true);
      if (err.response && err.response.status) {
        setErrorStatus(err.response.status);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceDetails();
  }, [id]);

  const handleCreateRequest = () => {
    if (!service) return;

    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (role !== 'citizen') {
      alert("Only citizens can create service requests. Please log in as a citizen.");
      return;
    }

    navigate(PATHS.CITIZEN_CREATE_REQUEST, { state: { serviceId: service._id } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#111827]">
        <main className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="h-10 w-10 border-4 border-[#13448a] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[14.5px] text-gray-500 font-bold">Loading service details...</p>
        </main>
      </div>
    );
  }

  if (isError) {
    const is404 = errorStatus === 404;
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#111827]">
        <main className="flex-1 max-w-[600px] w-full mx-auto px-6 py-20 text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-red-50 text-red-550 flex items-center justify-center border-2 border-red-200">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-[22px] font-extrabold text-gray-900 mt-6">
            {is404 ? 'Service Not Found' : 'Failed to Load Service Details'}
          </h1>
          <p className="text-[14px] text-gray-500 font-semibold mt-2">
            {is404 
              ? 'The requested government service catalog item does not exist or has been removed.' 
              : 'An error occurred while fetching the service catalog details. Please try again.'}
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => navigate(PATHS.SERVICES)}
              className="h-11 px-5 rounded-lg border border-gray-200 hover:bg-gray-50 text-[13.5px] font-bold text-gray-700 transition-colors"
            >
              Back to Catalog
            </button>
            {!is404 && (
              <button
                onClick={fetchServiceDetails}
                className="h-11 px-5 rounded-lg bg-[#13448a] hover:bg-[#0c316a] text-[13.5px] font-bold text-white shadow-md transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Map real MongoDB fields to view data
  const title = service.name;
  const description = service.description || "No description provided.";
  const serviceChargeFormatted = service.serviceCharge === 0 ? 'Free' : `₹${service.serviceCharge.toFixed(2)}`;
  const estimatedTimeFormatted = `${service.estimatedProcessingDays} Working Days`;
  const badge1 = 'Verified Agent Processing';
  const badge2 = service.serviceCharge === 0 ? 'Free Scheme' : 'One-Time Charge';

  const documents = (service.requiredDocuments || []).map((docName, idx) => {
    const icons = ['user', 'pin', 'document', 'wallet'];
    const icon = icons[idx % icons.length];
    return {
      title: docName,
      desc: `Please upload a scanned copy of your ${docName}.`,
      icon,
    };
  });

  const faqs = DEFAULT_FAQS;

  const details = {
    title,
    description,
    serviceCharge: serviceChargeFormatted,
    estimatedTime: estimatedTimeFormatted,
    badge1,
    badge2,
    documents,
    faqs,
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#111827]">

      {/* Top Breadcrumb Bar */}
      <div className="bg-white border-b border-[#e2e8f0] py-3.5 px-6">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between">
          <nav className="flex items-center gap-2 text-[14px] font-semibold text-gray-500">
            <Link to={PATHS.SERVICES} className="hover:text-[#13448a] flex items-center gap-1.5 no-underline text-gray-500">
              Services
            </Link>
            <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-[#0f294a] font-extrabold">{details.title}</span>
          </nav>

          <span className="flex items-center gap-1.5 rounded-full bg-[#f3f4f6] border border-[#e2e8f0] px-3 py-1 text-[12px] font-bold text-[#374151]">
            <svg style={{ width: '16px', height: '16px' }} className="h-4 w-4 text-[#13448a]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Official Service
          </span>
        </div>
      </div>

      {/* Main Body */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-6 py-10">
        
        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          
          {/* Left Column (Service Info & Details) */}
          <section className="flex-1 space-y-10 w-full" aria-labelledby="service-title">
            
            {/* Header info */}
            <div>
              <h1 id="service-title" className="text-[32px] font-extrabold text-[#0f294a] tracking-tight leading-tight">
                {details.title}
              </h1>
              <p className="text-[15px] text-gray-500 font-medium mt-3.5 leading-relaxed">
                {details.description}
              </p>

              {/* Verified badges */}
              <div className="flex flex-wrap gap-3 mt-5">
                <div className="flex items-center gap-1.5 rounded-full bg-[#eff6ff] border border-[#dbeafe] px-3.5 py-1 text-[12px] font-bold text-[#1e40af]">
                  <svg style={{ width: '16px', height: '16px' }} className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {details.badge1}
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-[#fff7ed] border border-[#ffedd5] px-3.5 py-1 text-[12px] font-bold text-[#c2410c]">
                  <svg style={{ width: '16px', height: '16px' }} className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                    <polyline points="12 12 12 16" />
                  </svg>
                  {details.badge2}
                </div>
              </div>
            </div>

            {/* Required Documents Section */}
            <div>
              <h2 className="text-[20px] font-extrabold text-[#0f294a] flex items-center gap-3.5 pl-4 border-l-4 border-[#f58220]">
                Required Documents
              </h2>
              
              <div className="grid gap-5 sm:grid-cols-2 mt-6">
                {details.documents.map((doc, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm flex gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-[#eff6ff] flex items-center justify-center text-[#1e40af]">
                      {doc.icon === 'user' && (
                        <svg style={{ width: '20px', height: '20px' }} className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                        </svg>
                      )}
                      {doc.icon === 'pin' && (
                        <svg style={{ width: '20px', height: '20px' }} className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      )}
                      {doc.icon === 'document' && (
                        <svg style={{ width: '20px', height: '20px' }} className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      )}
                      {doc.icon === 'wallet' && (
                        <svg style={{ width: '20px', height: '20px' }} className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                          <line x1="12" y1="4" x2="12" y2="20" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="text-[14.5px] font-bold text-gray-800">{doc.title}</h3>
                      <p className="text-[13px] text-gray-500 font-semibold mt-1 leading-relaxed">{doc.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* All Documents Scanning Bar */}
              <div className="mt-5 rounded-xl border border-dashed border-[#cbd5e1] bg-gray-50/50 p-4.5 text-center text-[12.5px] font-bold text-gray-500">
                All documents should be scanned in color and clearly legible in <span className="text-gray-700">PDF or JPEG</span> format (Max 2MB per file).
              </div>
            </div>

            {/* FAQs Section */}
            <div>
              <h2 className="text-[20px] font-extrabold text-[#0f294a] flex items-center gap-3.5 pl-4 border-l-4 border-[#f58220]">
                Frequently Asked Questions
              </h2>

              <div className="bg-white rounded-xl border border-[#e2e8f0] divide-y divide-[#e2e8f0] shadow-sm mt-6">
                {details.faqs.map((faq, idx) => {
                  const isOpen = activeFaq === idx;
                  return (
                    <div key={idx} className="w-full">
                      <button
                        type="button"
                        onClick={() => setActiveFaq(isOpen ? -1 : idx)}
                        className="w-full px-6 py-4.5 flex items-center justify-between text-left font-bold text-[14.5px] text-gray-800 hover:bg-gray-50/50 transition-colors"
                      >
                        <span>{faq.q}</span>
                        <svg style={{ width: '20px', height: '20px' }} className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      
                      {isOpen && (
                        <div className="px-6 pb-5 text-[13.5px] text-gray-500 font-semibold leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Official Disclaimer Box */}
              <div className="mt-6 rounded-xl bg-[#f0f4fa] p-5 shadow-sm flex gap-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-[#1e40af]/10 flex items-center justify-center text-[#1e40af]">
                  <svg style={{ width: '20px', height: '20px' }} className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[14.5px] font-bold text-[#1e40af] flex items-center gap-1.5">Official Disclaimer</h4>
                  <p className="text-[13px] text-gray-500 font-semibold mt-1.5 leading-relaxed">
                    The final authority for the issuance of the certificate rests with the Tehsildar/Sub-Divisional Magistrate. SevaSetu facilitates the application and verification through verified agents to ensure high success rates and timely processing. False information provided in the application may lead to legal action under the relevant sections of the Indian Penal Code.
                  </p>
                </div>
              </div>
            </div>

          </section>

          {/* Right Column (Sidebar Card Summary) */}
          <aside className="w-full lg:w-[360px] shrink-0 space-y-6">
            
            {/* Service Summary Card */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
              <h3 className="text-[16px] font-extrabold text-[#0f294a] pb-4.5 border-b border-gray-100">
                Service Summary
              </h3>

              <div className="mt-5 space-y-4">
                <div className="flex justify-between items-center text-[14px]">
                  <span className="font-semibold text-gray-500">Service Charge</span>
                  <span className="font-extrabold text-[#13448a] text-[16px]">{details.serviceCharge}</span>
                </div>
                
                <div className="flex justify-between items-center text-[14px]">
                  <span className="font-semibold text-gray-500">Estimated Time</span>
                  <span className="font-extrabold text-gray-700">{details.estimatedTime}</span>
                </div>
              </div>

              {/* Alert inside summary */}
              <div className="mt-5 flex gap-2.5 rounded-xl bg-gray-50 p-4 border border-[#e2e8f0] text-[12px] font-bold text-gray-500 leading-normal">
                <svg style={{ width: '20px', height: '20px' }} className="h-5 w-5 text-[#13448a] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Processing time may vary based on document verification by the local tehsildar office.
              </div>

              {/* CTA Action Button */}
              <button
                type="button"
                onClick={handleCreateRequest}
                className="mt-6 h-12 w-full rounded-lg bg-[#13448a] hover:bg-[#0c316a] text-[14px] font-bold text-white shadow-md transition-colors flex items-center justify-center transform active:scale-[0.98]"
              >
                Create Request
              </button>

              <div className="mt-3.5 text-center text-[10px] font-bold text-gray-400 tracking-wider">
                SECURE GOVERNMENT CHANNEL
              </div>
            </div>

            {/* Muted Govt Logos row */}
            <div className="flex items-center justify-between gap-4 py-3 px-4 border border-[#e2e8f0] rounded-xl bg-white/50 opacity-80 hover:opacity-100 transition-opacity">
              {/* Digital India Logo */}
              <svg style={{ width: '100px', height: '28px' }} viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <circle cx="16" cy="16" r="12" fill="url(#paint0_linear_di)" />
                <path d="M12 16C12 13.7909 13.7909 12 16 12C18.2091 12 20 13.7909 20 16" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <path d="M16 20C18.2091 20 20 18.2091 20 16" stroke="#f58220" strokeWidth="2" strokeLinecap="round" />
                <text x="34" y="15" fill="#0f294a" fontSize="10.5" fontWeight="bold" fontFamily="sans-serif">Digital India</text>
                <text x="34" y="23" fill="#64748b" fontSize="6.5" fontWeight="semibold" fontFamily="sans-serif">Power To Empower</text>
                <defs>
                  <linearGradient id="paint0_linear_di" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#13448a" />
                    <stop offset="1" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
              </svg>

              {/* NeGD Logo */}
              <svg style={{ width: '90px', height: '28px' }} viewBox="0 0 110 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <circle cx="16" cy="16" r="12" stroke="#e2e8f0" strokeWidth="1" />
                <circle cx="16" cy="16" r="9" fill="url(#paint0_linear_negd)" />
                <path d="M12 14L16 18L20 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <text x="34" y="15" fill="#0f294a" fontSize="10.5" fontWeight="bold" fontFamily="sans-serif">NeGD</text>
                <text x="34" y="23" fill="#f58220" fontSize="7" fontWeight="bold" fontFamily="sans-serif">e-Governance</text>
                <defs>
                  <linearGradient id="paint0_linear_negd" x1="7" y1="7" x2="25" y2="25" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f58220" />
                    <stop offset="1" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
              </svg>

              {/* NIC Logo */}
              <svg style={{ width: '85px', height: '28px' }} viewBox="0 0 100 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <rect x="6" y="6" width="20" height="20" rx="4" fill="url(#paint0_linear_nic)" />
                <path d="M12 16L15 13L18 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12 19L15 16L18 19" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <text x="34" y="15" fill="#0f294a" fontSize="10.5" fontWeight="bold" fontFamily="sans-serif">NIC</text>
                <text x="34" y="23" fill="#64748b" fontSize="6.5" fontWeight="semibold" fontFamily="sans-serif">Gov Informatics</text>
                <defs>
                  <linearGradient id="paint0_linear_nic" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0f172a" />
                    <stop offset="1" stopColor="#334155" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Guaranteed Service Quality Checkmarks */}
            <div className="space-y-3.5 pt-2">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Guaranteed Service Quality
              </h4>

              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-[13.5px] font-bold text-gray-700">
                  <svg style={{ width: '20px', height: '20px' }} className="h-5 w-5 text-[#10b981] shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  End-to-end encryption
                </div>
                <div className="flex items-center gap-2.5 text-[13.5px] font-bold text-gray-700">
                  <svg style={{ width: '20px', height: '20px' }} className="h-5 w-5 text-[#10b981] shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Verified professional agents
                </div>
                <div className="flex items-center gap-2.5 text-[13.5px] font-bold text-gray-700">
                  <svg style={{ width: '20px', height: '20px' }} className="h-5 w-5 text-[#10b981] shrink-0" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Real-time status tracking
                </div>
              </div>
            </div>

          </aside>

        </div>

      </main>

      {/* Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-blue-50 text-brand-700 flex items-center justify-center mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Authentication Required</h3>
              <p className="text-[14px] text-gray-500 font-medium leading-relaxed mb-6">
                To create a certificate request, please log in with your citizen account first. If you don't have an account, you can register for free.
              </p>
              <div className="flex flex-col gap-2.5 w-full">
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    navigate(PATHS.LOGIN, { 
                      state: { 
                        from: { 
                          pathname: PATHS.CITIZEN_CREATE_REQUEST, 
                          state: { serviceId: service._id } 
                        } 
                      } 
                    });
                  }}
                  className="w-full py-2.5 px-4 bg-brand-900 text-white font-bold text-[14px] rounded-lg hover:bg-brand-800 transition-colors focus:outline-none"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    navigate(PATHS.REGISTER);
                  }}
                  className="w-full py-2.5 px-4 bg-white border border-gray-300 text-gray-700 font-bold text-[14px] rounded-lg hover:bg-gray-50 transition-colors focus:outline-none"
                >
                  Register
                </button>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full py-2 px-4 text-gray-500 hover:text-gray-700 font-bold text-[13px] transition-colors focus:outline-none"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
