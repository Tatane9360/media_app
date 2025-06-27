import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Schéma Article simple pour la migration
const ArticleSchema = new mongoose.Schema({
  title: String,
  content: String,
  description: String,
  image: String,
  published: Boolean,
  author: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
}, { timestamps: true });

const Article = mongoose.model('Article', ArticleSchema);

async function migrateArticles() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Trouver tous les articles sans description
    const articlesWithoutDescription = await Article.find({
      $or: [
        { description: { $exists: false } },
        { description: null },
        { description: '' }
      ]
    });

    console.log(`📝 Trouvé ${articlesWithoutDescription.length} articles sans description`);

    if (articlesWithoutDescription.length === 0) {
      console.log('✅ Tous les articles ont déjà une description');
      return;
    }

    // Fonction pour extraire du texte du contenu et créer une description
    function createDescriptionFromContent(content) {
      if (!content) return 'Description à compléter';
      
      // Supprimer les balises HTML/Markdown
      const plainText = content
        .replace(/<[^>]*>/g, '') // Supprimer HTML
        .replace(/[#*`_~\[\]()]/g, '') // Supprimer Markdown
        .replace(/\n/g, ' ') // Remplacer retours à la ligne par espaces
        .trim();
      
      // Tronquer à 200 caractères maximum
      if (plainText.length <= 200) {
        return plainText;
      }
      
      // Couper au dernier espace avant 200 caractères
      const truncated = plainText.substring(0, 200);
      const lastSpace = truncated.lastIndexOf(' ');
      return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
    }

    // Mettre à jour chaque article
    let updatedCount = 0;
    for (const article of articlesWithoutDescription) {
      const description = createDescriptionFromContent(article.content);
      
      await Article.findByIdAndUpdate(article._id, {
        description: description
      });
      
      updatedCount++;
      console.log(`📝 Mise à jour article "${article.title}" (${updatedCount}/${articlesWithoutDescription.length})`);
    }

    console.log(`✅ Migration terminée: ${updatedCount} articles mis à jour`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter la migration
migrateArticles(); 