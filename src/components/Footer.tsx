import React from 'react';
import Button from './Button';
import Icon from './Icon';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-dark px-6 py-8 pb-20 bg-[var(--background)]">
      <div className="text-center">
        <h3 className="text-light text-lg font-bold mb-6">
          RETROUVEZ NOUS ICI
        </h3>
        
        <div className="flex justify-center gap-6 mb-8">
          <Button variant="secondary" size="md" className="w-12 h-12 p-0">
            <Icon name="logoYoutube" size={20} />
          </Button>
          
          <Button variant="secondary" size="md" className="w-12 h-12 p-0">
            <Icon name="logoInstagram" size={20} />
          </Button>
          
          <Button variant="secondary" size="md" className="w-12 h-12 p-0">
            <Icon name="logoTikok" size={20} />
          </Button>
        </div>
        
        <div className="space-y-4 text-light text-sm">
          <div className="border-t border-gray-600 pt-6">
            <Link href="/mentions-legales">
              <Button variant="ghost" size="sm" className="block mx-auto mb-3 font-medium">
                MENTIONS LÉGALES
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="block mx-auto mb-3 font-medium">
                ADMIN
              </Button>
            </Link>
            <Link href="/confidentialite">
              <Button variant="ghost" size="sm" className="block mx-auto font-medium">
                CONFIDENTIALITÉ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 