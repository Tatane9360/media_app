'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface Article {
    title: string;
    author: {
        email: string;
    };
    createdAt: string;
    published: boolean;
    image?: string;
    content: string;
}

interface ArticleDetailProps {
    article: Article;
    onClose: () => void;
}

export default function ArticleDetail({ article, onClose }: ArticleDetailProps) {
    const overlayRef = useRef(null);
    const modalRef = useRef(null);

    useEffect(() => {
        if (overlayRef.current && modalRef.current) {
            gsap.fromTo(overlayRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.3 }
            );
            gsap.fromTo(modalRef.current,
                {
                    scale: 0.8,
                    y: 50,
                    opacity: 0
                },
                {
                    scale: 1,
                    y: 0,
                    opacity: 1,
                    duration: 0.4,
                    ease: "back.out(1.7)"
                }
            );
        }
    }, []);

    const handleClose = () => {
        if (overlayRef.current && modalRef.current) {
            gsap.to(modalRef.current, {
                scale: 0.8,
                y: 50,
                opacity: 0,
                duration: 0.3,
                ease: "power2.in"
            });
            gsap.to(overlayRef.current, {
                opacity: 0,
                duration: 0.3,
                onComplete: onClose
            });
        } else {
            onClose();
        }
    };

    if (!article) return null; return (
        <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md">
            <div ref={modalRef} className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">        <button
                onClick={handleClose}
                className="absolute top-3 right-3 text-black hover:text-gray-800 text-2xl"
                aria-label="Close"            >
                &times;
            </button>        <h2 className="text-2xl font-bold mb-2 text-black">{article.title}</h2>
                <div className="flex items-center gap-4 text-sm text-black mb-4">
                    <span>By: {article.author.email}</span>
                    <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                    <span className={`px-2 py-1 rounded text-xs ${article.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {article.published ? 'Published' : 'Draft'}
                    </span>
                </div>
                {article.image && (
                    <img
                        src={article.image}
                        alt={article.title}
                        className="w-full max-h-60 object-cover rounded mb-4"
                    />)}
                <div className="prose max-w-none text-black" style={{ whiteSpace: 'pre-wrap' }}>
                    {article.content}
                </div>
            </div>
        </div>
    );
}
