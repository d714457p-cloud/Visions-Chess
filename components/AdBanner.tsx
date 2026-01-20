
import React from 'react';

/**
 * AdMob Banner Integration
 * Ad Unit ID: ca-app-pub-3940256099942544/6300978111
 */
const AdBanner: React.FC = () => {
  const AD_UNIT_ID = "ca-app-pub-3940256099942544/6300978111";

  return (
    <div className="w-full bg-slate-100 border-t border-slate-200 h-16 flex items-center justify-center overflow-hidden shrink-0 z-50">
      <div 
        className="w-[320px] h-[50px] bg-slate-200 rounded flex flex-col items-center justify-center border border-slate-300 shadow-inner"
        data-ad-unit-id={AD_UNIT_ID}
      >
        <span className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">Google AdMob Banner</span>
        <span className="text-[7px] text-slate-500 font-mono mt-0.5">{AD_UNIT_ID}</span>
      </div>
    </div>
  );
};

export default AdBanner;
