import WireframeLogo from './WireframeLogo';

const quickLinks = ['All Services', 'How It Works', 'Find an Agent', 'Login'];
const supportLinks = ['Help Center', 'Contact Us', 'FAQs', 'Grievance Redressal'];

function SocialIcon({ label, children }) {
  return (
    <a href="/#" aria-label={label} className="grid h-7 w-7 place-items-center text-white no-underline">
      {children}
    </a>
  );
}

export default function WireframeFooter() {
  return (
    <footer className="bg-[#153f70] text-white">
      <div className="mx-auto grid max-w-[1190px] gap-10 px-8 py-14 md:grid-cols-[1.15fr_0.9fr_0.9fr_1.25fr] lg:px-0">
        <div>
          <WireframeLogo className="h-10 w-[145px] brightness-0 invert" />
          <p className="mt-7 max-w-[245px] text-[14px] font-medium leading-6 text-white">
            Connecting citizens with government services through verified agents and a secure digital pipeline.
          </p>
          <div className="mt-8 flex gap-5">
            <SocialIcon label="Facebook">
              <span className="text-lg font-bold">f</span>
            </SocialIcon>
            <SocialIcon label="Twitter">
              <span className="text-lg font-bold">t</span>
            </SocialIcon>
            <SocialIcon label="LinkedIn">
              <span className="text-lg font-bold">in</span>
            </SocialIcon>
          </div>
        </div>
        <div>
          <h2 className="text-[15px] font-bold">Quick Links</h2>
          <ul className="mt-8 space-y-5 text-[14px]">
            {quickLinks.map((item) => (
              <li key={item}>
                <a href="/#" className="text-white no-underline hover:underline">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-[15px] font-bold">Support</h2>
          <ul className="mt-8 space-y-5 text-[14px]">
            {supportLinks.map((item) => (
              <li key={item}>
                <a href="/#" className="text-white no-underline hover:underline">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-[15px] font-bold">Official Info</h2>
          <p className="mt-8 text-[14px] font-medium leading-6 text-white">
            Digital India Initiative
            <br />
            Ministry of Electronics & IT
            <br />
            Government of India
          </p>
          <div className="mt-6 rounded-md border border-white/10 bg-white/10 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">Helpline</p>
            <p className="mt-2 text-xl font-semibold">1800-111-222</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
