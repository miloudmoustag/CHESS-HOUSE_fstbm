import { LocalizedText } from '../config/site';

export interface ClubDocument {
  id: string;
  filePath: string;
  languageLabel: string;
  title: LocalizedText;
  description: LocalizedText;
  updatedAt: string;
  isPlaceholder: boolean;
}

export const CLUB_DOCUMENTS: ClubDocument[] = [
  {
    id: 'reglement-fr',
    filePath: '/docs/reglement-interieur-fr.pdf',
    languageLabel: 'FR · PDF',
    title: {
      fr: 'Règlement intérieur (Français)',
      en: 'Internal Regulation (French)',
      ar: 'القانون الداخلي (بالفرنسية)',
    },
    description: {
      fr: 'Charte de fonctionnement, adhésion, respect des locaux et règles de fair-play du club.',
      en: 'Club governance, membership terms, campus conduct and fair-play rules.',
      ar: 'ميثاق التسيير وشروط الانخراط واحترام الفضاء الجامعي وقواعد اللعب النظيف.',
    },
    updatedAt: '2026-09-25',
    isPlaceholder: true,
  },
  {
    id: 'reglement-ar',
    filePath: '/docs/reglement-interieur-ar.pdf',
    languageLabel: 'AR · PDF',
    title: {
      fr: 'Règlement intérieur (Arabe)',
      en: 'Internal Regulation (Arabic)',
      ar: 'القانون الداخلي (بالعربية)',
    },
    description: {
      fr: 'Version arabe officielle du règlement intérieur de Chess House Club.',
      en: 'Official Arabic version of the Chess House Club internal regulation.',
      ar: 'النسخة العربية الرسمية من القانون الداخلي لنادي بيت الشطرنج.',
    },
    updatedAt: '2026-09-25',
    isPlaceholder: true,
  },
  {
    id: 'presentation-fr',
    filePath: '/docs/presentation-club-fr.pdf',
    languageLabel: 'FR · PDF',
    title: {
      fr: 'Présentation du club (Français)',
      en: 'Club Presentation (French)',
      ar: 'تقديم النادي (بالفرنسية)',
    },
    description: {
      fr: 'Histoire depuis le 18 octobre 2025, objectifs pédagogiques, séances et tournois.',
      en: 'History since 18 October 2025, educational goals, sessions and tournaments.',
      ar: 'نبذة عن النادي منذ تأسيسه في 18 أكتوبر 2025 وأهدافه البيداغوجية والبطولات.',
    },
    updatedAt: '2026-10-01',
    isPlaceholder: true,
  },
  {
    id: 'pv-election-2026',
    filePath: '/docs/pv-election-2026.pdf',
    languageLabel: 'FR · PDF',
    title: {
      fr: 'Procès-verbal d’élection du bureau 2026/27',
      en: '2026/27 Board Election Minutes',
      ar: 'محضر انتخاب المكتب المسير 2026/27',
    },
    description: {
      fr: 'Compte-rendu officiel de l’assemblée élective du 25 septembre 2026 (15 membres présents).',
      en: 'Official minutes of the 25 September 2026 election assembly (15 members present).',
      ar: 'المحضر الرسمي للجمع الانتخابي المنعقد بتاريخ 25 شتنبر 2026 بحضور 15 عضواً.',
    },
    updatedAt: '2026-09-25',
    isPlaceholder: true,
  },
  {
    id: 'dossier-sponsoring',
    filePath: '/docs/dossier-sponsoring-fr.pdf',
    languageLabel: 'FR · PDF',
    title: {
      fr: 'Dossier de partenariat et sponsoring',
      en: 'Partnership & Sponsorship Dossier',
      ar: 'ملف الشراكة والرعاية',
    },
    description: {
      fr: 'Présentation des activités, audience universitaire et modalités de soutien.',
      en: 'Club activities overview, university audience reach and sponsorship formats.',
      ar: 'عرض أنشطة النادي والانتشار الجامعي وصيغ الدعم والشراكة.',
    },
    updatedAt: '2026-10-10',
    isPlaceholder: true,
  },
];
