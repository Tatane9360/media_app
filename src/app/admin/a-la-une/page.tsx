'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components';

interface FeaturedContent {
    _id?: string;
    title: string;
    description: string;
    videoUrl: string;
    image?: string;
}

export default function ALaUnePage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [featuredContent, setFeaturedContent] = useState<FeaturedContent>({
        title: '',
        description: '',
        videoUrl: '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        // Charger le contenu à la une existant
        const fetchFeaturedContent = async () => {
            try {
                const response = await fetch('/api/a-la-une');
                const data = await response.json();

                if (response.ok && data.featured) {
                    setFeaturedContent(data.featured);
                    if (data.featured.image) {
                        setPreviewImage(data.featured.image);
                    }
                }
            } catch (err) {
                console.error('Erreur lors du chargement du contenu à la une:', err);
            }
        };

        fetchFeaturedContent();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFeaturedContent(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);

            // Créer une URL pour la prévisualisation
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Créer un FormData pour envoyer l'image
            const formData = new FormData();
            formData.append('title', featuredContent.title);
            formData.append('description', featuredContent.description);
            formData.append('videoUrl', featuredContent.videoUrl);

            if (imageFile) {
                formData.append('image', imageFile);
            }

            // Si on a un ID, c'est une mise à jour
            if (featuredContent._id) {
                formData.append('_id', featuredContent._id);
            }

            // Envoyer les données
            const response = await fetch('/api/a-la-une', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Une erreur est survenue');
            }

            // Rediriger vers la page admin principale
            router.push('/admin');

        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push('/admin');
    };

    return (
        <div className="min-h-screen bg-[#1F1F2C]">
            <Header />

            <main className="px-6 py-6 pb-20">
                {/* Exactement comme sur la maquette */}
                <h1 className="text-white text-2xl font-bold mb-8">A LA UNE</h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Image upload - Style exact comme sur la maquette */}
                    <div>
                        <div className="w-[72px] h-[52px] bg-white rounded-md flex items-center justify-center overflow-hidden">
                            {previewImage ? (
                                <Image
                                    src={previewImage}
                                    alt="Aperçu de l'image"
                                    width={72}
                                    height={52}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                style={{ width: "72px", height: "52px" }}
                            />
                        </div>
                    </div>

                    {/* TITRE - Style exact comme sur la maquette */}
                    <div>
                        <label htmlFor="title" className="block text-white font-medium mb-1">TITRE*</label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            required
                            value={featuredContent.title}
                            onChange={handleInputChange}
                            placeholder="ZONE DE TEXTE"
                            className="w-full h-12 px-4 rounded-lg bg-white text-gray-800 placeholder-gray-400"
                        />
                    </div>

                    {/* DESCRIPTION - Style exact comme sur la maquette */}
                    <div>
                        <label htmlFor="description" className="block text-white font-medium mb-1">DESCRIPTION*</label>
                        <input
                            id="description"
                            name="description"
                            type="text"
                            required
                            value={featuredContent.description}
                            onChange={handleInputChange}
                            placeholder="ZONE DE TEXTE"
                            className="w-full h-12 px-4 rounded-lg bg-white text-gray-800 placeholder-gray-400"
                        />
                    </div>

                    {/* LIEN VIDÉO - Style exact comme sur la maquette */}
                    <div>
                        <label htmlFor="videoUrl" className="block text-white font-medium mb-1">LIEN VIDÉO*</label>
                        <input
                            id="videoUrl"
                            name="videoUrl"
                            type="text"
                            required
                            value={featuredContent.videoUrl}
                            onChange={handleInputChange}
                            placeholder="ZONE DE TEXTE"
                            className="w-full h-12 px-4 rounded-lg bg-white text-gray-800 placeholder-gray-400"
                        />
                    </div>

                    {/* Message d'erreur */}
                    {error && (
                        <div className="text-red-500 text-center">{error}</div>
                    )}

                    {/* Boutons - Style exact comme sur la maquette */}
                    <div className="flex gap-3 mt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-[#E94E1B] text-white py-3 rounded-md text-center"
                        >
                            ENREGISTRER
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 bg-white text-black py-3 rounded-md text-center"
                        >
                            ANNULER
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
