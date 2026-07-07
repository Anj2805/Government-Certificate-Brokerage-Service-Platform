import { Outlet } from 'react-router-dom';
import SiteHeader from '../components/public/SiteHeader';
import SiteFooter from '../components/public/SiteFooter';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
