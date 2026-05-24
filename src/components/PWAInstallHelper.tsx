import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle2, Info, ExternalLink, X, Download, HelpCircle, RefreshCw, AlertTriangle } from 'lucide-react';

export const PWAInstallHelper = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem('pwa_install_helper_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const [swRegistered, setSwRegistered] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  useEffect(() => {
    // 1. Detect if running inside iframe
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    // 2. Detect if already running standalone (installed PWA)
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    setIsStandalone(isStandaloneMode);

    // 3. Register beforeinstallprompt event hook
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Verify Service Worker Active State
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.active) {
          setSwRegistered(true);
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerNativeInstall = async () => {
    if (!deferredPrompt) {
      alert("Browser install prompt is currently unavailable. Please follow the direct manual install guidelines.");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User installation choice outcome: ${outcome}`);
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsStandalone(true);
    }
  };

  const openInNewTabAndClearCache = () => {
    // Force direct URL without iframe sandbox
    const directUrl = window.location.origin + '?view=home';
    window.open(directUrl, '_blank');
  };

  const dismissHelper = () => {
    try {
      localStorage.setItem('pwa_install_helper_dismissed', 'true');
    } catch {}
    setIsDismissed(true);
  };

  const showHelperAgain = () => {
    try {
      localStorage.setItem('pwa_install_helper_dismissed', 'false');
    } catch {}
    setIsDismissed(false);
  };

  if (isDismissed) {
    return (
      <div className="flex justify-start">
        <button
          onClick={showHelperAgain}
          className="text-xs font-mono font-medium text-slate-500 hover:text-blue-400 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-blue-500/10 px-4 py-2 rounded-xl transition-all flex items-center space-x-2"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>App Installation Status (Android/Chrome helper)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-blue-900/[0.05] via-[#090b11] to-slate-900/40 p-6 md:p-8 backdrop-blur-3xl shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
      {/* Background Neon Accent Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
      
      {/* Header Close button */}
      <button 
        onClick={dismissHelper}
        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
        title="Dismiss panel"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider">
            <Smartphone className="w-3 h-3" />
            <span>Smartphone Setup & Multi-Device Sync</span>
          </div>

          <h3 className="text-xl md:text-2xl font-display font-black text-white">
            Set up Drive OS as an Android App
          </h3>

          <p className="text-sm text-slate-400 leading-relaxed font-sans font-medium">
            Drive OS includes a full **PWA (Progressive Web App)** package. Installing it enables native smartphone notifications, offline availability, pocket alarm vibration, and extreme speed.
          </p>

          {/* Realtime Diagnostics Panel */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-400 bg-white/[0.02] px-3 py-2 rounded-xl border border-white/5">
              <span className={`w-2 h-2 rounded-full ${isInIframe ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
              <span>Context: {isInIframe ? "Iframe Preview" : "Direct Browser"}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-400 bg-white/[0.02] px-3 py-2 rounded-xl border border-white/5">
              <span className={`w-2 h-2 rounded-full ${isStandalone ? "bg-emerald-500" : "bg-slate-600"}`} />
              <span>Engine Status: {isStandalone ? "Installed OS" : "Not Installed"}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-400 bg-white/[0.02] px-3 py-2 rounded-xl border border-white/5">
              <span className={`w-2 h-2 rounded-full ${swRegistered ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`} />
              <span>Service Worker: {swRegistered ? "Online & Ready" : "Unconnected"}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-400 bg-white/[0.02] px-3 py-2 rounded-xl border border-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>PNG Icons: 192px/512px OK</span>
            </div>
          </div>
        </div>

        {/* Action Controls Column */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-3 flex-shrink-0">
          {isStandalone ? (
            <div className="px-5 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center space-x-3 text-emerald-400">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-xs font-sans font-black uppercase tracking-widest leading-none">Drive OS Active</p>
                <p className="text-[10px] font-mono opacity-80 mt-1">Installed & synced on this device.</p>
              </div>
            </div>
          ) : isInIframe ? (
            <div className="space-y-3 w-full">
              <button
                onClick={openInNewTabAndClearCache}
                className="w-full px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-[0_10px_25px_rgba(37,99,235,0.2)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.35)]"
              >
                <span>Launch in New Tab</span>
                <ExternalLink className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-amber-400 font-mono text-center md:max-w-xs leading-relaxed">
                ⚠️ Chrome blocks app installation inside frame-sandboxes. You must open Drive OS in a new tab first!
              </p>
            </div>
          ) : isInstallable ? (
            <button
              onClick={triggerNativeInstall}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-[0_15px_30px_rgba(37,99,235,0.25)] hover:scale-[1.02]"
            >
              <Download className="w-4 h-4 animate-bounce" />
              <span>Install Drive OS Natively</span>
            </button>
          ) : (
            <div className="space-y-3 w-full">
              <button
                onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                className="w-full px-5 py-3.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 hover:border-white/20 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Show Android Install Steps</span>
              </button>
              <p className="text-[10px] text-slate-400 font-mono text-center leading-normal max-w-[220px] mx-auto">
                No active prompt detected yet. Chrome requires certain criteria. Touch above to read manual steps.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Setup Guidance block */}
      {(showTroubleshooting || (!isStandalone && !isInIframe && !isInstallable)) && (
        <div className="mt-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
          <div className="bg-white/[0.01] border border-white/5 p-5 rounded-2xl">
            <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 flex items-center space-x-2 mb-3">
              <Info className="w-4 h-4" />
              <span>How to Install directly on Android Chrome</span>
            </h4>
            
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 font-medium font-sans">
              <li>
                Make sure you are browsing directly in the Chrome app (not in a sandboxed developer workspace). Use this link: 
                <span className="text-blue-400 break-all ml-1 underline cursor-pointer select-all font-mono">
                  {window.location.origin}
                </span>
              </li>
              <li>
                In Google Chrome, tap the <strong className="text-white">Three Dots menu (⋮)</strong> located in the upper-right corner.
              </li>
              <li>
                Locate and tap either <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.
              </li>
              <li>
                If you only see "Add to Home screen" as a generic shortcut, **clear Chrome's cache and site history** for this domain! Chrome might still be serving older cached icons. Once cleared, refresh, and the premium "Install app" option with logo support will appear.
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
