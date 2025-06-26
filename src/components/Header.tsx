import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Header = () => {
  return (
  <header className="bg-[var(--secondary)] h-16 flex items-center justify-start px-6">
    <Link href="/">
      <Image src="/logo.svg" alt="Logo" width={48} height={48} />
    </Link>
  </header>
  );
};

export default Header;