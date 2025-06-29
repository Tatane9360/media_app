'use client'

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Icon from './Icon';
import Link from 'next/link';

import { useAuth } from '@hooks';

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading, logout, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [pathname, checkAuth]);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    
    if (path === '/projects') {
      return pathname?.startsWith('/projects') || 
             pathname?.includes('project') || 
             (isAuthenticated && pathname?.startsWith('/videos'));
    }
    
    if (path === '/videos') {
      return pathname?.startsWith('/videos');
    }
    
    return pathname === path;
  };

  // Détermine le lien vidéos selon l'état de connexion
  const getVideosLink = () => {
    if (loading) return '/videos';
    return isAuthenticated ? '/projects' : '/videos';
  };

  // Détermine le lien home selon l'état de connexion
  const getHomeLink = () => {
    if (loading) return '/';
    return isAuthenticated ? '/admin' : '/';
  };

  const getBlogLink = () => {
    if (loading) return '/blog';
    return isAuthenticated ? '/admin/actualite' : '/blog';
  };
  
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const videosPath = getVideosLink();
  const homePath = getHomeLink();
  const blogPath = getBlogLink();

  return (
    <nav className="bg-[var(--background)] fixed bottom-0 left-0 right-0 h-fit w-[100dvw] px-4 py-6 bg-navy flex items-center justify-around z-50">
      <Link href={homePath} className="flex flex-col items-center gap-0.5">
        <Icon 
          name="home" 
          size={28} 
          color={isActive(homePath) ? '#F26B3D' : '#F6F6F6'} 
        />
        <span className="text-xs" style={{ color: isActive(homePath) ? '#F26B3D' : '#F6F6F6' }}>Accueil</span>
      </Link>

      {isAuthenticated && (
        <>
          <Link href="/admin/featured" className="flex flex-col items-center gap-0.5">
            <Icon 
              name="bento"
              size={28} 
              color={isActive('/admin/featured') ? '#F26B3D' : '#F6F6F6'} 
            />
            <span className="text-xs" style={{ color: isActive('/admin/featured') ? '#F26B3D' : '#F6F6F6' }}>À la une</span>
          </Link>
        </>
      )}

      <Link href={blogPath} className="flex flex-col items-center gap-0.5">
        <Icon 
          name="document" 
          size={28} 
          color={isActive(blogPath) ? '#F26B3D' : '#F6F6F6'} 
        />
        <span className="text-xs" style={{ color: isActive(blogPath) ? '#F26B3D' : '#F6F6F6' }}>actualité</span>
      </Link>
      
      <Link href={videosPath} className="flex flex-col items-center gap-0.5">
        <Icon 
          name="youtube" 
          size={28} 
          color={isActive(videosPath) ? '#F26B3D' : '#F6F6F6'} 
        />
        <span className="text-xs" style={{ color: isActive(videosPath) ? '#F26B3D' : '#F6F6F6' }}>
          {isAuthenticated ? 'Projets' : 'Vidéos'}
        </span>
      </Link>

      {isAuthenticated && (
        <>
          <button onClick={handleLogout} className="flex flex-col items-center gap-0.5">
            <Icon 
              name="logout"
              size={28} 
              color="#F6F6F6" 
            />
            <span className="text-xs" style={{ color: '#F6F6F6' }}>Déconnexion</span>
          </button>
        </>
      )}
    </nav>
  );
};

export default Navbar; 