import { Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import WireframeLogo from './WireframeLogo';

export default function WireframeHeader() {
  return (
    <header className="h-[86px] border-b border-[#d7dce5] bg-white">
      <div className="mx-auto flex h-full max-w-[1390px] items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-12">
          <Link to={PATHS.HOME} aria-label="SevaSetu home" className="flex h-[54px] w-auto items-center no-underline">
            <WireframeLogo vertical className="h-full w-auto" />
          </Link>
          <nav className="hidden items-center gap-10 text-[17px] font-semibold text-black md:flex" aria-label="Primary navigation">
            <Link to={PATHS.SERVICES} className="text-black no-underline hover:text-[#003b7a]">
              Services
            </Link>
            <a href="/#how-it-works" className="text-black no-underline hover:text-[#003b7a]">
              How It Works
            </a>
            <a href="/#about" className="text-black no-underline hover:text-[#003b7a]">
              About
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-[17px] font-semibold">
          <Link to={PATHS.LOGIN} className="rounded-md px-4 py-3 text-black no-underline hover:bg-[#f4f6f9]">
            Login
          </Link>
          <Link to={PATHS.REGISTER} className="rounded-md bg-[#073b78] px-7 py-4 text-white no-underline hover:bg-[#052f61]">
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}
