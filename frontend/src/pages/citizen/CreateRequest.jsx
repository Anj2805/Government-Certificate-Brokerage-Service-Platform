import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { serviceApi } from '../../api/serviceApi';
import { documentApi } from '../../api/documentApi';
import { requestApi } from '../../api/requestApi';
import { useAuth } from '../../hooks/useAuth';

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
    } catch (err) {
      alert(`Failed to upload ${docName}: ${err.response?.data?.message || err.message}`);
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
      alert("Please upload all the required documents before proceeding.");
      return;
    }
    setCurrentStep(3);
  };

  const handleConfirmStep3 = async () => {
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
      };

      requestDoc = await requestApi.createRequest(payload);
    } catch (err) {
      alert(`Failed to create request draft: ${err.response?.data?.message || err.message}`);
      setSubmitting(false);
      return;
    }

    try {
      const submittedDoc = await requestApi.submitRequest(requestDoc._id, { reason: 'Initial application submission' });
      setRequestId(submittedDoc.requestNumber || submittedDoc._id);
      setCurrentStep(4);
    } catch (err) {
      alert(`Draft created successfully with ID: ${requestDoc.requestNumber || requestDoc._id}, but submission failed. You can manage and submit this draft later from My Requests. Error: ${err.response?.data?.message || err.message}`);
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
          <div className="h-16 w-16 mx-auto rounded-full bg-red-50 text-red-550 flex items-center justify-center border-2 border-red-200">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-[22px] font-extrabold text-gray-900 mt-6">Failed to Load Application Wizard</h1>
          <p className="text-[14px] text-gray-500 font-semibold mt-2">
            An error occurred while loading the service catalog options. Please try again.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => navigate(PATHS.SERVICES)}
              className="h-11 px-5 rounded-lg border border-gray-200 hover:bg-gray-50 text-[13.5px] font-bold text-gray-700 transition-colors"
            >
              Back to Catalog
            </button>
            <button
              onClick={loadInitialData}
              className="h-11 px-5 rounded-lg bg-[#13448a] hover:bg-[#0c316a] text-[13.5px] font-bold text-white shadow-md transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1024px] w-full mx-auto px-6 py-10 flex-1">
        
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
        <div className="mb-12 max-w-[800px] mx-auto">
          <div className="flex items-center justify-between relative">
            
            {/* Background line connecting steps */}
            <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-gray-100 -translate-y-1/2 z-0"></div>
            
            {/* Step 1 */}
            <div className="flex flex-col items-center z-10 bg-[#f8fafc] px-3">
              <div style={{ width: '36px', height: '36px' }} className={`rounded-full flex items-center justify-center border-2 text-[14px] font-extrabold transition-colors ${
                currentStep === 1 
                  ? 'border-[#f58220] bg-white text-[#f58220] ring-4 ring-[#f58220]/15' 
                  : currentStep > 1 
                    ? 'border-[#10b981] bg-[#10b981] text-white' 
                    : 'border-gray-200 bg-white text-gray-400'
              }`}>
                {currentStep > 1 ? "✓" : "1"}
              </div>
              <span className={`text-[12px] font-bold mt-2 tracking-wide ${currentStep === 1 ? 'text-[#f58220]' : currentStep > 1 ? 'text-[#10b981]' : 'text-gray-400'}`}>
                Select Service
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center z-10 bg-[#f8fafc] px-3">
              <div style={{ width: '36px', height: '36px' }} className={`rounded-full flex items-center justify-center border-2 text-[14px] font-extrabold transition-colors ${
                currentStep === 2 
                  ? 'border-[#f58220] bg-white text-[#f58220] ring-4 ring-[#f58220]/15' 
                  : currentStep > 2 
                    ? 'border-[#10b981] bg-[#10b981] text-white' 
                    : 'border-gray-200 bg-white text-gray-400'
              }`}>
                {currentStep > 2 ? "✓" : "2"}
              </div>
              <span className={`text-[12px] font-bold mt-2 tracking-wide ${currentStep === 2 ? 'text-[#f58220]' : currentStep > 2 ? 'text-[#10b981]' : 'text-gray-400'}`}>
                Upload Documents
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center z-10 bg-[#f8fafc] px-3">
              <div style={{ width: '36px', height: '36px' }} className={`rounded-full flex items-center justify-center border-2 text-[14px] font-extrabold transition-colors ${
                currentStep === 3 
                  ? 'border-[#f58220] bg-white text-[#f58220] ring-4 ring-[#f58220]/15' 
                  : currentStep > 3 
                    ? 'border-[#10b981] bg-[#10b981] text-white' 
                    : 'border-gray-200 bg-white text-gray-400'
              }`}>
                {currentStep > 3 ? "✓" : "3"}
              </div>
              <span className={`text-[12px] font-bold mt-2 tracking-wide ${currentStep === 3 ? 'text-[#f58220]' : currentStep > 3 ? 'text-[#10b981]' : 'text-gray-400'}`}>
                Review
              </span>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center z-10 bg-[#f8fafc] px-3">
              <div style={{ width: '36px', height: '36px' }} className={`rounded-full flex items-center justify-center border-2 text-[14px] font-extrabold transition-colors ${
                currentStep === 4 
                  ? 'border-[#f58220] bg-white text-[#f58220] ring-4 ring-[#f58220]/15' 
                  : 'border-gray-200 bg-white text-gray-400'
              }`}>
                4
              </div>
              <span className={`text-[12px] font-bold mt-2 tracking-wide ${currentStep === 4 ? 'text-[#f58220]' : 'text-gray-400'}`}>
                Submit
              </span>
            </div>

          </div>
        </div>

        {/* Dynamic Wizard Steps Content */}
        <div className="max-w-[800px] mx-auto">
          
          {/* STEP 1: Confirm/Select Service */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-[18px] font-extrabold text-gray-800">Step 1: Confirm Service Selection</h2>
                <p className="text-[13.5px] text-gray-500 font-semibold mt-1">You have selected the following service. Please confirm to proceed with document submission.</p>
              </div>
 
              {/* Service Details Card */}
              <div className="bg-[#f0f4fa]/60 border border-[#dbeafe] rounded-2xl p-6 space-y-6 shadow-sm">
                
                {/* Header title */}
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[#13448a] flex items-center justify-center text-white shrink-0">
                    <svg style={{ width: '22px', height: '22px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-[18px] font-extrabold text-gray-900 leading-tight truncate">{service.name}</h3>
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
                            alert("Failed to load service details.");
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        className="text-[12px] font-bold text-[#13448a] bg-white border border-[#cbd5e1] px-2.5 py-1 rounded-lg outline-none focus:ring-1 focus:ring-[#13448a]"
                      >
                        {services.map(s => (
                          <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <span className="text-[12.5px] font-bold text-gray-500 block mt-1 uppercase tracking-wider">Category: {service.category}</span>
                  </div>
                </div>
 
                {/* Inner white cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-white border border-[#e2e8f0] rounded-xl p-4.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Estimated Time</span>
                    <span className="text-[16px] font-extrabold text-gray-800 mt-1 block">{service.estimatedProcessingDays} Working Days</span>
                  </div>
                  <div className="bg-white border border-[#e2e8f0] rounded-xl p-4.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Service Fee</span>
                    <span className="text-[16px] font-extrabold text-gray-800 mt-1 block">
                      {service.serviceCharge === 0 ? "Free" : `₹${service.serviceCharge.toFixed(2)}`}
                    </span>
                  </div>
                </div>
 
                {/* Alert Info box */}
                <div className="flex gap-2.5 rounded-xl bg-white p-4 border border-[#e2e8f0] text-[12.5px] font-semibold text-gray-500 leading-normal">
                  <svg style={{ width: '20px', height: '20px' }} className="text-[#13448a] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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
                  className="h-12 px-6 rounded-lg bg-[#13448a] hover:bg-[#0c316a] text-[14px] font-bold text-white shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  Confirm & Continue
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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
                          <div className="flex items-center gap-2 bg-gray-50 text-gray-500 border border-gray-200 px-3.5 py-2 rounded-lg text-[13px] font-bold">
                            <div className="h-4 w-4 border-2 border-[#13448a] border-t-transparent rounded-full animate-spin"></div>
                            <span>Uploading...</span>
                          </div>
                        ) : doc ? (
                          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3.5 py-2 rounded-lg text-[13px] font-bold">
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
                              className="text-emerald-800 hover:text-red-650 font-extrabold ml-1.5"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="h-10 px-4 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 text-[13px] font-bold text-gray-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
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
              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="h-12 px-6 rounded-lg border border-gray-200 hover:bg-gray-50 text-[14px] font-bold text-gray-700 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStep2}
                  className="h-12 px-6 rounded-lg bg-[#13448a] hover:bg-[#0c316a] text-[14px] font-bold text-white shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  Continue to Review
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
 
          {/* STEP 3: Review Application */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-[18px] font-extrabold text-gray-800">Step 3: Review Application</h2>
                <p className="text-[13.5px] text-gray-500 font-semibold mt-1">Verify your application details and uploaded documents before final submission.</p>
              </div>
 
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 space-y-6 shadow-sm">
                
                {/* Service Category */}
                <div>
                  <h3 className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider block">Service Category</h3>
                  <p className="text-[16px] font-extrabold text-[#0f294a] mt-1">{service.name}</p>
                  <p className="text-[13px] text-gray-500 font-bold mt-0.5 uppercase">Category: {service.category}</p>
                </div>
 
                {/* Processing and Fees */}
                <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-gray-100">
                  <div>
                    <h3 className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider block">Estimated processing time</h3>
                    <p className="text-[14.5px] font-extrabold text-gray-800 mt-1">{service.estimatedProcessingDays} Working Days</p>
                  </div>
                  <div>
                    <h3 className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider block">Service Charge</h3>
                    <p className="text-[14.5px] font-extrabold text-gray-800 mt-1">
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
                <div className="pt-4 border-t border-gray-100">
                  <label className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Additional Notes / Instructions (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide any additional details or context for the verifying agent..."
                    rows="3"
                    className="w-full p-3 text-[13.5px] font-medium bg-white rounded-lg border border-[#cbd5e1] focus:border-[#13448a] outline-none transition-all shadow-sm resize-none"
                  />
                </div>
 
                <div className="flex gap-2.5 rounded-xl bg-amber-50/30 p-4 border border-amber-100 text-[12.5px] font-semibold text-amber-800 leading-normal">
                  <svg style={{ width: '18px', height: '18px' }} className="text-amber-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  By submitting, you declare that all provided documents and information are true and correct. False claims can lead to rejection or legal actions under relevant acts.
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
              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setCurrentStep(2)}
                  className="h-12 px-6 rounded-lg border border-gray-200 hover:bg-gray-50 text-[14px] font-bold text-gray-700 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={submitting || !user?.emailVerified}
                  onClick={handleConfirmStep3}
                  className="h-12 px-6 rounded-lg bg-[#13448a] hover:bg-[#0c316a] text-[14px] font-bold text-white shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Proceed to Submit'}
                  {!submitting && (
                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
 
          {/* STEP 4: Submit success */}
          {currentStep === 4 && (
            <div className="space-y-8 bg-white border border-[#e2e8f0] rounded-2xl p-8 shadow-sm text-center">
              
              {/* Success Badge */}
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border-2 border-emerald-200">
                <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
 
              <div className="space-y-2">
                <h2 className="text-[22px] font-extrabold text-gray-900">Application Submitted Successfully!</h2>
                <p className="text-[14px] text-gray-500 font-semibold max-w-md mx-auto">Your application request has been received. A service verification agent will be assigned to verify your documents shortly.</p>
              </div>
 
              {/* Receipt info card */}
              <div className="max-w-md mx-auto bg-gray-50/70 border border-gray-100 rounded-xl p-5 text-left text-[13.5px] space-y-3 font-semibold">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Request ID</span>
                  <span className="text-[#13448a] font-extrabold">{requestId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Service Category</span>
                  <span className="text-gray-800 font-extrabold">{service.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Current Status</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                    Awaiting Agent
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-gray-100">
                  <span className="text-gray-400">Payment Status</span>
                  <span className="text-emerald-700 font-bold">
                    {service.serviceCharge === 0 ? "Free Scheme" : "Paid (Online)"}
                  </span>
                </div>
              </div>
 
              {/* Actions buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(PATHS.CITIZEN_DASHBOARD)}
                  className="h-11 w-full sm:w-auto px-6 rounded-lg bg-[#13448a] hover:bg-[#0c316a] text-[13.5px] font-bold text-white shadow-md transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-11 w-full sm:w-auto px-6 rounded-lg border border-gray-200 hover:bg-gray-50 text-[13.5px] font-bold text-gray-700 transition-colors"
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
    </div>
  );
}
