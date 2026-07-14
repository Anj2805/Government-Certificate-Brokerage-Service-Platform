import React from 'react';

export default function StatCard({ title, value, subtitle, subtitleIcon, icon, colorTheme = 'blue' }) {
  const themeStyles = {
    blue: {
      text: 'text-[#13448a]',
      iconBg: 'bg-blue-50',
      iconText: 'text-[#13448a]',
      border: 'border-[#13448a]/10',
      hoverBorder: 'group-hover:border-[#13448a]/30'
    },
    orange: {
      text: 'text-[#f58220]',
      iconBg: 'bg-orange-50',
      iconText: 'text-[#f58220]',
      border: 'border-[#f58220]/10',
      hoverBorder: 'group-hover:border-[#f58220]/30'
    },
    green: {
      text: 'text-[#10b981]',
      iconBg: 'bg-emerald-50',
      iconText: 'text-[#10b981]',
      border: 'border-[#10b981]/10',
      hoverBorder: 'group-hover:border-[#10b981]/30'
    },
    red: {
      text: 'text-[#ef4444]',
      iconBg: 'bg-red-50',
      iconText: 'text-[#ef4444]',
      border: 'border-[#ef4444]/10',
      hoverBorder: 'group-hover:border-[#ef4444]/30'
    },
  };

  const theme = themeStyles[colorTheme] || themeStyles.blue;

  return (
    <div className={`group bg-white rounded-2xl border ${theme.border} p-5 xl:p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex flex-col justify-between min-h-[150px] h-full transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${theme.hoverBorder} relative overflow-hidden`}>
      {/* Decorative subtle background gradient blob */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${theme.iconBg} blur-2xl opacity-50 transition-transform duration-500 group-hover:scale-150`}></div>

      <div className="flex justify-between items-start gap-3 relative z-10 w-full">
        <span className="text-xs xl:text-[13px] font-semibold text-gray-500 uppercase tracking-wider leading-tight flex-1">
          {title}
        </span>
        <div className={`h-10 w-10 xl:h-12 xl:w-12 rounded-xl ${theme.iconBg} ${theme.iconText} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
          {icon}
        </div>
      </div>
      
      <div className="mt-4 relative z-10 w-full">
        <span className={`text-3xl xl:text-4xl font-bold ${theme.text} block leading-none tracking-tight`}>
          {value}
        </span>
        {subtitle && (
          <div className="text-xs xl:text-sm font-medium text-gray-400 mt-2 flex items-start gap-1.5 leading-snug">
            <span className={`${theme.text} shrink-0 mt-0.5`}>{subtitleIcon}</span> 
            <span className="flex-1">{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}
