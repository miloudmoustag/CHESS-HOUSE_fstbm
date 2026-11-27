export type Locale = 'fr' | 'en' | 'ar';

export interface LocalizedText {
  fr: string;
  en: string;
  ar: string;
}

export const SITE_CONFIG = {
  clubName: 'Chess House Club',
  clubVariantName: 'Club CHESS HOUSE BM',
  facultyName: {
    fr: 'Faculté des Sciences et Techniques de Béni Mellal (FST)',
    en: 'Faculty of Sciences and Techniques of Béni Mellal (FST)',
    ar: 'كلية العلوم والتقنيات ببني ملال (FST)',
  },
  universityName: {
    fr: 'Université Sultan Moulay Slimane',
    en: 'Sultan Moulay Slimane University',
    ar: 'جامعة السلطان مولاي سليمان',
  },
  cityCountry: {
    fr: 'Béni Mellal, Maroc',
    en: 'Béni Mellal, Morocco',
    ar: 'بني ملال، المغرب',
  },
  foundedDate: '2025-10-18',
  publicEmail: 'Chesshouse58@gmail.com',
  instagramHandle: '@chess_house_fstbm',
  instagramUrl: 'https://instagram.com/chess_house_fstbm',
  mapsUrl: 'https://maps.google.com/?q=Faculte+des+Sciences+et+Techniques+Beni+Mellal',

  // TODO-CONFIRM: Set SHOW_PERSONAL_CONTACT=true only if the president wants personal phone/email publicly displayed.
  showPersonalContact: false,
  personalContact: {
    name: 'Miloud Moustage',
    email: 'miloudmoustage@gmail.com',
    phone: '0634 262 883',
  },

  // TODO-CONFIRM: Entry fee for the next tournament (null hides the fee line completely).
  entryFee: null as number | null,

  // TODO-CONFIRM: Integration day exact date (5 October 2026 per club plan vs 24 September in older doc).
  integrationDayDate: '2026-10-05',
  integrationDayDisplay: {
    fr: 'Octobre 2026',
    en: 'October 2026',
    ar: 'أكتوبر 2026',
  },

  // TODO-CONFIRM: Regular weekly rooms and expected attendance / Thursday format.
  weeklySessions: [
    {
      id: 'monday',
      day: { fr: 'Lundi', en: 'Monday', ar: 'الإثنين' },
      time: '12:00 – 14:00',
      room: { fr: 'Salle au Bloc A', en: 'Room in Block A', ar: 'قاعة بالبلوك A' }, // TODO-CONFIRM
      attendance: '~20–30', // TODO-CONFIRM
      focus: {
        fr: 'Formation structurée pour débutants (programme à rebours)',
        en: 'Structured beginner training (backwards curriculum)',
        ar: 'تكوين منظم للمبتدئين (المنهج العكسي)',
      },
    },
    {
      id: 'thursday',
      day: { fr: 'Jeudi', en: 'Thursday', ar: 'الخميس' },
      time: '12:00 – 14:00',
      room: { fr: 'Salle au Bloc C', en: 'Room in Block C', ar: 'قاعة بالبلوك C' }, // TODO-CONFIRM
      attendance: '~50–60', // TODO-CONFIRM
      focus: {
        fr: 'Jeu libre, parties amicales et exercices pratiques', // TODO-CONFIRM
        en: 'General play, friendly games and practice', // TODO-CONFIRM
        ar: 'لعب حر ومباريات ودية وتطبيقات عملية', // TODO-CONFIRM
      },
    },
    {
      id: 'online',
      day: { fr: 'Hebdomadaire (En ligne)', en: 'Weekly (Online)', ar: 'أسبوعي (عن بُعد)' },
      time: '20:30 – 22:00', // TODO-CONFIRM
      room: { fr: 'Plateforme en ligne (Lichess)', en: 'Online platform (Lichess)', ar: 'منصة إلكترونية (Lichess)' },
      attendance: '24 clubs',
      focus: {
        fr: 'Tournoi inter-universitaire hebdomadaire en ligne',
        en: 'Weekly inter-university online tournament',
        ar: 'بطولة أسبوعية بين الجامعات عبر الإنترنت',
      },
    },
  ],

  stats: {
    clubsReached: 24,
    iuccUniversities: 22,
    iuccStudents: 220,
    weeklySessions: 2,
    electedBoardPresent: 15,
  },

  // Next seeded tournament
  nextTournament: {
    slug: 'internal-rapid-nov-2026',
    name: {
      fr: 'Tournoi Interne — Novembre 2026',
      en: 'Internal Tournament — November 2026',
      ar: 'البطولة الداخلية — نونبر 2026',
    },
    eventDate: '2026-11-30T12:00:00+01:00',
    endDate: '2026-11-30T16:00:00+01:00',
    // TODO-CONFIRM: Registration deadline defaults to the day before at 18:00.
    deadline: '2026-11-29T18:00:00+01:00',
    venue: {
      fr: 'Cour du Bloc A, FST Béni Mellal',
      en: 'Block A Courtyard, FST Béni Mellal',
      ar: 'ساحة البلوك A، كلية العلوم والتقنيات ببني ملال',
    },
    rounds: 9,
    timeControl: '5+2',
    capacity: 20, // 20 boards
    membersOnly: true,
    snackBuffet: true,
    // TODO-CONFIRM: Confirm Open & Women categories setup for pairings/standings.
    categories: ['open', 'women'] as const,
  },

  // TODO-CONFIRM: Exact title and format of the 30 October 2026 Chess Cinema screening.
  chessCinemaTitle: {
    fr: 'Chess Cinema — Soirée Cinéma Halloween',
    en: 'Chess Cinema — Halloween Movie Night',
    ar: 'سينما الشطرنج — أمسية هالوين السينمائية',
  },

  board2026_27: [
    {
      id: 'miloud',
      name: 'Miloud Moustage',
      role: { fr: 'Président', en: 'President', ar: 'الرئيس' },
      bio: {
        fr: 'Coordination générale du club, relations avec la faculté et suivi des tournois.',
        en: 'General club coordination, faculty liaison and tournament oversight.',
        ar: 'التنسيق العام للنادي والتواصل مع الكلية والإشراف على البطولات.',
      },
      imageSlot: 'board-miloud',
    },
    {
      id: 'douae',
      name: 'Douae Bouuda',
      role: { fr: 'Vice-Présidente', en: 'Vice-President', ar: 'نائبة الرئيس' },
      bio: {
        fr: 'Appui à la direction du club, accueil des nouveaux membres et catégorie féminine.',
        en: 'Supports club leadership, new member onboarding and women’s category.',
        ar: 'دعم إدارة النادي واستقبال الأعضاء الجدد وتنسيق فئة الإناث.',
      },
      imageSlot: 'board-douae',
    },
    {
      id: 'ayoub',
      name: 'Ayoub Elataoui',
      role: { fr: 'Secrétaire Général', en: 'Secretary General', ar: 'الكاتب العام' },
      bio: {
        fr: 'Rédaction des procès-verbaux, gestion administrative et suivi du règlement intérieur.',
        en: 'Minutes, administrative records and compliance with internal regulations.',
        ar: 'تحرير المحاضر والتدبير الإداري وتتبع القانون الداخلي.',
      },
      imageSlot: 'board-ayoub',
    },
    {
      id: 'khalid',
      name: 'Khalid Elmouhi',
      role: { fr: 'Trésorier', en: 'Treasurer', ar: 'أمين المال' },
      bio: {
        fr: 'Suivi des cotisations, budget matériel et transparence financière.',
        en: 'Membership fees tracking, equipment budget and financial transparency.',
        ar: 'تتبع الانخراطات وميزانية المعدات والشفافية المالية.',
      },
      imageSlot: 'board-khalid',
    },
    {
      id: 'haitam',
      name: 'Haitam Daoud',
      role: { fr: 'Responsable Événements', en: 'Events Officer', ar: 'مسؤول الأنشطة والبطولات' },
      bio: {
        fr: 'Organisation logistique des séances, tournois internes et événements campus.',
        en: 'Logistics for weekly sessions, internal tournaments and campus events.',
        ar: 'التنظيم اللوجستي للحصص الأسبوعية والبطولات الداخلية وفعاليات الكلية.',
      },
      imageSlot: 'board-haitam',
    },
    {
      id: 'youssef',
      name: 'Youssef Hamdan',
      role: { fr: 'Responsable Communication', en: 'Communication Officer', ar: 'مسؤول التواصل' },
      bio: {
        fr: 'Annonces officielles, liens inter-universitaires et coordination des inscriptions.',
        en: 'Official announcements, inter-university outreach and registration updates.',
        ar: 'الإعلانات الرسمية والتواصل بين الجامعات وتنسيق التسجيلات.',
      },
      imageSlot: 'board-youssef',
    },
    {
      id: 'doha',
      name: 'Doha Douhabi',
      role: { fr: 'Responsable Média', en: 'Media Officer', ar: 'مسؤولة الإعلام' },
      bio: {
        fr: 'Couverture photo, archives visuelles des tournois et réseaux sociaux.',
        en: 'Photography, tournament visual archives and social media.',
        ar: 'التغطية المصورة والأرشيف البصري للبطولات ومنصات التواصل.',
      },
      imageSlot: 'board-doha',
    },
  ],

  board2025_26: [
    { name: 'Oussama Idlil', role: { fr: 'Président', en: 'President', ar: 'الرئيس' } },
    { name: 'Miloud Moustage', role: { fr: 'Trésorier', en: 'Treasurer', ar: 'أمين المال' } },
    { name: 'Mohamed Farsaoui', role: { fr: 'Activités', en: 'Activities', ar: 'الأنشطة' } },
  ],

  roadmap2026_27: [
    {
      id: 'integration',
      period: { fr: 'Octobre 2026', en: 'October 2026', ar: 'أكتوبر 2026' },
      status: 'completed' as const,
      title: {
        fr: "Journée d'intégration",
        en: 'Integration Day',
        ar: 'يوم الاندماج',
      },
      description: {
        fr: 'Accueil des nouveaux étudiants de la FST, initiation libre et présentation du programme annuel.',
        en: 'Welcoming new FST students, open boards and introduction to the annual programme.',
        ar: 'استقبال طلبة الكلية الجدد، حصص تعريفية وعرض البرنامج السنوي.',
      },
    },
    {
      id: 'training',
      period: { fr: 'Octobre – Juin', en: 'October – June', ar: 'أكتوبر – يونيو' },
      status: 'active' as const,
      title: {
        fr: 'Formation débutants (chaque lundi)',
        en: 'Beginner Training (every Monday)',
        ar: 'تكوين المبتدئين (كل إثنين)',
      },
      description: {
        fr: 'Parcours structuré enseigné à rebours : finales d’abord, puis milieu de jeu, puis ouvertures.',
        en: 'Structured backwards curriculum: endgames first, then middlegame, then openings.',
        ar: 'منهج منظم يُدرّس بالعكس: النهايات أولاً، ثم وسط اللعب، ثم الافتتاحيات.',
      },
    },
    {
      id: 'internal-champ',
      period: { fr: 'Novembre 2026', en: 'November 2026', ar: 'نونبر 2026' },
      status: 'next' as const,
      title: {
        fr: 'Championnat interne (Open & Féminin)',
        en: 'Internal Championship (Open & Women)',
        ar: 'البطولة الداخلية (المفتوحة والإناث)',
      },
      description: {
        fr: 'Tournoi suisse en 9 rondes (5+2) sur 20 échiquiers dans la cour du Bloc A, le 30 novembre 2026.',
        en: '9-round Swiss (5+2) across 20 boards in Block A Courtyard on 30 November 2026.',
        ar: 'بطولة سويسرية من 9 جولات (5+2) على 20 رقعة بساحة البلوك A يوم 30 نونبر 2026.',
      },
    },
    {
      id: 'inter-schools',
      period: { fr: 'Décembre 2026', en: 'December 2026', ar: 'دجنبر 2026' },
      status: 'upcoming' as const,
      title: {
        fr: 'Tournoi par équipes entre écoles',
        en: 'Inter-School Team Tournament',
        ar: 'بطولة الفرق بين المدارس',
      },
      description: {
        fr: 'Rencontre amicale par équipes réunissant les clubs étudiants des établissements partenaires.',
        en: 'Team competition bringing together student clubs from partner schools.',
        ar: 'منافسة جماعية للفرق تجمع أندية الطلبة بالمؤسسات الشريكة.',
      },
    },
    {
      id: 'simul',
      period: { fr: 'Février 2027', en: 'February 2027', ar: 'فبراير 2027' },
      status: 'upcoming' as const,
      title: {
        fr: 'Simultanée avec un champion marocain',
        en: 'Simultaneous Exhibition with a Moroccan Champion',
        ar: 'مباراة استعراضية متزامنة مع بطل مغربي',
      },
      description: {
        fr: 'Séance exceptionnelle face à un joueur titré national, suivie d’une analyse collective.',
        en: 'Simultaneous display against a national champion followed by collective game review.',
        ar: 'مواجهات متزامنة أمام بطل وطني متبوعة بتحليل جماعي للأدوار.',
      },
    },
    {
      id: 'national-fst',
      period: { fr: 'Mars 2027', en: 'March 2027', ar: 'مارس 2027' },
      status: 'upcoming' as const,
      title: {
        fr: 'Tournoi national des FST',
        en: 'National FST Tournament',
        ar: 'البطولة الوطنية لكليات العلوم والتقنيات',
      },
      description: {
        fr: 'Délégation et compétition nationale réunissant les Facultés des Sciences et Techniques du Maroc.',
        en: 'National gathering uniting FST chess clubs across Morocco.',
        ar: 'تظاهرة وطنية تجمع أندية الشطرنج بكليات العلوم والتقنيات بالمغرب.',
      },
    },
    {
      id: 'weekly-online',
      period: { fr: 'Toute l’année', en: 'All Year', ar: 'طوال السنة' },
      status: 'active' as const,
      title: {
        fr: 'Ligue inter-universitaire hebdomadaire en ligne',
        en: 'Weekly Inter-University Online League',
        ar: 'الدوري الأسبوعي عبر الإنترنت بين الجامعات',
      },
      description: {
        fr: 'Rencontres hebdomadaires réunissant jusqu’à 24 clubs universitaires marocains.',
        en: 'Weekly online arenas connecting up to 24 university clubs across Morocco.',
        ar: 'لقاءات أسبوعية عبر الإنترنت تجمع ما يصل إلى 24 نادياً جامعياً مغربياً.',
      },
    },
  ],
};
