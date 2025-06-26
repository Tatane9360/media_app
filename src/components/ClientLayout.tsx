'use client';

import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import NavbarAdmin from "@/components/NavbarAdmin";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAdminPage = pathname?.startsWith('/admin');

    return (
        <>
            {children}
            {isAdminPage ? <NavbarAdmin /> : <Navbar />}
        </>
    );
}
