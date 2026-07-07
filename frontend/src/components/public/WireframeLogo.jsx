import { brandAssets } from '../../config/brandAssets';

export default function WireframeLogo({ className = '', vertical = false }) {
  return (
    <img
      src={(vertical ? brandAssets.logoVertical : brandAssets.logo) + '?t=' + Date.now()}
      alt="SevaSetu"
      className={`block object-contain ${className}`}
    />
  );
}
