'use client'

import { usePathname, useRouter } from 'next/navigation';
import Icon from './Icon';
import Link from 'next/link';
import { useAuth } from '@/hooks';

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading, logout } = useAuth();

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

  // Détermine le lien home selon l'état de connexion
  const getHomeLink = () => {
    if (loading) return '/';
    return isAuthenticated ? '/admin' : '/';
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const videosPath = getVideosLink();
  const homePath = getHomeLink();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-navy flex items-center justify-around z-50">
      <Link href={homePath} className="flex flex-col items-center">
        <Icon 
          name="home" 
          size={28} 
          color={isActive(homePath) || (isAuthenticated && isActive('/admin')) ? '#F36B3D' : '#F6F6F6'} 
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

      {isAuthenticated && (
        <>
          <Link href="/admin" className="flex flex-col items-center">
            <Icon 
              name="bento"
              // TODO : Change after creating "à la une" page
              size={28} 
              color={isActive('/admin') ? '#F36B3D' : '#F6F6F6'} 
            />
          </Link>
          
          <button onClick={handleLogout} className="flex flex-col items-center">
            <Icon 
              name="arrowLeft"
              // TODO : Change to logout icon
              size={28} 
              color="#F6F6F6" 
            />
          </button>
        </>
      )}
    </nav>
  );
};

export default Navbar; 