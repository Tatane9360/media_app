# Architecture de l'Application de Montage Vidéo Admin (Next.js + MongoDB)

Cette application permet à un administrateur d'importer, d'éditer, de rendre et de publier des vidéos via une interface web/mobile responsive basée sur Next.js.

## Architecture du Système

### Schéma Logique

```
+---------------------+    +----------------------+    +-------------------+
| Frontend (Next.js)  | <- | Backend (API Routes) | <- | MongoDB Database  |
+---------------------+    +----------------------+    +-------------------+
        ^                          ^                           ^
        |                          |                           |
        v                          v                           v
+---------------------+    +----------------------+    +-------------------+
| Client Mobile/Web   |    | Services de Rendu    |    | Stockage Cloud    |
|                     |    | (FFmpeg/Shotstack)   |    | (S3/Cloudinary)   |
+---------------------+    +----------------------+    +-------------------+
```
        |  Project Models)|               |  Cloudinary)     |
        +----------------+                +-----------------+
                |
                v
    +----------------------------+
    |    Video Rendering Engine  |
    |  (FFmpeg or external API)  |
    +----------------------------+
                |
                v
     +----------------------------+
     |  Published Video (URL)     |
     |  (stored in Project.publishedUrl) |
     +----------------------------+

examples :

```tsx
// pages/api/upload.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { VideoAssetModel } from '@/models/VideoAsset';
import { connectDB } from '@/lib/mongoose';

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  const form = formidable({ multiples: false });
  form.parse(req, async (err, fields, files) => {
    const file = files.file[0];
    const result = await uploadToCloudinary(file.filepath);

    const asset = await VideoAssetModel.create({
      owner: fields.userId,
      originalName: file.originalFilename,
      storageUrl: result.secure_url,
      duration: result.duration,
      metadata: result // dimensions, codec, etc.
    });

    res.status(200).json({ success: true, asset });
  });
}
```

```tsx
// scripts/renderVideo.ts
import { spawn } from 'child_process';
import path from 'path';

export function renderTimeline(timeline: any, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpegArgs = [
      '-i', timeline.input1,
      '-i', timeline.input2,
      '-filter_complex', '[0:v][1:v]concat=n=2:v=1:a=0[outv]',
      '-map', '[outv]',
      '-y',
      outputPath,
    ];

    const ffmpeg = spawn('ffmpeg', ffmpegArgs);

    ffmpeg.stderr.on('data', (data) => console.error(data.toString()));
    ffmpeg.on('exit', (code) => (code === 0 ? resolve() : reject(`Exit code ${code}`)));
  });
}
```

```tsx
// pages/api/project/create.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '@/lib/mongoose';
import { ProjectModel } from '@/models/Project';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();
  if (req.method !== 'POST') return res.status(405).end();

  const { title, owner, videoAssets } = req.body;

  const project = await ProjectModel.create({
    title,
    owner,
    videoAssets,
    status: 'draft',
    timeline: { tracks: [] },
  });

  res.status(201).json({ success: true, project });
}
```