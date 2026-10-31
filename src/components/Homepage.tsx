import React from 'react';
import { Shield, Lock } from 'lucide-react';
import { VaultId } from '../types/vault';

interface HomepageProps {
  onSelectVault: (vaultId: VaultId) => void;
}

export const Homepage: React.FC<HomepageProps> = ({ onSelectVault }) => {
  return (
    <div className="relative min-h-screen bg-[#070913] text-white flex flex-col items-center justify-center px-4 py-8 sm:py-12 overflow-hidden selection:bg-purple-500/30">
      {/* Ambient background glows */}
      <div 
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[650px] h-[350px] rounded-full blur-[140px] opacity-25"
        style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.6) 0%, rgba(56, 189, 248, 0.2) 60%, transparent 100%)' }}
      />
      <div 
        className="pointer-events-none absolute -bottom-32 -left-20 w-[450px] h-[450px] rounded-full blur-[130px] opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.7) 0%, transparent 70%)' }}
      />
      <div 
        className="pointer-events-none absolute -bottom-32 -right-20 w-[450px] h-[450px] rounded-full blur-[130px] opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.7) 0%, transparent 70%)' }}
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
        
        {/* Top Purple Shield & Lock Icon */}
        <div className="mb-4 flex items-center justify-center">
          <div className="relative p-2.5 rounded-xl border border-purple-500/60 bg-purple-950/20 shadow-[0_0_20px_rgba(168,85,247,0.45)]">
            <Shield className="w-8 h-8 text-purple-400 neon-purple-shield stroke-[1.8]" />
            <Lock className="w-3.5 h-3.5 text-purple-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%]" />
          </div>
        </div>

        {/* Title with glowing gradient and side lines */}
        <div className="w-full flex items-center justify-center gap-2.5 sm:gap-6 md:gap-8 mb-8 sm:mb-12 md:mb-14 px-2">
          {/* Left glowing line (cyan fading left) */}
          <div className="flex-1 h-[1.5px] max-w-[40px] min-[400px]:max-w-[70px] sm:max-w-[160px] md:max-w-[200px] title-cyan-line rounded-full" />
          
          <h1 className="text-3xl min-[400px]:text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-[#4dd0e1] via-[#60a5fa] to-[#c084fc] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(96,165,250,0.3)] font-['Outfit'] select-none whitespace-nowrap">
            KG-Vault
          </h1>

          {/* Right glowing line (purple fading right) */}
          <div className="flex-1 h-[1.5px] max-w-[40px] min-[400px]:max-w-[70px] sm:max-w-[160px] md:max-w-[200px] title-purple-line rounded-full" />
        </div>

        {/* Two Vault Cards Container */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-7 lg:gap-10 max-w-4xl px-1">
          
          {/* Left Card - Male Vault (Cyan/Blue Theme) */}
          <button
            type="button"
            onClick={() => onSelectVault('vault_1')}
            className="group relative w-full h-[280px] sm:h-[350px] md:h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden neon-border-cyan transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.99] text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/80 focus:ring-offset-2 focus:ring-offset-[#070913]"
            aria-label="Unlock Vault 1"
          >
            {/* Background image: extracted male photo from reference, blurred */}
            <div 
              className="absolute inset-0 bg-cover bg-center scale-105 filter blur-[4px] brightness-90 group-hover:scale-110 transition-transform duration-700 ease-out"
              style={{
                backgroundImage: `url('/assets/vault-male-bg.png')`,
                backgroundColor: '#0c1526'
              }}
            />
            {/* Dark translucent overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/30 group-hover:bg-black/35 transition-colors duration-300" />
            
            {/* Upper-right minimal lock icon */}
            <div className="absolute top-5 right-5 z-20">
              <div className="p-2 rounded-lg bg-black/40 backdrop-blur-md border border-cyan-500/30 text-cyan-300/80 group-hover:text-cyan-300 group-hover:border-cyan-400/60 transition-all shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                <Lock className="w-4 h-4" />
              </div>
            </div>

            {/* Center glowing rounded-square button with male symbol */}
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl symbol-box-cyan flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(56,189,248,0.6)]">
                {/* Glowing Mars Symbol ♂ */}
                <span className="text-4xl sm:text-5xl text-[#38bdf8] font-bold select-none drop-shadow-[0_0_15px_rgba(56,189,248,0.9)]">
                  &#9794;
                </span>
              </div>
            </div>

            {/* Subtle bottom shine effect */}
            <div className="absolute bottom-4 inset-x-0 text-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-[11px] font-medium tracking-wider text-cyan-200/90 uppercase px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 backdrop-blur-md">
                Click to Unlock
              </span>
            </div>
          </button>

          {/* Right Card - Female Vault (Pink/Magenta Theme) */}
          <button
            type="button"
            onClick={() => onSelectVault('vault_2')}
            className="group relative w-full h-[280px] sm:h-[350px] md:h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden neon-border-pink transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.99] text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-400/80 focus:ring-offset-2 focus:ring-offset-[#070913]"
            aria-label="Unlock Vault 2"
          >
            {/* Background image: extracted female photo from reference, blurred */}
            <div 
              className="absolute inset-0 bg-cover bg-center scale-105 filter blur-[4px] brightness-90 group-hover:scale-110 transition-transform duration-700 ease-out"
              style={{
                backgroundImage: `url('/assets/vault-female-bg.png')`,
                backgroundColor: '#260c1d'
              }}
            />
            {/* Dark translucent overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/30 group-hover:bg-black/35 transition-colors duration-300" />
            
            {/* Upper-right minimal lock icon */}
            <div className="absolute top-5 right-5 z-20">
              <div className="p-2 rounded-lg bg-black/40 backdrop-blur-md border border-pink-500/30 text-pink-300/80 group-hover:text-pink-300 group-hover:border-pink-400/60 transition-all shadow-[0_0_10px_rgba(236,72,153,0.2)]">
                <Lock className="w-4 h-4" />
              </div>
            </div>

            {/* Center glowing rounded-square button with female symbol */}
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl symbol-box-pink flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(236,72,153,0.6)]">
                {/* Glowing Venus Symbol ♀ */}
                <span className="text-4xl sm:text-5xl text-[#ec4899] font-bold select-none drop-shadow-[0_0_15px_rgba(236,72,153,0.9)]">
                  &#9792;
                </span>
              </div>
            </div>

            {/* Subtle bottom shine effect */}
            <div className="absolute bottom-4 inset-x-0 text-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-[11px] font-medium tracking-wider text-pink-200/90 uppercase px-3 py-1 rounded-full bg-pink-950/60 border border-pink-500/40 backdrop-blur-md">
                Click to Unlock
              </span>
            </div>
          </button>

        </div>

        {/* Footer info & security hint */}
        <div className="mt-12 text-center text-xs text-gray-400/80 select-none">
          <p className="flex items-center justify-center gap-2">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>End-to-end encrypted storage &bull; Isolated multi-vault security</span>
          </p>
        </div>

      </div>
    </div>
  );
};
