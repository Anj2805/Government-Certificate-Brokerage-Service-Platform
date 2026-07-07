import { Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import logo from '../../assets/logo.png';

const footerLinks = [
  {
    title: 'Platform',
    links: [
      { label: 'Home', to: PATHS.HOME },
      { label: 'Services', to: PATHS.SERVICES },
      { label: 'Citizen Login', to: PATHS.LOGIN },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Centre', to: '/#faq' },
      { label: 'Application Status', to: PATHS.LOGIN },
      { label: 'Agent Assistance', to: PATHS.REGISTER },
    ],
  },
  {
    title: 'Governance',
    links: [
      { label: 'Accessibility', to: '/#accessibility' },
      { label: 'Privacy', to: '/#privacy' },
      { label: 'Terms of Use', to: '/#terms' },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-civic-line bg-white">
      <div className="portal-container py-12">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <img src={logo} alt="SevaSetu Logo" className="h-10 w-auto object-contain" />
            <p className="mt-5 max-w-md text-sm leading-6 text-ink-600">
              SevaSetu helps citizens discover certificate services, prepare documents, and submit assisted requests through digital service workflows.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {footerLinks.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm font-semibold text-ink-900">{group.title}</h2>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.to} className="text-sm text-ink-600 no-underline hover:text-brand-700">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-civic-line pt-6 text-xs text-ink-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 SevaSetu. Government Certificate & Documentation Assistance Platform.</p>
          <p>Designed for accessible citizen service delivery.</p>
        </div>
      </div>
    </footer>
  );
}
