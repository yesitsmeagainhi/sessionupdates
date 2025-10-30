"use client";

import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useAuth } from '@/contexts/AuthContext';
import { StudentProfile, loadStudentProfileByEmail } from '@/services/profile';
import { fetchAnnouncements } from '@/services/lectures'; // Assuming this is the correct path

/* Extract YouTube video ID from URL */
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/* Replace placeholders like {name} or {pendingFees} with student values */
function personalize(str = '', student: StudentProfile | null) {
  if (!str || !student) return str;
  return str.replace(/{(\w+)}/g, (_, key) =>
    (student as any)?.[key] !== undefined ? String((student as any)[key]) : `{${key}}`,
  );
}

/* Parse "More details" field for structured info */
function parseMoreDetails(moreDetails: string) {
  if (!moreDetails) return {};
  
  const details: any = {};
  const lines = moreDetails.split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    if (line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '');
      
      switch (cleanKey) {
        case 'priority':
        case 'importance':
          details.priority = value;
          break;
        case 'category':
        case 'type':
          details.category = value;
          break;
        case 'deadline':
        case 'duedate':
        case 'lastdate':
          details.deadline = value;
          break;
        case 'location':
        case 'venue':
        case 'place':
          details.location = value;
          break;
        case 'contact':
        case 'email':
        case 'phone':
        case 'contactinfo':
          details.contact = value;
          break;
        case 'link':
        case 'url':
        case 'website':
          details.link = value;
          break;
        case 'author':
        case 'by':
        case 'postedby':
          details.author = value;
          break;
        default:
          details[cleanKey] = value;
      }
    } else {
      if (!details.additionalInfo) details.additionalInfo = [];
      details.additionalInfo.push(line.trim());
    }
  });
  
  return details;
}

/* Priority Badge Component */
const PriorityBadge = ({ priority }: { priority?: string }) => {
  if (!priority) return null;
  
  const getPriorityStyle = () => {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'urgent':
        return { backgroundColor: '#fee2e2', color: '#dc2626', icon: '🔴' };
      case 'medium':
        return { backgroundColor: '#fef3c7', color: '#d97706', icon: '🟡' };
      case 'low':
        return { backgroundColor: '#dcfce7', color: '#16a34a', icon: '🟢' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#6b7280', icon: '⚪' };
    }
  };

  const style = getPriorityStyle();
  
  return (
    <div style={{...styles.priorityBadge, backgroundColor: style.backgroundColor}}>
      <span style={styles.priorityIcon}>{style.icon}</span>
      <span style={{...styles.priorityText, color: style.color}}>
        {priority.toUpperCase()}
      </span>
    </div>
  );
};

/* Category Badge Component */
const CategoryBadge = ({ category }: { category?: string }) => {
  if (!category) return null;
  
  const getCategoryIcon = () => {
    switch (category.toLowerCase()) {
      case 'academic':
      case 'academics':
        return '📚';
      case 'event':
      case 'events':
        return '🎉';
      case 'exam':
      case 'exams':
        return '📝';
      case 'fee':
      case 'fees':
        return '💰';
      case 'holiday':
      case 'holidays':
        return '🏖️';
      case 'urgent':
        return '⚠️';
      case 'general':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div style={styles.categoryBadge}>
      <span style={styles.categoryIcon}>{getCategoryIcon()}</span>
      <span style={styles.categoryText}>{category}</span>
    </div>
  );
};

/* YouTube Video Component */
const YouTubeVideo = ({ url, student }: { url: string; student: StudentProfile | null }) => {
  const personalizedUrl = personalize(url, student);
  const videoId = getYouTubeVideoId(personalizedUrl);

  const webUrl = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : personalizedUrl;

  if (!webUrl) return null;

  const thumbnailUrl = videoId 
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null;

  return (
    <a
      href={webUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={styles.videoContainer}
    >
      {thumbnailUrl ? (
        <>
          <img
            src={thumbnailUrl}
            style={styles.videoThumbnail}
            alt="Video Thumbnail"
          />
          <div style={styles.playOverlay}>
            <div style={styles.playButton}>
              <span style={styles.playIcon}>▶️</span>
            </div>
            <span style={styles.videoLabel}>Watch on YouTube</span>
          </div>
        </>
      ) : (
        <div style={styles.genericVideoContainer}>
          <span style={styles.videoIcon}>🎥</span>
          <span style={styles.videoText}>Open Video</span>
          <span style={styles.videoSubText}>Tap to play in browser</span>
        </div>
      )}
    </a>
  );
};

export default function ImportantAnnouncementPage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setLoading(false);
      setError("Please log in to view announcements.");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load profile and announcements in parallel
        const [profileData, announcementsData] = await Promise.all([
          loadStudentProfileByEmail(user.email),
          fetchAnnouncements()
        ]);

        if (!profileData) {
          throw new Error("Student profile not found.");
        }
        
        setProfile(profileData);
        setAnnouncements(announcementsData || []);
        
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load data.");
        alert(err.message || "Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, authLoading]);

  const renderContent = () => {
    if (loading) {
      return (
        <div style={styles.loadingContainer}>
          <p style={styles.loadingText}>Loading announcements...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div style={styles.empty}>
          <p style={styles.emptyText}>{error}</p>
        </div>
      );
    }

    if (!announcements.length) {
      return (
        <div style={styles.empty}>
          <p style={styles.emptyText}>No important announcements 🎉</p>
        </div>
      );
    }

    return (
      <div style={styles.listContainer}>
        {announcements.map((item, idx) => {
          const moreDetails = parseMoreDetails(item['More details'] || item.moredetails || '');
          const contact = personalize(moreDetails.contact, profile);
          const contactLink = contact.includes('@') ? `mailto:${contact}` : `tel:${contact}`;

          return (
            <div key={`${item.id || 'ann'}-${idx}`} style={styles.card}>
              
              {(moreDetails.category || moreDetails.priority) && (
                <div style={styles.headerRow}>
                  <CategoryBadge category={moreDetails.category} />
                  <PriorityBadge priority={moreDetails.priority} />
                </div>
              )}
              
              <h2 style={styles.title}>
                {personalize(item.title, profile)}
              </h2>

              <div style={styles.metaRow}>
                {!!item.date && (
                  <span style={styles.date}>
                    📅 {dayjs(item.date).format('DD MMM YYYY')}
                  </span>
                )}
                {!!moreDetails.author && (
                  <span style={styles.author}>
                    👤 {personalize(moreDetails.author, profile)}
                  </span>
                )}
              </div>

              {!!moreDetails.deadline && (
                <div style={styles.deadlineContainer}>
                  <p style={styles.deadlineLabel}>⏰ Deadline:</p>
                  <p style={styles.deadlineText}>
                    {dayjs(moreDetails.deadline).format('DD MMM YYYY')}
                  </p>
                </div>
              )}

              {!!item.image && (
                <img
                  src={personalize(item.image, profile)}
                  style={styles.media}
                  alt="Announcement"
                />
              )}

              {!!item.video && (
                <YouTubeVideo url={item.video} student={profile} />
              )}

              {!!item.message && (
                <p style={styles.body}>
                  {personalize(item.message, profile)}
                </p>
              )}

              {!!moreDetails.location && (
                <div style={styles.locationContainer}>
                  <span style={styles.locationIcon}>ℹ️</span>
                  <p style={styles.locationText}>
                    {personalize(moreDetails.location, profile)}
                  </p>
                </div>
              )}

              {!!moreDetails.contact && (
                <a href={contactLink} style={styles.contactContainer}>
                  <span style={styles.contactIcon}>
                    {contact.includes('@') ? '📧' : '📞'}
                  </span>
                  <span style={styles.contactText}>
                    {contact}
                  </span>
                </a>
              )}

              {!!moreDetails.link && (
                <a 
                  href={personalize(moreDetails.link, profile)}
                  style={styles.linkContainer}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span style={styles.linkIcon}>🔗</span>
                  <span style={styles.linkText}>Open Link</span>
                </a>
              )}

              {!!moreDetails.additionalInfo && moreDetails.additionalInfo.length > 0 && (
                <div style={styles.detailsContainer}>
                  <p style={styles.detailsLabel}>📋 Additional Details:</p>
                  {moreDetails.additionalInfo.map((info: string, i: number) => (
                    <p key={i} style={styles.detailsText}>
                      • {personalize(info, profile)}
                    </p>
                  ))}
                </div>
              )}
              
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main style={styles.container}>
       <h1 style={styles.mainTitle}>Announcements</h1>
       {renderContent()}
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '20px',
    backgroundColor: '#f5f5f5',
    flexGrow: 1,
    minHeight: '100vh',
  },
  listContainer: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  mainTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#121212',
    marginBottom: '15px',
    padding: '0 5px',
    maxWidth: '800px',
    margin: '0 auto 15px auto',
  },
  loadingContainer: {
    display: 'flex',
    flex: 1,
    minHeight: '80vh',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: '10px',
    fontSize: '16px',
    color: '#666',
  },
  empty: {
    display: 'flex',
    flex: 1,
    minHeight: '80vh',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    fontSize: '18px',
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '14px',
    padding: '18px',
    marginBottom: '20px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
  headerRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  categoryBadge: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: '4px 8px',
    borderRadius: '12px',
    border: '1px solid #0ea5e9',
  },
  categoryIcon: {
    fontSize: '12px',
    marginRight: '4px',
  },
  categoryText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0ea5e9',
  },
  priorityBadge: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '12px',
  },
  priorityIcon: {
    fontSize: '10px',
    marginRight: '4px',
  },
  priorityText: {
    fontSize: '12px',
    fontWeight: '600',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#004e92',
    marginBottom: '8px',
    margin: 0,
  },
  metaRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '10px',
    flexWrap: 'wrap',
    gap: '5px 10px',
  },
  date: {
    color: '#6b7280',
    fontSize: '14px',
  },
  author: {
    color: '#6b7280',
    fontSize: '14px',
  },
  deadlineContainer: {
    backgroundColor: '#fef3c7',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '10px',
    borderLeft: '4px solid #f59e0b',
  },
  deadlineLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#92400e',
    marginBottom: '2px',
    margin: 0,
  },
  deadlineText: {
    fontSize: '14px',
    color: '#92400e',
    margin: 0,
  },
  body: {
    fontSize: '16px',
    lineHeight: 1.5,
    marginTop: '10px',
    color: '#333',
    whiteSpace: 'pre-wrap', // Preserves newlines
    margin: 0,
  },
  detailsContainer: {
    backgroundColor: '#f8fafc',
    padding: '12px',
    borderRadius: '8px',
    marginTop: '10px',
    border: '1px solid #e2e8f0',
  },
  detailsLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '5px',
    margin: 0,
  },
  detailsText: {
    fontSize: '14px',
    lineHeight: 1.4,
    color: '#475569',
    marginBottom: '2px',
    margin: 0,
  },
  locationContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '10px',
    padding: '8px',
    backgroundColor: '#ecfdf5',
    borderRadius: '6px',
  },
  locationIcon: {
    fontSize: '16px',
    marginRight: '6px',
  },
  locationText: {
    fontSize: '14px',
    color: '#059669',
    flex: 1,
    margin: 0,
  },
  contactContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    textDecoration: 'none',
  },
  contactIcon: {
    fontSize: '16px',
    marginRight: '8px',
  },
  contactText: {
    fontSize: '14px',
    color: '#1d4ed8',
    textDecoration: 'underline',
  },
  linkContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    textDecoration: 'none',
  },
  linkIcon: {
    fontSize: '16px',
    marginRight: '8px',
  },
  linkText: {
    fontSize: '14px',
    color: '#4f46e5',
    textDecoration: 'underline',
  },
  media: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '10px',
    marginBottom: '10px',
    backgroundColor: '#f0f0f0',
  },
  videoContainer: {
    width: '100%',
    height: '200px',
    borderRadius: '10px',
    marginBottom: '10px',
    position: 'relative',
    backgroundColor: '#000',
    overflow: 'hidden',
    display: 'block',
    textDecoration: 'none',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '10px',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: '60px',
    height: '60px',
    borderRadius: '30px',
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '10px',
  },
  playIcon: {
    fontSize: '24px',
    color: '#fff',
    marginLeft: '3px',
  },
  videoLabel: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: '6px 12px',
    borderRadius: '20px',
  },
  genericVideoContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#004e92',
  },
  videoIcon: {
    fontSize: '40px',
    marginBottom: '10px',
  },
  videoText: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '5px',
  },
  videoSubText: {
    fontSize: '14px',
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
  },
};
