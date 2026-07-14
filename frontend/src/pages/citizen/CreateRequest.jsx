import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { serviceApi } from '../../api/serviceApi';
import { documentApi } from '../../api/documentApi';
import { requestApi } from '../../api/requestApi';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function CreateRequest() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(location.state?.serviceId || "");
  const [service, setService] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploadingStatus, setUploadingStatus] = useState({});
  const [requestId, setRequestId] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState({
    alternateMobile: "",
    houseNumber: "",
    street: user?.address || "",
    landmark: "",
    village: user?.city || "",
    district: user?.city || "",
    state: user?.state || "",
    pinCode: user?.postalCode || "",
    addressType: "Home",
    deliveryInstructions: ""
  });
  const [deliveryDeclarationAccepted, setDeliveryDeclarationAccepted] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadInitialData = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const listResponse = await serviceApi.listServices({ limit: 100 });
      const servicesList = listResponse.data.services || [];
      setServices(servicesList);
      
      let targetId = selectedServiceId;
      if (!targetId && servicesList.length > 0) {
        targetId = servicesList[0]._id;
      }
      setSelectedServiceId(targetId);
      if (targetId) {
        const details = await serviceApi.getServiceDetails(targetId);
        setService(details);
      }
    } catch (err) {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleUpload = async (docName, file) => {
    setUploadingStatus(prev => ({ ...prev, [docName]: true }));
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', docName);
      
      const doc = await documentApi.uploadDocument(formData);
      setUploadedFiles(prev => ({
        ...prev,
        [docName]: doc,
      }));
      toast.success(`${docName} uploaded successfully`);
    } catch (err) {
      toast.error(`Failed to upload ${docName}: ${err.response?.data?.message || err.message}`);
    } finally {
      setUploadingStatus(prev => ({ ...prev, [docName]: false }));
    }
  };

  const handleConfirmStep1 = () => {
    setCurrentStep(2);
  };

  const handleConfirmStep2 = () => {
    const required = service?.requiredDocuments || [];
    const missing = required.filter(docName => !uploadedFiles[docName]);
    if (missing.length > 0) {
      toast.error("Please upload all the required documents before proceeding.");
      return;
    }
    setCurrentStep(3);
  };

  const handleConfirmStep3 = () => {
    const { street, village, district, state, pinCode } = deliveryAddress;
    if (!street || !village || !district || !state || !pinCode) {
      toast.error("Please fill in all required delivery address fields.");
      return;
    }
    setCurrentStep(4);
  };

  const handleConfirmStep4 = async () => {
    if (service?.serviceCharge > 0 && !deliveryDeclarationAccepted) {
      toast.error("You must accept the secure delivery declaration to proceed.");
      return;
    }
    
    setSubmitting(true);
    let requestDoc = null;
    try {
      const docIds = Object.values(uploadedFiles).map(doc => doc._id);
      const payload = {
        serviceId: service._id,
        documents: docIds,
        status: 'draft',
        notes: notes || undefined,
        applicationData: {},
        deliveryAddress: deliveryAddress,
        deliveryDeclarationAccepted: deliveryDeclarationAccepted,
      };

      requestDoc = await requestApi.createRequest(payload);
    } catch (err) {
      toast.error(`Failed to create request draft: ${err.response?.data?.message || err.message}`);
      setSubmitting(false);
      return;
    }

    try {
      const submitPayload = { 
        reason: 'Initial application submission',
        deliveryDeclarationAccepted
      };
      
      const submittedDoc = await requestApi.submitRequest(requestDoc._id, submitPayload);
      setRequestId(submittedDoc.requestNumber || submittedDoc._id);
      setCurrentStep(5);
      toast.success('Request submitted successfully');
    } catch (err) {
      toast.error(`Draft created successfully with ID: ${requestDoc.requestNumber || requestDoc._id}, but submission failed. You can manage and submit this draft later from My Requests. Error: ${err.response?.data?.message || err.message}`, { duration: 6000 });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen text-[#111827] bg-[#f8fafc]">
        <div className="max-w-[1024px] w-full mx-auto px-6 py-20 flex-1 flex flex-col items-center justify-center">
          <div className="h-10 w-10 border-4 border-[#13448a] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[14.5px] text-gray-500 font-bold">Loading application wizard...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col min-h-screen text-[#111827] bg-[#f8fafc]">
        <div className="max-w-[600px] w-full mx-auto px-6 py-20 flex-1 text-center">
          <div className="h-20 w-20 mx-auto rounded-3xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100 shadow-sm transform -rotate-3 transition-transform hover:rotate-0">
            <svg className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-[24px] font-extrabold text-[#0f294a] mt-6 tracking-tight">Failed to Load Application Wizard</h1>
          <p className="text-[14.5px] text-gray-500 font-medium mt-2 max-w-sm mx-auto">
            We encountered an issue while loading the service catalog options. Please try again.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => navigate(PATHS.SERVICES)}
              className="h-11 px-6 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-[13.5px] font-bold text-gray-700 transition-all"
            >
              Back to Catalog
            </button>
            <button
              onClick={loadInitialData}
              className="h-11 px-6 rounded-lg bg-[#13448a] hover:bg-[#0c316a] text-[13.5px] font-bold text-white shadow-md shadow-[#13448a]/20 transition-all hover:-translate-y-0.5"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[720px] w-full mx-auto px-4 py-8">
        
        {/* Title Header */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight">
            Create Service Request
          </h1>
          <p className="text-[14.5px] text-gray-500 font-semibold mt-1">
            Follow the guided steps to submit your application for government services.
          </p>
        </div>

        {/* Guided Wizard Steps Progress Bar */}
        <div className="mb-12 max-w-[600px] mx-auto">
          <div className="flex items-center justify-between relative">
            
            {/* Background line connecting steps */}
            <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-gray-200 -translate-y-1/2 z-0 rounded-full"></div>
            
            {/* Step 1 */}
            <div className="flex flex-col items-center z-10 bg-[#f8fafc] px-3 transition-transform hover:scale-105">
              <div style={{ width: '40px', height: '40px' }} className={`rounded-2xl flex items-center justify-center text-[15px] font-extrabold transition-all duration-300 shadow-sm ${
                currentStep === 1 
                  ? 'bg-white text-[#f58220] border-2 border-[#f58220] shadow-[#f58220]/20' 
                  : currentStep > 1 
                    ? 'bg-[#10b981] border-2 border-[#10b981] text-white shadow-[#10b981]/20' 
                    : 'bg-white border-2 border-gray-200 text-gray-400'
              }`}>
                {currentStep > 1 ? "✓" : "1"}
              </div>
              <span className={`text-[12.5px] font-extrabold mt-3 tracking-wide transition-colors ${currentStep === 1 ? 'text-[#f58220]' : currentStep > 1 ? 'text-[#10b981]' : 'text-gray-400'}`}>
                Select Service
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center z-10 bg-[#f8fafc] px-3 transition-transform hover:scale-105">
              <div style={{ width: '40px', height: '40px' }} className={`rounded-2xl flex items-center justify-center text-[15px] font-extrabold transition-all duration-300 shadow-sm ${
                currentStep === 2 
                  ? 'bg-white text-[#f58220] border-2 border-[#f58220] shadow-[#f58220]/20' 
                  : currentStep > 2 
                    ? 'bg-[#10b981] border-2 border-[#10b981] text-white shadow-[#10b981]/20' 
                    : 'bg-white border-2 border-gray-200 text-gray-400'
              }`}>
                {currentStep > 2 ? "✓" : "2"}
              </div>
              <span className={`text-[12.5px] font-extrabold mt-3 tracking-wide transition-colors ${currentStep === 2 ? 'text-[#f58220]' : currentStep > 2 ? 'text-[#10b981]' : 'text-gray-400'}`}>
                Documents
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center z-10 bg-[#f8fafc] px-3 transition-transform hover:scale-105">
              <div style={{ width: '40px', height: '40px' }} className={`rounded-2xl flex items-center justify-center text-[15px] font-extrabold transition-all duration-300 shadow-sm ${
                currentStep === 3 
                  ? 'bg-white text-[#f58220] border-2 border-[#f58220] shadow-[#f58220]/20' 
                  : currentStep > 3 
                    ? 'bg-[#10b981] border-2 border-[#10b981] text-white shadow-[#10b981]/20' 
                    : 'bg-white border-2 border-gray-200 text-gray-400'
              }`}>
                {currentStep > 3 ? "✓" : "3"}
              </div>
              <span className={`text-[12.5px] font-extrabold mt-3 tracking-wide transition-colors ${currentStep === 3 ? 'text-[#f58220]' : currentStep > 3 ? 'text-[#10b981]' : 'text-gray-400'}`}>
                Delivery
              </span>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center z-10 bg-[#f8fafc] px-3 transition-transform hover:scale-105">
              <div style={{ width: '40px', height: '40px' }} className={`rounded-2xl flex items-center justify-center text-[15px] font-extrabold transition-all duration-300 shadow-sm ${
                currentStep === 4 
                  ? 'bg-white text-[#f58220] border-2 border-[#f58220] shadow-[#f58220]/20' 
                  : currentStep > 4
                    ? 'bg-[#10b981] border-2 border-[#10b981] text-white shadow-[#10b981]/20'
                    : 'bg-white border-2 border-gray-200 text-gray-400'
              }`}>
                {currentStep > 4 ? "✓" : "4"}
              </div>
              <span className={`text-[12.5px] font-extrabold mt-3 tracking-wide transition-colors ${currentStep === 4 ? 'text-[#f58220]' : currentStep > 4 ? 'text-[#10b981]' : 'text-gray-400'}`}>
                Review
              </span>
            </div>

          </div>
        </div>

        {/* Dynamic Wizard Steps Content */}
        <div className="max-w-[600px] mx-auto">
          
          {/* STEP 1: Confirm/Select Service */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-[18px] font-extrabold text-gray-800">Step 1: Confirm Service Selection</h2>
                <p className="text-[13.5px] text-gray-500 font-semibold mt-1">You have selected the following service. Please confirm to proceed with document submission.</p>
              </div>
 
              {/* Service Details Card */}
              <div className="bg-[#f0f4fa]/50 border border-[#dbeafe] rounded-2xl p-7 space-y-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                {/* Decorative subtle background gradient blob */}
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-blue-100 blur-3xl opacity-50"></div>
                
                {/* Header title */}
                <div className="flex items-center gap-5 relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-[#13448a] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#13448a]/20">
                    <svg style={{ width: '26px', height: '26px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-[20px] font-extrabold text-[#0f294a] leading-tight truncate">{service.name}</h3>
                      <select
                        value={selectedServiceId}
                        onChange={async (e) => {
                          const newId = e.target.value;
                          setSelectedServiceId(newId);
                          setIsLoading(true);
                          try {
                            const details = await serviceApi.getServiceDetails(newId);
                            setService(details);
                          } catch (err) {
                            toast.error("Failed to load service details.");
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        className="text-[12px] font-bold text-[#13448a] bg-white border border-[#cbd5e1] px-3 py-1.5 rounded-lg outline-none focus:ring-2 focus:ring-[#13448a]/20 focus:border-[#13448a] hover:border-[#13448a] cursor-pointer transition-colors shadow-sm"
                      >
                        {services.map(s => (
                          <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <span className="text-[12.5px] font-extrabold text-[#f58220] block mt-1.5 uppercase tracking-wider">{service.category}</span>
                  </div>
                </div>
 
                {/* Inner white cards */}
                <div className="grid gap-4 sm:grid-cols-2 relative z-10">
                  <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm hover:border-[#13448a]/30 transition-colors">
                    <div className="flex items-center gap-2 text-[11.5px] font-extrabold text-gray-500 uppercase tracking-widest mb-1">
                      <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Processing Time
                    </div>
                    <span className="text-[18px] font-extrabold text-[#0f294a] block">{service.estimatedProcessingDays} Working Days</span>
                  </div>
                  <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm hover:border-[#13448a]/30 transition-colors">
                    <div className="flex items-center gap-2 text-[11.5px] font-extrabold text-gray-500 uppercase tracking-widest mb-1">
                      <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                      </svg>
                      Service Fee
                    </div>
                    <span className="text-[18px] font-extrabold text-[#0f294a] block">
                      {service.serviceCharge === 0 ? "Free" : `₹${service.serviceCharge.toFixed(2)}`}
                    </span>
                  </div>
                </div>
 
                {/* Alert Info box */}
                <div className="flex gap-3 rounded-xl bg-blue-50/50 p-4.5 border border-blue-100 text-[13px] font-semibold text-[#13448a] leading-relaxed relative z-10">
                  <svg style={{ width: '20px', height: '20px' }} className="shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  {service.description || "Apply for this service using the configured document submission workflow."}
                </div>
 
              </div>
 
              {/* Navigation button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleConfirmStep1}
                  className="h-12 px-7 rounded-xl bg-[#13448a] hover:bg-[#0c316a] text-[14px] font-extrabold text-white shadow-md shadow-[#13448a]/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  Confirm & Continue
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
 
          {/* STEP 2: Upload Documents */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-[18px] font-extrabold text-gray-800">Step 2: Upload Documents</h2>
                <p className="text-[13.5px] text-gray-500 font-semibold mt-1">Please upload a scanned copy of the required documents (Max 5MB per file, PDF, PNG, or JPEG format).</p>
              </div>
 
              <div className="space-y-4">
                {(service.requiredDocuments || []).map((docName, idx) => {
                  const doc = uploadedFiles[docName];
                  const isUploading = uploadingStatus[docName];
                  return (
                    <div key={idx} className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <h4 className="text-[14.5px] font-extrabold text-gray-850 flex items-center gap-2">
                          {docName}
                          <span className="text-red-500 font-bold">*</span>
                        </h4>
                        <p className="text-[12.5px] text-gray-500 font-medium leading-relaxed">
                          Please provide a clear scanned copy of your {docName} for verification.
                        </p>
                      </div>
 
                      <div className="shrink-0 flex items-center gap-3">
                        {isUploading ? (
                          <div className="flex items-center gap-2 bg-blue-50/50 text-[#13448a] border border-blue-100 px-4 py-2 rounded-lg text-[13px] font-extrabold shadow-sm">
                            <div className="h-4 w-4 border-2 border-[#13448a] border-t-transparent rounded-full animate-spin"></div>
                            <span>Uploading...</span>
                          </div>
                        ) : doc ? (
                          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg text-[13px] font-extrabold shadow-sm">
                            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span className="max-w-[130px] truncate">{doc.originalName}</span>
                            <button
                              onClick={() => setUploadedFiles(prev => {
                                const copy = { ...prev };
                                delete copy[docName];
                                return copy;
                              })}
                              className="text-emerald-800 hover:text-red-600 font-extrabold ml-2 p-1 rounded hover:bg-emerald-100 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="h-10 px-5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 hover:border-[#13448a] text-[13px] font-extrabold text-gray-700 hover:text-[#13448a] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Upload File
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/jpg,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleUpload(docName, e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
 
              {/* Navigation buttons */}
              <div className="pt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="h-12 px-7 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-[14px] font-extrabold text-gray-700 transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStep2}
                  className="h-12 px-7 rounded-xl bg-[#13448a] hover:bg-[#0c316a] text-[14px] font-extrabold text-white shadow-md shadow-[#13448a]/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  Continue to Review
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
 
          {/* STEP 3: Secure Document Delivery Address */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-[18px] font-extrabold text-gray-800">Step 3: Secure Document Delivery Address</h2>
                <p className="text-[13.5px] text-gray-500 font-semibold mt-1">Please provide the address where the document will be securely delivered.</p>
              </div>
              <div className="bg-[#f0f4fa]/50 border border-[#dbeafe] rounded-2xl p-7 space-y-6 shadow-sm relative overflow-hidden">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[11.5px] font-extrabold text-gray-400 uppercase tracking-widest block mb-2">Recipient Name</label>
                    <input type="text" value={`${user.firstName} ${user.lastName}`} disabled className="w-full p-3 text-[13.5px] font-semibold bg-gray-100 rounded-xl border border-gray-200 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-extrabold text-gray-400 uppercase tracking-widest block mb-2">Mobile Number</label>
                    <input type="text" value={user.phone} disabled className="w-full p-3 text-[13.5px] font-semibold bg-gray-100 rounded-xl border border-gray-200 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-extrabold text-gray-400 uppercase tracking-widest block mb-2">Alternate Mobile (Optional)</label>
                    <input type="text" value={deliveryAddress.alternateMobile} onChange={e => setDeliveryAddress({...deliveryAddress, alternateMobile: e.target.value})} className="w-full p-3 text-[13.5px] font-semibold bg-white rounded-xl border border-[#cbd5e1] focus:border-[#13448a] outline-none" />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-extrabold text-gray-400 uppercase tracking-widest block mb-2">Street / Road / Area*</label>
                    <input type="text" value={deliveryAddress.street} disabled className="w-full p-3 text-[13.5px] font-semibold bg-gray-100 rounded-xl border border-gray-200 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-extrabold text-gray-400 uppercase tracking-widest block mb-2">Village / Town / City*</label>
                    <input type="text" value={deliveryAddress.village} disabled className="w-full p-3 text-[13.5px] font-semibold bg-gray-100 rounded-xl border border-gray-200 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-extrabold text-gray-400 uppercase tracking-widest block mb-2">State*</label>
                    <input type="text" value={deliveryAddress.state} disabled className="w-full p-3 text-[13.5px] font-semibold bg-gray-100 rounded-xl border border-gray-200 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-extrabold text-gray-400 uppercase tracking-widest block mb-2">PIN Code*</label>
                    <input type="text" value={deliveryAddress.pinCode} disabled className="w-full p-3 text-[13.5px] font-semibold bg-gray-100 rounded-xl border border-gray-200 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-[11.5px] font-extrabold text-gray-400 uppercase tracking-widest block mb-2">Address Type</label>
                    <select value={deliveryAddress.addressType} onChange={e => setDeliveryAddress({...deliveryAddress, addressType: e.target.value})} className="w-full p-3 text-[13.5px] font-semibold bg-white rounded-xl border border-[#cbd5e1] focus:border-[#13448a] outline-none">
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex items-center gap-4">
                <button type="button" onClick={() => setCurrentStep(2)} className="h-12 px-7 rounded-xl border border-gray-200 hover:bg-gray-50 text-[14px] font-extrabold text-gray-700">Back</button>
                <button type="button" onClick={handleConfirmStep3} className="h-12 px-7 rounded-xl bg-[#13448a] hover:bg-[#0c316a] text-[14px] font-extrabold text-white">Continue to Review</button>
              </div>
            </div>
          )}
          
          {/* STEP 4: Review Application */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-[18px] font-extrabold text-gray-800">Step 4: Review Application</h2>
                <h2 className="text-[18px] font-extrabold text-gray-800">Step 3: Review Application</h2>
                <p className="text-[13.5px] text-gray-500 font-semibold mt-1">Verify your application details and uploaded documents before final submission.</p>
              </div>
 
              <div className="bg-[#f0f4fa]/50 border border-[#dbeafe] rounded-2xl p-7 space-y-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                {/* Decorative subtle background gradient blob */}
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-blue-100 blur-3xl opacity-50"></div>
                
                {/* Service Category */}
                <div className="relative z-10">
                  <h3 className="text-[11.5px] font-extrabold text-gray-400 uppercase tracking-widest block">Service Category</h3>
                  <p className="text-[18px] font-extrabold text-[#0f294a] mt-1">{service.name}</p>
                  <p className="text-[12.5px] text-[#f58220] font-extrabold mt-1 uppercase tracking-wider">{service.category}</p>
                </div>
 
                {/* Processing and Fees */}
                <div className="grid gap-4 sm:grid-cols-2 pt-5 border-t border-[#dbeafe] relative z-10">
                  <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-sm">
                    <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest block">Processing Time</h3>
                    <p className="text-[15px] font-extrabold text-gray-800 mt-1">{service.estimatedProcessingDays} Working Days</p>
                  </div>
                  <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-sm">
                    <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest block">Service Charge</h3>
                    <p className="text-[15px] font-extrabold text-gray-800 mt-1">
                      {service.serviceCharge === 0 ? "Free" : `₹${service.serviceCharge.toFixed(2)}`}
                    </p>
                  </div>
                </div>
 
                {/* Uploaded Documents details */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Uploaded Paperwork</h3>
                  <div className="space-y-2">
                    {(service.requiredDocuments || []).map((docName, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50/50 border border-gray-100 rounded-lg py-2.5 px-4 text-[13px] font-semibold">
                        <span className="text-gray-700">{docName}</span>
                        <span className="text-emerald-700 font-bold">{uploadedFiles[docName]?.originalName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Notes Text Area */}
                <div className="pt-5 border-t border-[#dbeafe] relative z-10">
                  <label className="text-[11.5px] font-extrabold text-gray-400 uppercase tracking-widest block mb-2">Additional Notes / Instructions (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide any additional details or context for the verifying agent..."
                    rows="3"
                    className="w-full p-4 text-[13.5px] font-semibold bg-white rounded-xl border border-[#cbd5e1] focus:border-[#13448a] focus:ring-2 focus:ring-[#13448a]/20 outline-none transition-all shadow-sm resize-none placeholder-gray-400"
                  />
                </div>

                <div className="pt-5 border-t border-[#dbeafe] relative z-10">
                  <h3 className="text-[14.5px] font-extrabold text-gray-800 mb-4">Secure Delivery & Payment</h3>
                  {service.serviceCharge > 0 ? (
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-sm mb-4">
                      <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest block">Payment Method</h3>
                      <p className="text-[15px] font-extrabold text-gray-800 mt-1">Cash on Delivery</p>
                      <p className="text-[13px] text-gray-500 font-medium mt-2">Payment of ₹{service.serviceCharge.toFixed(2)} will be collected only after successful recipient identity verification and immediately before the document is handed over. No online payment is required.</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-sm mb-4">
                      <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest block">Payment</h3>
                      <p className="text-[15px] font-extrabold text-gray-800 mt-1">No payment required.</p>
                    </div>
                  )}

                  <div className="flex gap-3 rounded-xl bg-amber-50/50 p-4 border border-amber-200 text-[12.5px] font-semibold text-amber-800 leading-relaxed">
                    <div className="flex items-start gap-3 w-full">
                      <input type="checkbox" id="deliveryDeclaration" checked={deliveryDeclarationAccepted} onChange={(e) => setDeliveryDeclarationAccepted(e.target.checked)} className="mt-1 w-4 h-4 text-[#13448a] bg-white border-amber-300 rounded focus:ring-[#13448a] focus:ring-2" />
                      <label htmlFor="deliveryDeclaration" className="cursor-pointer space-y-2">
                        <p className="font-bold">SECURE DOCUMENT DELIVERY DECLARATION</p>
                        <p>• The requested document will be delivered only to the verified applicant.</p>
                        <p>• I must be personally present at the delivery address to receive the document.</p>
                        <p>• The document will not be handed to any third party.</p>
                        <p>• I may be required to present an accepted identity document or complete verification before delivery.</p>
                        <p>• I have reviewed my delivery address and agree to the secure delivery terms.</p>
                      </label>
                    </div>
                  </div>
                </div>

                {!user?.emailVerified && (
                  <div className="flex gap-2.5 rounded-xl bg-red-50 p-4 border border-red-200 text-[12.5px] font-semibold text-red-800 leading-normal mt-4">
                    <svg style={{ width: '18px', height: '18px' }} className="text-red-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <div>
                      Verify your email before submitting a service request. 
                      <Link to={PATHS.RESEND_VERIFICATION} className="ml-1 text-[#13448a] underline hover:text-[#0c316a]">
                        Resend verification link
                      </Link>
                    </div>
                  </div>
                )}
 
              </div>
 
              {/* Navigation buttons */}
              <div className="pt-4 flex items-center gap-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setCurrentStep(3)}
                  className="h-12 px-7 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-[14px] font-extrabold text-gray-700 transition-all disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={submitting || !user?.emailVerified}
                  onClick={handleConfirmStep4}
                  className="h-12 px-7 rounded-xl bg-[#13448a] hover:bg-[#0c316a] text-[14px] font-extrabold text-white shadow-md shadow-[#13448a]/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? 'Submitting...' : service.serviceCharge > 0 ? `Submit Application — ₹${service.serviceCharge.toFixed(2)} Due on Delivery` : 'Proceed to Submit'}
                  {!submitting && (
                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
 
          {/* STEP 5: Submit success */}
          {currentStep === 5 && (
            <div className="space-y-8 bg-[#f0f4fa]/30 border border-[#dbeafe] rounded-2xl p-10 shadow-sm text-center relative overflow-hidden">
              {/* Decorative subtle background gradient blob */}
              <div className="absolute left-1/2 -top-10 w-40 h-40 -translate-x-1/2 rounded-full bg-emerald-100 blur-3xl opacity-50"></div>
              
              {/* Success Badge */}
              <div className="mx-auto h-20 w-20 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shadow-sm relative z-10 transform -rotate-3 transition-transform hover:rotate-0">
                <svg style={{ width: '40px', height: '40px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
 
              <div className="space-y-2 relative z-10">
                <h2 className="text-[24px] font-extrabold text-[#0f294a] tracking-tight">Application Submitted Successfully!</h2>
                <p className="text-[14.5px] text-gray-500 font-medium max-w-md mx-auto">Your application request has been received. A service verification agent will be assigned to verify your documents shortly.</p>
              </div>
 
              {/* Receipt info card */}
              <div className="max-w-md mx-auto bg-white border border-[#e2e8f0] rounded-xl p-6 text-left text-[13.5px] space-y-3.5 font-semibold shadow-sm relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Request ID</span>
                  <span className="text-[#13448a] font-extrabold text-[15px]">{requestId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Service Category</span>
                  <span className="text-gray-800 font-extrabold">{service.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Current Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] font-extrabold border border-amber-200">
                    Awaiting Agent
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-[#e2e8f0]">
                  <span className="text-gray-500">Payment Status</span>
                  <span className="text-emerald-600 font-extrabold">
                    {service.serviceCharge === 0 ? "Free Scheme" : "Paid (Online)"}
                  </span>
                </div>
              </div>
 
              {/* Actions buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                <button
                  type="button"
                  onClick={() => navigate(PATHS.CITIZEN_DASHBOARD)}
                  className="h-12 w-full sm:w-auto px-8 rounded-xl bg-[#13448a] hover:bg-[#0c316a] text-[14px] font-extrabold text-white shadow-md shadow-[#13448a]/20 transition-all hover:-translate-y-0.5"
                >
                  Go to Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-12 w-full sm:w-auto px-8 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-[14px] font-extrabold text-gray-700 transition-all"
                >
                  Print Receipt
                </button>
              </div>
 
            </div>
          )}
      </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e2e8f0] py-6 px-6 mt-12">
        <div className="max-w-[1344px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12.5px] font-semibold text-gray-500">
          <div>
            © 2026 SevaSetu. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link to="#" className="hover:text-[#13448a] no-underline">Privacy Policy</Link>
            <Link to="#" className="hover:text-[#13448a] no-underline">Terms of Service</Link>
            <Link to="#" className="hover:text-[#13448a] no-underline">Accessibility</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
