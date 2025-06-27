'use client';

import { useRouter } from 'next/navigation';

interface ArticleEditorProps {
  article?: any;
  onClose?: () => void;
}

export default function ArticleEditor({ article, onClose }: ArticleEditorProps) {
  const router = useRouter();

  if (article && article._id) {
    router.push(`/admin/actualite/edit?id=${article._id}`);
  } else {
    router.push('/admin/actualite/edit');
  }

  if (onClose) {
    onClose();
  }

  return null;
}
