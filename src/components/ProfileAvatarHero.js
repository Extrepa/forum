'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { getAvatarUrl } from '../lib/media';

export default function ProfileAvatarHero({ avatarKey, userColor }) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    setCoords({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setCoords({ x: 0, y: 0 });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  // Subtle floating animation for when not hovering or on mobile
  const floatingAnim = `
    @keyframes floatingFace {
      0%, 100% { transform: translate(0, 0); }
      25% { transform: translate(2px, -3px); }
      50% { transform: translate(-1px, 2px); }
      75% { transform: translate(-2px, -1px); }
    }
  `;

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ 
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        cursor: 'default',
        perspective: '1000px'
      }}
    >
      <style>{floatingAnim}</style>
      
      {/* Background Aura - moves slightly */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${userColor}33 0%, transparent 70%)`,
        transform: `translate(${coords.x * 15}px, ${coords.y * 15}px) scale(${isHovering ? 1.1 : 1})`,
        transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.6s ease-out',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* The Face - moves more for parallax effect */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        transform: `translate(${coords.x * 30}px, ${coords.y * 30}px) rotateX(${coords.y * -10}deg) rotateY(${coords.x * 10}deg)`,
        transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.8s ease-out',
        animation: !isHovering ? 'floatingFace 6s ease-in-out infinite' : 'none'
      }}>
        <Image
          src={getAvatarUrl(avatarKey)}
          alt=""
          width={160}
          height={160}
          unoptimized
          style={{
            width: '160px',
            height: '160px',
            display: 'block',
            filter: `drop-shadow(0 0 10px ${userColor}44)`
          }}
        />
      </div>
    </div>
  );
}
