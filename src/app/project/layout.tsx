'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  return (
    <div>
      <nav className="bg-gray-800 text-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="font-bold text-xl">
                Media App
              </Link>
              
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/projects"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/projects' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Tous les projets
                </Link>
                
                <Link
                  href="/project/new"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/project/new' 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Nouveau projet
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <main>{children}</main>
    </div>
  );
}
