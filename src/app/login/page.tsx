'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { BackButton, Button } from '@components';
import { useAuth } from '@/hooks';

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        router.push('/admin');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    const form = document.getElementById('login-form') as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  };

  return (
    <div className='flex flex-col items-center'>
      <div className="bg-navy rounded-2xl shadow-2xl w-full max-w-xl p-4 flex flex-col gap-2.5">
        <div className="text-center">
          <h1 className="uppercase">Connexion</h1>
        </div>

        {message && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg">
            <p className="text-green-700 text-sm font-medium">{message}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <form id="login-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-1.5'>
              <label htmlFor="email" className="text-sm text-foreground">
                E-MAIL*
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-800 bg-gray-50 focus:bg-white"
                placeholder="Enter your email"
              />
            </div>

            <div className='flex flex-col gap-1.5'>
              <label htmlFor="password" className="text-sm text-foreground">
                  MOT DE PASSE*
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-gray-800 bg-gray-50 focus:bg-white"
                placeholder="Enter your password"
              />
              <Link href="/forgot-password" className="text-sm hover:underline">
                Mot de passe oublié ? // TODO : add forgot-password functionality
              </Link>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            disabled={loading}
            onClick={handleButtonClick}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
      </div>
    </div>
  );
}

function LoginLoading() {
  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
        <p className="text-gray-600">Sign in to your account</p>
      </div>
      <div className="animate-pulse space-y-6">
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        <div className="h-12 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        <div className="h-12 bg-gray-300 rounded"></div>
        <div className="h-12 bg-blue-300 rounded"></div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <div className="flex flex-col gap-6 w-full justify-center p-4 mt-24">
      <BackButton variant='icon-only' />
      <Suspense fallback={<LoginLoading />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
