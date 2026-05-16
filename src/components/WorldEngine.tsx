import React from 'react';

interface WorldEngineProps {
  isStormActive: boolean;
  vitalityScore?: number;
  masteryScore?: number;
}

export const WorldEngine: React.FC<WorldEngineProps> = ({ isStormActive, vitalityScore = 30, masteryScore = 50 }) => {
  return (
    <div className="w-full h-full relative">
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1000 500"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="skyGradClear" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          
          <linearGradient id="skyGradStorm" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#020617" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="hillBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#042f2e" />
          </linearGradient>

          <linearGradient id="hillMidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#134e4a" />
          </linearGradient>

          <linearGradient id="hillFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>

          <filter id="moonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="windowGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="sparkGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="10" stdDeviation="15" floodOpacity="0.5" floodColor="#000" />
          </filter>

          <pattern id="rainPattern" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
            <line x1="20" y1="0" x2="20" y2="40" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeLinecap="round">
              <animateTransform attributeName="transform" type="translate" from="0 -40" to="0 40" dur="0.5s" repeatCount="indefinite" />
            </line>
            <line x1="0" y1="-20" x2="0" y2="20" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round">
              <animateTransform attributeName="transform" type="translate" from="0 -40" to="0 40" dur="0.4s" repeatCount="indefinite" />
            </line>
          </pattern>
        </defs>

        {/* Backdrop */}
        <rect width="1000" height="500" fill={isStormActive ? "url(#skyGradStorm)" : "url(#skyGradClear)"} />

        {/* Clear Sky Elements */}
        {!isStormActive && (
          <g>
            {/* Stars */}
            <circle cx="150" cy="100" r="1.5" fill="#fff" opacity="0.6">
              <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="300" cy="60" r="2" fill="#fff" opacity="0.4">
              <animate attributeName="opacity" values="0.4;1;0.4" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="850" cy="150" r="1.5" fill="#fff" opacity="0.8">
              <animate attributeName="opacity" values="0.1;0.7;0.1" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="600" cy="80" r="2" fill="#fff" opacity="0.5">
              <animate attributeName="opacity" values="0.3;0.9;0.3" dur="5s" repeatCount="indefinite" />
            </circle>
            <circle cx="450" cy="200" r="1" fill="#fff" opacity="0.3" />
            <circle cx="750" cy="90" r="1.5" fill="#fff" opacity="0.6" />

            {/* Moon */}
            <circle 
              cx="800" 
              cy="150" 
              r="40" 
              fill="#fdf08a" 
              filter="url(#moonGlow)" 
            />
          </g>
        )}

        {/* Storm Sky Background */}
        {isStormActive && (
          <g>
            {/* Lightning flash overlay */}
            <rect width="1000" height="500" fill="#fff" opacity="0">
              <animate attributeName="opacity" values="0;0;0;0.15;0;0;" keyTimes="0;0.4;0.45;0.48;0.5;1" dur="8s" repeatCount="indefinite" />
            </rect>
          </g>
        )}

        {/* Landscape Hills */}
        <g filter="url(#dropShadow)">
          {/* Back Hill */}
          <path 
            d="M0,350 Q250,200 500,320 T1000,250 L1000,500 L0,500 Z" 
            fill="url(#hillBackGrad)" 
          />
        </g>
        
        <g filter="url(#dropShadow)">
          {/* Mid Hill */}
          <path 
            d="M-100,420 Q200,280 600,400 T1100,340 L1100,500 L-100,500 Z" 
            fill="url(#hillMidGrad)" 
          />
        </g>

        {/* Sanctuary */}
        {masteryScore > 50 ? (
          <g transform="translate(710, 230)">
            {/* Main wing */}
            <path d="M0,60 L100,35 L100,180 L0,180 Z" fill="#1e293b" />
            <path d="M0,60 L30,52 L30,180 L0,180 Z" fill="#0f172a" opacity="0.5" />
            {/* Main roof */}
            <path d="M-10,62 L110,32 L110,38 L-10,68 Z" fill="#020617" />
            
            {/* Second Floor / Extended wing */}
            <path d="M80,80 L180,55 L180,180 L80,180 Z" fill="#0f172a" />
            <path d="M80,80 L110,72 L110,180 L80,180 Z" fill="#020617" opacity="0.4" />
            {/* Wing roof */}
            <path d="M70,82 L190,52 L190,58 L70,88 Z" fill="#0f172a" />

            {/* Main Window */}
            <rect x="45" y="70" width="40" height="70" rx="6" fill="#fbbf24" filter="url(#windowGlow)" />
            <rect x="50" y="75" width="30" height="60" rx="4" fill="#fef3c7" opacity="0.95" />
            
            {/* Second Floor Window */}
            <rect x="125" y="90" width="35" height="35" rx="18" fill="#fbbf24" filter="url(#windowGlow)" />
            <circle cx="142.5" cy="107.5" r="12" fill="#fef3c7" opacity="0.95" />

            {/* Golden glow intensification */}
            <circle cx="65" cy="105" r="30" fill="#fbbf24" filter="url(#windowGlow)" opacity="0.4" style={{ mixBlendMode: 'screen' }} />
            <circle cx="142.5" cy="107.5" r="20" fill="#fbbf24" filter="url(#windowGlow)" opacity="0.4" style={{ mixBlendMode: 'screen' }} />
            
            {/* Antenna / Tech Detailing */}
            <rect x="155" y="15" width="2" height="40" fill="#334155" />
            <circle cx="156" cy="15" r="3" fill="#ef4444" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        ) : (
          <g transform="translate(730, 250)">
            {/* Main structure walls */}
            <path d="M10,40 L110,15 L110,160 L10,160 Z" fill="#1e293b" />
            <path d="M10,40 L40,32 L40,160 L10,160 Z" fill="#0f172a" opacity="0.4" />
            {/* Roof */}
            <path d="M0,42 L120,12 L120,18 L0,48 Z" fill="#020617" />
            {/* Window */}
            <rect x="55" y="45" width="40" height="70" rx="12" fill="#fbbf24" filter="url(#windowGlow)" />
            <rect x="60" y="50" width="30" height="60" rx="8" fill="#fef3c7" opacity="0.9" />
            {/* Antenna */}
            <rect x="85" y="-15" width="2" height="30" fill="#334155" />
            <circle cx="86" cy="-15" r="3" fill="#ef4444" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* Spirit Tree - Phase 4 */}
        <g transform="translate(560, 310)">
          {/* Trunk */}
          <path d="M0,140 Q-10,70 15,0 Q25,-40 5,-70 Q10,-70 25,-40 Q35,-10 15,0 Q10,70 20,140 Z" fill="#1e293b" />
          {/* Branch */}
          <path d="M18,-15 Q40,-30 60,-20 Q40,-25 18,-10 Z" fill="#1e293b" />
          <path d="M12,-30 Q-10,-50 -25,-40 Q-10,-45 12,-25 Z" fill="#1e293b" />

          {/* Dynamic Leaves List */}
          {vitalityScore >= 50 && !isStormActive && (
            <g>
              {/* Back leaves (Teal/Darker Green) */}
              <path d="M20,-60 C-10,-90 -30,-40 -10,-20 C-5,5 30,10 50,-10 C70,-30 60,-70 20,-60 Z" fill="#059669" opacity="0.9" />
              <path d="M-10,-45 C-30,-70 -50,-20 -20,10 C0,-30 40,20 50,0 C60,-20 30,-50 -10,-45 Z" fill="#047857" opacity="0.8" />
              
              {/* Front leaves (Vibrant Green) */}
              <path d="M10,-80 C-20,-110 -40,-60 -20,-40 C-5,-10 40,-5 60,-30 C80,-50 50,-90 10,-80 Z" fill="#10b981" />
              <path d="M-25,-55 C-40,-75 -60,-30 -30,0 C-10,20 30,10 40,-10 C50,-30 10,-60 -25,-55 Z" fill="#34d399" opacity="0.9" />
              <path d="M45,-45 C20,-70 0,-20 20,5 C40,30 70,20 80,0 C90,-20 70,-50 45,-45 Z" fill="#10b981" />
              
              {/* Fireflies */}
              <circle cx="-30" cy="-80" r="2.5" fill="#fef08a" filter="url(#sparkGlow)">
                <animateTransform attributeName="transform" type="translate" values="0,0; 10,-15; -5,10; 0,0" dur="4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="60" cy="-85" r="2" fill="#fef08a" filter="url(#sparkGlow)">
                <animateTransform attributeName="transform" type="translate" values="0,0; -12,-8; 8,-12; 0,0" dur="5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.9;0.2" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="15" cy="-110" r="2.5" fill="#fef08a" filter="url(#sparkGlow)">
                <animateTransform attributeName="transform" type="translate" values="0,0; 15,10; -8,-12; 0,0" dur="6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;1;0.5" dur="4s" repeatCount="indefinite" />
              </circle>
              <circle cx="70" cy="-20" r="2" fill="#fef08a" filter="url(#sparkGlow)">
                <animateTransform attributeName="transform" type="translate" values="0,0; -8,12; 6,-8; 0,0" dur="4.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2.5s" repeatCount="indefinite" />
              </circle>
            </g>
          )}
        </g>

        <g filter="url(#dropShadow)">
          {/* Front Hill */}
          <path 
            d="M-50,500 Q300,380 700,480 T1050,420 L1050,500 L-50,500 Z" 
            fill="url(#hillFrontGrad)" 
          />
        </g>

        {/* Avatar - Minimalist Explorer */}
        <g transform="translate(320, 435)">
          {/* Shadow */}
          <ellipse cx="0" cy="12" rx="16" ry="4" fill="#042f2e" opacity="0.6" />
          
          <g className="animate-[bounce_3s_infinite]">
            {/* Legs (Dark Pants #1e293b) */}
            <path d="M-5,0 L-5,12" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
            <path d="M5,0 L5,12" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
            
            {/* Body / Cloak (#3b82f6) */}
            <path d="M-12,-15 Q0,-25 12,-15 L14,2 Q0,6 -14,2 Z" fill="#3b82f6" />
            
            {/* Head (#fef3c7) - solid circle for the head */}
            <circle cx="0" cy="-22" r="7" fill="#fef3c7" />
            
            {/* Arm holding Spark */}
            <path d="M 3,-12 Q 16,-8 20,-14" fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
            
            {/* Glowing Spark */}
            <circle cx="21" cy="-15" r="4" fill="#38bdf8" filter="url(#sparkGlow)" />
            <circle cx="21" cy="-15" r="1.5" fill="#ffffff" opacity="0.8" />
          </g>
        </g>

        {/* Rain Layer - Must be in front of Avatar and Hills */}
        {isStormActive && (
          <rect width="1000" height="500" fill="url(#rainPattern)" style={{ pointerEvents: 'none' }} />
        )}
      </svg>
    </div>
  );
};
