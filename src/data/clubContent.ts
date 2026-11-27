import { LocalizedText } from '../config/site';

export interface ClubEventItem {
  id: string;
  slug: string;
  type: 'tournament' | 'cinema' | 'online' | 'milestone';
  dateIso: string;
  endIso?: string;
  isPast: boolean;
  title: LocalizedText;
  summary: LocalizedText;
  details: LocalizedText;
  location: LocalizedText;
  imageSlot: string;
}

export const CLUB_EVENTS: ClubEventItem[] = [
  {
    id: 'ev-nov-2026',
    slug: 'tournoi-interne-novembre-2026',
    type: 'tournament',
    dateIso: '2026-11-30T12:00:00+01:00',
    endIso: '2026-11-30T16:00:00+01:00',
    isPast: false,
    title: {
      fr: 'Tournoi Interne — Novembre 2026',
      en: 'Internal Tournament — November 2026',
      ar: 'البطولة الداخلية — نونبر 2026',
    },
    summary: {
      fr: '9 rondes en cadence 5+2 sur 20 échiquiers dans la cour du Bloc A. Catégories Open et Féminin.',
      en: '9-round 5+2 rapid across 20 boards in Block A Courtyard. Open & Women categories.',
      ar: '9 جولات بزمن 5+2 على 20 رقعة بساحة البلوك A. الفئة المفتوحة وفئة الإناث.',
    },
    details: {
      fr: 'Tournoi réservé aux membres du club avec une pause conviviale (buffet léger) pour les inscrits. Inscriptions jusqu’au 29 novembre à 18h00.',
      en: 'Members-only event featuring a light snack buffet for registered players. Registration closes 29 November at 18:00.',
      ar: 'بطولة خاصة بأعضاء النادي مع استراحة خفيفة للمسجلين. يغلق التسجيل يوم 29 نونبر على الساعة السادسة مساءً.',
    },
    location: {
      fr: 'Cour du Bloc A, FST Béni Mellal',
      en: 'Block A Courtyard, FST Béni Mellal',
      ar: 'ساحة البلوك A، كلية العلوم والتقنيات ببني ملال',
    },
    imageSlot: 'event-tournament-nov',
  },
  {
    id: 'ev-cinema-oct-2026',
    slug: 'chess-cinema-octobre-2026',
    type: 'cinema',
    dateIso: '2026-10-30T17:30:00+01:00',
    endIso: '2026-10-30T20:00:00+01:00',
    isPast: true,
    title: {
      fr: 'Chess Cinema — Soirée Cinéma Halloween',
      en: 'Chess Cinema — Halloween Movie Night',
      ar: 'سينما الشطرنج — أمسية هالوين السينمائية',
    },
    summary: {
      fr: 'Projection cinématographique sur le thème des échecs ouverte à tous les étudiants de l’université.',
      en: 'Chess-themed film screening open to all university students.',
      ar: 'عرض فيلم حول موضوع الشطرنج مفتوح لجميع طلبة الجامعة.',
    },
    details: {
      fr: 'Organisée le 30 octobre 2026 à l’occasion d’Halloween, cette séance a rassemblé des étudiants de toute l’USMS autour du cinéma et d’échiquiers en libre accès.',
      en: 'Held on 30 October 2026 for Halloween, bringing students from across USMS together for a screening and casual boards.',
      ar: 'نُظمت بتاريخ 30 أكتوبر 2026 بمناسبة الهالوين وجمعت طلبة الجامعة حول عرض سينمائي ورقع شطرنج حرة.',
    },
    location: {
      fr: 'FST Béni Mellal — Amphithéâtre',
      en: 'FST Béni Mellal — Lecture Hall',
      ar: 'كلية العلوم والتقنيات ببني ملال — المدرج',
    },
    imageSlot: 'event-cinema',
  },
  {
    id: 'ev-iucc-2026',
    slug: 'ligue-inter-universitaire-iucc',
    type: 'online',
    dateIso: '2026-10-15T20:30:00+01:00',
    isPast: true,
    title: {
      fr: 'Tournoi Inter-Universitaire en ligne (IUCC)',
      en: 'Online Inter-University Tournament (IUCC)',
      ar: 'البطولة الجامعية عبر الإنترنت (IUCC)',
    },
    summary: {
      fr: '22 universités et plus de 220 étudiants réunis ; la dernière édition hebdomadaire a compté 24 clubs.',
      en: '22 universities and 220+ students participating; last week’s edition reached 24 clubs.',
      ar: '22 جامعة وأكثر من 220 طالباً؛ وبلغت آخر دورة أسبوعية 24 نادياً.',
    },
    details: {
      fr: 'Chaque semaine, Chess House Club représente la FST Béni Mellal face aux clubs universitaires marocains.',
      en: 'Every week, Chess House Club represents FST Béni Mellal against university clubs across Morocco.',
      ar: 'يمثل نادي بيت الشطرنج أسبوعياً كلية العلوم والتقنيات ببني ملال أمام الأندية الجامعية المغربية.',
    },
    location: {
      fr: 'En ligne (Maroc)',
      en: 'Online (Morocco)',
      ar: 'عن بُعد (المغرب)',
    },
    imageSlot: 'event-iucc',
  },
  {
    id: 'ev-halloween-earlier',
    slug: 'soiree-halloween-chess',
    type: 'cinema',
    dateIso: '2025-10-31T17:00:00+01:00',
    isPast: true,
    title: {
      fr: 'Soirée Échecs Halloween',
      en: 'Halloween Chess Evening',
      ar: 'أمسية الهالوين للشطرنج',
    },
    summary: {
      fr: 'Première édition thématique d’automne ayant accueilli de nombreux étudiants sur le campus.',
      en: 'Earlier autumn themed chess gathering well attended by campus students.',
      ar: 'نسخة خريفية مميزة استقطبت عدداً كبيراً من طلبة الكلية.',
    },
    details: {
      fr: 'Parties amicales en cadence blitz et découverte du jeu dans une atmosphère conviviale.',
      en: 'Friendly blitz games and board introductions in a welcoming campus setting.',
      ar: 'مباريات ودية سريعة وتعارف طلابي في أجواء هادئة ومنظمة.',
    },
    location: {
      fr: 'FST Béni Mellal',
      en: 'FST Béni Mellal',
      ar: 'كلية العلوم والتقنيات ببني ملال',
    },
    imageSlot: 'event-halloween',
  },
  {
    id: 'ev-founding-2025',
    slug: 'fondation-chess-house-club',
    type: 'milestone',
    dateIso: '2025-10-18T12:00:00+01:00',
    isPast: true,
    title: {
      fr: 'Fondation de Chess House Club & premières séances',
      en: 'Founding of Chess House Club & First Sessions',
      ar: 'تأسيس نادي بيت الشطرنج وأولى الحصص',
    },
    summary: {
      fr: 'Lancement officiel du club à la FST Béni Mellal le 18 octobre 2025.',
      en: 'Official launch of the club at FST Béni Mellal on 18 October 2025.',
      ar: 'الانطلاقة الرسمية للنادي بكلية العلوم والتقنيات ببني ملال يوم 18 أكتوبر 2025.',
    },
    details: {
      fr: 'Premier bureau fondateur : Oussama Idlil (Président), Miloud Moustage (Trésorier) et Mohamed Farsaoui (Activités).',
      en: 'Inaugural board: Oussama Idlil (President), Miloud Moustage (Treasurer) and Mohamed Farsaoui (Activities).',
      ar: 'المكتب التأسيسي: أسامة إدليل (رئيساً)، ميلود موستاج (أميناً للمال)، ومحمد فرساوي (الأنشطة).',
    },
    location: {
      fr: 'FST Béni Mellal, USMS',
      en: 'FST Béni Mellal, USMS',
      ar: 'كلية العلوم والتقنيات ببني ملال',
    },
    imageSlot: 'gallery-01',
  },
];

export interface NewsPost {
  id: string;
  dateIso: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  body: LocalizedText;
}

export const INITIAL_NEWS: NewsPost[] = [
  {
    id: 'news-1',
    dateIso: '2026-11-15',
    title: {
      fr: 'Ouverture des inscriptions : Tournoi interne du 30 novembre',
      en: 'Registration Open: 30 November Internal Tournament',
      ar: 'فتح التسجيل: البطولة الداخلية ليوم 30 نونبر',
    },
    excerpt: {
      fr: 'Les membres peuvent dès à présent réserver leur place parmi les 20 échiquiers disponibles.',
      en: 'Club members can now claim one of the 20 boards for our 9-round rapid tournament.',
      ar: 'يمكن للأعضاء الآن حجز مقعدهم ضمن الرقع العشرين المتاحة في البطولة السريعة.',
    },
    body: {
      fr: 'Rendez-vous lundi 30 novembre 2026 de 12h00 à 16h00 dans la cour du Bloc A. Cadence 5+2 en 9 rondes, catégories Open et Féminin, avec un léger buffet offert aux joueurs inscrits.',
      en: 'Join us Monday 30 November 2026 from 12:00 to 16:00 in Block A Courtyard. 9 rounds at 5+2, Open and Women categories, with a light snack buffet for registered players.',
      ar: 'الموعد يوم الإثنين 30 نونبر 2026 من 12:00 إلى 16:00 بساحة البلوك A. 9 جولات بزمن 5+2 في الفئة المفتوحة وفئة الإناث مع استراحة خفيفة للمشاركين.',
    },
  },
  {
    id: 'news-2',
    dateIso: '2026-10-31',
    title: {
      fr: 'Retour sur la soirée Chess Cinema du 30 octobre',
      en: 'Recap: 30 October Chess Cinema Screening',
      ar: 'تقرير حول أمسية سينما الشطرنج ليوم 30 أكتوبر',
    },
    excerpt: {
      fr: 'Une belle participation des étudiants de l’université pour notre projection d’Halloween.',
      en: 'A warm turnout of students across the university for our Halloween chess screening.',
      ar: 'حضور طلابي لافت في العرض السينمائي الخاص بالهالوين حول الشطرنج.',
    },
    body: {
      fr: 'Merci à toutes et à tous d’avoir participé à cette soirée ouverte à l’ensemble des étudiants de la faculté et de l’USMS.',
      en: 'Thank you to every student who joined our campus screening and post-film boards.',
      ar: 'شكراً لجميع الطلبة الذين شاركوا في هذه الأمسية المفتوحة لطلبة الجامعة.',
    },
  },
  {
    id: 'news-3',
    dateIso: '2026-10-20',
    title: {
      fr: '24 clubs réunis lors de la dernière édition en ligne',
      en: '24 Clubs Competed in Last Week’s Online Edition',
      ar: 'مشاركة 24 نادياً جامعياً في النسخة الأسبوعية الأخيرة',
    },
    excerpt: {
      fr: 'La ligue inter-universitaire hebdomadaire poursuit sa progression à travers le Maroc.',
      en: 'Our weekly online inter-university tournament continues to grow nationwide.',
      ar: 'يواصل الدوري الأسبوعي بين الجامعات توسعه بمشاركة أندية من مختلف المدن.',
    },
    body: {
      fr: 'Après l’édition IUCC à 22 universités et 220+ étudiants, notre tournoi hebdomadaire rassemble désormais 24 clubs universitaires.',
      en: 'Following the IUCC edition with 22 universities and 220+ students, our weekly tournament now gathers 24 university clubs.',
      ar: 'بعد دورة IUCC التي عرفت مشاركة 22 جامعة و220+ طالباً، استقطبت النسخة الأخيرة 24 نادياً جامعياً.',
    },
  },
];

export interface FaqItem {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
}

export const INITIAL_FAQ: FaqItem[] = [
  {
    id: 'faq-1',
    question: {
      fr: 'Faut-il déjà savoir jouer aux échecs pour rejoindre le club ?',
      en: 'Do I already need to know how to play chess to join?',
      ar: 'هل يجب أن أعرف قواعد الشطرنج مسبقاً للانخراط في النادي؟',
    },
    answer: {
      fr: 'Non. Le club est ouvert à tous les étudiants de l’université, y compris aux grands débutants. Chaque lundi de 12h00 à 14h00 est dédié à la formation progressive.',
      en: 'No. The club is open to all university students, including complete beginners. Every Monday from 12:00 to 14:00 is dedicated to structured training.',
      ar: 'لا، النادي مفتوح لجميع طلبة الجامعة بمن فيهم المبتدئون تماماً. كل يوم إثنين من 12:00 إلى 14:00 مخصص للتكوين المنظم.',
    },
  },
  {
    id: 'faq-2',
    question: {
      fr: 'Pourquoi enseignez-vous « à rebours » (finales d’abord) ?',
      en: 'Why do you teach "backwards" (endgames first)?',
      ar: 'لماذا تعتمدون المنهج العكسي (النهايات أولاً)؟',
    },
    answer: {
      fr: 'En commençant par les finales avec peu de pièces, on comprend clairement la force de chaque pièce et l’activité du roi. On comprend ensuite beaucoup mieux le milieu de jeu et les ouvertures au lieu de réciter des coups par cœur.',
      en: 'Starting with endgames with fewer pieces makes piece power and king activity crystal clear. That understanding makes middlegame tactics and openings logical instead of rote memorisation.',
      ar: 'البدء بالنهايات حيث تقل القطع يوضح قيمة كل قطعة ودور الملك، مما يجعل فهم خطط وسط اللعب والافتتاحيات منطقياً بدل الحفظ الآلي.',
    },
  },
  {
    id: 'faq-3',
    question: {
      fr: 'Où et quand ont lieu les séances hebdomadaires ?',
      en: 'When and where are the weekly sessions held?',
      ar: 'متى وأين تُعقد الحصص الأسبوعية؟',
    },
    answer: {
      fr: 'Le lundi (12h00–14h00, Bloc A, formation débutants) et le jeudi (12h00–14h00, Bloc C, jeu libre et pratique), ainsi qu’un tournoi inter-universitaire hebdomadaire en ligne.',
      en: 'Monday (12:00–14:00, Block A, beginner training) and Thursday (12:00–14:00, Block C, open play and practice), plus a weekly online inter-university tournament.',
      ar: 'الإثنين (12:00–14:00 بالبلوك A لتكوين المبتدئين) والخميس (12:00–14:00 بالبلوك C للعب الحر)، إضافة إلى بطولة أسبوعية عبر الإنترنت بين الجامعات.',
    },
  },
  {
    id: 'faq-4',
    question: {
      fr: 'Que se passe-t-il si je m’inscris à un tournoi alors que mon adhésion n’est pas encore validée ?',
      en: 'What happens if I register for a tournament before my membership is validated?',
      ar: 'ماذا يحدث إذا سجلتُ في البطولة قبل تفعيل عضويتي؟',
    },
    answer: {
      fr: 'Votre pré-inscription est enregistrée avec le statut « en attente ». Dès que le bureau valide votre adhésion dans la liste des membres, votre statut devient confirmé automatiquement si des places restent disponibles.',
      en: 'Your pre-registration is saved with a pending status. Once the board adds you to the active members list, your eligibility updates automatically if boards remain available.',
      ar: 'يُحفظ تسجيلك المبدئي في قائمة الانتظار، وبمجرد تفعيل عضويتك من طرف المكتب تصبح مؤهلاً تلقائياً إذا بقيت مقاعد متاحة.',
    },
  },
];

export interface GalleryEntry {
  id: string;
  imageSlot: string;
  category: 'sessions' | 'tournaments' | 'events' | 'board';
  caption: LocalizedText;
  dateLabel: string;
}

export const INITIAL_GALLERY: GalleryEntry[] = [
  { id: 'g1', imageSlot: 'gallery-01', category: 'events', dateLabel: '2025-10-18', caption: { fr: 'Fondation du club et premières parties', en: 'Club founding and opening boards', ar: 'تأسيس النادي وأولى المباريات' } },
  { id: 'g2', imageSlot: 'gallery-02', category: 'sessions', dateLabel: '2026-10-12', caption: { fr: 'Formation débutants du lundi — Bloc A', en: 'Monday beginner training — Block A', ar: 'حصة المبتدئين يوم الإثنين — البلوك A' } },
  { id: 'g3', imageSlot: 'gallery-03', category: 'sessions', dateLabel: '2026-10-15', caption: { fr: 'Séance de jeu libre du jeudi — Bloc C', en: 'Thursday open play — Block C', ar: 'حصة اللعب الحر يوم الخميس — البلوك C' } },
  { id: 'g4', imageSlot: 'gallery-04', category: 'tournaments', dateLabel: '2026-10-19', caption: { fr: 'Ligue inter-universitaire en ligne (24 clubs)', en: 'Online inter-university league (24 clubs)', ar: 'الدوري الجامعي عبر الإنترنت (24 نادياً)' } },
  { id: 'g5', imageSlot: 'gallery-05', category: 'events', dateLabel: '2026-10-30', caption: { fr: 'Chess Cinema — Soirée Halloween', en: 'Chess Cinema — Halloween night', ar: 'سينما الشطرنج — أمسية هالوين' } },
  { id: 'g6', imageSlot: 'gallery-06', category: 'events', dateLabel: '2025-10-31', caption: { fr: 'Rencontre Halloween Chess', en: 'Halloween Chess gathering', ar: 'لقاء هالوين للشطرنج' } },
  { id: 'g7', imageSlot: 'gallery-07', category: 'board', dateLabel: '2026-09-25', caption: { fr: 'Élection du bureau exécutif 2026/27', en: '2026/27 executive board election', ar: 'انتخاب المكتب المسير 2026/27' } },
  { id: 'g8', imageSlot: 'gallery-08', category: 'sessions', dateLabel: '2026-11-02', caption: { fr: 'Atelier pratique sur les finales de tours', en: 'Rook endgame practical workshop', ar: 'ورشة تطبيقية في نهايات القلاع' } },
];

export interface LeagueClubRow {
  id: string;
  clubName: string;
  university: string;
  city: string;
  points: number;
  editionsPlayed: number;
}

export const INITIAL_LEAGUE_CLUBS: LeagueClubRow[] = [
  { id: 'c1', clubName: 'Chess House Club', university: 'FST Béni Mellal (USMS)', city: 'Béni Mellal', points: 148, editionsPlayed: 6 },
  { id: 'c2', clubName: 'ENSA Rabat Chess', university: 'Université Mohammed V', city: 'Rabat', points: 142, editionsPlayed: 6 },
  { id: 'c3', clubName: 'EMI Knights', university: 'École Mohammadia d’Ingénieurs', city: 'Rabat', points: 136, editionsPlayed: 6 },
  { id: 'c4', clubName: 'FST Settat Chess', university: 'Université Hassan I', city: 'Settat', points: 129, editionsPlayed: 6 },
  { id: 'c5', clubName: 'EHTP Gambit', university: 'EHTP Casablanca', city: 'Casablanca', points: 124, editionsPlayed: 6 },
  { id: 'c6', clubName: 'FST Fès Chess', university: 'USMBA Fès', city: 'Fès', points: 118, editionsPlayed: 5 },
  { id: 'c7', clubName: 'ENSA Marrakech', university: 'Université Cadi Ayyad', city: 'Marrakech', points: 112, editionsPlayed: 5 },
  { id: 'c8', clubName: 'FST Tanger', university: 'Université Abdelmalek Essaâdi', city: 'Tanger', points: 105, editionsPlayed: 5 },
];

export const PARTNER_TIERS = [
  {
    id: 'tier-mat',
    name: { fr: 'Soutien Matériel (Échiquiers & Pendules)', en: 'Equipment Support (Boards & Clocks)', ar: 'دعم المعدات (الرقع والساعات)' },
    contribution: { fr: 'Don de jeux ou pendules · Modifiable', en: 'Boards/clocks donation · Editable', ar: 'توفير معدات اللعب · قابل للتعديل' },
    benefits: {
      fr: ['Logo sur les affiches des tournois internes', 'Mention sur le site et la page Partenaires', 'Remerciements lors des remises de prix'],
      en: ['Logo on internal tournament posters', 'Listing on website & Partners page', 'Acknowledgement at prize ceremonies'],
      ar: ['وضع الشعار في ملصقات البطولات الداخلية', 'إدراج المؤسسة في صفحة الشركاء', 'توجيه شكر رسمي أثناء حفل التتويج'],
    },
  },
  {
    id: 'tier-event',
    name: { fr: 'Parrain d’Événement (Tournoi / Simultanée)', en: 'Event Sponsor (Tournament / Simul)', ar: 'راعي فعالية (بطولة أو استعراضية)' },
    contribution: { fr: 'Financement d’un événement · Modifiable', en: 'Single-event support · Editable', ar: 'دعم فعالية محددة · قابل للتعديل' },
    benefits: {
      fr: ['Présence visuelle durant l’événement sur campus', 'Stand ou documentation lors du tournoi', 'Bilan chiffré et galerie après l’événement'],
      en: ['On-campus branding during the event', 'Information booth at tournament venue', 'Post-event summary and photo recap'],
      ar: ['حضور بصري خلال الفعالية داخل الكلية', 'فضاء تعريفي أثناء البطولة', 'تقرير رقمي وتغطية مصورة بعد الفعالية'],
    },
  },
  {
    id: 'tier-annual',
    name: { fr: 'Partenaire Annuel du Club', en: 'Annual Club Partner', ar: 'شريك سنوي للنادي' },
    contribution: { fr: 'Soutien saison 2026/27 · Modifiable', en: '2026/27 season support · Editable', ar: 'دعم الموسم 2026/27 · قابل للتعديل' },
    benefits: {
      fr: ['Visibilité sur toute la saison et la ligue en ligne', 'Priorité sur les tournois nationaux des FST', 'Inclusion dans le dossier annuel du club'],
      en: ['Full-season visibility across campus & online league', 'Featured partner for National FST Tournament', 'Included in annual club report'],
      ar: ['حضور دائم طوال الموسم وفي الدوري الجامعي', 'شراكة مميزة في البطولة الوطنية للكليات', 'إدراج في التقرير السنوي للنادي'],
    },
  },
];
