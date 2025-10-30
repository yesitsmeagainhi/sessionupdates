'use client';

import React, { useRef, useEffect, useState } from 'react';

interface Banner {
  id: string;
  imageUrl: string;
  link?: string;
  title?: string;
}

// Helper to normalize URLs
const normalizeURL = (raw = '') => {
  let url = raw.trim();
  if (!url) return '';
  // ✅ Fix: use the actual url variable
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) url = `https://${url}`;
  try {
    return encodeURI(new URL(url).toString());
  } catch {
    return '';
  }
};

const Dots = ({ count, active }: { count: number; active: number }) => (
  <div style={styles.dotRow}>
    {Array.from({ length: count }).map((_, idx) => (
      <div key={idx} style={idx === active ? { ...styles.dot, ...styles.dotActive } : styles.dot} />
    ))}
  </div>
);

export default function BannerSlider({ banners = [] }: { banners: Banner[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-scroll
  useEffect(() => {
    if (!banners.length || !ref.current) return;
    const id = setInterval(() => {
      const nextIndex = (activeIndex + 1) % banners.length;
      const container = ref.current;
      if (container) {
        const scrollAmount = nextIndex * container.clientWidth;
        container.scrollTo({ left: scrollAmount, behavior: 'smooth' });
        setActiveIndex(nextIndex);
      }
    }, 4000);
    return () => clearInterval(id);
  }, [activeIndex, banners.length]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  const openLink = (link?: string) => {
    const url = normalizeURL(link || '');
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!banners.length) return null;

  return (
    <div style={styles.wrapper}>
      <div ref={ref} style={styles.container} onScroll={onScroll}>
        {banners.map((item) => (
          <div key={item.id} onClick={() => openLink(item.link)} style={styles.slideTouch}>
            <img src={item.imageUrl} style={styles.image} alt={item.title || 'Banner'} />
            {!!item.title && (
              <div style={styles.overlay}>
                <span style={styles.slideTitle}>{item.title}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {banners.length > 1 && <Dots count={banners.length} active={activeIndex} />}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    height: 'auto',
    marginBottom: '16px',
    position: 'relative',
    borderRadius: '14px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  container: {
    display: 'flex',
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    scrollBehavior: 'smooth',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
  },
  slideTouch: {
    width: '100%',
    height: 'auto',
    flexShrink: 0,
    scrollSnapAlign: 'start',
    position: 'relative',
    cursor: 'pointer',
  },
  image: {
    width: '100%',
    height: 'auto',
    aspectRatio: '16 / 9',
    objectFit: 'contain',
    backgroundColor: '#000',
    display: 'block',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: '12px',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
  },
  slideTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.7)',
  },
  dotRow: {
    position: 'absolute',
    bottom: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'row',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    margin: '0 4px',
    transition: 'all 0.3s ease',
  },
  dotActive: {
    width: '24px',
    backgroundColor: '#fff',
  },
};
