'use client'

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  className?: string;
  children?: React.ReactNode;
  href?: string;
  variant?: 'default' | 'icon-only';
}

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className}
    width="17" 
    height="14" 
    viewBox="0 0 17 14" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M15.5713 7.00002L1.8208 7.00002" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.9289 12.5L1.42871 7L6.9289 1.50002" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function BackButton({ 
  className = '', 
  children = 'Retour', 
  href,
  variant = 'default'
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  const baseClasses = "flex items-center gap-2 transition-colors duration-200 w-fit rounded-full";
  
  const variantClasses = {
    default: "p-4 bg-main text-color-light font-medium",
    'icon-only': "p-3 bg-main text-color-light"
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      type="button"
    >
      <ArrowLeftIcon className="w-4 h-4" />
      {variant !== 'icon-only' && children}
    </button>
  );
}
