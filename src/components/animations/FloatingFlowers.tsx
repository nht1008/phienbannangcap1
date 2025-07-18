"use client";

import React from 'react';
import Image from 'next/image';

export const FloatingFlowers = () => {
  // Danh sách hình ảnh hoa - có thể là emoji hoặc file ảnh thực tế
  const flowerImages = [
    { type: 'image', src: '/floating-flowers/flower1.png', alt: 'Hoa 1', fallback: '🌸' },
    { type: 'image', src: '/floating-flowers/flower2.png', alt: 'Hoa 2', fallback: '🌺' },
    { type: 'image', src: '/floating-flowers/flower3.png', alt: 'Hoa 3', fallback: '🌻' },
    { type: 'image', src: '/floating-flowers/flower4.png', alt: 'Hoa 4', fallback: '🌷' },
    { type: 'image', src: '/floating-flowers/flower5.png', alt: 'Hoa 5', fallback: '🌹' },
    { type: 'image', src: '/floating-flowers/flower6.png', alt: 'Hoa 6', fallback: '💐' },
    { type: 'image', src: '/floating-flowers/flower7.png', alt: 'Hoa 7', fallback: '🌼' },
    { type: 'image', src: '/floating-flowers/flower8.png', alt: 'Hoa 8', fallback: '🌿' },
  ];
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(20)].map((_, i) => {
        const flowerIndex = i % flowerImages.length;
        const flower = flowerImages[flowerIndex];
        
        return (
          <div
            key={i}
            className="absolute animate-float opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          >
            {flower.type === 'image' ? (
              <div className="relative w-8 h-8 md:w-12 md:h-12">
                <Image
                  src={flower.src}
                  alt={flower.alt}
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback về emoji nếu không tải được hình ảnh
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span class="text-2xl md:text-4xl">${flower.fallback}</span>`;
                    }
                  }}
                />
              </div>
            ) : (
              <span 
                className="text-2xl md:text-4xl"
                style={{
                  fontSize: `${1 + Math.random() * 2}rem`,
                }}
              >
                {flower.fallback}
              </span>
            )}
          </div>
        );
      })}
      
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(5deg);
          }
          50% {
            transform: translateY(-20px) rotate(-5deg);
          }
          75% {
            transform: translateY(-5px) rotate(3deg);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
