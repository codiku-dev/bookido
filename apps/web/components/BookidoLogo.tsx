interface BookidoLogoProps {
  className?: string;
  showText?: boolean;
}

export default function BookidoLogo({ className = "w-10 h-10", showText = false }: BookidoLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <svg className={className} viewBox="0 0 100 85" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Top beam */}
        <rect x="10" y="5" width="80" height="12" rx="2" fill="currentColor" className="text-blue-600" />

        {/* Left pillar */}
        <rect x="15" y="17" width="11" height="28" rx="2" fill="currentColor" className="text-blue-600" />

        {/* Right pillar */}
        <rect x="74" y="17" width="11" height="28" rx="2" fill="currentColor" className="text-blue-600" />

        {/* Middle beam */}
        <rect x="12" y="22" width="76" height="9" rx="2" fill="currentColor" className="text-blue-600" />

        {/* Calendar grid */}
        <rect x="32" y="45" width="9" height="9" rx="1.5" fill="currentColor" className="text-blue-600" />
        <rect x="46" y="45" width="9" height="9" rx="1.5" fill="currentColor" className="text-blue-600" />
        <rect x="60" y="45" width="9" height="9" rx="1.5" fill="currentColor" className="text-blue-600" />
        <rect x="32" y="58" width="9" height="9" rx="1.5" fill="currentColor" className="text-blue-600" />
        <rect x="46" y="58" width="9" height="9" rx="1.5" fill="currentColor" className="text-blue-600" />
        <rect x="60" y="58" width="9" height="9" rx="1.5" fill="currentColor" className="text-blue-600" />
        <rect x="32" y="71" width="9" height="9" rx="1.5" fill="currentColor" className="text-blue-600" />
        <rect x="46" y="71" width="9" height="9" rx="1.5" fill="currentColor" className="text-blue-600" />
        <rect x="60" y="71" width="9" height="9" rx="1.5" fill="currentColor" className="text-blue-600" />
      </svg>
      {showText && <span className="text-2xl font-bold text-slate-900">Bookido</span>}
    </div>
  );
}
