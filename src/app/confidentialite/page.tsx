'use client';

import React from 'react';
import { BackButton } from '@components';

export default function ConfidentialitePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] pt-6 pb-24 text-foreground dark:text-light">
      <div className="flex items-center px-4 lg:px-8 mb-4">
        <BackButton variant="icon-only" />
      </div>

      <div className="px-4 lg:px-8 max-w-4xl mx-auto">
        <h1 className="text-foreground dark:text-light text-2xl lg:text-3xl font-bold tracking-widest mb-8">
          POLITIQUE DE CONFIDENTIALITÉ
        </h1>

        <div className="bg-[var(--navy)] rounded-3xl p-6 lg:p-8 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-[var(--primary)] mb-4">
              1. COLLECTE DES DONNÉES
            </h2>
            <div className="text-sm lg:text-base opacity-90 leading-relaxed">
              <p className="mb-4">
                Nous collectons les informations que vous nous fournissez directement, notamment :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Informations d&apos;inscription (nom, email, mot de passe)</li>
                <li>Contenu que vous créez ou partagez sur notre plateforme</li>
                <li>Communications avec notre équipe support</li>
                <li>Préférences et paramètres de votre compte</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--primary)] mb-4">
              2. UTILISATION DES DONNÉES
            </h2>
            <div className="text-sm lg:text-base opacity-90 leading-relaxed">
              <p className="mb-4">
                Nous utilisons vos données personnelles pour :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Fournir et améliorer nos services</li>
                <li>Personnaliser votre expérience utilisateur</li>
                <li>Communiquer avec vous concernant votre compte</li>
                <li>Assurer la sécurité de la plateforme</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--primary)] mb-4">
              3. PARTAGE DES DONNÉES
            </h2>
            <div className="text-sm lg:text-base opacity-90 leading-relaxed">
              <p className="mb-4">
                Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos informations dans les cas suivants :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Avec votre consentement explicite</li>
                <li>Avec nos prestataires de services de confiance</li>
                <li>Pour se conformer à des obligations légales</li>
                <li>Pour protéger nos droits et notre sécurité</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--primary)] mb-4">
              4. COOKIES
            </h2>
            <div className="text-sm lg:text-base opacity-90 leading-relaxed">
              <p className="mb-4">
                Notre site utilise des cookies pour :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Maintenir votre session de connexion</li>
                <li>Mémoriser vos préférences</li>
                <li>Analyser l&apos;utilisation du site</li>
                <li>Améliorer la performance du site</li>
              </ul>
              <p className="mt-4">
                Vous pouvez désactiver les cookies dans les paramètres de votre navigateur, mais cela peut affecter le fonctionnement du site.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--primary)] mb-4">
              5. SÉCURITÉ DES DONNÉES
            </h2>
            <div className="text-sm lg:text-base opacity-90 leading-relaxed">
              <p>
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données personnelles contre l&apos;accès non autorisé, la modification, la divulgation ou la destruction. Cependant, aucune méthode de transmission sur Internet n&apos;est 100% sécurisée.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--primary)] mb-4">
              6. VOS DROITS
            </h2>
            <div className="text-sm lg:text-base opacity-90 leading-relaxed">
              <p className="mb-4">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Droit d&apos;accès :</strong> consulter les données que nous détenons sur vous</li>
                <li><strong>Droit de rectification :</strong> corriger les données inexactes</li>
                <li><strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données</li>
                <li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format structuré</li>
                <li><strong>Droit d&apos;opposition :</strong> vous opposer au traitement de vos données</li>
                <li><strong>Droit à la limitation :</strong> demander la limitation du traitement</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--primary)] mb-4">
              7. CONSERVATION DES DONNÉES
            </h2>
            <div className="text-sm lg:text-base opacity-90 leading-relaxed">
              <p>
                Nous conservons vos données personnelles uniquement aussi longtemps que nécessaire pour les finalités décrites dans cette politique ou pour respecter nos obligations légales. Les données de compte inactif depuis plus de 3 ans peuvent être supprimées.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--primary)] mb-4">
              8. MODIFICATIONS
            </h2>
            <div className="text-sm lg:text-base opacity-90 leading-relaxed">
              <p>
                Cette politique de confidentialité peut être mise à jour périodiquement. Nous vous informerons de tout changement significatif par email ou via une notification sur notre site.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--primary)] mb-4">
              9. CONTACT
            </h2>
            <div className="text-sm lg:text-base opacity-90 leading-relaxed">
              <p className="mb-4">
                Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, contactez-nous :
              </p>
              <div className="bg-[var(--background)] rounded-lg p-4 space-y-2">
                <p><strong>Email :</strong> [email de contact]</p>
                <p><strong>Adresse :</strong> [adresse postale]</p>
                <p><strong>Délégué à la protection des données :</strong> [email DPO]</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}