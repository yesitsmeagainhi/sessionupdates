'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import BannerSlider from '@/components/BannerSlider';
import MenuCard from '@/components/MenuCard';
import { loadStudentProfileByEmail } from '@/services/profile';
import { fetchBanners, BannerRow } from '@/services/lectures';

const PALETTE = {
  blue: '#004e92',
  textMain: '#1a1a1a',
  textMute: '#686868',
  surface: '#fff',
  bg: '#f2f5fa',
  chip: '#eef4ff',
};

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = React.useState('Student');
  const [branch, setBranch] = React.useState('Branch');
  const [banners, setBanners] = React.useState<BannerRow[]>([]);
  const [bannersLoading, setBannersLoading] = React.useState(true);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }

      try {
        setBannersLoading(true);
        const [profile, fetchedBanners] = await Promise.all([
          loadStudentProfileByEmail(user.email),
          fetchBanners(),
        ]);

        if (profile) {
          if (profile.name) setName(profile.name);
          if (profile.branch) setBranch(profile.branch);
        } else {
          const fallbackName = (user.email || '').split('@')[0];
          setName(fallbackName || 'Student');
        }

        setBanners(fetchedBanners || []);
        console.log('Banners fetched:', fetchedBanners?.length ?? 0);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setBannersLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const menuItems = [
    { href: '/today', icon: '🗓️', title: 'Today' },
    { href: '/tomorrow', icon: '▶️', title: 'Tomorrow' },
    { href: '/results', icon: '📊', title: 'Results' },
    { href: '/attendance', icon: '✋', title: 'Attendance' },
    { href: '/helpdesk', icon: '👤', title: 'helpdesk' },
    { href: '/announcements', icon: '🔔', title: 'Announcements' },
  ];

  const renderBannerContent = () => {
    if (bannersLoading) {
      return (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            background: PALETTE.surface,
            borderRadius: '14px',
            color: PALETTE.textMute,
          }}
        >
          Loading banners...
        </div>
      );
    }

    if (banners.length === 0) {
      return (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            background: PALETTE.surface,
            borderRadius: '14px',
            color: PALETTE.textMute,
          }}
        >
          No Updates
        </div>
      );
    }

    return <BannerSlider banners={banners} />;
  };

  return (
    <main style={{ minHeight: '100vh', background: PALETTE.bg }}>
      {/* Header */}
      <section
        style={{
          background: PALETTE.blue,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          padding: '16px 20px 20px',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,.12)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ color: '#cfe3ff', fontSize: 15 }}>Welcome back 👋</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{name}</div>
            <div style={{ color: '#b3d9ff', fontSize: 16, fontWeight: 600, marginTop: 4 }}>
              Branch: {branch}
            </div>
          </div>
          <button
            onClick={async () => {
              await auth.signOut();
              router.replace('/login');
            }}
            style={{
              border: '1px solid rgba(255,255,255,0.4)',
              padding: '8px 16px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.18)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </section>

      {/* Banners */}
      <section style={{ padding: '20px 20px 0' }}>{renderBannerContent()}</section>

      {/* Menu */}
      <section style={{ padding: '20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: '16px',
          }}
        >
          {menuItems.map((item) => (
            <MenuCard key={item.title} {...item} />
          ))}
        </div>
      </section>
    </main>
  );
}
