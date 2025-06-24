import { NextResponse } from "next/server";
import { renderVideoFromTimeline } from "@/lib/videoProcessing";

export async function GET() {
  try {
    // Timeline de test avec un clip simple
    const testTimeline = {
      duration: 10,
      clips: [
        {
          id: "test-clip-1",
          assetId: "test-asset-1",
          trackIndex: 0,
          startTime: 0,
          endTime: 10,
        },
      ],
      audioTracks: [],
    };

    // Asset de test (utilise une vidéo Cloudinary existante)
    const testAssets = [
      {
        _id: "test-asset-1",
        id: "test-asset-1",
        admin_id: "test-admin",
        originalName: "test-video.mp4",
        storageUrl:
          "https://res.cloudinary.com/dexgnx9ki/video/upload/v1750192710/uploads/1750192708755-Enregistrement_de_l_e_cran_2025-06-17_a__22.mov",
        duration: 30,
        mimeType: "video/mp4",
        fileSize: 1024000,
        metadata: {
          width: 1920,
          height: 1080,
          codec: "h264",
          framerate: 30,
          bitrate: 2000,
        },
        tags: [],
        hasAudio: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const renderSettings = {
      format: "mp4",
      quality: "medium",
      codec: "h264",
      bitrateVideo: 2000,
      bitrateAudio: 128,
    };

    console.log("🧪 Démarrage du test de rendu...");

    const result = await renderVideoFromTimeline(
      testTimeline,
      testAssets,
      renderSettings
    );

    return NextResponse.json({
      success: true,
      message: "Test de rendu réussi",
      outputPath: result.outputPath,
    });
  } catch (error) {
    console.error("❌ Erreur lors du test de rendu:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
