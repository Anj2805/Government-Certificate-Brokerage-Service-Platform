import { toast } from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { brandAssets } from '../../config/brandAssets';
import { PATHS } from '../../config/paths';
import { serviceApi } from '../../api/serviceApi';
import { useAuth } from '../../hooks/useAuth';
const steps = [
  {
    number: '01',
    title: 'Select Service',
    description: 'Browse the configured service catalog and choose the service you need.',
    icon: 'cursor',
  },
  {
    number: '02',
    title: 'Upload Documents',
    description: 'Upload required documents through the platform document workflow.',
    icon: 'upload',
  },
  {
    number: '03',
    title: 'Agent Assistance',
    description: 'A service agent can be assigned to review and process your request.',
    icon: 'user',
  },
  {
    number: '04',
    title: 'Track Status',
    description: 'Track status updates from your citizen dashboard.',
    icon: 'pulse',
  },
];

const services = [
  ['Income Certificate', 'Official document certifying the annual income of an individual or family.', 'document'],
  ['Birth Certificate', 'Vital record documenting the birth of a child, required for legal identity.', 'verified'],
  ['Caste Certificate', 'Proof of belonging to a specific caste for constitutional benefits.', 'users'],
  ['Domicile Certificate', 'Certificate of residency in a particular state or union territory.', 'home'],
  ['PAN Service', 'New Permanent Account Number (PAN) application or correction services.', 'card'],
  ['Aadhaar Service', 'Biometric ID updates, link services, and new enrolment assistance.', 'finger'],
];

const benefits = [
  ['Agent Workflow', 'Requests can be routed to active service agents for review.', 'shield'],
  ['Transparent Pricing', 'Fixed service charges with zero hidden fees or middleman commissions.', 'bolt'],
  ['Doorstep Assistance', 'Premium on-demand support for physical verification at your location.', 'pin'],
  ['Status Tracking', 'Follow request progress from submission to completion.', 'clock'],
];

function Icon({ name, className = 'h-6 w-6' }) {
  const common = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
  };

  const paths = {
    cursor: <path d="m5 4 13 8-6 2-2 6-5-16Z" />,
    upload: <path d="M12 16V5m0 0 4 4m-4-4-4 4M5 19h14" />,
    user: <path d="M16 19a4 4 0 0 0-8 0M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 1h-4m2-2v4" />,
    pulse: <path d="M3 12h4l3-7 4 14 3-7h4" />,
    document: <path d="M7 3h7l4 4v14H7V3Zm7 0v5h5M10 14h4M10 17h6" />,
    verified: <path d="M12 3 5 6v5c0 4.5 2.9 8.5 7 10 4.1-1.5 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-5" />,
    users: <path d="M16 20a4 4 0 0 0-8 0M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 8a3 3 0 0 0-3-3M17 8a2 2 0 0 1 0 4" />,
    home: <path d="m4 11 8-7 8 7v9H6v-9m4 9v-6h4v6" />,
    card: <path d="M4 6h16v12H4V6Zm0 4h16M8 14h4" />,
    finger: <path d="M12 11v4m0-8a4 4 0 0 1 4 4v2m-8 0v-2a4 4 0 0 1 4-4m-7 8v-4a7 7 0 0 1 14 0v1m-3 7v-3m-8 3v-2" />,
    shield: <path d="M12 3 5 6v5c0 4.5 2.9 8.5 7 10 4.1-1.5 7-5.5 7-10V6l-7-3Zm0 6v4" />,
    bolt: <path d="m13 2-8 12h6l-1 8 8-12h-6l1-8Z" />,
    pin: <path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Zm0-8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
    clock: <path d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function StepCard({ step }) {
  return (
    <article className="relative min-h-[262px] rounded-md border border-[#d9dee8] bg-white px-8 pb-8 pt-10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <div className="absolute -left-4 -top-4 grid h-9 w-9 place-items-center rounded-full bg-[#f58220] text-[12px] font-extrabold text-black">
        {step.number}
      </div>
      <div className="mx-auto grid h-[58px] w-[58px] place-items-center rounded-full bg-[#edf4ff] text-[#073b78]">
        <Icon name={step.icon} />
      </div>
      <h3 className="mt-7 text-[17px] font-bold text-[#111827]">{step.title}</h3>
      <p className="mx-auto mt-4 max-w-[210px] text-[14px] font-medium leading-relaxed text-[#4b5563]">{step.description}</p>
    </article>
  );
}

function ServiceCard({ service }) {
  const [title, description, icon, id] = service;

  return (
    <article className="rounded-md border border-[#d9dee8] bg-white p-6 shadow-sm">
      <div className="flex items-start gap-5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-[#f7f9fc] text-[#073b78]">
          <Icon name={icon} className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-[#111827]">{title}</h3>
          <p className="mt-5 min-h-[42px] text-[14px] font-medium leading-relaxed text-[#4b5563]">{description}</p>
        </div>
      </div>
      <div className="mt-7 flex items-center justify-between">
        <span className="rounded-full border border-[#d9dee8] bg-[#f7f9fc] px-3 py-1 text-[12px] font-semibold text-[#4b5563]">
          Service
        </span>
        <Link 
          to={id ? PATHS.SERVICE_DETAILS.replace(':id', id) : PATHS.SERVICES} 
          className="text-[14px] font-bold text-[#073b78] no-underline hover:text-[#13448a] transition-colors"
        >
          View Details ↗
        </Link>
      </div>
    </article>
  );
}

function BenefitItem({ item }) {
  const [title, description, icon] = item;
  
  // Dynamic icon box color theme matching the mockup
  const isBlue = icon === 'shield' || icon === 'clock';
  const iconClass = isBlue 
    ? 'bg-[#e8efff] text-[#0066cc] border border-[#d2e2fc]' 
    : 'bg-[#fff7ed] text-[#ea580c] border border-[#ffedd5]';

  return (
    <div className="flex gap-4">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-sm ${iconClass}`}>
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-[16px] font-bold text-[#0f294a]">{title}</h3>
        <p className="mt-1 max-w-[220px] text-[14px] font-medium leading-relaxed text-[#4b5563]">{description}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isBootstrapping } = useAuth();
  
  const [dbServices, setDbServices] = useState([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);

  // Filtered services for autocomplete
  const autocompleteResults = dbServices.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase().trim()))
  ).slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Check for exact match in results
    const exactMatch = autocompleteResults.find(s => s.name.toLowerCase() === query.toLowerCase());
    if (exactMatch) {
      handleSelectService(exactMatch);
    } else {
      navigate(`${PATHS.SERVICES}?search=${encodeURIComponent(query)}`);
    }
  };

  const handleSelectService = (service) => {
    setShowAutocomplete(false);
    setSearchQuery(service.name);
    
    if (user?.role === 'citizen') {
      navigate(`${PATHS.CITIZEN_CREATE_REQUEST}?serviceId=${service._id}`);
    } else {
      navigate(PATHS.SERVICE_DETAILS.replace(':id', service._id));
    }
  };

  const handleKeyDown = (e) => {
    if (!showAutocomplete || autocompleteResults.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < autocompleteResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0) {
        e.preventDefault();
        handleSelectService(autocompleteResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
      setSelectedIndex(-1);
    }
  };

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash.replace('#', ''));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [hash]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await serviceApi.listServices({ limit: 50 });
        if (response?.data?.services) {
          setDbServices(response.data.services);
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || 'An error occurred');
        console.error("Failed to fetch services for homepage:", error);
      }
    };
    fetchServices();
  }, []);

  const popularServices = services.map(s => {
    const dbMatch = dbServices.find(db => db.name === s[0]);
    return [...s, dbMatch?._id];
  });

  return (
    <div className="bg-white text-[#111827]">
      <section
        className="relative bg-[#eef4ff] bg-cover bg-right md:bg-[length:auto_100%] lg:bg-cover bg-no-repeat overflow-hidden pt-12 pb-20 md:pt-16 md:pb-20"
        style={{ backgroundImage: `url(${brandAssets.banner})` }}
      >
        {/* Subtle background graphics decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(225,236,255,0.4),transparent_60%)] pointer-events-none" />

        <div className="mx-auto max-w-[1390px] px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            {/* Left Content Column */}
            <div className="w-full md:w-[55%] text-left">
              {/* Pill Tag */}
              <div className="inline-flex items-center gap-2 rounded-full bg-[#e8efff]/90 border border-[#d2e2fc] px-4 py-1.5 text-[12px] font-bold text-[#0066cc] backdrop-blur-sm">
                <span className="text-[14px]">🇮🇳</span>
                Service Assistance Portal
              </div>
              
              {/* Heading */}
              <h1 className="mt-6 text-[42px] md:text-[56px] font-extrabold leading-[1.05] tracking-[-0.02em] text-[#0f294a]">
                Seamless Access to <span className="text-[#f58220]">Government Services</span>
              </h1>
              
              {/* Subheading */}
              <p className="mt-6 text-[18px] md:text-[20px] font-medium leading-relaxed text-[#4b5563] max-w-[620px]">
                Empowering citizens with a digital gateway for document requests and assisted service workflows.
              </p>

              {/* Search Bar */}
              <div className="relative mt-8" ref={searchRef}>
                <form 
                  onSubmit={handleSearchSubmit}
                  className="flex w-full max-w-[580px] rounded-xl border border-[#cbd5e1] bg-white p-2 shadow-md focus-within:border-[#f58220] transition-colors" 
                  role="search"
                >
                  <label htmlFor="service-search" className="sr-only">
                    Search service
                  </label>
                  <div className="flex flex-1 items-center gap-3 px-3">
                    <svg className="h-5 w-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      id="service-search"
                      type="search"
                      placeholder="Search for Income, Birth, or Caste certificates..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowAutocomplete(true);
                        setSelectedIndex(-1);
                      }}
                      onFocus={() => {
                        if (searchQuery.trim()) setShowAutocomplete(true);
                      }}
                      onKeyDown={handleKeyDown}
                      className="w-full border-0 bg-transparent text-[16px] font-medium text-[#111827] outline-none placeholder:text-[#94a3b8]"
                      autoComplete="off"
                    />
                  </div>
                  <button type="submit" className="rounded-lg bg-[#f58220] px-6 py-3.5 text-[15px] font-bold text-white hover:bg-[#e07216] transition-colors shadow-sm shrink-0">
                    Search Service
                  </button>
                </form>

                {/* Autocomplete Dropdown */}
                {showAutocomplete && searchQuery.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-2 max-w-[580px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                    {autocompleteResults.length > 0 ? (
                      <ul className="py-2" role="listbox">
                        {autocompleteResults.map((service, index) => (
                          <li 
                            key={service._id}
                            role="option"
                            aria-selected={index === selectedIndex}
                            className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                            onClick={() => handleSelectService(service)}
                            onMouseEnter={() => setSelectedIndex(index)}
                          >
                            <div className="flex flex-col">
                              <span className="text-[14.5px] font-bold text-gray-900">{service.name}</span>
                              {service.category && (
                                <span className="text-[12px] font-medium text-gray-500">{service.category}</span>
                              )}
                            </div>
                            {(service.processingTimeDays || service.fee) && (
                              <div className="flex flex-col items-end gap-0.5 shrink-0">
                                {service.processingTimeDays && (
                                  <span className="text-[11px] font-bold text-[#0066cc] bg-[#e8efff] px-2 py-0.5 rounded-full">
                                    {service.processingTimeDays} Days
                                  </span>
                                )}
                                {service.fee !== undefined && (
                                  <span className="text-[11px] font-bold text-gray-500">
                                    ₹{service.fee}
                                  </span>
                                )}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-4 text-center">
                        <p className="text-[14px] font-medium text-gray-500">No services found matching "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stats pills */}
              <div className="mt-10 flex flex-wrap gap-4">
                {/* Stat 1 */}
                <div className="flex items-center gap-3 rounded-2xl bg-[#e8efff]/90 px-5 py-3 border border-[#d2e2fc] shadow-sm backdrop-blur-sm">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d2e2fc] text-[#0066cc] shrink-0">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[18px] font-extrabold text-[#0066cc]">2M+</div>
                    <div className="text-[13px] font-bold text-[#4b5563]">Citizens Served</div>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="flex items-center gap-3 rounded-2xl bg-[#e6f4ea]/90 px-5 py-3 border border-[#ceead6] shadow-sm backdrop-blur-sm">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ceead6] text-[#137333] shrink-0">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[18px] font-extrabold text-[#137333]">50K+</div>
                    <div className="text-[13px] font-bold text-[#4b5563]">Verified Agents</div>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="flex items-center gap-3 rounded-2xl bg-[#e8efff]/90 px-5 py-3 border border-[#d2e2fc] shadow-sm backdrop-blur-sm">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d2e2fc] text-[#0066cc] shrink-0">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2a2.5 2.5 0 002.5-2.5V8a2 2 0 00-2-2h-.5A2 2 0 0112 4V3.5A2.5 2.5 0 009.5 1h-1A2.5 2.5 0 006 3.5v.435" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[18px] font-extrabold text-[#0066cc]">PAN India</div>
                    <div className="text-[13px] font-bold text-[#4b5563]">Coverage</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Spacer to display background image illustration */}
            <div className="hidden md:block w-[45%] h-[480px]" />
          </div>

          {/* Bottom Feature Cards Row */}
          <div className="mt-14 rounded-2xl bg-white p-6 md:p-8 shadow-lg border border-[#e2e8f0]">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Feature 1 */}
              <div className="flex gap-4 items-start border-b border-gray-100 pb-4 sm:border-0 sm:pb-0">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8efff] text-[#0066cc] shrink-0 shadow-sm border border-[#d2e2fc]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[16px] font-bold text-[#0f294a]">Agent Workflow</h4>
                  <p className="mt-1 text-[14px] font-medium leading-relaxed text-[#4b5563]">Requests can be assigned to active service agents.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-4 items-start border-b border-gray-100 pb-4 sm:border-0 sm:pb-0">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8efff] text-[#0066cc] shrink-0 shadow-sm border border-[#d2e2fc]">
                  <span className="text-[15px] font-extrabold">₹</span>
                </div>
                <div>
                  <h4 className="text-[16px] font-bold text-[#0f294a]">Transparent Pricing</h4>
                  <p className="mt-1 text-[14px] font-medium leading-relaxed text-[#4b5563]">Fixed service charges with zero hidden fees or commissions.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-4 items-start border-b border-gray-100 pb-4 sm:border-0 sm:pb-0">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8efff] text-[#0066cc] shrink-0 shadow-sm border border-[#d2e2fc]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[16px] font-bold text-[#0f294a]">Status Tracking</h4>
                  <p className="mt-1 text-[14px] font-medium leading-relaxed text-[#4b5563]">View request status history from your dashboard.</p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex gap-4 items-start">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8efff] text-[#0066cc] shrink-0 shadow-sm border border-[#d2e2fc]">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[16px] font-bold text-[#0f294a]">Document Workflow</h4>
                  <p className="mt-1 text-[14px] font-medium leading-relaxed text-[#4b5563]">Upload required files and add documents when a request allows it.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-b border-[#e5e7eb] bg-[#f7f8fa] px-6 py-24">
        <div className="mx-auto max-w-[1178px]">
          <div className="text-center">
            <h2 className="text-[30px] font-extrabold text-[#073b78]">How SevaSetu Works</h2>
            <p className="mx-auto mt-5 max-w-[585px] text-[15px] font-medium leading-relaxed text-[#374151]">
              Our platform streamlines the complex government bureaucracy into four simple, transparent steps that save you time and effort.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <StepCard key={step.title} step={step} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-[1178px]">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-[32px] font-extrabold text-[#073b78]">Popular Services</h2>
              <p className="mt-5 max-w-[510px] text-[15px] font-medium leading-relaxed text-[#374151]">
                Quick access to commonly requested documents and certificate services.
              </p>
            </div>
            <Link
              to={PATHS.SERVICES}
              className="hidden rounded border border-[#073b78] px-5 py-3 text-[12px] font-bold text-[#073b78] no-underline md:inline-flex"
            >
              View All Services
            </Link>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {popularServices.map((service) => (
              <ServiceCard key={service[0]} service={service} />
            ))}
          </div>
        </div>
      </section>

      <section id="benefits" className="bg-white border-y border-[#e5e7eb] px-6 py-24">
        <div className="mx-auto grid max-w-[1178px] gap-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <h2 className="text-[32px] font-extrabold text-[#0f294a]">Why Use SevaSetu?</h2>
            <div className="w-12 h-1 bg-[#f58220] mt-3 mb-6" />
            <p className="max-w-[495px] text-[15px] font-medium leading-relaxed text-[#4b5563]">
              SevaSetu brings service discovery, document upload, and request tracking into one citizen workflow.
            </p>
            <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
              {benefits.map((item) => (
                <BenefitItem key={item[0]} item={item} />
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[555px]">
            <article className="overflow-hidden rounded-2xl border border-[#cbd5e1] bg-white shadow-xl">
              <img src={brandAssets.banner2} alt="Digital infrastructure operations centre" className="h-[340px] w-full object-cover" />
              <div className="p-8">
                <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#94a3b8]">Platform Workflow</p>
                <h3 className="mt-4 text-[22px] font-extrabold text-[#0f294a]">Citizen Service Hub</h3>
                <p className="mt-4 text-[15px] font-medium leading-relaxed text-[#4b5563]">
                  The portal connects service catalog browsing, document uploads, and request tracking through authenticated citizen accounts.
                </p>
                <div className="mt-8 flex gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cbd5e1] px-4 py-1.5 text-[12px] font-bold text-[#4b5563] bg-[#f8fafc]">
                    <svg className="h-3.5 w-3.5 text-[#137333]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Authenticated Access
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cbd5e1] px-4 py-1.5 text-[12px] font-bold text-[#4b5563] bg-[#f8fafc]">
                    <svg className="h-3.5 w-3.5 text-[#137333]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Request Tracking
                  </span>
                </div>
              </div>
            </article>
            <div className="absolute -bottom-6 -right-6 rounded-2xl bg-[#0f294a] px-6 py-5 text-center text-white shadow-xl border border-[#1e3a63]">
              <p className="text-[32px] font-extrabold leading-none text-[#f58220]">99.8%</p>
              <p className="mt-2 text-[12px] font-bold uppercase tracking-[0.16em] text-white/80">Workflow</p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="border-b border-[#e5e7eb] bg-[#f7f8fa] px-6 py-24">
        <div className="mx-auto max-w-[800px]">
          <div className="text-center mb-12">
            <h2 className="text-[32px] font-extrabold text-[#0f294a]">Frequently Asked Questions</h2>
            <p className="mt-4 text-[15px] font-medium text-[#4b5563]">Find quick answers to common questions about SevaSetu.</p>
          </div>
          <div className="space-y-4">
            <details className="group rounded-lg bg-white p-6 shadow-sm border border-[#e5e7eb] [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-gray-900">
                <h2 className="font-bold text-[16px]">What is SevaSetu?</h2>
                <span className="shrink-0 rounded-full bg-[#f8fafc] border border-gray-100 p-1.5 text-gray-900 sm:p-2">
                  <svg className="h-5 w-5 shrink-0 transition duration-300 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 leading-relaxed text-gray-600 text-[14.5px]">SevaSetu is a service assistance portal for discovering services, submitting documents, and tracking citizen requests.</p>
            </details>
            <details className="group rounded-lg bg-white p-6 shadow-sm border border-[#e5e7eb] [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-gray-900">
                <h2 className="font-bold text-[16px]">How do I track my request?</h2>
                <span className="shrink-0 rounded-full bg-[#f8fafc] border border-gray-100 p-1.5 text-gray-900 sm:p-2">
                  <svg className="h-5 w-5 shrink-0 transition duration-300 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 leading-relaxed text-gray-600 text-[14.5px]">Once you submit a request, you can log in to your Citizen Dashboard and review status updates in My Requests.</p>
            </details>
            <details className="group rounded-lg bg-white p-6 shadow-sm border border-[#e5e7eb] [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-gray-900">
                <h2 className="font-bold text-[16px]">Is there a fee for processing?</h2>
                <span className="shrink-0 rounded-full bg-[#f8fafc] border border-gray-100 p-1.5 text-gray-900 sm:p-2">
                  <svg className="h-5 w-5 shrink-0 transition duration-300 group-open:-rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 leading-relaxed text-gray-600 text-[14.5px]">Yes, each certificate type has a fixed, transparent service charge. The fee is displayed upfront before you submit your request. There are no hidden fees.</p>
            </details>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-[1178px] rounded-md bg-[#153f70] px-6 py-20 text-center text-white shadow-[0_28px_45px_rgba(0,0,0,0.25)] min-h-[300px] flex flex-col justify-center">
          {isBootstrapping ? (
            <div className="animate-pulse">
              <div className="h-10 w-64 bg-white/10 rounded mx-auto mb-6"></div>
              <div className="h-4 w-96 bg-white/10 rounded mx-auto mb-9"></div>
              <div className="h-12 w-48 bg-white/10 rounded mx-auto"></div>
            </div>
          ) : isAuthenticated && user ? (
            <>
              {user.role === 'citizen' ? (
                <>
                  <h2 className="text-[44px] font-extrabold leading-tight">Continue Managing Your Services</h2>
                  <p className="mx-auto mt-6 max-w-[570px] text-[16px] font-medium leading-relaxed text-white">
                    Access your citizen dashboard to track existing requests or discover new services in the catalog.
                  </p>
                  <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
                    <Link to={PATHS.SERVICES} className="rounded-md bg-[#f58220] px-11 py-4 text-[15px] font-extrabold text-black no-underline transition-transform hover:-translate-y-0.5">
                      Browse Services
                    </Link>
                    <Link to={PATHS.CITIZEN_REQUESTS} className="rounded-md bg-white px-11 py-4 text-[15px] font-bold text-black no-underline transition-transform hover:-translate-y-0.5">
                      View My Requests
                    </Link>
                  </div>
                </>
              ) : user.role === 'agent' ? (
                <>
                  <h2 className="text-[44px] font-extrabold leading-tight">Continue Managing Assigned Requests</h2>
                  <p className="mx-auto mt-6 max-w-[570px] text-[16px] font-medium leading-relaxed text-white">
                    Access your agent dashboard to process document verifications and manage citizen service requests.
                  </p>
                  <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
                    <Link to={PATHS.AGENT_ASSIGNED_REQUESTS} className="rounded-md bg-[#f58220] px-11 py-4 text-[15px] font-extrabold text-black no-underline transition-transform hover:-translate-y-0.5">
                      View Assigned Requests
                    </Link>
                    <Link to={PATHS.AGENT_DASHBOARD} className="rounded-md bg-white px-11 py-4 text-[15px] font-bold text-black no-underline transition-transform hover:-translate-y-0.5">
                      Open Dashboard
                    </Link>
                  </div>
                </>
              ) : user.role === 'admin' ? (
                <>
                  <h2 className="text-[44px] font-extrabold leading-tight">Continue Managing SevaSetu</h2>
                  <p className="mx-auto mt-6 max-w-[570px] text-[16px] font-medium leading-relaxed text-white">
                    Access the administrative console to manage services, system agents, and oversee platform requests.
                  </p>
                  <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
                    <Link to={PATHS.ADMIN_DASHBOARD} className="rounded-md bg-[#f58220] px-11 py-4 text-[15px] font-extrabold text-black no-underline transition-transform hover:-translate-y-0.5">
                      Open Admin Dashboard
                    </Link>
                    <Link to={PATHS.ADMIN_SERVICES} className="rounded-md bg-white px-11 py-4 text-[15px] font-bold text-black no-underline transition-transform hover:-translate-y-0.5">
                      Manage Services
                    </Link>
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <>
              <h2 className="text-[44px] font-extrabold leading-tight">Ready to Get Started?</h2>
              <p className="mx-auto mt-6 max-w-[570px] text-[16px] font-medium leading-relaxed text-white">
                Register to browse available services, upload documents, and track your requests.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
                <Link to={PATHS.REGISTER} className="rounded-md bg-[#f58220] px-11 py-4 text-[15px] font-extrabold text-black no-underline transition-transform hover:-translate-y-0.5">
                  Create Free Account
                </Link>
                <Link to={PATHS.LOGIN} className="rounded-md bg-white px-11 py-4 text-[15px] font-bold text-black no-underline transition-transform hover:-translate-y-0.5">
                  Login to Portal
                </Link>
              </div>
              <p className="mt-7 text-[13px] italic text-white/75">* Service availability and processing depend on configured catalog rules.</p>
            </>
          )}
        </div>
      </section>

    </div>
  );
}
