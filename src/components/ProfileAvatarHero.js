'use client';

import { useState, useRef, useEffect } from 'react';
import AvatarImage from './AvatarImage';
import { getAvatarUrl } from '../lib/media';

export default function ProfileAvatarHero({ avatarKey, userColor }) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const spinTimeoutRef = useRef(null);

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

  const handleFaceClick = () => {
    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current);
    }
    setIsSpinning(true);
    spinTimeoutRef.current = setTimeout(() => {
      setIsSpinning(false);
      spinTimeoutRef.current = null;
    }, 900);
  };

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current);
        spinTimeoutRef.current = null;
      }
    };
  }, []);

  // Subtle floating animation for when not hovering or on mobile
  const translateScalar = 18;
  const rotationScalar = 6;

  const floatingAnim = `
    @keyframes floatingFace {
      0%, 100% { transform: translate(0, 0); }
      25% { transform: translate(2px, -3px); }
      50% { transform: translate(-1px, 2px); }
      75% { transform: translate(-2px, -1px); }
    }
    @keyframes coinSpin {
      0% { transform: rotateY(0deg); }
      50% { transform: rotateY(180deg) scaleX(1.02); }
      100% { transform: rotateY(360deg); }
    }
  `;

  const avatarUrl = getAvatarUrl(avatarKey);

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
        transform: `translate(${coords.x * 6}px, ${coords.y * 5}px) scale(${isHovering ? 1.05 : 1})`,
        transition: isHovering ? 'transform 0.15s ease-out' : 'transform 0.5s ease-out',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* The Face - moves more for parallax effect */}
      <div
        onClick={handleFaceClick}
        style={{
          position: 'relative',
          zIndex: 1,
          transform: `translate(${coords.x * translateScalar}px, ${coords.y * translateScalar}px) rotateX(${coords.y * -rotationScalar}deg) rotateY(${coords.x * rotationScalar}deg)`,
          transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.8s ease-out',
          cursor: 'pointer'
        }}
      >
        <div
          style={{
            transformStyle: 'preserve-3d',
            animation: isSpinning ? 'coinSpin 0.9s ease-out' : (!isHovering ? 'floatingFace 6s ease-in-out infinite' : 'none')
          }}
        >
          <AvatarImage
            src={avatarUrl}
            alt="Profile avatar"
            size={160}
            loading="eager"
            style={{
              width: '160px',
              height: '160px',
              display: 'block',
              filter: `drop-shadow(0 0 10px ${userColor}44)`
            }}
          />
        </div>
      </div>
    </div>
  );
}
