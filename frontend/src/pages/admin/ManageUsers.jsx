import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { adminApi } from '../../api/adminApi';
import { Users, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setMeta(prev => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.listUsers({ 
        page: meta.page, 
        limit: meta.limit, 
        search: debouncedSearch 
      });
      if (response.data) {
        setUsers(response.data.users);
        setMeta(response.meta);
      }
    } catch (error) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [meta.page, meta.limit, debouncedSearch]);

  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-[#13448a]" />
              Manage Citizens
            </h1>
            <p className="text-[14.5px] text-gray-500 font-semibold mt-0.5">
              View and manage citizen profiles and activity.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search citizens by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[14px] font-medium outline-none focus:bg-white focus:border-[#13448a] focus:ring-1 focus:ring-[#13448a] transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[11.5px] font-bold text-gray-400 uppercase tracking-wider">Citizen</th>
                  <th className="px-6 py-4 text-[11.5px] font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-[11.5px] font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-[11.5px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="h-8 w-8 border-4 border-[#13448a] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[14.5px] font-semibold text-gray-500">
                      No citizens found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-sm uppercase">
                            {user.firstName?.[0] || 'C'}
                          </div>
                          <div>
                            <span className="block text-[14.5px] font-extrabold text-gray-800">
                              {user.firstName} {user.lastName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="block text-[13.5px] font-semibold text-gray-600">{user.email}</span>
                        <span className="block text-[12px] font-medium text-gray-400 mt-0.5">{user.phone || 'No phone'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-semibold text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={PATHS.ADMIN_USER_DETAILS.replace(':id', user._id)}
                          className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-[#13448a] hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && users.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-gray-500">
                Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} citizens
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMeta(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={meta.page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setMeta(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={meta.page === meta.totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
