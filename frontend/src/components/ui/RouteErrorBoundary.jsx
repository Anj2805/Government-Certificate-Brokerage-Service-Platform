import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { AlertCircle } from 'lucide-react';

export default function RouteErrorBoundary() {
  const error = useRouteError();

  let title = "Something went wrong";
  let message = "An unexpected error occurred while loading this page.";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Page Not Found";
      message = "The page you are looking for does not exist.";
    } else if (error.status === 401) {
      title = "Unauthorized";
      message = "You are not authorized to view this page.";
    } else if (error.status === 503) {
      title = "Service Unavailable";
      message = "The service is temporarily down. Please try again later.";
    } else {
      title = `Error ${error.status}`;
      message = error.statusText || error.data?.message || message;
    }
  } else if (error instanceof Error) {
    // We log it safely, but don't expose stack traces to user
    console.error("Route Error Boundary caught an error:", error.message);
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      <h1 className="text-3xl font-extrabold text-[#0f294a] mb-4">
        {title}
      </h1>
      <p className="text-lg text-gray-600 max-w-md mx-auto mb-8">
        {message}
      </p>
      
      <div className="flex gap-4">
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-white border-2 border-[#13448a] text-[#13448a] font-semibold rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          Try Again
        </button>
        <Link 
          to={PATHS.ADMIN_DASHBOARD}
          className="px-6 py-2.5 bg-[#13448a] text-white font-semibold rounded-lg shadow-sm hover:bg-[#0c316a] transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
