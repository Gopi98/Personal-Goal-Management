import React, { useRef, useEffect } from 'react';

interface GameWorldProps {
  isStormActive: boolean;
  vitalityScore: number;
}

export const GameWorld: React.FC<GameWorldProps> = ({ isStormActive, vitalityScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let frameCount = 0;

    // Handle Resize
    const resize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener('resize', resize);
    resize();

    // Weather Particles State
    const rainDrops = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: Math.random() * 10 + 15,
      length: Math.random() * 15 + 10,
    }));

    const stars = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height * 0.6),
      size: Math.random() * 2 + 1,
      opacity: Math.random(),
    }));

    // Render Loop
    const draw = () => {
      frameCount++;

      // 1. Sky Background
      ctx.fillStyle = '#0f172a'; // Deep dark night sky
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Weather Engine (Background Layer)
      if (!isStormActive) {
        // Clear Sky: Stars
        stars.forEach((star) => {
          ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
          ctx.fillRect(star.x, star.y, star.size, star.size);
          // Twinkle effect
          if (Math.random() > 0.95) star.opacity = Math.random();
        });

        // Static Moon
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(canvas.width * 0.8, canvas.height * 0.2, 30, 0, Math.PI * 2);
        ctx.fill();
        // Moon crater / texture
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.arc(canvas.width * 0.8 - 5, canvas.height * 0.2 + 5, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Mountains (Layer 1 - Farthest, slow/static)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.8);
      ctx.lineTo(canvas.width * 0.15, canvas.height * 0.4);
      ctx.lineTo(canvas.width * 0.4, canvas.height * 0.8);
      ctx.lineTo(canvas.width * 0.65, canvas.height * 0.3);
      ctx.lineTo(canvas.width * 0.9, canvas.height * 0.8);
      ctx.lineTo(canvas.width, canvas.height * 0.6);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.fill();

      // 4. Mountains (Layer 2 - Closer)
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      ctx.lineTo(canvas.width * 0.25, canvas.height * 0.55);
      ctx.lineTo(canvas.width * 0.5, canvas.height);
      ctx.lineTo(canvas.width * 0.8, canvas.height * 0.45);
      ctx.lineTo(canvas.width, canvas.height * 0.7);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.fill();

      // 5. The Ground
      const groundHeight = canvas.height * 0.2;
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

      // 5.25 Spirit Tree (Phase 4)
      const drawSpiritTree = (vitality: number) => {
        const treeX = canvas.width * 0.55;
        const groundY = canvas.height - groundHeight;
        const pixelSize = 5;

        // Trunk
        ctx.fillStyle = '#78350f';
        ctx.fillRect(treeX, groundY - pixelSize * 15, pixelSize * 2, pixelSize * 15);
        
        // Branches
        ctx.fillRect(treeX - pixelSize * 3, groundY - pixelSize * 10, pixelSize * 3, pixelSize);
        ctx.fillRect(treeX + pixelSize * 2, groundY - pixelSize * 12, pixelSize * 4, pixelSize);
        ctx.fillRect(treeX - pixelSize * 4, groundY - pixelSize * 5, pixelSize * 4, pixelSize);
        
        // Logic: vitalityScore >= 50 and !isStormActive
        if (vitality >= 50 && !isStormActive) {
          // Leaves (Main Canopy)
          ctx.fillStyle = '#059669'; // Darker green
          ctx.fillRect(treeX - pixelSize * 6, groundY - pixelSize * 20, pixelSize * 14, pixelSize * 8);
          ctx.fillStyle = '#10b981'; // Lighter green
          ctx.fillRect(treeX - pixelSize * 5, groundY - pixelSize * 21, pixelSize * 12, pixelSize * 4);
          ctx.fillRect(treeX - pixelSize * 3, groundY - pixelSize * 22, pixelSize * 8, pixelSize * 2);

          // Branch leaves
          ctx.fillStyle = '#059669';
          ctx.fillRect(treeX - pixelSize * 6, groundY - pixelSize * 12, pixelSize * 5, pixelSize * 4);
          ctx.fillRect(treeX + pixelSize * 4, groundY - pixelSize * 14, pixelSize * 6, pixelSize * 4);
          
          ctx.fillStyle = '#10b981';
          ctx.fillRect(treeX - pixelSize * 5, groundY - pixelSize * 13, pixelSize * 3, pixelSize * 2);
          ctx.fillRect(treeX + pixelSize * 5, groundY - pixelSize * 15, pixelSize * 4, pixelSize * 2);

          // Fireflies
          ctx.fillStyle = '#a7f3d0';
          const numFireflies = 6;
          for (let i = 0; i < numFireflies; i++) {
            const fx = Math.sin(frameCount * 0.03 + i) * 40 + (treeX + pixelSize);
            const fy = Math.cos(frameCount * 0.02 + i * 2) * 30 + (groundY - pixelSize * 16);
            ctx.fillRect(fx, fy, 2, 2);
          }
        }
      };

      drawSpiritTree(vitalityScore);

      // 5.5. Data Forge (Phase 3)
      const drawDataForge = () => {
        const forgeWidth = 120;
        const forgeHeight = 140;
        // Place Data Forge around the 75% mark
        const startX = canvas.width * 0.75 - forgeWidth / 2;
        const groundY = canvas.height - groundHeight;
        const startY = groundY - forgeHeight;

        // Main building structure (Outer walls)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(startX, startY, forgeWidth, forgeHeight);

        // Inner server bays
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(startX + 10, startY + 10, forgeWidth - 20, forgeHeight - 10);

        // Server racks & lights
        const numRacks = 3;
        for (let r = 0; r < numRacks; r++) {
          const rackX = startX + 20 + r * 30;
          const rackY = startY + 20;

          // Rack structure
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(rackX, rackY, 20, forgeHeight - 30);

          // Rack lights
          for (let slot = 0; slot < 8; slot++) {
            const lightY = rackY + 10 + slot * 12;

            // Blinking Blue Lights
            ctx.fillStyle = ((frameCount + r * 15 + slot * 10) % 60 < 30) ? '#3b82f6' : '#1e3a8a';
            ctx.fillRect(rackX + 4, lightY, 4, 3);

            // Blinking Green Lights
            ctx.fillStyle = ((frameCount + r * 20 + slot * 5) % 80 < 40) ? '#10b981' : '#064e3b';
            ctx.fillRect(rackX + 10, lightY, 6, 3);
          }
        }
      };

      drawDataForge();

      // 6. Avatar (Phase 2)
      const drawAvatar = () => {
        const pixelSize = 5;
        const startX = canvas.width * 0.4;
        const groundY = canvas.height - groundHeight;
        
        // Breathing animation: sine wave based on frameCount
        const breathOffset = Math.sin(frameCount * 0.05) * 3;
        
        const headSize = 5 * pixelSize;
        const torsoW = 5 * pixelSize;
        const torsoH = 6 * pixelSize;
        const legW = 2 * pixelSize;
        const legH = 4 * pixelSize;

        const pantsY = groundY - legH;
        const shirtY = pantsY - torsoH + breathOffset;
        const headY = shirtY - headSize;

        // Shadow under feet
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(startX + torsoW / 2, groundY, torsoW, pixelSize * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs (Dark Pants #374151) 
        // Note: Legs are NOT affected by breathOffset so they stay planted
        ctx.fillStyle = '#374151';
        ctx.fillRect(startX, pantsY, legW, legH); // Back leg
        ctx.fillRect(startX + torsoW - legW, pantsY, legW, legH); // Front leg

        // Torso (Blue Shirt #2563eb)
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(startX, shirtY, torsoW, torsoH);

        // Head (Face/Skin #fef3c7)
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(startX + pixelSize, headY, headSize, headSize);

        // Dark Hair (#3f271d)
        ctx.fillStyle = '#3f271d';
        ctx.fillRect(startX, headY - pixelSize, headSize + pixelSize, pixelSize * 2); // Top hair
        ctx.fillRect(startX, headY, pixelSize, headSize); // Back hair

        // Eye (Dark)
        ctx.fillStyle = '#111827';
        ctx.fillRect(startX + headSize, headY + pixelSize * 1.5, pixelSize, pixelSize);

        // Sleeve
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(startX + torsoW - pixelSize * 2, shirtY + pixelSize, legW, legH);
        
        // Hand
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(startX + torsoW - pixelSize * 2, shirtY + pixelSize + legH, legW, pixelSize);

        // Digital Tablet (#38bdf8)
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
        // Placed in hand
        ctx.fillRect(startX + torsoW - pixelSize, shirtY + pixelSize * 2 + legH - pixelSize, pixelSize * 1.5, pixelSize * 2.5);
        ctx.shadowBlur = 0; // Reset
      };

      drawAvatar();

      // 7. Weather Engine (Foreground Layer)
      if (isStormActive) {
        // Lightning Flash
        if (Math.random() > 0.99) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Rain
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';

        rainDrops.forEach((drop) => {
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          // Angle dropping to the right
          ctx.lineTo(drop.x + 2, drop.y + drop.length);
          ctx.stroke();

          // Move drops
          drop.y += drop.speed;
          drop.x += 1.5; // slight wind

          // Reset drop if offscreen
          if (drop.y > canvas.height) {
            drop.y = -20;
            drop.x = Math.random() * canvas.width;
          }
          if (drop.x > canvas.width) {
            drop.x = -20;
          }
        });
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationId);
    };
  }, [isStormActive, vitalityScore]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0f172a]">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};
