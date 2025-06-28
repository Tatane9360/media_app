#!/usr/bin/env node

/**
 * Script de migration pour ajouter le champ isAudioOnly aux MediaAssets existants
 * Ce script détecte automatiquement les fichiers audio en se basant sur le mimeType
 */

import { connectDB } from '../src/lib/mongodb.js';
import { MediaAsset } from '../src/models/MediaAsset.js';

async function migrateAudioDetection() {
    try {
        console.log('🔧 Connexion à la base de données...');
        await connectDB();

        console.log('🔍 Recherche des assets vidéo sans le champ isAudioOnly...');

        // Trouver tous les assets qui n'ont pas le champ isAudioOnly
        const assetsToUpdate = await MediaAsset.find({
            isAudioOnly: { $exists: false }
        });

        console.log(`📊 Trouvé ${assetsToUpdate.length} assets à migrer`);

        if (assetsToUpdate.length === 0) {
            console.log('✅ Aucune migration nécessaire');
            process.exit(0);
        }

        let audioCount = 0;
        let videoCount = 0;

        // Mettre à jour chaque asset
        for (const asset of assetsToUpdate) {
            const isAudio = asset.mimeType.startsWith('audio/');

            await MediaAsset.findByIdAndUpdate(asset._id, {
                isAudioOnly: isAudio,
                hasAudio: isAudio || asset.hasAudio // Si c'est audio seulement, alors hasAudio = true
            });

            if (isAudio) {
                audioCount++;
                console.log(`🎵 Asset audio détecté: ${asset.originalName} (${asset.mimeType})`);
            } else {
                videoCount++;
                console.log(`🎬 Asset vidéo: ${asset.originalName} (${asset.mimeType})`);
            }
        }

        console.log('📈 Résultats de la migration:');
        console.log(`   - Assets audio: ${audioCount}`);
        console.log(`   - Assets vidéo: ${videoCount}`);
        console.log(`   - Total traité: ${assetsToUpdate.length}`);
        console.log('✅ Migration terminée avec succès!');

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        process.exit(1);
    }
}

// Exécuter la migration si ce script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateAudioDetection();
}

export { migrateAudioDetection };
