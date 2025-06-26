// Script de migration pour détecter automatiquement hasAudio sur les assets existants
import mongoose from 'mongoose';

// Configuration de la base de données
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/media_app";

// Schéma VideoAsset simplifié pour la migration
const VideoAssetSchema = new mongoose.Schema({
    originalName: String,
    storageUrl: String,
    duration: Number,
    mimeType: String,
    metadata: {
        audioChannels: Number,
        audioSampleRate: Number,
    },
    hasAudio: Boolean,
}, { timestamps: true });

const VideoAsset = mongoose.model('VideoAsset', VideoAssetSchema);

async function migrateAudioDetection() {
    try {
        console.log('Connexion à MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connecté à MongoDB');

        // Trouver tous les assets sans hasAudio défini ou avec hasAudio à false/undefined
        const assetsToUpdate = await VideoAsset.find({
            $or: [
                { hasAudio: { $exists: false } },
                { hasAudio: false },
                { hasAudio: null }
            ]
        });

        console.log(`Trouvé ${assetsToUpdate.length} assets à mettre à jour`);

        let updatedCount = 0;
        let audioDetectedCount = 0;

        for (const asset of assetsToUpdate) {
            let hasAudio = false;

            // Méthode 1: Vérifier les métadonnées audio
            if (asset.metadata && asset.metadata.audioChannels && asset.metadata.audioChannels > 0) {
                hasAudio = true;
                console.log(`✅ Audio détecté via métadonnées pour: ${asset.originalName} (${asset.metadata.audioChannels} canaux)`);
            }
            // Méthode 2: Vérifier le type MIME
            else if (asset.mimeType) {
                const mimeType = asset.mimeType.toLowerCase();
                if (mimeType.includes('audio/') ||
                    (mimeType.includes('video/') && !mimeType.includes('gif'))) {
                    hasAudio = true;
                    console.log(`🔍 Audio supposé via MIME type pour: ${asset.originalName} (${asset.mimeType})`);
                }
            }
            // Méthode 3: Par défaut, supposer qu'une vidéo a de l'audio
            else {
                hasAudio = true;
                console.log(`🤔 Audio supposé par défaut pour: ${asset.originalName}`);
            }

            // Mettre à jour l'asset
            await VideoAsset.findByIdAndUpdate(asset._id, { hasAudio });
            updatedCount++;

            if (hasAudio) {
                audioDetectedCount++;
            }

            console.log(`Mis à jour: ${asset.originalName} -> hasAudio: ${hasAudio}`);
        }

        console.log('\n📊 Résumé de la migration:');
        console.log(`- Assets traités: ${updatedCount}`);
        console.log(`- Assets avec audio détecté: ${audioDetectedCount}`);
        console.log(`- Assets sans audio: ${updatedCount - audioDetectedCount}`);

        await mongoose.disconnect();
        console.log('\n✅ Migration terminée avec succès!');

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        process.exit(1);
    }
}

// Exécuter la migration
migrateAudioDetection();
