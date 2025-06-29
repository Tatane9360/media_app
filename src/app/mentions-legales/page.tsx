'use client';

import React from 'react';
import { BackButton } from '@components';

export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] pt-6 pb-24 text-foreground dark:text-light">
      <div className="flex items-center px-4 lg:px-8 mb-4">
        <BackButton variant="icon-only" />
      </div>

      <div className="px-4 lg:px-8 max-w-4xl mx-auto">
        <h1 className="text-foreground dark:text-light text-2xl lg:text-3xl font-bold tracking-widest mb-8">
          MENTIONS LÉGALES
        </h1>

        <div className="bg-[var(--navy)] rounded-3xl p-6 lg:p-8 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-[var(--primary)] mb-4">
              1. INFORMATIONS LÉGALES
            </h2>
            <div className="space-y-3 text-sm lg:text-base opacity-90 leading-relaxed">
              <p>
                <strong>Nom de l&apos;entreprise :</strong> [Nom de votre entreprise]
              </p>
              <p>
                <strong>Forme juridique :</strong> [Forme juridique]
              </p>
              <p>
                <strong>Siège social :</strong> [Adresse complète du siège social]
              </p>
              <p>
                <strong>Capital social :</strong> [Montant du capital]
              </p>
              <p>
                <strong>Numéro SIRET :</strong> [Numéro SIRET]
              </p>
              <p>
                <strong>Code APE :</strong> [Code APE]
              </p>
              <p>
                <strong>Numéro de TVA intracommunautaire :</strong> [Numéro de TVA]
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--primary)] mb-4">
              2. DIRECTEUR DE LA PUBLICATION
            </h2>
            <div className="space-y-3 text-sm lg:text-base opacity-90 leading-relaxed">
              <p>
                <strong>Nom :</strong> [Nom du directeur de publication]
              </p>
              <p>
                <strong>Email :</strong> [Email de contact]
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--primary)] mb-4">
              3. HÉBERGEMENT
            </h2>
            <div className="space-y-3 text-sm lg:text-base opacity-90 leading-relaxed">
              <p>
                Ce site est hébergé par :
              </p>
              <p>
                <strong>Nom de l&apos;hébergeur :</strong> [Nom de l&apos;hébergeur]
              </p>
              <p>
                <strong>Adresse :</strong> [Adresse de l&apos;hébergeur]
              </p>
              <p>
                <strong>Téléphone :</strong> [Numéro de téléphone]
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--primary)] mb-4">
              4. PROPRIÉTÉ INTELLECTUELLE
            </h2>
            <div className="text-sm lg:text-base opacity-90 leading-relaxed">
              <p>
                L&apos;ensemble de ce site relève de la législation française et internationale sur le droit d&apos;auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--primary)] mb-4">
              5. RESPONSABILITÉ
            </h2>
            <div className="text-sm lg:text-base opacity-90 leading-relaxed">
              <p>
                Les informations contenues sur ce site sont aussi précises que possible et le site remis à jour à différentes périodes de l&apos;année, mais peut toutefois contenir des inexactitudes ou des omissions. Si vous constatez une lacune, erreur ou ce qui parait être un dysfonctionnement, merci de bien vouloir le signaler par email.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--primary)] mb-4">
              6. LIENS HYPERTEXTES
            </h2>
            <div className="text-sm lg:text-base opacity-90 leading-relaxed">
              <p>
                Les liens hypertextes mis en place dans le cadre du présent site web en direction d&apos;autres ressources présentes sur le réseau Internet ne sauraient engager la responsabilité de [Nom de votre entreprise].
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--primary)] mb-4">
              7. DONNÉES PERSONNELLES
            </h2>
            <div className="text-sm lg:text-base opacity-90 leading-relaxed">
              <p>
                Aucune information personnelle n&apos;est collectée à votre insu. Aucune information personnelle n&apos;est cédée à des tiers. Pour plus d&apos;informations, consultez notre politique de confidentialité.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--primary)] mb-4">
              8. DROIT APPLICABLE
            </h2>
            <div className="text-sm lg:text-base opacity-90 leading-relaxed">
              <p>
                Tout litige en relation avec l&apos;utilisation du site est soumis au droit français. Il est fait attribution exclusive de juridiction aux tribunaux compétents de [Ville].
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}