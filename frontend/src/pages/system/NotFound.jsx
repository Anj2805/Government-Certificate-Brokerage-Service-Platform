import { Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-950">Page not found</h1>
        <Link to={PATHS.HOME} className="mt-4 inline-block text-sm">
          Go home
        </Link>
      </section>
    </main>
  );
}
