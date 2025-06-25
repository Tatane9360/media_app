'use client'

import { usePathname } from 'next/navigation';
import Icon from './Icon';
import Link from 'next/link';
import { useAuth } from '@/hooks';

const Navbar = () => {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  const isActive = (path: string) => {
    const active = path === '/' ? pathname === '/' : pathname?.startsWith(path);
    console.log(`Checking ${path} against ${pathname}: ${active}`);
    return active;
  };

  // Détermine le lien vidéos selon l'état de connexion
  const getVideosLink = () => {
    if (loading) return '/videos';
    return isAuthenticated ? '/projects' : '/videos';
  };

  const videosPath = getVideosLink();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-navy flex items-center justify-around z-50">
      <Link href="/" className="flex flex-col items-center">
        <Icon 
          name="home" 
          size={28} 
          color={isActive('/') ? '#F36B3D' : '#F6F6F6'} 
        />
      </Link>
      
      <Link href="/blog" className="flex flex-col items-center">
        <Icon 
          name="document" 
          size={28} 
          color={isActive('/blog') ? '#F36B3D' : '#F6F6F6'} 
        />
      </Link>
      
      <Link href={videosPath} className="flex flex-col items-center">
        <Icon 
          name="youtube" 
          size={28} 
          color={isActive(videosPath) ? '#F36B3D' : '#F6F6F6'} 
        />
      </Link>
    </nav>
  );
};

export default Navbar; 