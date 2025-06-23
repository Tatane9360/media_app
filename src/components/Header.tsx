import React from 'react';
import Image from 'next/image';

const Header = () => {
  return (
    <header className="bg-dark h-16 flex items-center justify-start px-6">
      <Image src="/logo.svg" alt="Logo" width={48} height={48} />
    </header>
  );
};

export default Header; 