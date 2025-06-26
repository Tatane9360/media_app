'use client'

import { usePathname } from 'next/navigation';
import Icon from './Icon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NavbarAdminProps {
    onLogout?: () => void;
}

const NavbarAdmin = ({ onLogout }: NavbarAdminProps) => {
    const pathname = usePathname();
    const router = useRouter();

    const isActive = (path: string) => {
        const active = path === '/admin' ? pathname === '/admin' : pathname?.startsWith(path);
        return active;
    };

    const handleLogout = async () => {
        if (onLogout) {
            onLogout();
        } else {
            try {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
            } catch (error) {
                console.error("Logout error:", error);
            }
        }
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#292841] border-t border-[#40405c] flex items-center justify-around z-50">
            <Link href="/admin" className="flex flex-col items-center">
                <Icon
                    name="home"
                    size={24}
                    color={isActive('/admin') && !pathname?.includes('/admin/') ? '#E94E1B' : '#FFFFFF'}
                />
                <span className="text-xs mt-1" style={{ color: isActive('/admin') && !pathname?.includes('/admin/') ? '#E94E1B' : '#FFFFFF' }}>
                    Accueil
                </span>
            </Link>

            <Link href="/admin/a-la-une" className="flex flex-col items-center">
                <Icon
                    name="bento"
                    size={24}
                    color={isActive('/admin/a-la-une') ? '#E94E1B' : '#FFFFFF'}
                />
                <span className="text-xs mt-1" style={{ color: isActive('/admin/a-la-une') ? '#E94E1B' : '#FFFFFF' }}>
                    À la une
                </span>
            </Link>

            <Link href="/admin/actualite" className="flex flex-col items-center">
                <Icon
                    name="document"
                    size={24}
                    color={isActive('/admin/actualite') ? '#E94E1B' : '#FFFFFF'}
                />
                <span className="text-xs mt-1" style={{ color: isActive('/admin/articles') ? '#E94E1B' : '#FFFFFF' }}>
                    Actualité
                </span>
            </Link>

            <Link href="/admin/videos" className="flex flex-col items-center">
                <Icon
                    name="youtube"
                    size={24}
                    color={isActive('/admin/videos') ? '#E94E1B' : '#FFFFFF'}
                />
                <span className="text-xs mt-1" style={{ color: isActive('/admin/videos') ? '#E94E1B' : '#FFFFFF' }}>
                    Vidéos
                </span>
            </Link>

            <button
                onClick={handleLogout}
                className="flex flex-col items-center bg-transparent border-0 cursor-pointer"
            >
                <Icon
                    name="settings"
                    size={24}
                    color="#FFFFFF"
                />
                <span className="text-xs mt-1 text-white">
                    Déconnexion
                </span>
            </button>
        </nav>
    );
};

export default NavbarAdmin;
