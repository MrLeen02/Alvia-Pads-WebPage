/* =====================================================
   ALVIA — Swiss-minimal interactions + i18n (EN / DE / FR)
   Hairline nav · image lifecycle · reveal · active link · FAQ · language switch
   =====================================================
   Shared external runtime loaded by every standalone page.
   Keep page markup and this shared catalogue in sync when adding routes.
   ===================================================== */
(function () {
  'use strict';

  /* =====================================================
     i18n — language catalogue + apply / init
     Declared FIRST so they're initialized before setup() runs.
     Brand-stable proper nouns (ALVIA, CC01) and engineering
     markers (blueprint tags, spec dimensions, social platform names)
     are intentionally NOT localized — they remain identical across languages.
     ===================================================== */

  const STRINGS = {
    en: {
      'meta.title':              'ALVIA — Precision. Nothing more.',
      'meta.description':        'ALVIA is a Swiss studio developing ALVIA Control CC01, a precision mousepad refined slowly and deliberately with a small group of players and creators.',
      'brand.aria':              'ALVIA — Home',
      'nav.home':                'Home',
      'nav.control':             'Control CC01',
      'nav.community':           'Community',
      'nav.shop':                'Prototype',
      'nav.prototype':           'Prototype',
      'nav.technology':          'Technology',
      'nav.about':               'About',
      'nav.faq':                 'FAQ',
      'nav.contact':             'Contact',
      'nav.lang.label':          'Language',
      'social.label':            'Social',
      'principles.label':        'Design principles',

      'hero.tag':                'Currently in Prototype Testing',
      'hero.title.a':            'Precision.',
      'hero.title.b':            'Nothing More.',
      'hero.sub':                'Designed in Switzerland.',
      'hero.note':               'Currently refining our first prototype with real players and creators.',
      'hero.cta':                'Learn More',
      'hero.img.alt':            'ALVIA — Control CC01',

      'philosophy.tag':          'Philosophy',
      'philosophy.title.a':      'Fewer distractions.',
      'philosophy.title.b':      'Better products.',
      'philosophy.lede':         'ALVIA believes fewer distractions create better products. We are not building a catalog. We are building one product — carefully, repeatedly, until it is right.',
      'philosophy.pillar.1':     'Minimalism',
      'philosophy.pillar.2':     'Precision',
      'philosophy.pillar.3':     'Consistency',
      'philosophy.pillar.4':     'Craftsmanship',
      'philosophy.pillar.5':     'Attention to detail',
      'philosophy.pillar.6':     'Long-term quality',

      'prototype.tag':           'Current prototype',
      'prototype.code.label':    'Internal code',
      'prototype.lede':          'Every prototype is tested and refined before production. CC01 is currently with a small group of players and creators. Wider release will follow when the product meets our internal standard — not before.',
      'prototype.specs.aria':    'ALVIA Control CC01 specifications',

      'spec.dimensions':         'Dimensions',
      'spec.surface':            'Surface',
      'spec.base':               'Base',
      'spec.edges':              'Edges',
      'spec.origin':             'Origin',
      'spec.thickness':          'Thickness',
      'spec.surface.value':      'Premium Control Surface',
      'spec.base.value':         'High-density PU foam base',
      'spec.edges.value':        'Black Stitched Edges',
      'spec.origin.value':       'Designed in Switzerland',

      'timeline.tag':            'Development',
      'timeline.title':          'From concept to launch.',
      'timeline.lede':           'ALVIA does not move fast on purpose. Every step exists for a reason.',
      'timeline.list.aria':      'Development timeline',
      'timeline.current':        'Current',
      'timeline.status':         'In testing with the founding community.',
      'timeline.step.1':         'Concept',
      'timeline.step.2':         'Design',
      'timeline.step.3':         'Prototype CC01',
      'timeline.step.4':         'Community Testing',
      'timeline.step.5':         'Refinement',
      'timeline.step.6':         'Official Launch',

      'arch.tag':                'Technology & Materials',
      'arch.title':              'Engineered in layers.',
      'arch.lede':               'Every element is functional. Nothing decorative. Each layer exists for a specific reason.',
      'arch.surface.caption':    '01 · Surface',
      'arch.surface.title':      'ALVIA Surface Mark',
      'arch.surface.body':       'The ALVIA mark is placed directly on the control surface. Its position and scale are part of the product language: quiet, legible and intentionally restrained.',
      'arch.base.caption':       '02 · Foundation',
      'arch.base.title':         '4 mm Profile',
      'arch.base.body':          'The current prototype is built to a low 4 mm profile. The proportion keeps the transition from desk to surface discreet under the wrist.',
      'arch.edges.caption':      '03 · Finish',
      'arch.edges.title':        'Low-Profile Stitched Edges',
      'arch.edges.body':         'Reinforced black stitching keeps the surface flat over time and prevents the kind of fraying that ends a product early. The edge stays where the edge should be.',
      'arch.perf.aria':          'Performance characteristics',
      'arch.perf.caption':       '04 · Performance',
      'arch.perf.title':         'Held to a higher bar.',
      'arch.perf.1.lead':        'Consistent glide.',
      'arch.perf.1.body':        '500 × 500 mm of uninterrupted surface.',
      'arch.perf.2.lead':        'A defined profile.',
      'arch.perf.2.body':        '4 mm from desk to surface.',
      'arch.perf.3.lead':        'Competitive performance.',
      'arch.perf.3.body':        'Tested by players who treat control as a craft.',
      'arch.perf.4.lead':        'Silent under the wrist.',
      'arch.perf.4.body':        'The base absorbs movement rather than announcing it.',
      'arch.cloth.img.alt':      'ALVIA CC01 logo mark on the Phantom Blue surface',
      'arch.base.img.alt':       'ALVIA Control CC01 — 4 mm profile detail',
      'arch.edges.img.alt':      'ALVIA Control CC01 — low-profile edge and top view',

      'about.tag':               'About',
      'about.title':             'Meet the founders.',
      'about.lede':              'Two people. One studio. A long view.',
      'founder.role.1':          'Founder',
      'founder.alias.1':         'Also known as Mr. Leen.',
      'founder.bio.1':           'Swiss IT professional and passionate gamer. Responsible for product development, branding and design at ALVIA.',
      'founder.alt.1':           'Lean’s desk setup with an ALVIA Control CC01 mousepad',
      'founder.role.2':          'Co-Founder',
      'founder.alias.2':         'Also known as Cheesy.',
      'founder.bio.2':           'Competitive gamer. Responsible for product testing, feedback and community development at ALVIA.',
      'founder.alt.2':           'Noah’s desk setup with an ALVIA Control CC01 mousepad',

      'faq.tag':                 'FAQ',
      'faq.title':               'Frequently asked.',
      'faq.q.1':                 "Why isn't the mousepad available yet?",
      'faq.a.1':                 'ALVIA Control CC01 is currently with a small, closed group of players and creators. Release happens when the product meets our internal standard — not before.',
      'faq.q.2':                 'How can I become a tester?',
      'faq.a.2.prefix':          'Send a short, honest introduction through the contact page under',
      'faq.a.2.suffix':          '. We value clear feedback over follower count.',
      'faq.q.3':                 'When is the official launch?',
      'faq.a.3':                 'When CC01 meets our internal quality standard. We will not commit to a date that compromises the product.',
      'faq.q.4':                 'Will there be glass mousepads?',
      'faq.a.4':                 'The current CC01 prototype combines a control cloth surface, a 4 mm high-density PU foam base and low-profile stitched edges.',
      'faq.q.5':                 'Why only one product?',
      'faq.a.5':                 'Because focus matters. One product, fully tested and produced deliberately — that is the foundation. More may follow, but never as noise.',

      'contact.tag':             'Contact',
      'contact.title':           'Write to us.',
      'contact.lede':            'Direct channels for direct inquiries. No forms, no funnels.',
      'contact.cat.1':           'Business inquiries',
      'contact.cat.2':           'social media',
      'contact.cat.3':           'Retail partnerships',
      'contact.cat.test':        'Product testing',
      'contact.cat.5':           'General questions',

      'footer.origin':           'Designed in Switzerland.',
      'footer.copyright':        '© 2026 ALVIA Studio. All rights reserved.',
      'footer.privacy':          'Privacy Policy',
      'footer.terms':            'Terms'
    },

    de: {
      'meta.title':              'ALVIA — Präzision. Nicht mehr.',
      'meta.description':        'ALVIA ist ein Schweizer Studio, das ALVIA Control CC01 entwickelt — ein Präzisions-Mousepad, verfeinert langsam und mit Bedacht zusammen mit einer kleinen Gruppe von Spielern und Creators.',
      'brand.aria':              'ALVIA — Startseite',
      'nav.home':                'Start',
      'nav.control':             'Control CC01',
      'nav.community':           'Community',
      'nav.shop':                'Prototyp',
      'nav.prototype':           'Prototyp',
      'nav.technology':          'Technologie',
      'nav.about':               'Über uns',
      'nav.faq':                 'FAQ',
      'nav.contact':             'Kontakt',
      'nav.lang.label':          'Sprache',
      'social.label':            'Social',
      'principles.label':        'Designprinzipien',

      'hero.tag':                'Aktuell in der Prototyp-Testphase',
      'hero.title.a':            'Präzision.',
      'hero.title.b':            'Nicht mehr.',
      'hero.sub':                'Entworfen in der Schweiz.',
      'hero.note':               'Aktuell verfeinern wir unseren ersten Prototyp mit echten Spielern und Creators.',
      'hero.cta':                'Mehr erfahren',
      'hero.img.alt':            'ALVIA — Control CC01',

      'philosophy.tag':          'Philosophie',
      'philosophy.title.a':      'Weniger Ablenkung.',
      'philosophy.title.b':      'Bessere Produkte.',
      'philosophy.lede':         'ALVIA glaubt: weniger Ablenkung macht bessere Produkte. Wir bauen keinen Katalog. Wir bauen ein Produkt — mit Sorgfalt, wiederholt, bis es stimmt.',
      'philosophy.pillar.1':     'Minimalismus',
      'philosophy.pillar.2':     'Präzision',
      'philosophy.pillar.3':     'Konstanz',
      'philosophy.pillar.4':     'Handwerk',
      'philosophy.pillar.5':     'Liebe zum Detail',
      'philosophy.pillar.6':     'Langfristige Qualität',

      'prototype.tag':           'Aktueller Prototyp',
      'prototype.code.label':    'Interner Code',
      'prototype.lede':          'Jeder Prototyp wird vor der Produktion getestet und verfeinert. CC01 ist aktuell bei einer kleinen Gruppe von Spielern und Creators. Die breite Veröffentlichung folgt, wenn das Produkt unseren internen Standard erreicht — nicht früher.',
      'prototype.specs.aria':    'ALVIA Control CC01 — Spezifikationen',

      'spec.dimensions':         'Abmessungen',
      'spec.surface':            'Oberfläche',
      'spec.base':               'Unterseite',
      'spec.edges':              'Kanten',
      'spec.origin':             'Herkunft',
      'spec.thickness':          'Dicke',
      'spec.surface.value':      'Premium-Steueroberfläche',
      'spec.base.value':         'Basis aus hochdichtem PU-Schaum',
      'spec.edges.value':        'Schwarze gesteppte Kanten',
      'spec.origin.value':       'Entworfen in der Schweiz.',

      'timeline.tag':            'Entwicklung',
      'timeline.title':          'Vom Konzept zur Markteinführung.',
      'timeline.lede':           'ALVIA geht nicht absichtlich schnell vor. Jeder Schritt hat seinen Grund.',
      'timeline.list.aria':      'Entwicklungszeitachse',
      'timeline.current':        'Aktuell',
      'timeline.status':         'In der Erprobung mit der Gründungsgemeinschaft.',
      'timeline.step.1':         'Konzept',
      'timeline.step.2':         'Design',
      'timeline.step.3':         'Prototyp CC01',
      'timeline.step.4':         'Community-Test',
      'timeline.step.5':         'Verfeinerung',
      'timeline.step.6':         'Markteinführung',

      'arch.tag':                'Technologie & Materialien',
      'arch.title':              'In Schichten konstruiert.',
      'arch.lede':               'Jedes Element ist funktional. Nichts ist dekorativ. Jede Schicht hat einen bestimmten Grund.',
      'arch.surface.caption':    '01 · Oberfläche',
      'arch.surface.title':      'ALVIA-Oberflächenlogo',
      'arch.surface.body':       'Das ALVIA-Logo sitzt direkt auf der Steueroberfläche. Position und Größe gehören zur Produktsprache: ruhig, lesbar und bewusst zurückhaltend.',
      'arch.base.caption':       '02 · Grundlage',
      'arch.base.title':         '4-mm-Profil',
      'arch.base.body':          'Der aktuelle Prototyp ist auf ein flaches 4-mm-Profil ausgelegt. Der Übergang vom Schreibtisch zur Oberfläche bleibt unter dem Handgelenk dezent.',
      'arch.edges.caption':      '03 · Abschluss',
      'arch.edges.title':        'Flach gesteppte Kanten',
      'arch.edges.body':         'Verstärkte schwarze Naht hält die Oberfläche über die Zeit flach und verhindert Ausfransungen, die ein Produkt vorzeitig beenden. Die Kante bleibt dort, wo sie sein soll.',
      'arch.perf.aria':          'Leistungsmerkmale',
      'arch.perf.caption':       '04 · Leistung',
      'arch.perf.title':         'An einer höheren Messlatte.',
      'arch.perf.1.lead':        'Konstantes Gleitverhalten.',
      'arch.perf.1.body':        '500 × 500 mm ununterbrochene Fläche.',
      'arch.perf.2.lead':        'Ein klares Profil.',
      'arch.perf.2.body':        '4 mm vom Desk bis zur Oberfläche.',
      'arch.perf.3.lead':        'Wettkampf-Performance.',
      'arch.perf.3.body':        'Getestet von Spielern, die Kontrolle als Handwerk verstehen.',
      'arch.perf.4.lead':        'Leise unter dem Handgelenk.',
      'arch.perf.4.body':        'Die Unterseite absorbiert Bewegung, statt sie zu verraten.',
      'arch.cloth.img.alt':      'ALVIA CC01 Logo auf der Oberfläche in Phantom Blue',
      'arch.base.img.alt':       'ALVIA Control CC01 — 4-mm-Profil',
      'arch.edges.img.alt':      'ALVIA Control CC01 — flache Kante und Aufsicht',

      'about.tag':               'Über uns',
      'about.title':             'Die Gründer.',
      'about.lede':              'Zwei Personen. Ein Studio. Eine lange Sicht.',
      'founder.role.1':          'Gründer',
      'founder.alias.1':         'Auch bekannt als Mr. Leen.',
      'founder.bio.1':           'Schweizer IT-Profi und leidenschaftlicher Gamer. Verantwortlich für Produktentwicklung, Markenbildung und Design bei ALVIA.',
      'founder.alt.1':           'Leans Schreibtisch-Setup mit einem ALVIA Control CC01 Mauspad',
      'founder.role.2':          'Mitgründer',
      'founder.alias.2':         'Auch bekannt als Cheesy.',
      'founder.bio.2':           'Competitive Gamer. Verantwortlich für Produkttests, Feedback und Community-Aufbau bei ALVIA.',
      'founder.alt.2':           'Noahs Schreibtisch-Setup mit einem ALVIA Control CC01 Mauspad',

      'faq.tag':                 'FAQ',
      'faq.title':               'Häufige Fragen.',
      'faq.q.1':                 'Warum ist das Mousepad noch nicht erhältlich?',
      'faq.a.1':                 'ALVIA Control CC01 befindet sich derzeit bei einer kleinen, geschlossenen Gruppe von Spielern und Creators. Die Veröffentlichung erfolgt, wenn das Produkt unseren internen Standard erreicht — nicht früher.',
      'faq.q.2':                 'Wie kann ich Tester werden?',
      'faq.a.2.prefix':          'Senden Sie eine kurze, ehrliche Vorstellung über die Kontaktseite unter',
      'faq.a.2.suffix':          '. Wir schätzen klares Feedback mehr als Follower-Zahlen.',
      'faq.q.3':                 'Wann erfolgt die offizielle Markteinführung?',
      'faq.a.3':                 'Wenn CC01 unseren internen Qualitätsstandard erfüllt. Wir nennen kein Datum, das das Produkt gefährdet.',
      'faq.q.4':                 'Wird es auch Glas-Mousepads geben?',
      'faq.a.4':                 'Der aktuelle CC01-Prototyp kombiniert ein Control-Gewebe, eine 4 mm hohe Basis aus hochdichtem PU-Schaum und flach vernähte Kanten.',
      'faq.q.5':                 'Warum nur ein Produkt?',
      'faq.a.5':                 'Weil Fokus zählt. Ein Produkt, vollständig getestet und mit Bedacht produziert — das ist das Fundament. Mehr kann folgen, aber nie als Lärm.',

      'contact.tag':             'Kontakt',
      'contact.title':           'Schreiben Sie uns.',
      'contact.lede':            'Direkte Kanäle für direkte Anfragen. Keine Formulare, keine Funnels.',
      'contact.cat.1':           'Geschäftsanfragen',
      'contact.cat.2':           'Soziale Medien',
      'contact.cat.3':           'Einzelhandelspartnerschaften',
      'contact.cat.test':        'Produkttests',
      'contact.cat.5':           'Allgemeine Fragen',

      'footer.origin':           'Entworfen in der Schweiz.',
      'footer.copyright':        '© 2026 ALVIA Studio. Alle Rechte vorbehalten.',
      'footer.privacy':          'Datenschutz',
      'footer.terms':            'Nutzungsbedingungen'
    },

    fr: {
      'meta.title':              'ALVIA — Précision. Rien de plus.',
      'meta.description':        'ALVIA est un studio suisse qui développe ALVIA Control CC01, un pad de précision raffiné lentement et avec discernement avec un petit groupe de joueurs et créateurs.',
      'brand.aria':              'ALVIA — Accueil',
      'nav.home':                'Accueil',
      'nav.control':             'Control CC01',
      'nav.community':           'Communauté',
      'nav.shop':                'Prototype',
      'nav.prototype':           'Prototype',
      'nav.technology':          'Technologie',
      'nav.about':               'À propos',
      'nav.faq':                 'FAQ',
      'nav.contact':             'Contact',
      'nav.lang.label':          'Langue',
      'social.label':            'Social',
      'principles.label':        'Principes de design',

      'hero.tag':                'Actuellement en phase de prototype',
      'hero.title.a':            'Précision.',
      'hero.title.b':            'Rien de plus.',
      'hero.sub':                'Conçu en Suisse.',
      'hero.note':               'Nous peaufinons actuellement notre premier prototype avec de vrais joueurs et créateurs.',
      'hero.cta':                'En savoir plus',
      'hero.img.alt':            'ALVIA — Control CC01',

      'philosophy.tag':          'Philosophie',
      'philosophy.title.a':      'Moins de distractions.',
      'philosophy.title.b':      'De meilleurs produits.',
      'philosophy.lede':         'ALVIA croit que moins de distractions produisent de meilleurs produits. Nous ne construisons pas un catalogue. Nous construisons un produit — avec soin, méthodiquement, jusqu\'à ce qu\'il soit juste.',
      'philosophy.pillar.1':     'Minimalisme',
      'philosophy.pillar.2':     'Précision',
      'philosophy.pillar.3':     'Constance',
      'philosophy.pillar.4':     'Savoir-faire',
      'philosophy.pillar.5':     'Attention au détail',
      'philosophy.pillar.6':     'Qualité à long terme',

      'prototype.tag':           'Prototype actuel',
      'prototype.code.label':    'Code interne',
      'prototype.lede':          'Chaque prototype est testé et raffiné avant production. Le CC01 est actuellement entre les mains d\'un petit groupe de joueurs et créateurs. La sortie suivra lorsque le produit répondra à notre standard interne — pas avant.',
      'prototype.specs.aria':    'Spécifications de l\'ALVIA Control CC01',

      'spec.dimensions':         'Dimensions',
      'spec.surface':            'Surface',
      'spec.base':               'Base',
      'spec.edges':              'Bords',
      'spec.origin':             'Origine',
      'spec.thickness':          'Épaisseur',
      'spec.surface.value':      'Surface de contrôle premium',
      'spec.base.value':         'Base en mousse PU haute densité',
      'spec.edges.value':        'Bords cousus noirs',
      'spec.origin.value':       'Conçu en Suisse',

      'timeline.tag':            'Développement',
      'timeline.title':          'Du concept au lancement.',
      'timeline.lede':           'ALVIA ne va pas vite par choix. Chaque étape a sa raison.',
      'timeline.list.aria':      'Chronologie de développement',
      'timeline.current':        'En cours',
      'timeline.status':         'En test auprès de la communauté fondatrice.',
      'timeline.step.1':         'Concept',
      'timeline.step.2':         'Design',
      'timeline.step.3':         'Prototype CC01',
      'timeline.step.4':         'Test communautaire',
      'timeline.step.5':         'Raffinement',
      'timeline.step.6':         'Lancement officiel',

      'arch.tag':                'Technologie & Matériaux',
      'arch.title':              'Conçue en couches.',
      'arch.lede':               'Chaque élément est fonctionnel. Rien n\'est décoratif. Chaque couche a sa raison d\'être.',
      'arch.surface.caption':    '01 · Surface',
      'arch.surface.title':      'Logo ALVIA en surface',
      'arch.surface.body':       'Le logo ALVIA est placé directement sur la surface de contrôle. Sa position et sa taille suivent un langage produit calme, lisible et volontairement discret.',
      'arch.base.caption':       '02 · Fondation',
      'arch.base.title':         'Profil de 4 mm',
      'arch.base.body':          'Le prototype actuel adopte un profil bas de 4 mm. La transition entre le bureau et la surface reste discrète sous le poignet.',
      'arch.edges.caption':      '03 · Finition',
      'arch.edges.title':        'Bords cousus à profil bas',
      'arch.edges.body':         'La couture noire renforcée maintient la surface plane dans le temps et prévient l\'effilochage qui termine un produit trop tôt. Le bord reste où il doit être.',
      'arch.perf.aria':          'Caractéristiques de performance',
      'arch.perf.caption':       '04 · Performance',
      'arch.perf.title':         'À une exigence supérieure.',
      'arch.perf.1.lead':        'Glisse constante.',
      'arch.perf.1.body':        'La même distance au premier jour qu\'au cinq-centième.',
      'arch.perf.2.lead':        'Résistance à l\'humidité.',
      'arch.perf.2.body':        'La texture reste stable en hivers secs comme en étés humides.',
      'arch.perf.3.lead':        'Performance en compétition.',
      'arch.perf.3.body':        'Testée par des joueurs qui traitent le contrôle comme un artisanat.',
      'arch.perf.4.lead':        'Silence sous le poignet.',
      'arch.perf.4.body':        'La base absorbe le mouvement au lieu de l\'annoncer.',
      'arch.cloth.img.alt':      'Logo ALVIA CC01 sur la surface Phantom Blue',
      'arch.base.img.alt':       'ALVIA Control CC01 — profil de 4 mm',
      'arch.edges.img.alt':      'ALVIA Control CC01 — bord bas et vue de dessus',

      'about.tag':               'À propos',
      'about.title':             'Les fondateurs.',
      'about.lede':              'Deux personnes. Un studio. Une vision long terme.',
      'founder.role.1':          'Fondateur',
      'founder.alias.1':         'Également connu sous le nom de Mr. Leen.',
      'founder.bio.1':           'Professionnel IT suisse et gamer passionné. Responsable du développement produit, de l\'identité de marque et du design chez ALVIA.',
      'founder.alt.1':           'Le poste de travail de Lean avec un tapis ALVIA Control CC01',
      'founder.role.2':          'Co-fondateur',
      'founder.alias.2':         'Également connu sous le nom de Cheesy.',
      'founder.bio.2':           'Joueur compétitif. Responsable des tests produit, du retour et du développement de la communauté chez ALVIA.',
      'founder.alt.2':           'Le poste de travail de Noah avec un tapis ALVIA Control CC01',

      'faq.tag':                 'FAQ',
      'faq.title':               'Questions fréquentes.',
      'faq.q.1':                 'Pourquoi le pad n\'est-il pas encore disponible ?',
      'faq.a.1':                 'L\'ALVIA Control CC01 est actuellement entre les mains d\'un petit groupe fermé de joueurs et créateurs. La sortie a lieu lorsque le produit atteint notre standard interne — pas avant.',
      'faq.q.2':                 'Comment devenir testeur ?',
      'faq.a.2.prefix':          'Envoyez une courte présentation honnête via la page Contact sous',
      'faq.a.2.suffix':          '. Nous valorisons un retour clair plus qu\'un nombre d\'abonnés.',
      'faq.q.3':                 'Quand aura lieu le lancement officiel ?',
      'faq.a.3':                 'Lorsque CC01 atteindra notre standard de qualité interne. Nous ne communiquerons pas de date qui compromettrait le produit.',
      'faq.q.4':                 'Y aura-t-il des pads en verre ?',
      'faq.a.4':                 'Le prototype CC01 actuel combine une surface textile de contrôle, une base de 4 mm en mousse PU haute densité et des bords cousus bas.',
      'faq.q.5':                 'Pourquoi un seul produit ?',
      'faq.a.5':                 'Parce que le focus compte. Un produit, entièrement testé et produit avec discernement — c\'est le fondement. D\'autres pourront suivre, jamais en bruit.',

      'contact.tag':             'Contact',
      'contact.title':           'Écrivez-nous.',
      'contact.lede':            'Des canaux directs pour des demandes directes. Pas de formulaires, pas d\'entonnoirs.',
      'contact.cat.1':           'Demandes commerciales',
      'contact.cat.2':           'réseaux sociaux',
      'contact.cat.3':           'Partenariats retail',
      'contact.cat.test':        'Tests produit',
      'contact.cat.5':           'Questions générales',

      'footer.origin':           'Conçu en Suisse.',
      'footer.copyright':        '© 2026 ALVIA Studio. Tous droits réservés.',
      'footer.privacy':          'Politique de confidentialité',
      'footer.terms':            'Conditions'
    }
  };

  /* Asset-specific copy patch: keeps this reference catalog aligned with the supplied product images. */
  Object.assign(STRINGS.en, {
    'arch.surface.title': 'ALVIA Surface Mark',
    'arch.surface.body': 'The ALVIA mark is placed directly on the control surface. Its position and scale are part of the product language: quiet, legible and intentionally restrained.',
    'arch.base.title': '4 mm Profile',
    'arch.base.body': 'The current prototype is built to a low 4 mm profile. The proportion keeps the transition from desk to surface discreet under the wrist.',
    'arch.cloth.img.alt': 'ALVIA CC01 logo mark on the Phantom Blue surface',
    'arch.base.img.alt': 'ALVIA Control CC01 — 4 mm profile detail',
    'arch.edges.img.alt': 'ALVIA Control CC01 — low-profile edge and top view',
    'spec.surface.value': 'Premium control surface',
    'spec.base.value': 'High-density PU foam base',
    'asset.hero.caption': 'CC01 / TEST UNIT 01',
    'asset.prototype.top.caption': 'ALVIA CC01 — TOP VIEW',
    'asset.prototype.base.caption': 'ALVIA CC01 — 4 MM PROFILE',
    'asset.prototype.logo.caption': 'ALVIA CC01 — SURFACE DETAIL',
    'asset.arch.surface.caption': 'SURFACE / CONTROL CLOTH',
    'asset.arch.base.caption': 'BASE / 4 MM PROFILE',
    'asset.arch.edges.caption': 'EDGE / LOW-PROFILE STITCHING'
  });
  Object.assign(STRINGS.de, {
    'arch.surface.title': 'ALVIA-Oberflächenlogo',
    'arch.surface.body': 'Das ALVIA-Logo sitzt direkt auf der Steueroberfläche. Position und Größe gehören zur Produktsprache: ruhig, lesbar und bewusst zurückhaltend.',
    'arch.base.title': '4-mm-Profil',
    'arch.base.body': 'Der aktuelle Prototyp ist auf ein flaches 4-mm-Profil ausgelegt. Der Übergang vom Schreibtisch zur Oberfläche bleibt unter dem Handgelenk dezent.',
    'arch.cloth.img.alt': 'ALVIA CC01 Logo auf der Oberfläche in Phantom Blue',
    'arch.base.img.alt': 'ALVIA Control CC01 — 4-mm-Profil',
    'arch.edges.img.alt': 'ALVIA Control CC01 — flache Kante und Aufsicht',
    'spec.surface.value': 'Premium-Steueroberfläche',
    'spec.base.value': 'Basis aus hochdichtem PU-Schaum',
    'asset.hero.caption': 'CC01 / TESTGERÄT 01',
    'asset.prototype.top.caption': 'ALVIA CC01 — AUFSICHT',
    'asset.prototype.base.caption': 'ALVIA CC01 — 4-MM-PROFIL',
    'asset.prototype.logo.caption': 'ALVIA CC01 — OBERFLÄCHEN-DETAIL',
    'asset.arch.surface.caption': 'OBERFLÄCHE / CONTROL-GEWEBE',
    'asset.arch.base.caption': 'BASIS / 4-MM-PROFIL',
    'asset.arch.edges.caption': 'KANTE / FLACHE NAHT'
  });
  Object.assign(STRINGS.fr, {
    'arch.surface.title': 'Logo ALVIA en surface',
    'arch.surface.body': 'Le logo ALVIA est placé directement sur la surface de contrôle. Sa position et sa taille suivent un langage produit calme, lisible et volontairement discret.',
    'arch.base.title': 'Profil de 4 mm',
    'arch.base.body': 'Le prototype actuel adopte un profil bas de 4 mm. La transition entre le bureau et la surface reste discrète sous le poignet.',
    'arch.cloth.img.alt': 'Logo ALVIA CC01 sur la surface Phantom Blue',
    'arch.base.img.alt': 'ALVIA Control CC01 — profil de 4 mm',
    'arch.edges.img.alt': 'ALVIA Control CC01 — bord bas et vue de dessus',
    'spec.surface.value': 'Surface de contrôle premium',
    'spec.base.value': 'Base en mousse PU haute densité',
    'asset.hero.caption': 'CC01 / UNITÉ DE TEST 01',
    'asset.prototype.top.caption': 'ALVIA CC01 — VUE DE DESSUS',
    'asset.prototype.base.caption': 'ALVIA CC01 — PROFIL DE 4 MM',
    'asset.prototype.logo.caption': 'ALVIA CC01 — DÉTAIL DE SURFACE',
    'asset.arch.surface.caption': 'SURFACE / TEXTILE DE CONTRÔLE',
    'asset.arch.base.caption': 'BASE / PROFIL DE 4 MM',
    'asset.arch.edges.caption': 'BORD / COUTURE BASSE'
  });

  /* Product-first brand language + slideshow copy. CC01 is the first chapter, not the whole catalogue. */
  Object.assign(STRINGS.en, {
    'nav.products': 'Products',
    'hero.tag': 'Swiss product studio · Currently testing',
    'hero.note': 'ALVIA develops considered tools for precise work, play and everything between. The first is currently being tested with real players and creators.',
    'hero.view': 'View product',
    'philosophy.title.a': 'A small collection.',
    'philosophy.title.b': 'Nothing unnecessary.',
    'philosophy.lede': 'ALVIA builds a small collection of precise tools. Each product begins with a clear purpose, earns its place through testing and remains open to refinement.',
    'prototype.tag': 'Product development',
    'prototype.lede': 'Every product is tested and refined before it earns a place in the collection. CC01 is the first chapter: currently with a small group of players and creators, and still being shaped.',
    'product.tag': 'Product 01 · Current',
    'product.title': 'The first surface.',
    'product.code.label': 'ALVIA Control',
    'product.lede': 'CC01 is where ALVIA begins: one considered control surface, tested in the real world before the collection moves forward. View the details, then continue through the product story.',
    'product.future': 'CC01 is the first product, not the final destination. ALVIA is developing the next surfaces and tools with the same standard: only what earns its place moves forward.',
    'product.details': 'See specifications',
    'product.carousel.label': 'ALVIA CC01 product views',
    'product.views.label': 'Product views',
    'product.prev': 'Previous product view',
    'product.next': 'Next product view',
    'product.pause': 'Pause',
    'product.resume': 'Play slideshow',
    'product.view.1': 'View 1', 'product.view.2': 'View 2', 'product.view.3': 'View 3',
    'product.image.black.top.alt': 'ALVIA Control CC01 in Moonnight Black — top view',
    'product.image.black.top.caption': 'Moonnight Black · top view',
    'product.image.blue.top.alt': 'ALVIA Control CC01 in Phantom Blue — top view',
    'product.image.blue.top.caption': 'Phantom Blue · top view',
    'product.image.black.side.alt': 'ALVIA Control CC01 in Moonnight Black — side and top view',
    'product.image.black.side.caption': 'Moonnight Black · side and top view',
    'product.image.black.base.alt': 'ALVIA Control CC01 in Moonnight Black — 4 mm profile',
    'product.image.black.base.caption': 'Moonnight Black · 4 mm profile',
    'product.image.blue.base.alt': 'ALVIA Control CC01 in Phantom Blue — 4 mm profile',
    'product.image.blue.base.caption': 'Phantom Blue · 4 mm profile',
    'product.image.black.logo.alt': 'ALVIA CC01 logo mark on the Moonnight Black surface',
    'product.image.blue.logo.alt': 'ALVIA CC01 logo mark on the Phantom Blue surface',
    'product.image.blue.logo.caption': 'Phantom Blue · surface mark',
    'product.colorway.label': 'Colourway',
    'product.colorway.blue': 'Phantom Blue',
    'product.colorway.black': 'Moonnight Black',
    'spec.color': 'Colourway',
    'faq.q.5': 'What comes after the first product?',
    'faq.a.5': 'CC01 is the beginning of the collection. Future surfaces and tools will follow only when they meet the same standard of purpose, testing and restraint.',
    'collection.tag': 'The collection',
    'collection.title.a': 'One beginning.',
    'collection.title.b': 'More to earn.',
    'collection.lede': 'CC01 establishes the standard. The next products will not arrive to fill a catalogue — they will arrive when they have a reason to exist.',
    'collection.current.status': 'Currently testing',
    'collection.current.title': 'Control CC01',
    'collection.current.body': 'A 500 × 500 × 4 mm control surface. The first ALVIA product, refined with players and creators.',
    'collection.current.link': 'View product',
    'collection.next.status': 'In development',
    'collection.next.title': 'The next surface',
    'collection.next.body': 'A future ALVIA surface will begin with a different question, not a larger product list.',
    'collection.next.note': 'Details when there are details.',
    'collection.future.status': 'Future direction',
    'collection.future.title': 'Tools with purpose',
    'collection.future.body': 'Accessories and new formats may follow. Each one must make the system more useful, not simply bigger.',
    'collection.future.note': 'Nothing announced.'
  });
  Object.assign(STRINGS.de, {
    'nav.products': 'Produkte',
    'hero.tag': 'Schweizer Produktstudio · Aktuell in Erprobung',
    'hero.note': 'ALVIA entwickelt präzise Werkzeuge für Arbeit, Spiel und alles dazwischen. Das erste Produkt wird derzeit mit echten Spielern und Creators getestet.',
    'hero.view': 'Produkt ansehen',
    'philosophy.title.a': 'Eine kleine Kollektion.',
    'philosophy.title.b': 'Nichts Unnötiges.',
    'philosophy.lede': 'ALVIA entwickelt eine kleine Kollektion präziser Werkzeuge. Jedes Produkt beginnt mit einem klaren Zweck, verdient seinen Platz durch Tests und bleibt offen für Verfeinerung.',
    'prototype.tag': 'Produktentwicklung',
    'prototype.lede': 'Jedes Produkt wird getestet und verfeinert, bevor es einen Platz in der Kollektion erhält. CC01 ist das erste Kapitel: aktuell bei einer kleinen Gruppe von Spielern und Creators und noch in Entwicklung.',
    'product.tag': 'Produkt 01 · Aktuell',
    'product.title': 'Die erste Oberfläche.',
    'product.code.label': 'ALVIA Control',
    'product.lede': 'Mit CC01 beginnt ALVIA: eine durchdachte Control-Oberfläche, in der Praxis getestet, bevor die Kollektion weitergeht. Entdecke die Details und folge der Produktgeschichte.',
    'product.future': 'CC01 ist das erste Produkt, nicht das Ziel. ALVIA entwickelt weitere Oberflächen und Werkzeuge nach demselben Anspruch: Nur was sich seinen Platz verdient, geht weiter.',
    'product.details': 'Spezifikationen ansehen',
    'product.carousel.label': 'ALVIA CC01 Produktansichten',
    'product.views.label': 'Produktansichten',
    'product.prev': 'Vorherige Produktansicht',
    'product.next': 'Nächste Produktansicht',
    'product.pause': 'Pause',
    'product.resume': 'Slideshow abspielen',
    'product.view.1': 'Ansicht 1', 'product.view.2': 'Ansicht 2', 'product.view.3': 'Ansicht 3',
    'product.image.black.top.alt': 'ALVIA Control CC01 in Moonnight Black — Aufsicht',
    'product.image.black.top.caption': 'Moonnight Black · Aufsicht',
    'product.image.blue.top.alt': 'ALVIA Control CC01 in Phantom Blue — Aufsicht',
    'product.image.blue.top.caption': 'Phantom Blue · Aufsicht',
    'product.image.black.side.alt': 'ALVIA Control CC01 in Moonnight Black — Seiten- und Aufsicht',
    'product.image.black.side.caption': 'Moonnight Black · Seite und Aufsicht',
    'product.image.black.base.alt': 'ALVIA Control CC01 in Moonnight Black — 4-mm-Profil',
    'product.image.black.base.caption': 'Moonnight Black · 4-mm-Profil',
    'product.image.blue.base.alt': 'ALVIA Control CC01 in Phantom Blue — 4-mm-Profil',
    'product.image.blue.base.caption': 'Phantom Blue · 4-mm-Profil',
    'product.image.black.logo.alt': 'ALVIA CC01 Logo auf der Oberfläche in Moonnight Black',
    'product.image.blue.logo.alt': 'ALVIA CC01 Logo auf der Oberfläche in Phantom Blue',
    'product.image.blue.logo.caption': 'Phantom Blue · Oberflächenlogo',
    'product.colorway.label': 'Farbvariante',
    'product.colorway.blue': 'Phantom Blue',
    'product.colorway.black': 'Moonnight Black',
    'spec.color': 'Farbvariante',
    'faq.q.5': 'Was kommt nach dem ersten Produkt?',
    'faq.a.5': 'CC01 ist der Beginn der Kollektion. Weitere Oberflächen und Werkzeuge folgen nur, wenn sie denselben Anspruch an Zweck, Tests und Zurückhaltung erfüllen.',
    'collection.tag': 'Die Kollektion',
    'collection.title.a': 'Ein Anfang.',
    'collection.title.b': 'Mehr muss verdient werden.',
    'collection.lede': 'CC01 setzt den Standard. Die nächsten Produkte erscheinen nicht, um einen Katalog zu füllen — sondern wenn sie einen Grund haben zu existieren.',
    'collection.current.status': 'Aktuell in Erprobung',
    'collection.current.title': 'Control CC01',
    'collection.current.body': 'Eine 500 × 500 × 4 mm große Control-Oberfläche. Das erste ALVIA-Produkt, verfeinert mit Spielern und Creators.',
    'collection.current.link': 'Produkt ansehen',
    'collection.next.status': 'In Entwicklung',
    'collection.next.title': 'Die nächste Oberfläche',
    'collection.next.body': 'Eine zukünftige ALVIA-Oberfläche beginnt mit einer anderen Frage, nicht mit einer längeren Produktliste.',
    'collection.next.note': 'Details, wenn es Details gibt.',
    'collection.future.status': 'Zukünftige Richtung',
    'collection.future.title': 'Werkzeuge mit Zweck',
    'collection.future.body': 'Zubehör und neue Formate können folgen. Jedes davon muss das System nützlicher machen, nicht nur größer.',
    'collection.future.note': 'Nichts angekündigt.'
  });
  Object.assign(STRINGS.fr, {
    'nav.products': 'Produits',
    'hero.tag': 'Studio produit suisse · Actuellement en test',
    'hero.note': 'ALVIA développe des outils précis pour le travail, le jeu et tout ce qui se trouve entre les deux. Le premier est actuellement testé avec de vrais joueurs et créateurs.',
    'hero.view': 'Voir le produit',
    'philosophy.title.a': 'Une petite collection.',
    'philosophy.title.b': 'Rien de superflu.',
    'philosophy.lede': 'ALVIA construit une petite collection d’outils précis. Chaque produit commence par un objectif clair, gagne sa place par les tests et reste ouvert au perfectionnement.',
    'prototype.tag': 'Développement produit',
    'prototype.lede': 'Chaque produit est testé et peaufiné avant de trouver sa place dans la collection. CC01 est le premier chapitre : actuellement testé par un petit groupe de joueurs et créateurs.',
    'product.tag': 'Produit 01 · Actuel',
    'product.title': 'La première surface.',
    'product.code.label': 'ALVIA Control',
    'product.lede': 'CC01 est le point de départ d’ALVIA : une surface de contrôle pensée avec soin, testée dans le monde réel avant de poursuivre la collection. Découvrez les détails, puis suivez l’histoire du produit.',
    'product.future': 'CC01 est le premier produit, pas la destination finale. ALVIA développe les prochaines surfaces et outils avec la même exigence : seul ce qui mérite sa place avance.',
    'product.details': 'Voir les spécifications',
    'product.carousel.label': 'Vues du produit ALVIA CC01',
    'product.views.label': 'Vues du produit',
    'product.prev': 'Vue précédente',
    'product.next': 'Vue suivante',
    'product.pause': 'Pause',
    'product.resume': 'Lire le diaporama',
    'product.view.1': 'Vue 1', 'product.view.2': 'Vue 2', 'product.view.3': 'Vue 3',
    'product.image.black.top.alt': 'ALVIA Control CC01 en Moonnight Black — vue de dessus',
    'product.image.black.top.caption': 'Moonnight Black · vue de dessus',
    'product.image.blue.top.alt': 'ALVIA Control CC01 en Phantom Blue — vue de dessus',
    'product.image.blue.top.caption': 'Phantom Blue · vue de dessus',
    'product.image.black.side.alt': 'ALVIA Control CC01 en Moonnight Black — côté et dessus',
    'product.image.black.side.caption': 'Moonnight Black · côté et dessus',
    'product.image.black.base.alt': 'ALVIA Control CC01 en Moonnight Black — profil de 4 mm',
    'product.image.black.base.caption': 'Moonnight Black · profil de 4 mm',
    'product.image.blue.base.alt': 'ALVIA Control CC01 en Phantom Blue — profil de 4 mm',
    'product.image.blue.base.caption': 'Phantom Blue · profil de 4 mm',
    'product.image.black.logo.alt': 'Logo ALVIA CC01 sur la surface Moonnight Black',
    'product.image.blue.logo.alt': 'Logo ALVIA CC01 sur la surface Phantom Blue',
    'product.image.blue.logo.caption': 'Phantom Blue · marque de surface',
    'product.colorway.label': 'Variante de couleur',
    'product.colorway.blue': 'Phantom Blue',
    'product.colorway.black': 'Moonnight Black',
    'spec.color': 'Variante de couleur',
    'faq.q.5': 'Que viendra-t-il après le premier produit ?',
    'faq.a.5': 'CC01 est le début de la collection. Les prochaines surfaces et outils suivront uniquement s’ils répondent au même niveau d’exigence, de test et de retenue.',
    'collection.tag': 'La collection',
    'collection.title.a': 'Un début.',
    'collection.title.b': 'Le reste doit se mériter.',
    'collection.lede': 'CC01 établit le standard. Les prochains produits ne viendront pas remplir un catalogue — ils viendront lorsqu’ils auront une raison d’exister.',
    'collection.current.status': 'Actuellement en test',
    'collection.current.title': 'Control CC01',
    'collection.current.body': 'Une surface de contrôle de 500 × 500 × 4 mm. Le premier produit ALVIA, affiné avec des joueurs et créateurs.',
    'collection.current.link': 'Voir le produit',
    'collection.next.status': 'En développement',
    'collection.next.title': 'La prochaine surface',
    'collection.next.body': 'Une future surface ALVIA commencera par une autre question, pas par une liste de produits plus longue.',
    'collection.next.note': 'Les détails quand il y aura des détails.',
    'collection.future.status': 'Direction future',
    'collection.future.title': 'Des outils avec un but',
    'collection.future.body': 'Des accessoires et de nouveaux formats pourront suivre. Chacun devra rendre le système plus utile, pas simplement plus grand.',
    'collection.future.note': 'Rien d’annoncé.'
  });

  Object.assign(STRINGS.en, {
    'nav.menu': 'Menu',
    'community.tag': 'Community',
    'community.title': 'Built with the people who use it.',
    'community.lede': 'ALVIA is developing its first surface with real players and creators. The community is where ideas become useful, and where details get tested honestly.',
    'community.card.1.tag': 'Testing',
    'community.card.1.title': 'Real hands. Clear feedback.',
    'community.card.1.body': 'Control CC01 is currently being evaluated by a small group of players and creators before any public release.',
    'community.card.2.tag': 'Conversation',
    'community.card.2.title': 'A direct line to ALVIA.',
    'community.card.2.body': 'For testing, feedback or a thoughtful question, use the contact page. We prefer useful conversations over noise.',
    'community.card.2.link': 'Get in touch',
    'community.card.3.tag': 'Next',
    'community.card.3.title': 'The door stays open.',
    'community.card.3.body': 'Tester applications are not always open, but the next conversation can start at any time.',
    'community.card.3.link': 'Read the FAQ'
  });
  Object.assign(STRINGS.de, {
    'nav.menu': 'Menü',
    'community.tag': 'Community',
    'community.title': 'Entwickelt mit den Menschen, die es nutzen.',
    'community.lede': 'ALVIA entwickelt seine erste Oberfläche mit echten Spielern und Creators. In der Community werden Ideen nützlich und Details ehrlich getestet.',
    'community.card.1.tag': 'Erprobung',
    'community.card.1.title': 'Echte Hände. Klares Feedback.',
    'community.card.1.body': 'Control CC01 wird vor der öffentlichen Veröffentlichung von einer kleinen Gruppe aus Spielern und Creators geprüft.',
    'community.card.2.tag': 'Austausch',
    'community.card.2.title': 'Direkter Kontakt zu ALVIA.',
    'community.card.2.body': 'Für Tests, Feedback oder eine durchdachte Frage nutzen Sie die Kontaktseite. Wir bevorzugen nützliche Gespräche statt Lärm.',
    'community.card.2.link': 'Kontakt aufnehmen',
    'community.card.3.tag': 'Als Nächstes',
    'community.card.3.title': 'Die Tür bleibt offen.',
    'community.card.3.body': 'Bewerbungen für Tests sind nicht immer offen, aber ein neues Gespräch kann jederzeit beginnen.',
    'community.card.3.link': 'FAQ lesen'
  });
  Object.assign(STRINGS.fr, {
    'nav.menu': 'Menu',
    'community.tag': 'Communauté',
    'community.title': 'Conçue avec ceux qui l’utilisent.',
    'community.lede': 'ALVIA développe sa première surface avec de vrais joueurs et créateurs. La communauté transforme les idées en usages et teste honnêtement chaque détail.',
    'community.card.1.tag': 'Tests',
    'community.card.1.title': 'De vraies mains. Des retours clairs.',
    'community.card.1.body': 'Control CC01 est actuellement évalué par un petit groupe de joueurs et créateurs avant toute sortie publique.',
    'community.card.2.tag': 'Échange',
    'community.card.2.title': 'Un lien direct avec ALVIA.',
    'community.card.2.body': 'Pour un test, un retour ou une question réfléchie, utilisez la page Contact. Nous préférons les échanges utiles au bruit.',
    'community.card.2.link': 'Nous contacter',
    'community.card.3.tag': 'Ensuite',
    'community.card.3.title': 'La porte reste ouverte.',
    'community.card.3.body': 'Les candidatures de test ne sont pas toujours ouvertes, mais une nouvelle conversation peut commencer à tout moment.',
    'community.card.3.link': 'Lire la FAQ'
  });

  /* Final copy pass — concrete product facts, clear next steps, no unsupported claims. */
  Object.assign(STRINGS.en, {
    'meta.title': 'ALVIA — Control, refined.',
    'meta.description.home': 'ALVIA Control CC01: a 500 × 500 mm control mousepad with a 4 mm high-density PU foam base. Designed in Switzerland and currently in testing.',
    'meta.description.products': 'Discover ALVIA Control CC01 — a 500 × 500 mm control mousepad, currently being refined with players and creators.',
    'meta.description.technology': 'Explore the surface, 4 mm profile and stitched edges behind ALVIA Control CC01.',
    'meta.description.community': 'Follow the ALVIA Control CC01 testing programme and share considered feedback.',
    'meta.description.about': 'Meet the small Swiss studio developing ALVIA Control CC01.',
    'meta.description.faq': 'Answers about ALVIA Control CC01, testing and the next release.',
    'meta.description.contact': 'Contact ALVIA about product testing, feedback, partnerships or general questions.',
    'nav.shop': 'View CC01',
    'hero.tag': 'ALVIA CONTROL CC01 · IN TESTING',
    'hero.title.a': 'Control your move.',
    'hero.title.b': 'Keep the focus.',
    'hero.sub': '500 × 500 mm · 4 mm profile',
    'hero.note': 'A control mousepad with a high-density PU foam base and low-profile stitched edges. Designed in Switzerland, then refined with real players.',
    'hero.view': 'Discover CC01',
    'hero.cta': 'Explore the test programme',
    'collection.tag': 'Why CC01',
    'collection.title.a': 'Made for the',
    'collection.title.b': 'long move.',
    'collection.lede': 'The first ALVIA product begins with the details that matter at the desk: generous space, a composed profile and feedback from people who play.',
    'collection.current.status': '01 · Workspace',
    'collection.current.title': 'Room to commit.',
    'collection.current.body': '500 × 500 mm gives your mouse room when the round asks for more than a small correction.',
    'collection.current.link': 'See CC01',
    'collection.next.status': '02 · Construction',
    'collection.next.title': 'A low, steady profile.',
    'collection.next.body': 'A 4 mm high-density PU foam base sits beneath the control surface for a considered desk feel.',
    'collection.next.note': '4 mm · High-density PU foam',
    'collection.future.status': '03 · Testing',
    'collection.future.title': 'Feedback leaves a mark.',
    'collection.future.body': 'CC01 is being tested with a small group of players and creators before the next version moves forward.',
    'collection.future.note': 'Prototype programme in progress',
    'home.fact.1.label': 'Format', 'home.fact.1.value': '500 × 500 mm',
    'home.fact.2.label': 'Profile', 'home.fact.2.value': '4 mm',
    'home.fact.3.label': 'Status', 'home.fact.3.value': 'In testing',
    'home.testing.tag': 'The test programme',
    'home.testing.title': 'Built with the people who play.',
    'home.testing.lede': 'We are refining CC01 with a focused group of players and creators. Useful feedback decides what remains, changes or leaves.',
    'home.testing.link': 'Meet the community',
    'product.tag': 'CC01 · Current prototype',
    'product.title': 'More room for precise moves.',
    'product.lede': 'ALVIA Control CC01 is a 500 × 500 mm control mousepad with a 4 mm high-density PU foam base and low-profile stitched edges. It is currently being refined with players.',
    'product.future': 'The prototype is intentionally still in motion. Every considered test helps shape the version that follows.',
    'product.details': 'See the specifications',
    'prototype.tag': 'Product details',
    'prototype.lede': 'A generous control surface, 4 mm profile and stitched perimeter define the current CC01 prototype. The next iteration follows what testing teaches us.',
    'spec.surface.value': 'Control cloth surface',
    'spec.base.value': 'High-density PU foam base',
    'spec.edges.value': 'Low-profile stitched edges',
    'spec.origin.value': 'Designed in Switzerland',
    'arch.tag': 'Construction',
    'arch.title': 'Every layer has a job.',
    'arch.lede': 'Surface, base and edge are selected for a focused, controlled desk experience. The prototype is tested in real setups before it is final.',
    'arch.surface.title': 'Control surface',
    'arch.surface.body': 'The cloth surface is tuned for controlled movement. Its character is being evaluated across real play styles during the testing phase.',
    'arch.base.title': '4 mm profile',
    'arch.base.body': 'A 4 mm high-density PU foam base gives the current prototype a composed, low profile at the desk.',
    'arch.edges.title': 'Stitched perimeter',
    'arch.edges.body': 'Low-profile stitching traces the edge of the surface and keeps the finish deliberately restrained.',
    'arch.perf.title': 'Measured in use.',
    'arch.perf.1.lead': 'A large working area.',
    'arch.perf.1.body': '500 × 500 mm of uninterrupted surface.',
    'arch.perf.2.lead': 'A defined profile.',
    'arch.perf.2.body': '4 mm from desk to surface.',
    'arch.perf.3.lead': 'Feedback-led refinement.',
    'arch.perf.3.body': 'Current prototypes are evaluated by players and creators.',
    'arch.perf.4.lead': 'Quiet visual language.',
    'arch.perf.4.body': 'A minimal mark and restrained black finish.',
    'about.title': 'Designed by gamers.',
    'about.lede': 'ALVIA began with a simple conviction: gaming tools should feel less generic and more considered.',
    'philosophy.title.a': 'Less noise.',
    'philosophy.title.b': 'More intention.',
    'philosophy.lede': 'ALVIA keeps the collection small and the process close. A product earns its place through a clear purpose, repeated testing and useful detail.',
    'founder.bio.1': 'Swiss IT professional and gamer. Lean leads product development, brand and design at ALVIA.',
    'founder.bio.2': 'Competitive player and co-founder. Noah leads product testing, feedback and community at ALVIA.',
    'community.title': 'Test it. Shape it.',
    'community.lede': 'CC01 is being refined with a small group of competitive players and creators. Honest feedback is what moves the prototype forward.',
    'community.card.1.title': 'Real setups. Clear feedback.',
    'community.card.1.body': 'We look at how CC01 feels in everyday play, then use the feedback to decide what deserves another iteration.',
    'community.card.2.title': 'A direct route to ALVIA.',
    'community.card.2.body': 'Tell us what you play, your sensitivity, your current pad and what you would want to test. We read every message.',
    'community.card.2.link': 'Contact the team',
    'community.card.3.title': 'The next session starts here.',
    'community.card.3.body': 'Testing places are limited, but you can introduce yourself for a future round at any time.',
    'community.card.3.link': 'Apply as a tester',
    'faq.title': 'Good questions, clear answers.',
    'faq.q.1': 'When can I buy CC01?',
    'faq.a.1': 'CC01 is still in testing. When the current phase is complete, people in the early-access conversation will hear first.',
    'faq.q.2': 'How do I apply for testing?',
    'faq.a.2.prefix': 'Write to us via the contact page under',
    'faq.a.2.suffix': '. Include your game, sensitivity, current pad and a short note about why you would like to test.',
    'faq.q.3': 'Is there a launch date?',
    'faq.a.3': 'Not yet. We will only announce a date once the current testing phase is complete and the product is ready to move forward.',
    'faq.q.4': 'Which materials are used?',
    'faq.a.4': 'The current CC01 prototype combines a control cloth surface, a 4 mm high-density PU foam base and low-profile stitched edges.',
    'faq.q.5': 'Will there be more ALVIA products?',
    'faq.a.5': 'CC01 comes first. Future products will be considered only when they solve a real need with the same level of focus.',
    'contact.title': 'How can we help?',
    'contact.lede': 'Want to test, share feedback or work with ALVIA? Choose the relevant contact route — every message is read by the team.',
    'contact.cat.test': 'Test programme',
    'footer.signal': 'ALVIA CONTROL CC01 · PROTOTYPE PROGRAMME',
    'footer.contact': 'Contact ALVIA',
    'a11y.skip': 'Skip to content'
  });
  Object.assign(STRINGS.de, {
    'meta.title': 'ALVIA — Kontrolle, verfeinert.',
    'meta.description.home': 'ALVIA Control CC01: ein 500 × 500 mm großes Control-Mauspad mit 4-mm-Basis aus hochdichtem PU-Schaum. Entwickelt in der Schweiz und aktuell in Erprobung.',
    'meta.description.products': 'Entdecke ALVIA Control CC01 — ein 500 × 500 mm großes Control-Mauspad, das aktuell mit Spielern und Creators weiterentwickelt wird.',
    'meta.description.technology': 'Oberfläche, 4-mm-Profil und vernähte Kanten des ALVIA Control CC01 im Überblick.',
    'meta.description.community': 'Begleite das Testerprogramm für ALVIA Control CC01 und gib Feedback, das etwas bewegt.',
    'meta.description.about': 'Lerne das kleine Schweizer Studio hinter ALVIA Control CC01 kennen.',
    'meta.description.faq': 'Antworten zu ALVIA Control CC01, der Testphase und dem nächsten Release.',
    'meta.description.contact': 'Kontaktiere ALVIA zu Tests, Feedback, Partnerschaften oder allgemeinen Fragen.',
    'nav.shop': 'CC01 entdecken',
    'hero.tag': 'ALVIA CONTROL CC01 · AKTUELL IN ERPROBUNG',
    'hero.title.a': 'Präzise Kontrolle.',
    'hero.title.b': 'Ohne Ablenkung.',
    'hero.sub': '500 × 500 mm · 4 mm Profil',
    'hero.note': 'Ein Control-Mauspad mit hochdichter PU-Schaumbasis und flach vernähten Kanten. Entwickelt in der Schweiz und mit echten Spielern weiter verfeinert.',
    'hero.view': 'CC01 entdecken',
    'hero.cta': 'Testerprogramm ansehen',
    'collection.tag': 'Warum CC01',
    'collection.title.a': 'Gemacht für',
    'collection.title.b': 'den langen Move.',
    'collection.lede': 'Das erste ALVIA-Produkt beginnt bei dem, was am Desk zählt: viel Fläche, ein ruhiges Profil und Feedback von Menschen, die spielen.',
    'collection.current.status': '01 · Fläche',
    'collection.current.title': 'Raum für den Commit.',
    'collection.current.body': '500 × 500 mm geben deiner Maus Platz, wenn eine Runde mehr als eine kleine Korrektur verlangt.',
    'collection.current.link': 'CC01 ansehen',
    'collection.next.status': '02 · Aufbau',
    'collection.next.title': 'Flach. Ruhig. Klar.',
    'collection.next.body': 'Unter der Control-Oberfläche liegt eine 4 mm hohe Basis aus hochdichtem PU-Schaum — bewusst auf ein reduziertes Desk-Gefühl abgestimmt.',
    'collection.next.note': '4 mm · Hochdichter PU-Schaum',
    'collection.future.status': '03 · Erprobung',
    'collection.future.title': 'Feedback hinterlässt Spuren.',
    'collection.future.body': 'CC01 wird mit einer kleinen Gruppe aus Spielern und Creators getestet, bevor die nächste Version weitergeht.',
    'collection.future.note': 'Testerprogramm läuft',
    'home.fact.1.label': 'Format', 'home.fact.1.value': '500 × 500 mm',
    'home.fact.2.label': 'Profil', 'home.fact.2.value': '4 mm',
    'home.fact.3.label': 'Status', 'home.fact.3.value': 'In Erprobung',
    'home.testing.tag': 'Das Testerprogramm',
    'home.testing.title': 'Entwickelt mit den Menschen, die spielen.',
    'home.testing.lede': 'Wir verfeinern CC01 mit einer fokussierten Gruppe aus Spielern und Creators. Nützliches Feedback entscheidet, was bleibt, sich verändert oder geht.',
    'home.testing.link': 'Zur Community',
    'product.tag': 'CC01 · Aktueller Prototyp',
    'product.title': 'Mehr Raum für präzise Moves.',
    'product.lede': 'ALVIA Control CC01 ist ein 500 × 500 mm großes Control-Mauspad mit 4-mm-Basis aus hochdichtem PU-Schaum und flach vernähten Kanten. Aktuell wird es mit Spielern weiterentwickelt.',
    'product.future': 'Der Prototyp ist bewusst noch in Bewegung. Jeder durchdachte Test formt die Version, die folgt.',
    'product.details': 'Spezifikationen ansehen',
    'prototype.tag': 'Produktdetails',
    'prototype.lede': 'Eine großzügige Control-Oberfläche, ein 4-mm-Profil und ein vernähter Rand definieren den aktuellen CC01-Prototyp. Was die Tests zeigen, prägt die nächste Iteration.',
    'spec.surface.value': 'Control-Gewebe',
    'spec.base.value': 'Basis aus hochdichtem PU-Schaum',
    'spec.edges.value': 'Flach vernähte Kanten',
    'spec.origin.value': 'Entwickelt in der Schweiz',
    'arch.tag': 'Aufbau',
    'arch.title': 'Jede Schicht hat eine Aufgabe.',
    'arch.lede': 'Oberfläche, Basis und Kante sind auf ein fokussiertes, kontrolliertes Desk-Gefühl abgestimmt. Der Prototyp wird in echten Setups getestet, bevor er final ist.',
    'arch.surface.title': 'Control-Oberfläche',
    'arch.surface.body': 'Das Gewebe ist auf kontrollierte Mausbewegungen abgestimmt. Sein Verhalten wird in der Testphase mit unterschiedlichen Spielstilen geprüft.',
    'arch.base.title': '4-mm-Profil',
    'arch.base.body': 'Die 4 mm hohe Basis aus hochdichtem PU-Schaum verleiht dem aktuellen Prototyp ein bewusst flaches, ruhiges Profil am Desk.',
    'arch.edges.title': 'Vernähter Rand',
    'arch.edges.body': 'Flache Nähte zeichnen die Kante der Oberfläche nach und halten den Abschluss bewusst zurückhaltend.',
    'arch.perf.title': 'Im Einsatz gemessen.',
    'arch.perf.1.lead': 'Viel Arbeitsfläche.',
    'arch.perf.1.body': '500 × 500 mm ununterbrochene Fläche.',
    'arch.perf.2.lead': 'Ein klares Profil.',
    'arch.perf.2.body': '4 mm vom Desk bis zur Oberfläche.',
    'arch.perf.3.lead': 'Verfeinert durch Feedback.',
    'arch.perf.3.body': 'Aktuelle Prototypen werden von Spielern und Creators bewertet.',
    'arch.perf.4.lead': 'Ruhige Bildsprache.',
    'arch.perf.4.body': 'Ein reduziertes Logo und ein schwarzes Finish.',
    'about.title': 'Von Gamern entwickelt.',
    'about.lede': 'ALVIA entstand aus einem einfachen Anspruch: Gaming-Peripherie soll weniger beliebig und spürbar durchdachter sein.',
    'philosophy.title.a': 'Weniger Lärm.',
    'philosophy.title.b': 'Mehr Absicht.',
    'philosophy.lede': 'ALVIA hält die Kollektion klein und den Prozess nah. Ein Produkt verdient seinen Platz durch einen klaren Zweck, wiederholte Tests und nützliche Details.',
    'founder.bio.1': 'Schweizer IT-Fachmann und Gamer. Lean verantwortet Produktentwicklung, Marke und Design bei ALVIA.',
    'founder.bio.2': 'Wettkampfspieler und Mitgründer. Noah verantwortet Produkttests, Feedback und Community bei ALVIA.',
    'community.title': 'Teste mit. Präge mit.',
    'community.lede': 'CC01 wird mit einer kleinen Gruppe kompetitiver Spieler und Creator weiterentwickelt. Ehrliches Feedback entscheidet, was im Prototyp bleibt.',
    'community.card.1.title': 'Echte Setups. Klares Feedback.',
    'community.card.1.body': 'Wir schauen, wie sich CC01 im Alltag spielt und entscheiden anhand des Feedbacks, was eine weitere Iteration verdient.',
    'community.card.2.title': 'Direkt zu ALVIA.',
    'community.card.2.body': 'Schreib uns, was du spielst, deine Sensitivity, dein aktuelles Pad und was du testen möchtest. Wir lesen jede Nachricht.',
    'community.card.2.link': 'Team kontaktieren',
    'community.card.3.title': 'Die nächste Session beginnt hier.',
    'community.card.3.body': 'Testplätze sind begrenzt. Für eine spätere Runde kannst du dich aber jederzeit kurz vorstellen.',
    'community.card.3.link': 'Als Tester:in bewerben',
    'faq.title': 'Gute Fragen. Klare Antworten.',
    'faq.q.1': 'Wann kann ich CC01 kaufen?',
    'faq.a.1': 'CC01 befindet sich noch in der Erprobung. Sobald die aktuelle Phase abgeschlossen ist, erfahren Menschen im Frühzugang zuerst davon.',
    'faq.q.2': 'Wie bewerbe ich mich fürs Testen?',
    'faq.a.2.prefix': 'Schreib uns über die Kontaktseite unter',
    'faq.a.2.suffix': '. Nenne dein Spiel, deine Sensitivity, dein aktuelles Pad und kurz, weshalb du testen möchtest.',
    'faq.q.3': 'Gibt es schon ein Releasedatum?',
    'faq.a.3': 'Noch nicht. Ein Datum nennen wir erst, wenn die laufende Testphase abgeschlossen ist und das Produkt bereit für den nächsten Schritt ist.',
    'faq.q.4': 'Welche Materialien werden verwendet?',
    'faq.a.4': 'Der aktuelle CC01-Prototyp kombiniert ein Control-Gewebe, eine 4 mm hohe Basis aus hochdichtem PU-Schaum und flach vernähte Kanten.',
    'faq.q.5': 'Wird es weitere ALVIA-Produkte geben?',
    'faq.a.5': 'CC01 kommt zuerst. Künftige Produkte werden nur dann gedacht, wenn sie ein echtes Bedürfnis mit demselben Fokus lösen.',
    'contact.title': 'Wobei können wir helfen?',
    'contact.lede': 'Du möchtest testen, Feedback geben oder mit ALVIA zusammenarbeiten? Wähle den passenden Kontaktweg — jede Nachricht landet direkt beim Team.',
    'contact.cat.test': 'Testerprogramm',
    'footer.signal': 'ALVIA CONTROL CC01 · TESTERPROGRAMM',
    'footer.contact': 'ALVIA kontaktieren',
    'a11y.skip': 'Zum Inhalt springen'
  });
  Object.assign(STRINGS.fr, {
    'meta.title': 'ALVIA — Le contrôle, affiné.',
    'meta.description.home': 'ALVIA Control CC01 : un tapis de contrôle 500 × 500 mm avec une base de 4 mm en mousse PU haute densité. Conçu en Suisse et actuellement en test.',
    'meta.description.products': 'Découvrez ALVIA Control CC01, un tapis de contrôle 500 × 500 mm en cours de perfectionnement avec des joueurs et créateurs.',
    'meta.description.technology': 'Découvrez la surface, le profil de 4 mm et les bords cousus d’ALVIA Control CC01.',
    'meta.description.community': 'Suivez le programme de test ALVIA Control CC01 et partagez un retour utile.',
    'meta.description.about': 'Découvrez le petit studio suisse qui développe ALVIA Control CC01.',
    'meta.description.faq': 'Réponses sur ALVIA Control CC01, les tests et la prochaine sortie.',
    'meta.description.contact': 'Contactez ALVIA pour les tests, les retours, les partenariats ou les questions générales.',
    'nav.shop': 'Découvrir CC01',
    'hero.tag': 'ALVIA CONTROL CC01 · EN TEST',
    'hero.title.a': 'Un contrôle précis.',
    'hero.title.b': 'Sans distraction.',
    'hero.sub': '500 × 500 mm · profil de 4 mm',
    'hero.note': 'Un tapis de contrôle avec une base en mousse PU haute densité et des bords cousus bas. Conçu en Suisse puis affiné avec de vrais joueurs.',
    'hero.view': 'Découvrir CC01',
    'hero.cta': 'Voir le programme de test',
    'collection.tag': 'Pourquoi CC01',
    'collection.title.a': 'Pensé pour les',
    'collection.title.b': 'longs mouvements.',
    'collection.lede': 'Le premier produit ALVIA commence par ce qui compte sur le bureau : un grand espace, un profil discret et le retour de personnes qui jouent.',
    'collection.current.status': '01 · Surface',
    'collection.current.title': 'De la place pour s’engager.',
    'collection.current.body': '500 × 500 mm donnent à votre souris l’espace nécessaire lorsque le tour demande plus qu’une petite correction.',
    'collection.current.link': 'Voir CC01',
    'collection.next.status': '02 · Construction',
    'collection.next.title': 'Bas. Stable. Clair.',
    'collection.next.body': 'Sous la surface de contrôle se trouve une base de 4 mm en mousse PU haute densité, pensée pour une sensation de bureau sobre.',
    'collection.next.note': '4 mm · mousse PU haute densité',
    'collection.future.status': '03 · Tests',
    'collection.future.title': 'Le retour compte.',
    'collection.future.body': 'CC01 est testé avec un petit groupe de joueurs et créateurs avant que la prochaine version avance.',
    'collection.future.note': 'Programme de test en cours',
    'home.fact.1.label': 'Format', 'home.fact.1.value': '500 × 500 mm',
    'home.fact.2.label': 'Profil', 'home.fact.2.value': '4 mm',
    'home.fact.3.label': 'Statut', 'home.fact.3.value': 'En test',
    'home.testing.tag': 'Le programme de test',
    'home.testing.title': 'Conçu avec les personnes qui jouent.',
    'home.testing.lede': 'Nous affinons CC01 avec un groupe ciblé de joueurs et créateurs. Les retours utiles déterminent ce qui reste, change ou disparaît.',
    'home.testing.link': 'Voir la communauté',
    'product.tag': 'CC01 · Prototype actuel',
    'product.title': 'Plus d’espace pour des mouvements précis.',
    'product.lede': 'ALVIA Control CC01 est un tapis de contrôle 500 × 500 mm avec une base de 4 mm en mousse PU haute densité et des bords cousus bas. Il est actuellement affiné avec des joueurs.',
    'product.future': 'Le prototype est volontairement encore en mouvement. Chaque test réfléchi façonne la version suivante.',
    'product.details': 'Voir les spécifications',
    'prototype.tag': 'Détails du produit',
    'prototype.lede': 'Une large surface de contrôle, un profil de 4 mm et un contour cousu définissent le prototype CC01 actuel. Les tests façonnent la prochaine itération.',
    'spec.surface.value': 'Surface textile de contrôle',
    'spec.base.value': 'Base en mousse PU haute densité',
    'spec.edges.value': 'Bords cousus bas',
    'spec.origin.value': 'Conçu en Suisse',
    'arch.tag': 'Construction',
    'arch.title': 'Chaque couche a une fonction.',
    'arch.lede': 'Surface, base et bord sont pensés pour une expérience de bureau concentrée et contrôlée. Le prototype est testé dans de vrais setups avant d’être finalisé.',
    'arch.surface.title': 'Surface de contrôle',
    'arch.surface.body': 'Le textile est conçu pour des mouvements contrôlés. Son comportement est évalué avec différents styles de jeu pendant les tests.',
    'arch.base.title': 'Profil de 4 mm',
    'arch.base.body': 'La base de 4 mm en mousse PU haute densité donne au prototype actuel un profil bas et posé sur le bureau.',
    'arch.edges.title': 'Contour cousu',
    'arch.edges.body': 'Des coutures basses suivent le bord de la surface et gardent la finition volontairement discrète.',
    'arch.perf.title': 'Mesuré à l’usage.',
    'arch.perf.1.lead': 'Une grande zone de travail.',
    'arch.perf.1.body': '500 × 500 mm de surface continue.',
    'arch.perf.2.lead': 'Un profil défini.',
    'arch.perf.2.body': '4 mm du bureau à la surface.',
    'arch.perf.3.lead': 'Affiné par les retours.',
    'arch.perf.3.body': 'Les prototypes actuels sont évalués par des joueurs et créateurs.',
    'arch.perf.4.lead': 'Un langage visuel calme.',
    'arch.perf.4.body': 'Un marquage minimal et une finition noire discrète.',
    'about.title': 'Créé par des gamers.',
    'about.lede': 'ALVIA part d’une conviction simple : les outils gaming doivent être moins génériques et plus réfléchis.',
    'philosophy.title.a': 'Moins de bruit.',
    'philosophy.title.b': 'Plus d’intention.',
    'philosophy.lede': 'ALVIA garde sa collection petite et son processus proche. Un produit mérite sa place par un objectif clair, des tests répétés et des détails utiles.',
    'founder.bio.1': 'Professionnel IT suisse et gamer. Lean dirige le développement produit, la marque et le design chez ALVIA.',
    'founder.bio.2': 'Joueur compétitif et cofondateur. Noah dirige les tests produit, les retours et la communauté chez ALVIA.',
    'community.title': 'Testez-le. Façonnez-le.',
    'community.lede': 'CC01 est affiné avec un petit groupe de joueurs compétitifs et créateurs. Les retours honnêtes décident de ce qui reste dans le prototype.',
    'community.card.1.title': 'De vrais setups. Des retours clairs.',
    'community.card.1.body': 'Nous regardons comment CC01 se comporte au quotidien, puis le retour décide ce qui mérite une nouvelle itération.',
    'community.card.2.title': 'Directement vers ALVIA.',
    'community.card.2.body': 'Dites-nous à quoi vous jouez, votre sensibilité, votre tapis actuel et ce que vous souhaitez tester. Nous lisons chaque message.',
    'community.card.2.link': 'Contacter l’équipe',
    'community.card.3.title': 'La prochaine session commence ici.',
    'community.card.3.body': 'Les places de test sont limitées, mais vous pouvez vous présenter pour une prochaine session à tout moment.',
    'community.card.3.link': 'Postuler comme testeur',
    'faq.title': 'Bonnes questions. Réponses claires.',
    'faq.q.1': 'Quand pourrai-je acheter CC01 ?',
    'faq.a.1': 'CC01 est encore en phase de test. Lorsque la phase actuelle sera terminée, les personnes en préaccès seront les premières informées.',
    'faq.q.2': 'Comment postuler pour les tests ?',
    'faq.a.2.prefix': 'Écrivez-nous via la page Contact sous',
    'faq.a.2.suffix': '. Indiquez votre jeu, votre sensibilité, votre tapis actuel et pourquoi vous aimeriez tester.',
    'faq.q.3': 'Y a-t-il déjà une date de sortie ?',
    'faq.a.3': 'Pas encore. Nous annoncerons une date seulement lorsque la phase de test actuelle sera terminée et que le produit sera prêt à avancer.',
    'faq.q.4': 'Quels matériaux sont utilisés ?',
    'faq.a.4': 'Le prototype CC01 actuel combine une surface textile de contrôle, une base de 4 mm en mousse PU haute densité et des bords cousus bas.',
    'faq.q.5': 'Y aura-t-il d’autres produits ALVIA ?',
    'faq.a.5': 'CC01 passe en premier. Les futurs produits ne seront considérés que s’ils répondent à un besoin réel avec le même niveau d’attention.',
    'contact.title': 'Comment pouvons-nous vous aider ?',
    'contact.lede': 'Vous souhaitez tester, partager un retour ou travailler avec ALVIA ? Choisissez le bon contact — chaque message arrive directement à l’équipe.',
    'contact.cat.test': 'Programme de test',
    'footer.signal': 'ALVIA CONTROL CC01 · PROGRAMME DE TEST',
    'footer.contact': 'Contacter ALVIA',
    'a11y.skip': 'Aller au contenu'
  });
  Object.assign(STRINGS.en, {
    'home.step.1': 'Play', 'home.step.2': 'Observe', 'home.step.3': 'Refine',
    'about.studio.tag': 'The studio', 'about.studio.title': 'Two roles. One standard.',
    'faq.cta.prompt': 'Still have a question?',
    'faq.lede': 'The important details of the current CC01 prototype — in one place.',
    'contact.intro': 'Choose the closest route. We will take it from there.',
    'nav.open': 'Open menu', 'nav.close': 'Close menu'
  });
  Object.assign(STRINGS.de, {
    'home.step.1': 'Spielen', 'home.step.2': 'Beobachten', 'home.step.3': 'Verfeinern',
    'about.studio.tag': 'Das Studio', 'about.studio.title': 'Zwei Rollen. Ein Anspruch.',
    'faq.cta.prompt': 'Noch eine Frage?',
    'faq.lede': 'Die wichtigen Details des aktuellen CC01-Prototyps — an einem Ort.',
    'contact.intro': 'Wähle den passendsten Kontaktweg. Den Rest übernehmen wir.',
    'nav.open': 'Menü öffnen', 'nav.close': 'Menü schließen'
  });
  Object.assign(STRINGS.fr, {
    'home.step.1': 'Jouer', 'home.step.2': 'Observer', 'home.step.3': 'Affiner',
    'about.studio.tag': 'Le studio', 'about.studio.title': 'Deux rôles. Une même exigence.',
    'faq.cta.prompt': 'Une autre question ?',
    'faq.lede': 'Les détails importants du prototype CC01 actuel — au même endroit.',
    'contact.intro': 'Choisissez le contact le plus adapté. Nous prenons la suite.',
    'nav.open': 'Ouvrir le menu', 'nav.close': 'Fermer le menu'
  });
  Object.assign(STRINGS.en, {
    'meta.title.home': 'ALVIA — Control, refined.',
    'meta.title.products': 'ALVIA Control CC01 — Current prototype',
    'meta.title.technology': 'ALVIA Control CC01 — Construction',
    'meta.title.community': 'ALVIA — Test the prototype',
    'meta.title.about': 'ALVIA — The studio',
    'meta.title.faq': 'ALVIA — FAQ',
    'meta.title.contact': 'ALVIA — Contact'
  });
  Object.assign(STRINGS.de, {
    'meta.title.home': 'ALVIA — Kontrolle, verfeinert.',
    'meta.title.products': 'ALVIA Control CC01 — Aktueller Prototyp',
    'meta.title.technology': 'ALVIA Control CC01 — Aufbau',
    'meta.title.community': 'ALVIA — Den Prototyp mitgestalten',
    'meta.title.about': 'ALVIA — Das Studio',
    'meta.title.faq': 'ALVIA — FAQ',
    'meta.title.contact': 'ALVIA — Kontakt'
  });
  Object.assign(STRINGS.fr, {
    'meta.title.home': 'ALVIA — Le contrôle, affiné.',
    'meta.title.products': 'ALVIA Control CC01 — Prototype actuel',
    'meta.title.technology': 'ALVIA Control CC01 — Construction',
    'meta.title.community': 'ALVIA — Façonnez le prototype',
    'meta.title.about': 'ALVIA — Le studio',
    'meta.title.faq': 'ALVIA — FAQ',
    'meta.title.contact': 'ALVIA — Contact'
  });

  /* Localised page furniture: section landmarks, the 404 route and its metadata. */
  Object.assign(STRINGS.en, {
    'nav.primary.label': 'Primary navigation',
    'facts.aria': 'CC01 key facts',
    'home.steps.aria': 'Testing process',
    'arch.section.aria': 'Technology and materials',
    'community.section.aria': 'Testing programme',
    'about.section.aria': 'The ALVIA studio',
    'faq.section.aria': 'Frequently asked questions',
    'contact.section.aria': 'Contact routes',
    'meta.title.notfound': 'ALVIA — Page not found',
    'meta.description.notfound': 'That address does not lead anywhere here. Continue to the product, the studio or the FAQ.',
    'notfound.tag': 'Error 404',
    'notfound.title': 'This address leads nowhere.',
    'notfound.lede': 'The page you were looking for does not exist or has moved. Everything ALVIA is one click away.',
    'notfound.home': 'Back to the start',
    'notfound.routes.tag': 'All pages',
    'notfound.routes.aria': 'All pages'
  });
  Object.assign(STRINGS.de, {
    'nav.primary.label': 'Hauptnavigation',
    'facts.aria': 'Wichtigste Fakten zu CC01',
    'home.steps.aria': 'Testablauf',
    'arch.section.aria': 'Technologie und Materialien',
    'community.section.aria': 'Testerprogramm',
    'about.section.aria': 'Das ALVIA-Studio',
    'faq.section.aria': 'Häufige Fragen',
    'contact.section.aria': 'Kontaktwege',
    'meta.title.notfound': 'ALVIA — Seite nicht gefunden',
    'meta.description.notfound': 'Diese Adresse führt nirgendwohin. Weiter zum Produkt, zum Studio oder zur FAQ.',
    'notfound.tag': 'Fehler 404',
    'notfound.title': 'Diese Adresse führt nirgendwohin.',
    'notfound.lede': 'Die gesuchte Seite existiert nicht oder wurde verschoben. Alles zu ALVIA ist einen Klick entfernt.',
    'notfound.home': 'Zurück zum Start',
    'notfound.routes.tag': 'Alle Seiten',
    'notfound.routes.aria': 'Alle Seiten'
  });
  Object.assign(STRINGS.fr, {
    'nav.primary.label': 'Navigation principale',
    'facts.aria': 'Chiffres clés du CC01',
    'home.steps.aria': 'Déroulement des tests',
    'arch.section.aria': 'Technologie et matériaux',
    'community.section.aria': 'Programme de test',
    'about.section.aria': 'Le studio ALVIA',
    'faq.section.aria': 'Questions fréquentes',
    'contact.section.aria': 'Voies de contact',
    'meta.title.notfound': 'ALVIA — Page introuvable',
    'meta.description.notfound': 'Cette adresse ne mène nulle part. Rejoignez le produit, le studio ou la FAQ.',
    'notfound.tag': 'Erreur 404',
    'notfound.title': 'Cette adresse ne mène nulle part.',
    'notfound.lede': 'La page recherchée n’existe pas ou a été déplacée. Tout ALVIA est à un clic.',
    'notfound.home': 'Retour à l’accueil',
    'notfound.routes.tag': 'Toutes les pages',
    'notfound.routes.aria': 'Toutes les pages'
  });

  /* Interface micro-copy: controls that exist on every page rather than copy that
     belongs to one route. */
  Object.assign(STRINGS.en, { 'ui.copy': 'Copy address', 'ui.copied': 'Copied' });
  Object.assign(STRINGS.de, { 'ui.copy': 'Adresse kopieren', 'ui.copied': 'Kopiert' });
  Object.assign(STRINGS.fr, { 'ui.copy': 'Copier l’adresse', 'ui.copied': 'Copié' });

  /* Shop + legal: the quantity stepper of the order form (the rest of its copy is
     further down, keys order.*), the legal links in the footer and the furniture of
     the four legal pages. The legal texts themselves are not in this catalogue — each
     legal page carries its three language versions in its own markup. */
  Object.assign(STRINGS.en, {
    'shop.quantity': 'Quantity',
    'shop.qty.dec': 'Decrease quantity',
    'shop.qty.inc': 'Increase quantity',
    'shop.soldout': 'Sold out',
    'footer.legal.aria': 'Legal',
    'footer.terms': 'Terms',
    'footer.privacy': 'Privacy',
    'footer.imprint': 'Imprint',
    'footer.shipping': 'Shipping & returns',
    'legal.tag': 'Legal',
    'legal.draft': 'Draft: this page still contains placeholders in double square brackets. Replace them before launch.',
    'legal.terms.title': 'Terms and conditions',
    'legal.privacy.title': 'Privacy policy',
    'legal.imprint.title': 'Imprint',
    'legal.shipping.title': 'Shipping & returns',
    'meta.title.terms': 'ALVIA — Terms and conditions',
    'meta.title.privacy': 'ALVIA — Privacy policy',
    'meta.title.imprint': 'ALVIA — Imprint',
    'meta.title.shipping': 'ALVIA — Shipping & returns',
    'meta.description.terms': 'The terms and conditions for orders placed in the ALVIA shop.',
    'meta.description.privacy': 'How ALVIA handles personal data on this website and in the shop.',
    'meta.description.imprint': 'Who is behind ALVIA and how to reach us.',
    'meta.description.shipping': 'Shipping, delivery and the 14-day return policy for ALVIA orders.'
  });
  Object.assign(STRINGS.de, {
    'shop.quantity': 'Menge',
    'shop.qty.dec': 'Menge verringern',
    'shop.qty.inc': 'Menge erhöhen',
    'shop.soldout': 'Ausverkauft',
    'footer.legal.aria': 'Rechtliches',
    'footer.terms': 'AGB',
    'footer.privacy': 'Datenschutz',
    'footer.imprint': 'Impressum',
    'footer.shipping': 'Versand & Rückgabe',
    'legal.tag': 'Rechtliches',
    'legal.draft': 'Entwurf: Diese Seite enthält noch Platzhalter in doppelten eckigen Klammern. Vor dem Launch ersetzen.',
    'legal.terms.title': 'Allgemeine Geschäftsbedingungen',
    'legal.privacy.title': 'Datenschutzerklärung',
    'legal.imprint.title': 'Impressum',
    'legal.shipping.title': 'Versand & Rückgabe',
    'meta.title.terms': 'ALVIA — AGB',
    'meta.title.privacy': 'ALVIA — Datenschutzerklärung',
    'meta.title.imprint': 'ALVIA — Impressum',
    'meta.title.shipping': 'ALVIA — Versand & Rückgabe',
    'meta.description.terms': 'Die Allgemeinen Geschäftsbedingungen für Bestellungen im ALVIA-Shop.',
    'meta.description.privacy': 'Wie ALVIA auf dieser Website und im Shop mit Personendaten umgeht.',
    'meta.description.imprint': 'Wer hinter ALVIA steht und wie du uns erreichst.',
    'meta.description.shipping': 'Versand, Lieferung und das 14-tägige Rückgaberecht für ALVIA-Bestellungen.'
  });
  Object.assign(STRINGS.fr, {
    'shop.quantity': 'Quantité',
    'shop.qty.dec': 'Diminuer la quantité',
    'shop.qty.inc': 'Augmenter la quantité',
    'shop.soldout': 'Épuisé',
    'footer.legal.aria': 'Informations légales',
    'footer.terms': 'CGV',
    'footer.privacy': 'Confidentialité',
    'footer.imprint': 'Mentions légales',
    'footer.shipping': 'Livraison & retours',
    'legal.tag': 'Informations légales',
    'legal.draft': 'Brouillon : cette page contient encore des espaces réservés entre doubles crochets. À remplacer avant le lancement.',
    'legal.terms.title': 'Conditions générales de vente',
    'legal.privacy.title': 'Politique de confidentialité',
    'legal.imprint.title': 'Mentions légales',
    'legal.shipping.title': 'Livraison & retours',
    'meta.title.terms': 'ALVIA — Conditions générales de vente',
    'meta.title.privacy': 'ALVIA — Politique de confidentialité',
    'meta.title.imprint': 'ALVIA — Mentions légales',
    'meta.title.shipping': 'ALVIA — Livraison & retours',
    'meta.description.terms': 'Les conditions générales de vente pour les commandes passées dans la boutique ALVIA.',
    'meta.description.privacy': 'Comment ALVIA traite les données personnelles sur ce site et dans la boutique.',
    'meta.description.imprint': 'Qui se trouve derrière ALVIA et comment nous joindre.',
    'meta.description.shipping': 'Livraison, délais et droit de retour de 14 jours pour les commandes ALVIA.'
  });

  const SUPPORTED = ['en', 'de', 'fr'];

  /* The copyright line, and the development timeline on the product page: it stands at
     "Refinement" — CC01 is being improved after the tests, the first drop is ahead. */
  Object.assign(STRINGS.en, {
    'footer.copyright': '© 2026 Alvia Pads. All rights reserved.',
    'timeline.step.retest': 'Second Community Testing',
    'timeline.step.6': 'First drop',
    'timeline.status': 'We are improving CC01 right now, based on what our testers told us.'
  });
  Object.assign(STRINGS.de, {
    'footer.copyright': '© 2026 Alvia Pads. Alle Rechte vorbehalten.',
    'timeline.step.retest': 'Zweiter Community-Test',
    'timeline.step.6': 'Erster Drop',
    'timeline.status': 'Wir verbessern CC01 gerade — mit dem Feedback unserer Tester:innen.'
  });
  Object.assign(STRINGS.fr, {
    'footer.copyright': '© 2026 Alvia Pads. Tous droits réservés.',
    'timeline.step.retest': 'Deuxième test communautaire',
    'timeline.step.6': 'Premier drop',
    'timeline.status': 'Nous améliorons CC01 en ce moment, à partir des retours de nos testeurs.'
  });

  /* Launch copy — CC01 is on sale. The product page, the FAQ and the status lines stop
     speaking about a prototype that cannot be bought yet. The test programme copy
     (community, technology) stays: testing continues for what comes next.
     Only used while "Shop on the website" is switched on in the admin backend (see
     SELLING below). Before launch the catalogue above speaks: CC01 is in testing. The
     English text in the pages themselves is that wording too. */
  const LAUNCH = { en: {}, de: {}, fr: {} };
  Object.assign(LAUNCH.en, {
    'nav.shop': 'Buy CC01',
    'hero.tag': 'ALVIA CONTROL CC01 · AVAILABLE NOW',
    'footer.signal': 'ALVIA CONTROL CC01 · AVAILABLE NOW',
    'home.fact.3.value': 'Available now',
    'meta.description.home': 'ALVIA Control CC01: a 500 × 500 mm control mousepad with a 4 mm high-density PU foam base. Designed in Switzerland and available now.',
    'meta.title.products': 'ALVIA Control CC01 — Buy the control mousepad',
    'meta.description.products': 'ALVIA Control CC01 — a 500 × 500 mm control mousepad in Phantom Blue and Moonnight Black. Order online, pay by TWINT.',
    'product.tag': 'Control mousepad · 500 × 500 mm',
    'product.lede': 'ALVIA Control CC01 is a 500 × 500 mm control mousepad with a 4 mm high-density PU foam base and low-profile stitched edges. Available in Phantom Blue and Moonnight Black.',
    'product.future': 'CC01 was refined with players before it went on sale. Their feedback keeps shaping what comes next.',
    'prototype.lede': 'A generous control surface, a 4 mm profile and a stitched perimeter define CC01. Every detail was tested in real setups before launch.',
    'faq.lede': 'The important details about CC01 — in one place.',
    'faq.q.1': 'How can I buy CC01?',
    'faq.a.1': 'CC01 is available now. Choose your colourway on the product page, add it to your cart and enter your address. You then pay with TWINT right on the site — we ship as soon as we have confirmed your payment.',
    'faq.q.3': 'How do shipping and returns work?',
    'faq.a.3': 'Shipping costs are shown on the product page before you order. If you are not happy with your order, you can return it within 14 days — the details are on the shipping & returns page.',
    'faq.a.4': 'CC01 combines a control cloth surface, a 4 mm high-density PU foam base and low-profile stitched edges.',
    'meta.description.faq': 'Answers about ALVIA Control CC01: ordering, shipping, returns and testing.'
  });
  Object.assign(LAUNCH.de, {
    'nav.shop': 'CC01 kaufen',
    'hero.tag': 'ALVIA CONTROL CC01 · JETZT ERHÄLTLICH',
    'footer.signal': 'ALVIA CONTROL CC01 · JETZT ERHÄLTLICH',
    'home.fact.3.value': 'Jetzt erhältlich',
    'meta.description.home': 'ALVIA Control CC01: ein 500 × 500 mm großes Control-Mauspad mit 4-mm-Basis aus hochdichtem PU-Schaum. Entwickelt in der Schweiz und jetzt erhältlich.',
    'meta.title.products': 'ALVIA Control CC01 — Control-Mauspad kaufen',
    'meta.description.products': 'ALVIA Control CC01 — ein 500 × 500 mm großes Control-Mauspad in Phantom Blue und Moonnight Black. Online bestellen, mit TWINT bezahlen.',
    'product.tag': 'Control-Mauspad · 500 × 500 mm',
    'product.lede': 'ALVIA Control CC01 ist ein 500 × 500 mm großes Control-Mauspad mit 4-mm-Basis aus hochdichtem PU-Schaum und flach vernähten Kanten. Erhältlich in Phantom Blue und Moonnight Black.',
    'product.future': 'CC01 wurde mit Spielern verfeinert, bevor es in den Verkauf ging. Ihr Feedback prägt auch, was als Nächstes kommt.',
    'prototype.lede': 'Eine großzügige Control-Oberfläche, ein 4-mm-Profil und ein vernähter Rand definieren CC01. Jedes Detail wurde vor dem Launch in echten Setups getestet.',
    'faq.lede': 'Die wichtigen Details zu CC01 — an einem Ort.',
    'faq.q.1': 'Wie kann ich CC01 kaufen?',
    'faq.a.1': 'CC01 ist jetzt erhältlich. Wähle auf der Produktseite deine Farbvariante, leg sie in den Warenkorb und gib deine Adresse ein. Danach bezahlst du direkt auf der Seite mit TWINT — wir versenden, sobald wir deine Zahlung bestätigt haben.',
    'faq.q.3': 'Wie funktionieren Versand und Rückgabe?',
    'faq.a.3': 'Die Versandkosten siehst du auf der Produktseite, bevor du bestellst. Wenn du mit deiner Bestellung nicht zufrieden bist, kannst du sie innerhalb von 14 Tagen zurückgeben — die Details stehen auf der Seite Versand & Rückgabe.',
    'faq.a.4': 'CC01 kombiniert ein Control-Gewebe, eine 4 mm hohe Basis aus hochdichtem PU-Schaum und flach vernähte Kanten.',
    'meta.description.faq': 'Antworten zu ALVIA Control CC01: Bestellung, Versand, Rückgabe und Tests.'
  });
  Object.assign(LAUNCH.fr, {
    'nav.shop': 'Acheter CC01',
    'hero.tag': 'ALVIA CONTROL CC01 · DISPONIBLE',
    'footer.signal': 'ALVIA CONTROL CC01 · DISPONIBLE',
    'home.fact.3.value': 'Disponible',
    'meta.description.home': 'ALVIA Control CC01 : un tapis de contrôle 500 × 500 mm avec une base de 4 mm en mousse PU haute densité. Conçu en Suisse et disponible dès maintenant.',
    'meta.title.products': 'ALVIA Control CC01 — Acheter le tapis de contrôle',
    'meta.description.products': 'ALVIA Control CC01 — un tapis de contrôle 500 × 500 mm en Phantom Blue et Moonnight Black. Commandez en ligne, payez avec TWINT.',
    'product.tag': 'Tapis de contrôle · 500 × 500 mm',
    'product.lede': 'ALVIA Control CC01 est un tapis de contrôle 500 × 500 mm avec une base de 4 mm en mousse PU haute densité et des bords cousus bas. Disponible en Phantom Blue et Moonnight Black.',
    'product.future': 'CC01 a été affiné avec des joueurs avant sa mise en vente. Leurs retours façonnent aussi la suite.',
    'prototype.lede': 'Une large surface de contrôle, un profil de 4 mm et un contour cousu définissent CC01. Chaque détail a été testé dans de vrais setups avant le lancement.',
    'faq.lede': 'Les détails importants sur CC01 — au même endroit.',
    'faq.q.1': 'Comment acheter CC01 ?',
    'faq.a.1': 'CC01 est disponible dès maintenant. Choisissez votre coloris sur la page produit, ajoutez-le au panier et saisissez votre adresse. Vous payez ensuite avec TWINT directement sur le site — nous expédions dès que votre paiement est confirmé.',
    'faq.q.3': 'Comment fonctionnent la livraison et les retours ?',
    'faq.a.3': 'Les frais de livraison sont indiqués sur la page produit avant la commande. Si votre commande ne vous convient pas, vous pouvez la retourner dans les 14 jours — les détails figurent sur la page Livraison & retours.',
    'faq.a.4': 'CC01 combine une surface textile de contrôle, une base de 4 mm en mousse PU haute densité et des bords cousus bas.',
    'meta.description.faq': 'Réponses sur ALVIA Control CC01 : commande, livraison, retours et tests.'
  });

  /* Is the shop on the website? The site's own server says so with a mark in the <html>
     tag (server/server.js, SHOP_PAGES); a host that only serves files never does. The
     stylesheet shows the shop's parts from the same mark (assets/css/shop.css). */
  const SELLING = document.documentElement.classList.contains('is-selling');
  if (SELLING) SUPPORTED.forEach((lang) => Object.assign(STRINGS[lang], LAUNCH[lang]));

  /* Order form on the product page (behaviour in assets/js/shop.js; price, stock and
     "shop open" are set in the admin dashboard). {amount}, {count}, {number}, {total}
     and {email} are filled in by shop.js. */
  Object.assign(STRINGS.en, {
    'shop.trust.pay': 'Pay by TWINT',
    'shop.trust.returns': '14-day returns',
    'shop.trust.ships': 'Shipped from Switzerland',
    'order.shipping.flat': 'plus {amount} shipping',
    'order.shipping.free': 'Free shipping',
    'order.stock.low': 'Only {count} left in this colourway.',
    'order.address': 'Delivery address',
    'order.name': 'Full name',
    'order.email': 'Email',
    'order.street': 'Street and number',
    'order.zip': 'Postcode',
    'order.city': 'Town',
    'order.country': 'Country',
    'order.country.ch': 'Switzerland',
    'order.note': 'Note (optional)',
    'order.total': 'Total',
    'order.submit': 'Place order',
    'order.sending': 'Sending…',
    'order.pay.note': 'You pay nothing now. We email you our TWINT details and ship as soon as the payment has arrived.',
    'order.legal': 'By ordering you accept our',
    'order.error.fields': 'Please check your details and try again.',
    'order.error.stock': 'That quantity is no longer in stock. The numbers above are up to date now.',
    'order.error.rate': 'Too many orders from this connection. Please try again later.',
    'order.error.send': 'The order could not be sent. Please try again.',
    'order.closed.tag': 'Shop',
    'order.closed.title': 'Orders are paused.',
    'order.closed.body': 'CC01 cannot be ordered right now. Write to us and we will tell you when it is back:',
    'order.offline': 'Online ordering is not available right now. To order, write to',
    'order.done.tag': 'Order received',
    'order.done.title': 'Thank you — order {number}.',
    'order.done.body': 'We will send the payment details for {total} to {email}. Your pad ships as soon as the payment has arrived.',
    'order.done.again': 'Place another order'
  });
  Object.assign(STRINGS.de, {
    'shop.trust.pay': 'Bezahlen mit TWINT',
    'shop.trust.returns': '14 Tage Rückgaberecht',
    'shop.trust.ships': 'Versand aus der Schweiz',
    'order.shipping.flat': 'zzgl. {amount} Versand',
    'order.shipping.free': 'Kostenloser Versand',
    'order.stock.low': 'Nur noch {count} in dieser Farbvariante.',
    'order.address': 'Lieferadresse',
    'order.name': 'Vor- und Nachname',
    'order.email': 'E-Mail',
    'order.street': 'Straße und Hausnummer',
    'order.zip': 'PLZ',
    'order.city': 'Ort',
    'order.country': 'Land',
    'order.country.ch': 'Schweiz',
    'order.note': 'Bemerkung (optional)',
    'order.total': 'Gesamt',
    'order.submit': 'Bestellung abschicken',
    'order.sending': 'Wird gesendet …',
    'order.pay.note': 'Du bezahlst jetzt noch nichts. Wir schicken dir unsere TWINT-Angaben per E-Mail und versenden, sobald die Zahlung eingegangen ist.',
    'order.legal': 'Mit der Bestellung akzeptierst du unsere',
    'order.error.fields': 'Bitte prüfe deine Angaben und versuche es erneut.',
    'order.error.stock': 'Diese Menge ist nicht mehr an Lager. Die Angaben oben sind jetzt aktuell.',
    'order.error.rate': 'Zu viele Bestellungen von diesem Anschluss. Bitte versuche es später noch einmal.',
    'order.error.send': 'Die Bestellung konnte nicht gesendet werden. Bitte versuche es erneut.',
    'order.closed.tag': 'Shop',
    'order.closed.title': 'Bestellungen sind pausiert.',
    'order.closed.body': 'CC01 kann gerade nicht bestellt werden. Schreib uns, dann melden wir uns, sobald es wieder so weit ist:',
    'order.offline': 'Online bestellen ist gerade nicht möglich. Für eine Bestellung schreib an',
    'order.done.tag': 'Bestellung eingegangen',
    'order.done.title': 'Danke — Bestellung {number}.',
    'order.done.body': 'Wir schicken die Zahlungsangaben für {total} an {email}. Dein Pad geht raus, sobald die Zahlung eingegangen ist.',
    'order.done.again': 'Weitere Bestellung aufgeben'
  });
  Object.assign(STRINGS.fr, {
    'shop.trust.pay': 'Paiement par TWINT',
    'shop.trust.returns': 'Retours sous 14 jours',
    'shop.trust.ships': 'Expédié depuis la Suisse',
    'order.shipping.flat': 'plus {amount} de livraison',
    'order.shipping.free': 'Livraison gratuite',
    'order.stock.low': 'Plus que {count} dans ce coloris.',
    'order.address': 'Adresse de livraison',
    'order.name': 'Prénom et nom',
    'order.email': 'E-mail',
    'order.street': 'Rue et numéro',
    'order.zip': 'NPA',
    'order.city': 'Localité',
    'order.country': 'Pays',
    'order.country.ch': 'Suisse',
    'order.note': 'Remarque (facultatif)',
    'order.total': 'Total',
    'order.submit': 'Passer la commande',
    'order.sending': 'Envoi en cours…',
    'order.pay.note': 'Vous ne payez rien maintenant. Nous vous envoyons nos coordonnées TWINT par e-mail et expédions dès réception du paiement.',
    'order.legal': 'En commandant, vous acceptez nos',
    'order.error.fields': 'Veuillez vérifier vos informations et réessayer.',
    'order.error.stock': 'Cette quantité n’est plus en stock. Les chiffres ci-dessus sont à jour.',
    'order.error.rate': 'Trop de commandes depuis cette connexion. Veuillez réessayer plus tard.',
    'order.error.send': 'La commande n’a pas pu être envoyée. Veuillez réessayer.',
    'order.closed.tag': 'Boutique',
    'order.closed.title': 'Les commandes sont en pause.',
    'order.closed.body': 'CC01 ne peut pas être commandé pour le moment. Écrivez-nous et nous vous préviendrons de son retour :',
    'order.offline': 'La commande en ligne n’est pas disponible pour le moment. Pour commander, écrivez à',
    'order.done.tag': 'Commande reçue',
    'order.done.title': 'Merci — commande {number}.',
    'order.done.body': 'Nous envoyons les informations de paiement pour {total} à {email}. Votre tapis est expédié dès réception du paiement.',
    'order.done.again': 'Passer une autre commande'
  });

  /* Contact page: one row per route — email, FAQ for general questions, social media. */
  Object.assign(STRINGS.en, { 'contact.cat.mail': 'Email', 'contact.faq.link': 'Read the FAQ' });
  Object.assign(STRINGS.de, { 'contact.cat.mail': 'E-Mail', 'contact.faq.link': 'FAQ lesen' });
  Object.assign(STRINGS.fr, { 'contact.cat.mail': 'E-mail', 'contact.faq.link': 'Lire la FAQ' });

  /* Product gallery: the last view is the pad as a 3D model (assets/js/pad3d.js). */
  Object.assign(STRINGS.en, {
    'product.view.3d': '3D view',
    'product.3d.label': '3D model of ALVIA Control CC01. Drag to turn it, or use the arrow keys.',
    'product.3d.caption.blue': 'Phantom Blue · 3D model',
    'product.3d.caption.black': 'Moonnight Black · 3D model',
    'product.3d.loading': 'Loading 3D model…',
    'product.3d.error': 'The 3D view is not available on this device.',
    'product.3d.hint': 'Drag to rotate',
    'product.3d.views': 'Camera views',
    'product.3d.view.front': 'Front',
    'product.3d.view.edge': 'Stitching',
    'product.3d.view.back': 'Back',
    'product.3d.zoom': 'Zoom',
    'product.3d.zoom.in': 'Zoom in',
    'product.3d.zoom.out': 'Zoom out'
  });
  Object.assign(STRINGS.de, {
    'product.view.3d': '3D-Ansicht',
    'product.3d.label': '3D-Modell des ALVIA Control CC01. Zum Drehen ziehen oder die Pfeiltasten verwenden.',
    'product.3d.caption.blue': 'Phantom Blue · 3D-Modell',
    'product.3d.caption.black': 'Moonnight Black · 3D-Modell',
    'product.3d.loading': '3D-Modell wird geladen …',
    'product.3d.error': 'Die 3D-Ansicht ist auf diesem Gerät nicht verfügbar.',
    'product.3d.hint': 'Zum Drehen ziehen',
    'product.3d.views': 'Kameraansichten',
    'product.3d.view.front': 'Vorderseite',
    'product.3d.view.edge': 'Naht',
    'product.3d.view.back': 'Rückseite',
    'product.3d.zoom': 'Zoom',
    'product.3d.zoom.in': 'Vergrößern',
    'product.3d.zoom.out': 'Verkleinern'
  });
  Object.assign(STRINGS.fr, {
    'product.view.3d': 'Vue 3D',
    'product.3d.label': 'Modèle 3D de l’ALVIA Control CC01. Faites glisser pour le tourner ou utilisez les flèches du clavier.',
    'product.3d.caption.blue': 'Phantom Blue · modèle 3D',
    'product.3d.caption.black': 'Moonnight Black · modèle 3D',
    'product.3d.loading': 'Chargement du modèle 3D…',
    'product.3d.error': 'La vue 3D n’est pas disponible sur cet appareil.',
    'product.3d.hint': 'Glissez pour tourner',
    'product.3d.views': 'Vues de la caméra',
    'product.3d.view.front': 'Face',
    'product.3d.view.edge': 'Couture',
    'product.3d.view.back': 'Dos',
    'product.3d.zoom': 'Zoom',
    'product.3d.zoom.in': 'Zoom avant',
    'product.3d.zoom.out': 'Zoom arrière'
  });

  /* Test programme — applications are open. The application form on apply.html
     (behaviour in assets/js/apply.js) and the lines on the home, community, FAQ and
     contact pages that point to it. */
  Object.assign(STRINGS.en, {
    'meta.title.apply': 'ALVIA — Apply as a tester',
    'meta.description.apply': 'Apply for the ALVIA test programme: tell us what you play, your sensitivity and why you want to test Control CC01.',
    'community.apply.open': 'Applications open',
    'community.card.3.body': 'Applications are open. Testing places are limited — tell us how you play and we will be in touch.',
    'collection.future.note': 'Applications open',
    'home.testing.apply': 'Apply as a tester',
    'contact.apply.link': 'Apply as a tester',
    'faq.a.2.prefix': 'Fill in the',
    'faq.a.2.link': 'application form',
    'faq.a.2.suffix': '. Tell us your game, your sensitivity, your current pad and why you would like to test — it goes straight to the team.',
    'apply.tag': 'Test programme',
    'apply.title': 'Apply as a tester.',
    'apply.lede': 'Tell us how you play. Testing places are limited, so the details matter: your games, your sensitivity and what you expect from a control pad.',
    'apply.section.aria': 'Application form',
    'apply.group.you': 'About you',
    'apply.group.play': 'How you play',
    'apply.group.why': 'Your motivation',
    'apply.optional': 'optional',
    'apply.name': 'Name',
    'apply.email': 'Email address',
    'apply.country': 'Country',
    'apply.games': 'Games you play',
    'apply.games.hint': 'Your main game first — for example Valorant, CS2 or Apex.',
    'apply.dpi': 'DPI',
    'apply.sens': 'In-game sensitivity',
    'apply.sens.hint': 'As set in your main game.',
    'apply.rank': 'Rank or level',
    'apply.mouse': 'Mouse',
    'apply.pad': 'Current mousepad',
    'apply.why': 'Why do you want to test CC01?',
    'apply.why.hint': 'A few honest sentences are enough.',
    'apply.link': 'Channel or profile',
    'apply.link.hint': 'TikTok, Twitch, YouTube or similar — if you have one.',
    'apply.consent': 'ALVIA may use these details to review my application and contact me about the test programme.',
    'apply.submit': 'Send application',
    'apply.sending': 'Sending…',
    'apply.note': 'Your application goes straight to the ALVIA team. We answer by email.',
    'apply.error.required': 'Please fill in this field.',
    'apply.error.email': 'Please enter a valid email address.',
    'apply.error.consent': 'Please tick this box so that we may contact you.',
    'apply.error.check': 'Please check the marked fields.',
    'apply.error.send': 'Your application could not be sent. Please try again, or',
    'apply.error.mail': 'send it by email instead',
    'apply.done.tag': 'Application sent',
    'apply.done.title': 'Thank you. It is with us now.',
    'apply.done.body': 'We read every application. If there is a place for you in a test round, we will write to the email address you gave us.',
    'apply.done.link': 'Back to the community'
  });
  Object.assign(STRINGS.de, {
    'meta.title.apply': 'ALVIA — Als Tester:in bewerben',
    'meta.description.apply': 'Bewirb dich fürs ALVIA-Testerprogramm: Sag uns, was du spielst, deine Sensitivity und warum du Control CC01 testen möchtest.',
    'community.apply.open': 'Bewerbung offen',
    'community.card.3.body': 'Die Bewerbung ist offen. Testplätze sind begrenzt — sag uns, wie du spielst, und wir melden uns.',
    'collection.future.note': 'Bewerbung offen',
    'home.testing.apply': 'Als Tester:in bewerben',
    'contact.apply.link': 'Als Tester:in bewerben',
    'faq.a.2.prefix': 'Fülle das',
    'faq.a.2.link': 'Bewerbungsformular',
    'faq.a.2.suffix': ' aus. Nenne dein Spiel, deine Sensitivity, dein aktuelles Pad und weshalb du testen möchtest — es landet direkt beim Team.',
    'apply.tag': 'Testerprogramm',
    'apply.title': 'Bewirb dich als Tester:in.',
    'apply.lede': 'Sag uns, wie du spielst. Testplätze sind begrenzt, darum zählen die Details: deine Spiele, deine Sensitivity und was du von einem Control-Pad erwartest.',
    'apply.section.aria': 'Bewerbungsformular',
    'apply.group.you': 'Über dich',
    'apply.group.play': 'So spielst du',
    'apply.group.why': 'Deine Motivation',
    'apply.optional': 'optional',
    'apply.name': 'Name',
    'apply.email': 'E-Mail-Adresse',
    'apply.country': 'Land',
    'apply.games': 'Spiele, die du spielst',
    'apply.games.hint': 'Dein Hauptspiel zuerst — zum Beispiel Valorant, CS2 oder Apex.',
    'apply.dpi': 'DPI',
    'apply.sens': 'Ingame-Sensitivity',
    'apply.sens.hint': 'So wie in deinem Hauptspiel eingestellt.',
    'apply.rank': 'Rang oder Level',
    'apply.mouse': 'Maus',
    'apply.pad': 'Aktuelles Mauspad',
    'apply.why': 'Warum möchtest du CC01 testen?',
    'apply.why.hint': 'Ein paar ehrliche Sätze genügen.',
    'apply.link': 'Kanal oder Profil',
    'apply.link.hint': 'TikTok, Twitch, YouTube oder Ähnliches — falls du eins hast.',
    'apply.consent': 'ALVIA darf diese Angaben verwenden, um meine Bewerbung zu prüfen und mich zum Testerprogramm zu kontaktieren.',
    'apply.submit': 'Bewerbung senden',
    'apply.sending': 'Wird gesendet …',
    'apply.note': 'Deine Bewerbung geht direkt ans ALVIA-Team. Wir antworten per E-Mail.',
    'apply.error.required': 'Bitte fülle dieses Feld aus.',
    'apply.error.email': 'Bitte gib eine gültige E-Mail-Adresse ein.',
    'apply.error.consent': 'Bitte setze das Häkchen, damit wir dich kontaktieren dürfen.',
    'apply.error.check': 'Bitte prüfe die markierten Felder.',
    'apply.error.send': 'Deine Bewerbung konnte nicht gesendet werden. Versuch es noch einmal oder',
    'apply.error.mail': 'schick sie stattdessen per E-Mail',
    'apply.done.tag': 'Bewerbung gesendet',
    'apply.done.title': 'Danke. Sie ist jetzt bei uns.',
    'apply.done.body': 'Wir lesen jede Bewerbung. Wenn es in einer Testrunde einen Platz für dich gibt, schreiben wir an die E-Mail-Adresse, die du angegeben hast.',
    'apply.done.link': 'Zurück zur Community'
  });
  Object.assign(STRINGS.fr, {
    'meta.title.apply': 'ALVIA — Postuler comme testeur',
    'meta.description.apply': 'Postulez au programme de test ALVIA : dites-nous à quoi vous jouez, votre sensibilité et pourquoi vous souhaitez tester Control CC01.',
    'community.apply.open': 'Candidatures ouvertes',
    'community.card.3.body': 'Les candidatures sont ouvertes. Les places de test sont limitées — dites-nous comment vous jouez et nous vous répondrons.',
    'collection.future.note': 'Candidatures ouvertes',
    'home.testing.apply': 'Postuler comme testeur',
    'contact.apply.link': 'Postuler comme testeur',
    'faq.a.2.prefix': 'Remplissez le',
    'faq.a.2.link': 'formulaire de candidature',
    'faq.a.2.suffix': '. Indiquez votre jeu, votre sensibilité, votre tapis actuel et pourquoi vous aimeriez tester — il arrive directement à l’équipe.',
    'apply.tag': 'Programme de test',
    'apply.title': 'Postulez comme testeur.',
    'apply.lede': 'Dites-nous comment vous jouez. Les places de test sont limitées, les détails comptent donc : vos jeux, votre sensibilité et ce que vous attendez d’un tapis de contrôle.',
    'apply.section.aria': 'Formulaire de candidature',
    'apply.group.you': 'À propos de vous',
    'apply.group.play': 'Votre façon de jouer',
    'apply.group.why': 'Votre motivation',
    'apply.optional': 'facultatif',
    'apply.name': 'Nom',
    'apply.email': 'Adresse e-mail',
    'apply.country': 'Pays',
    'apply.games': 'Jeux auxquels vous jouez',
    'apply.games.hint': 'Votre jeu principal en premier — par exemple Valorant, CS2 ou Apex.',
    'apply.dpi': 'DPI',
    'apply.sens': 'Sensibilité en jeu',
    'apply.sens.hint': 'Telle que réglée dans votre jeu principal.',
    'apply.rank': 'Rang ou niveau',
    'apply.mouse': 'Souris',
    'apply.pad': 'Tapis de souris actuel',
    'apply.why': 'Pourquoi souhaitez-vous tester CC01 ?',
    'apply.why.hint': 'Quelques phrases sincères suffisent.',
    'apply.link': 'Chaîne ou profil',
    'apply.link.hint': 'TikTok, Twitch, YouTube ou similaire — si vous en avez un.',
    'apply.consent': 'ALVIA peut utiliser ces informations pour examiner ma candidature et me contacter au sujet du programme de test.',
    'apply.submit': 'Envoyer la candidature',
    'apply.sending': 'Envoi en cours…',
    'apply.note': 'Votre candidature arrive directement à l’équipe ALVIA. Nous répondons par e-mail.',
    'apply.error.required': 'Veuillez remplir ce champ.',
    'apply.error.email': 'Veuillez saisir une adresse e-mail valide.',
    'apply.error.consent': 'Veuillez cocher cette case pour que nous puissions vous contacter.',
    'apply.error.check': 'Veuillez vérifier les champs signalés.',
    'apply.error.send': 'Votre candidature n’a pas pu être envoyée. Réessayez ou',
    'apply.error.mail': 'envoyez-la plutôt par e-mail',
    'apply.done.tag': 'Candidature envoyée',
    'apply.done.title': 'Merci. Elle est entre nos mains.',
    'apply.done.body': 'Nous lisons chaque candidature. S’il y a une place pour vous dans une session de test, nous écrirons à l’adresse e-mail indiquée.',
    'apply.done.link': 'Retour à la communauté'
  });

  /* Cart: the button in the header (assets/js/cart.js), "Add to cart" on the product
     page (shop.js) and the cart page (cart.html, checkout.js). {count} and {price} are
     filled in by those scripts. */
  Object.assign(STRINGS.en, {
    'meta.title.cart': 'ALVIA — Your cart',
    'meta.description.cart': 'Your ALVIA cart.',
    'cart.tag': 'Shop',
    'cart.title': 'Your cart',
    'cart.open': 'Cart',
    'cart.open.count': 'Cart, {count} items',
    'cart.empty': 'Your cart is empty.',
    'cart.empty.link': 'See CC01',
    'cart.remove': 'Remove',
    'cart.each': '{price} each',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Shipping',
    'cart.shipping.free': 'Free',
    'cart.adjusted': 'Your cart was changed to what can be ordered right now.',
    'cart.max': 'You can order up to {count} pads per order.',
    'shop.add': 'Add to cart',
    'shop.added': 'Added to your cart.', 'shop.incart': '{count} in your cart.',
    'shop.view': 'View cart',
    'shop.full': 'Everything we have of this colourway is already in your cart.',
    'order.ships.ch': 'We currently deliver within Switzerland only.',
    'cart.step.items': 'Your pads',
    'cart.step.pay': 'Payment',
    'cart.summary': 'Order summary',
    'cart.continue': 'Continue shopping',
    'pay.twint.title': 'Pay with TWINT',
    'pay.twint.sub': 'After you order — nothing to pay right now.',
    'pay.step.1': 'Place your order. You pay nothing yet.',
    'pay.step.2': 'We email you our TWINT number and the amount.',
    'pay.step.3': 'You pay in your TWINT app and we ship your pad.',
    'order.email.hint': 'We send the TWINT details to this address.',
    'order.invalid.name': 'Please enter your first and last name.',
    'order.invalid.email': 'Please enter a valid email address.',
    'order.invalid.street': 'Please enter your street and house number.',
    'order.invalid.zip': 'Please enter a Swiss postcode with 4 digits.',
    'order.invalid.city': 'Please enter your town.',
    'order.error.items': 'Your cart cannot be ordered like this. Please check the quantities.',
    'order.done.next': 'What happens next',
    'order.done.home': 'Back to the start page'
  });
  Object.assign(STRINGS.de, {
    'meta.title.cart': 'ALVIA — Dein Warenkorb',
    'meta.description.cart': 'Dein ALVIA-Warenkorb.',
    'cart.tag': 'Shop',
    'cart.title': 'Dein Warenkorb',
    'cart.open': 'Warenkorb',
    'cart.open.count': 'Warenkorb, {count} Artikel',
    'cart.empty': 'Dein Warenkorb ist leer.',
    'cart.empty.link': 'CC01 ansehen',
    'cart.remove': 'Entfernen',
    'cart.each': '{price} pro Stück',
    'cart.subtotal': 'Zwischensumme',
    'cart.shipping': 'Versand',
    'cart.shipping.free': 'Kostenlos',
    'cart.adjusted': 'Dein Warenkorb wurde an das angepasst, was gerade bestellbar ist.',
    'cart.max': 'Pro Bestellung sind maximal {count} Pads möglich.',
    'shop.add': 'In den Warenkorb',
    'shop.added': 'Liegt in deinem Warenkorb.', 'shop.incart': '{count} in deinem Warenkorb.',
    'shop.view': 'Warenkorb ansehen',
    'shop.full': 'Alles, was wir von dieser Farbvariante haben, liegt schon in deinem Warenkorb.',
    'order.ships.ch': 'Wir liefern derzeit nur innerhalb der Schweiz.',
    'cart.step.items': 'Deine Pads',
    'cart.step.pay': 'Zahlung',
    'cart.summary': 'Bestellübersicht',
    'cart.continue': 'Weiter einkaufen',
    'pay.twint.title': 'Mit TWINT bezahlen',
    'pay.twint.sub': 'Nach der Bestellung — jetzt ist noch nichts zu bezahlen.',
    'pay.step.1': 'Du schickst deine Bestellung ab. Du bezahlst noch nichts.',
    'pay.step.2': 'Wir schicken dir unsere TWINT-Nummer und den Betrag per E-Mail.',
    'pay.step.3': 'Du bezahlst in deiner TWINT-App und wir versenden dein Pad.',
    'order.email.hint': 'An diese Adresse schicken wir die TWINT-Angaben.',
    'order.invalid.name': 'Bitte gib deinen Vor- und Nachnamen ein.',
    'order.invalid.email': 'Bitte gib eine gültige E-Mail-Adresse ein.',
    'order.invalid.street': 'Bitte gib Straße und Hausnummer ein.',
    'order.invalid.zip': 'Bitte gib eine Schweizer PLZ mit 4 Ziffern ein.',
    'order.invalid.city': 'Bitte gib deinen Ort ein.',
    'order.error.items': 'Dein Warenkorb kann so nicht bestellt werden. Bitte prüfe die Mengen.',
    'order.done.next': 'So geht es weiter',
    'order.done.home': 'Zur Startseite'
  });
  Object.assign(STRINGS.fr, {
    'meta.title.cart': 'ALVIA — Votre panier',
    'meta.description.cart': 'Votre panier ALVIA.',
    'cart.tag': 'Boutique',
    'cart.title': 'Votre panier',
    'cart.open': 'Panier',
    'cart.open.count': 'Panier, {count} articles',
    'cart.empty': 'Votre panier est vide.',
    'cart.empty.link': 'Voir CC01',
    'cart.remove': 'Retirer',
    'cart.each': '{price} l’unité',
    'cart.subtotal': 'Sous-total',
    'cart.shipping': 'Livraison',
    'cart.shipping.free': 'Gratuite',
    'cart.adjusted': 'Votre panier a été ajusté à ce qui peut être commandé actuellement.',
    'cart.max': 'Vous pouvez commander jusqu’à {count} tapis par commande.',
    'shop.add': 'Ajouter au panier',
    'shop.added': 'Ajouté à votre panier.', 'shop.incart': '{count} dans votre panier.',
    'shop.view': 'Voir le panier',
    'shop.full': 'Tout notre stock de ce coloris est déjà dans votre panier.',
    'order.ships.ch': 'Nous livrons actuellement uniquement en Suisse.',
    'cart.step.items': 'Vos tapis',
    'cart.step.pay': 'Paiement',
    'cart.summary': 'Récapitulatif',
    'cart.continue': 'Continuer mes achats',
    'pay.twint.title': 'Payer avec TWINT',
    'pay.twint.sub': 'Après la commande — rien à payer maintenant.',
    'pay.step.1': 'Vous passez votre commande. Vous ne payez encore rien.',
    'pay.step.2': 'Nous vous envoyons notre numéro TWINT et le montant par e-mail.',
    'pay.step.3': 'Vous payez dans votre app TWINT et nous expédions votre tapis.',
    'order.email.hint': 'Nous envoyons les coordonnées TWINT à cette adresse.',
    'order.invalid.name': 'Veuillez saisir votre prénom et votre nom.',
    'order.invalid.email': 'Veuillez saisir une adresse e-mail valide.',
    'order.invalid.street': 'Veuillez saisir la rue et le numéro.',
    'order.invalid.zip': 'Veuillez saisir un NPA suisse à 4 chiffres.',
    'order.invalid.city': 'Veuillez saisir votre localité.',
    'order.error.items': 'Votre panier ne peut pas être commandé ainsi. Veuillez vérifier les quantités.',
    'order.done.next': 'La suite',
    'order.done.home': 'Retour à l’accueil'
  });

  /* Paying by TWINT on the cart page, before the order counts (assets/js/checkout.js).
     Where a key is already set further up, this is the wording that applies. */
  Object.assign(STRINGS.en, {
    'order.submit': 'Continue to payment',
    'order.sending': 'One moment…',
    'order.pay.note': 'Next you pay with TWINT. Your order counts once you have paid.',
    'order.email.hint': 'For questions about your order and the shipping notice.',
    'pay.twint.sub': 'In the next step — your pads are held for you meanwhile.',
    'pay.step.1': 'Continue to payment. Your pads are held for you.',
    'pay.step.2': 'Pay the amount in your TWINT app.',
    'pay.step.3': 'Confirm here that you have paid. We check it and ship your pad.',
    'pay.tag': 'Payment',
    'pay.title': 'Pay {total} with TWINT',
    'pay.timer': 'Your pads are held for {time}.',
    'pay.expired': 'The time is up and your pads were released. Already paid? Tap “I have paid” and we sort it out.',
    'pay.scan': 'Scan with your TWINT app',
    'pay.amount': 'Amount',
    'pay.number': 'TWINT number',
    'pay.message': 'Message',
    'pay.copy': 'Copy',
    'pay.copied': 'Copied',
    'pay.how.1': 'Open TWINT and scan the code — or send money to the number.',
    'pay.how.1.number': 'Open TWINT and send money to the number.',
    'pay.how.2': 'Enter {total} and write {number} as the message.',
    'pay.how.3': 'Come back to this page and tap “I have paid”.',
    'pay.confirm': 'I have paid',
    'pay.cancel': 'Cancel and go back to the cart',
    'pay.error.send': 'That did not work. Please try again.',
    'pay.error.expired': 'Your pads have been sold in the meantime. If you have already paid, write to alviapads@gmail.com and we refund you.',
    'order.done.body': 'You have told us that {total} is paid by TWINT. We check the payment and then ship your pad.',
    'done.step.1': 'Ordered and paid',
    'done.step.2': 'We confirm your payment',
    'done.step.3': 'Your pad is shipped',
    'done.status.claimed': 'We are checking your payment. This page updates by itself.',
    'done.status.paid': 'Payment received. We are packing your pad.',
    'done.status.shipped': 'Your pad is on its way.',
    'done.status.cancelled': 'This order was cancelled. Questions? Write to alviapads@gmail.com.',
    'done.status.new': 'We have not found your payment yet. Please check your TWINT app or write to alviapads@gmail.com.'
  });
  Object.assign(STRINGS.de, {
    'order.submit': 'Weiter zur Zahlung',
    'order.sending': 'Einen Moment …',
    'order.pay.note': 'Als Nächstes bezahlst du mit TWINT. Deine Bestellung gilt, sobald du bezahlt hast.',
    'order.email.hint': 'Für Fragen zu deiner Bestellung und die Versandmeldung.',
    'pay.twint.sub': 'Im nächsten Schritt — deine Pads sind so lange für dich reserviert.',
    'pay.step.1': 'Weiter zur Zahlung. Deine Pads werden für dich reserviert.',
    'pay.step.2': 'Du bezahlst den Betrag in deiner TWINT-App.',
    'pay.step.3': 'Du bestätigst hier, dass du bezahlt hast. Wir prüfen es und versenden dein Pad.',
    'pay.tag': 'Zahlung',
    'pay.title': '{total} mit TWINT bezahlen',
    'pay.timer': 'Deine Pads sind noch {time} für dich reserviert.',
    'pay.expired': 'Die Zeit ist abgelaufen und deine Pads wurden wieder freigegeben. Schon bezahlt? Tippe auf „Ich habe bezahlt“, dann klären wir das.',
    'pay.scan': 'Mit deiner TWINT-App scannen',
    'pay.amount': 'Betrag',
    'pay.number': 'TWINT-Nummer',
    'pay.message': 'Mitteilung',
    'pay.copy': 'Kopieren',
    'pay.copied': 'Kopiert',
    'pay.how.1': 'Öffne TWINT und scanne den Code — oder sende Geld an die Nummer.',
    'pay.how.1.number': 'Öffne TWINT und sende Geld an die Nummer.',
    'pay.how.2': 'Gib {total} ein und schreibe {number} als Mitteilung.',
    'pay.how.3': 'Komm zurück auf diese Seite und tippe auf „Ich habe bezahlt“.',
    'pay.confirm': 'Ich habe bezahlt',
    'pay.cancel': 'Abbrechen und zurück zum Warenkorb',
    'pay.error.send': 'Das hat nicht geklappt. Bitte versuche es noch einmal.',
    'pay.error.expired': 'Deine Pads wurden inzwischen verkauft. Falls du schon bezahlt hast, schreib an alviapads@gmail.com — wir erstatten dir den Betrag.',
    'order.done.body': 'Du hast uns mitgeteilt, dass {total} per TWINT bezahlt sind. Wir prüfen die Zahlung und versenden dann dein Pad.',
    'done.step.1': 'Bestellt und bezahlt',
    'done.step.2': 'Wir bestätigen deine Zahlung',
    'done.step.3': 'Dein Pad wird versendet',
    'done.status.claimed': 'Wir prüfen deine Zahlung. Diese Seite aktualisiert sich von selbst.',
    'done.status.paid': 'Zahlung eingegangen. Wir packen dein Pad.',
    'done.status.shipped': 'Dein Pad ist unterwegs.',
    'done.status.cancelled': 'Diese Bestellung wurde storniert. Fragen? Schreib an alviapads@gmail.com.',
    'done.status.new': 'Wir haben deine Zahlung noch nicht gefunden. Bitte prüfe deine TWINT-App oder schreib an alviapads@gmail.com.'
  });
  Object.assign(STRINGS.fr, {
    'order.submit': 'Continuer vers le paiement',
    'order.sending': 'Un instant…',
    'order.pay.note': 'Vous payez ensuite avec TWINT. Votre commande compte dès que vous avez payé.',
    'order.email.hint': 'Pour les questions sur votre commande et l’avis d’expédition.',
    'pay.twint.sub': 'À l’étape suivante — vos tapis vous sont réservés entre-temps.',
    'pay.step.1': 'Continuez vers le paiement. Vos tapis vous sont réservés.',
    'pay.step.2': 'Vous payez le montant dans votre app TWINT.',
    'pay.step.3': 'Vous confirmez ici avoir payé. Nous vérifions et expédions votre tapis.',
    'pay.tag': 'Paiement',
    'pay.title': 'Payer {total} avec TWINT',
    'pay.timer': 'Vos tapis vous sont réservés encore {time}.',
    'pay.expired': 'Le délai est écoulé et vos tapis ont été libérés. Déjà payé ? Touchez « J’ai payé » et nous réglons cela.',
    'pay.scan': 'Scannez avec votre app TWINT',
    'pay.amount': 'Montant',
    'pay.number': 'Numéro TWINT',
    'pay.message': 'Message',
    'pay.copy': 'Copier',
    'pay.copied': 'Copié',
    'pay.how.1': 'Ouvrez TWINT et scannez le code — ou envoyez de l’argent au numéro.',
    'pay.how.1.number': 'Ouvrez TWINT et envoyez de l’argent au numéro.',
    'pay.how.2': 'Saisissez {total} et écrivez {number} comme message.',
    'pay.how.3': 'Revenez sur cette page et touchez « J’ai payé ».',
    'pay.confirm': 'J’ai payé',
    'pay.cancel': 'Annuler et revenir au panier',
    'pay.error.send': 'Cela n’a pas fonctionné. Veuillez réessayer.',
    'pay.error.expired': 'Vos tapis ont été vendus entre-temps. Si vous avez déjà payé, écrivez à alviapads@gmail.com — nous vous remboursons.',
    'order.done.body': 'Vous nous avez indiqué que {total} ont été payés par TWINT. Nous vérifions le paiement, puis expédions votre tapis.',
    'done.step.1': 'Commandé et payé',
    'done.step.2': 'Nous confirmons votre paiement',
    'done.step.3': 'Votre tapis est expédié',
    'done.status.claimed': 'Nous vérifions votre paiement. Cette page se met à jour toute seule.',
    'done.status.paid': 'Paiement reçu. Nous préparons votre tapis.',
    'done.status.shipped': 'Votre tapis est en route.',
    'done.status.cancelled': 'Cette commande a été annulée. Des questions ? Écrivez à alviapads@gmail.com.',
    'done.status.new': 'Nous n’avons pas encore trouvé votre paiement. Vérifiez votre app TWINT ou écrivez à alviapads@gmail.com.'
  });

  /* Paying online: the shop has a payment provider (Payrexx), which shows the TWINT QR
     code for the order and tells the server when the money has arrived. Keys ending in
     ".online" replace the line of the same name while that is the way of paying
     (assets/js/checkout.js). */
  Object.assign(STRINGS.en, {
    'pay.step.2.online': 'Pay on the secure TWINT payment page: scan the QR code, or confirm in your TWINT app.',
    'pay.step.3.online': 'Your payment is recognised automatically. Only then is your order complete, and we ship your pad.',
    'order.pay.note.online': 'Next you pay with TWINT. Your order only goes through once the payment has arrived.',
    'order.error.payment': 'The payment page could not be opened. Nothing was ordered. Please try again in a moment.',
    'pay.online.how': 'You pay on the secure page of our payment partner Payrexx. On a computer you scan the QR code with your TWINT app; on your phone the TWINT app opens.',
    'pay.online.go': 'Pay with TWINT',
    'pay.online.wait': 'Already paid? This page notices by itself — it can take a few seconds.',
    'pay.online.checking': 'The time is up. We are checking one last time whether your payment has arrived…',
    'pay.online.gone': 'This order can no longer be paid here. Please write to alviapads@gmail.com.',
    'pay.expired.online': 'No payment arrived in time, so the order was cancelled and nothing was charged. Your pads are back in your cart.',
    'order.done.body.online': 'Your TWINT payment of {total} has arrived. Your order is complete.',
    'done.status.refund': 'Your payment arrived after this order had been cancelled, and the pads are no longer available. We refund you the full amount. Questions? Write to alviapads@gmail.com.'
  });
  Object.assign(STRINGS.de, {
    'pay.step.2.online': 'Du bezahlst auf der sicheren TWINT-Zahlungsseite: QR-Code scannen oder in deiner TWINT-App bestätigen.',
    'pay.step.3.online': 'Deine Zahlung wird automatisch erkannt. Erst dann ist deine Bestellung abgeschlossen, und wir versenden dein Pad.',
    'order.pay.note.online': 'Als Nächstes bezahlst du mit TWINT. Deine Bestellung kommt erst zustande, wenn die Zahlung eingegangen ist.',
    'order.error.payment': 'Die Zahlungsseite konnte nicht geöffnet werden. Es wurde nichts bestellt. Bitte versuche es gleich noch einmal.',
    'pay.online.how': 'Du bezahlst auf der sicheren Seite unseres Zahlungspartners Payrexx. Am Computer scannst du den QR-Code mit deiner TWINT-App; auf dem Handy öffnet sich die TWINT-App.',
    'pay.online.go': 'Mit TWINT bezahlen',
    'pay.online.wait': 'Schon bezahlt? Diese Seite merkt es von selbst — das kann ein paar Sekunden dauern.',
    'pay.online.checking': 'Die Zeit ist abgelaufen. Wir prüfen ein letztes Mal, ob deine Zahlung eingegangen ist …',
    'pay.online.gone': 'Diese Bestellung kann hier nicht mehr bezahlt werden. Bitte schreib an alviapads@gmail.com.',
    'pay.expired.online': 'Es ist rechtzeitig keine Zahlung eingegangen. Die Bestellung wurde storniert und nichts wurde belastet. Deine Pads liegen wieder im Warenkorb.',
    'order.done.body.online': 'Deine TWINT-Zahlung über {total} ist eingegangen. Deine Bestellung ist abgeschlossen.',
    'done.status.refund': 'Deine Zahlung ist eingegangen, nachdem diese Bestellung storniert wurde, und die Pads sind nicht mehr verfügbar. Wir erstatten dir den vollen Betrag. Fragen? Schreib an alviapads@gmail.com.'
  });
  Object.assign(STRINGS.fr, {
    'pay.step.2.online': 'Vous payez sur la page de paiement TWINT sécurisée : scannez le code QR ou confirmez dans votre app TWINT.',
    'pay.step.3.online': 'Votre paiement est reconnu automatiquement. C’est seulement alors que votre commande est finalisée et que nous expédions votre tapis.',
    'order.pay.note.online': 'Vous payez ensuite avec TWINT. Votre commande n’est validée qu’une fois le paiement reçu.',
    'order.error.payment': 'La page de paiement n’a pas pu être ouverte. Rien n’a été commandé. Veuillez réessayer dans un instant.',
    'pay.online.how': 'Vous payez sur la page sécurisée de notre partenaire de paiement Payrexx. Sur un ordinateur, vous scannez le code QR avec votre app TWINT ; sur votre téléphone, l’app TWINT s’ouvre.',
    'pay.online.go': 'Payer avec TWINT',
    'pay.online.wait': 'Déjà payé ? Cette page le remarque toute seule — cela peut prendre quelques secondes.',
    'pay.online.checking': 'Le délai est écoulé. Nous vérifions une dernière fois si votre paiement est arrivé…',
    'pay.online.gone': 'Cette commande ne peut plus être payée ici. Veuillez écrire à alviapads@gmail.com.',
    'pay.expired.online': 'Aucun paiement n’est arrivé à temps. La commande a été annulée et rien n’a été débité. Vos tapis sont de nouveau dans votre panier.',
    'order.done.body.online': 'Votre paiement TWINT de {total} est arrivé. Votre commande est finalisée.',
    'done.status.refund': 'Votre paiement est arrivé après l’annulation de cette commande, et les tapis ne sont plus disponibles. Nous vous remboursons la totalité du montant. Des questions ? Écrivez à alviapads@gmail.com.'
  });

  /* Cookie banner (behaviour in assets/js/consent.js). */
  Object.assign(STRINGS.en, {
    'consent.title': 'Help us count our visitors',
    'consent.text': 'With your OK we count how many people visit ALVIA and which country they come from. For that we use two small cookies of our own.',
    'consent.more': 'Privacy policy',
    'consent.accept': 'Accept',
    'consent.decline': 'Decline',
    'footer.cookies': 'Cookie settings'
  });
  Object.assign(STRINGS.de, {
    'consent.title': 'Hilf uns, Besucher zu zählen',
    'consent.text': 'Mit deinem OK zählen wir, wie viele Menschen ALVIA besuchen und aus welchem Land sie kommen. Dafür verwenden wir zwei kleine eigene Cookies.',
    'consent.more': 'Datenschutzerklärung',
    'consent.accept': 'Akzeptieren',
    'consent.decline': 'Ablehnen',
    'footer.cookies': 'Cookie-Einstellungen'
  });
  Object.assign(STRINGS.fr, {
    'consent.title': 'Aidez-nous à compter nos visiteurs',
    'consent.text': 'Avec votre accord, nous comptons combien de personnes visitent ALVIA et de quel pays elles viennent. Pour cela, nous utilisons deux petits cookies à nous.',
    'consent.more': 'Politique de confidentialité',
    'consent.accept': 'Accepter',
    'consent.decline': 'Refuser',
    'footer.cookies': 'Paramètres des cookies'
  });

  /* Admin sign-in in the header (behaviour in assets/js/account.js). */
  Object.assign(STRINGS.en, {
    'account.signin': 'Sign in',
    'account.dashboard': 'Open the admin area',
    'account.title': 'Admin sign-in',
    'account.username': 'Login name',
    'account.password': 'Password',
    'account.remember': 'Stay signed in on this device',
    'account.submit': 'Sign in',
    'account.sending': 'Signing in…',
    'account.close': 'Close',
    'account.error.credentials': 'Login name or password is wrong.',
    'account.error.rate': 'Too many attempts. Please wait 15 minutes.',
    'account.error.send': 'Sign-in is not available right now.'
  });
  Object.assign(STRINGS.de, {
    'account.signin': 'Anmelden',
    'account.dashboard': 'Admin-Bereich öffnen',
    'account.title': 'Admin-Anmeldung',
    'account.username': 'Loginname',
    'account.password': 'Passwort',
    'account.remember': 'Auf diesem Gerät angemeldet bleiben',
    'account.submit': 'Anmelden',
    'account.sending': 'Anmeldung läuft …',
    'account.close': 'Schließen',
    'account.error.credentials': 'Loginname oder Passwort ist falsch.',
    'account.error.rate': 'Zu viele Versuche. Bitte warte 15 Minuten.',
    'account.error.send': 'Die Anmeldung ist gerade nicht möglich.'
  });
  Object.assign(STRINGS.fr, {
    'account.signin': 'Se connecter',
    'account.dashboard': 'Ouvrir l’espace admin',
    'account.title': 'Connexion admin',
    'account.username': 'Identifiant',
    'account.password': 'Mot de passe',
    'account.remember': 'Rester connecté sur cet appareil',
    'account.submit': 'Se connecter',
    'account.sending': 'Connexion…',
    'account.close': 'Fermer',
    'account.error.credentials': 'Identifiant ou mot de passe incorrect.',
    'account.error.rate': 'Trop de tentatives. Veuillez patienter 15 minutes.',
    'account.error.send': 'La connexion est indisponible pour le moment.'
  });

  // Fills every [data-i18n] / [data-i18n-aria] element inside `root` from one dictionary.
  function translate(root, dict) {
    // Text content
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const value = dict[key];
      if (typeof value === 'string') el.textContent = value;
    });

    // aria-label attributes
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      const value = dict[key];
      if (typeof value === 'string') el.setAttribute('aria-label', value);
    });
  }

  /* The catalogue, opened up for scripts loaded after this one (assets/js/shop.js):
     they read strings from here and translate markup they add later. A language
     switch is announced with an `alvia:langchange` event on the document. */
  const currentLang = () => {
    const lang = document.documentElement.lang;
    return SUPPORTED.includes(lang) ? lang : 'en';
  };
  window.ALVIA_I18N = {
    lang: currentLang,
    t: (key) => STRINGS[currentLang()][key] || STRINGS.en[key] || key,
    translate: (root) => translate(root, STRINGS[currentLang()])
  };

  function applyLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = 'en';
    const dict = STRINGS[lang];

    document.documentElement.setAttribute('lang', lang);

    translate(document, dict);

    // Language buttons — active state + aria-pressed
    document.querySelectorAll('[data-lang]').forEach((btn) => {
      const isActive = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    const menuToggle = document.querySelector('.nav__toggle');
    if (menuToggle) {
      const isOpen = document.getElementById('primary-navigation')?.classList.contains('is-open');
      menuToggle.setAttribute('aria-label', dict[isOpen ? 'nav.close' : 'nav.open'] || dict['nav.menu'] || 'Menu');
    }

    const showcaseToggle = document.querySelector('[data-showcase-toggle]');
    if (showcaseToggle && dict['product.pause'] && dict['product.resume']) {
      const paused = showcaseToggle.getAttribute('aria-pressed') === 'true';
      const toggleKey = paused ? 'product.resume' : 'product.pause';
      const toggleLabel = showcaseToggle.querySelector('[data-showcase-toggle-label]');
      if (toggleLabel) toggleLabel.textContent = dict[toggleKey];
      showcaseToggle.setAttribute('aria-label', dict[toggleKey]);
    }

    const page = document.body.dataset.page || 'home';
    // Page-specific title + description preserve meaningful previews on every route.
    const pageTitle = dict[`meta.title.${page}`] || dict['meta.title'];
    if (pageTitle) document.title = pageTitle;
    const metaEl = document.querySelector('meta[name="description"]');
    const pageDescription = dict[`meta.description.${page}`] || dict['meta.description'];
    if (metaEl && pageDescription) metaEl.setAttribute('content', pageDescription);

    // Persist
    try { localStorage.setItem('alvia.lang', lang); } catch (_) {}

    // Keep the address bar shareable: ?lang=de reproduces this exact view, and the
    // canonical link points at the language actually being read.
    try {
      const url = new URL(window.location.href);
      if (lang === 'en') url.searchParams.delete('lang');
      else url.searchParams.set('lang', lang);
      window.history.replaceState(null, '', url);
    } catch (_) {}
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      const base = canonical.getAttribute('href').split('?')[0];
      canonical.setAttribute('href', lang === 'en' ? base : `${base}?lang=${lang}`);
    }

    document.dispatchEvent(new CustomEvent('alvia:langchange', { detail: { lang } }));
  }

  function initLang() {
    // Priority: an explicit ?lang= link, then the remembered choice, then the browser.
    let lang = null;
    try { lang = new URLSearchParams(window.location.search).get('lang'); } catch (_) {}
    if (!lang || !SUPPORTED.includes(lang)) {
      try { lang = localStorage.getItem('alvia.lang'); } catch (_) {}
    }
    if (!lang || !SUPPORTED.includes(lang)) {
      const nav = (navigator.language || 'en').toLowerCase().slice(0, 2);
      lang = SUPPORTED.includes(nav) ? nav : 'en';
    }
    applyLang(lang);
  }

  function setupShowcase() {
    const showcase = document.querySelector('[data-showcase]');
    if (!showcase) return;
    const allSlides = [...showcase.querySelectorAll('[data-slide]')];
    const allDots = [...showcase.querySelectorAll('[data-slide-to]')];
    const colorwayOptions = [...document.querySelectorAll('[data-variant-option]')];
    const status = showcase.querySelector('[data-showcase-status]');
    const previous = showcase.querySelector('[data-slide-prev]');
    const next = showcase.querySelector('[data-slide-next]');
    const toggle = showcase.querySelector('[data-showcase-toggle]');
    const toggleLabel = toggle?.querySelector('[data-showcase-toggle-label]');
    if (!allSlides.length) return;

    /* The gallery follows the colourway: only the selected variant's views and thumbnails
       take part, so arrows, counter and focus stay honest. Phantom Blue is the variant
       the page opens on; the stylesheet hides the other one. */
    let variant = document.body.dataset.variant || 'blue';
    let current = 0;
    let timer = null;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // A product gallery should not advance on its own. Visitors can opt in to playback.
    let paused = true;
    if (toggle) toggle.disabled = reduced;

    // A view without a colourway of its own (the 3D model) belongs to both sets.
    const inSet = (element) => !element.dataset.colorway || element.dataset.colorway === variant;
    const slides = () => allSlides.filter(inSet);
    const dots = () => allDots.filter(inSet);
    const stageEl = showcase.querySelector('.showcase__stage');
    let leaveTimer = null;

    /* `direction` is how the new view arrives: 'next' and 'prev' wipe it in from that
       side over the view that is leaving, anything else is a plain cross-fade. The
       stylesheet does the moving (see "Motion"); this only names the two views. */
    const show = (index, direction) => {
      const set = slides();
      const thumbs = dots();
      if (!set.length) return;
      const leaving = allSlides.find((slide) => slide.classList.contains('is-active'));
      current = (index + set.length) % set.length;
      window.clearTimeout(leaveTimer);
      allSlides.forEach((slide) => slide.classList.remove('is-leaving'));
      if (stageEl) {
        if (direction && leaving && leaving !== set[current]) {
          stageEl.dataset.dir = direction;
          leaving.classList.add('is-leaving');
          leaveTimer = window.setTimeout(() => leaving.classList.remove('is-leaving'), 1100);
        } else {
          delete stageEl.dataset.dir;
        }
      }
      set.forEach((slide, i) => {
        const active = i === current;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.inert = !active;
      });
      thumbs.forEach((dot, i) => {
        const active = i === current;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-pressed', String(active));
      });
      if (status) status.textContent = `${current + 1} / ${set.length}`;
    };
    const stop = () => { if (timer) { window.clearInterval(timer); timer = null; } };
    const updateToggle = () => {
      if (!toggle) return;
      toggle.setAttribute('aria-pressed', String(paused));
      const lang = document.documentElement.lang || 'en';
      const key = paused ? 'product.resume' : 'product.pause';
      const label = STRINGS[lang]?.[key] || STRINGS.en[key];
      if (toggleLabel) toggleLabel.textContent = label;
      toggle.setAttribute('aria-label', label);
    };
    const start = () => {
      stop();
      if (!paused && !reduced) timer = window.setInterval(() => show(current + 1, 'next'), 7800);
    };
    const restart = () => { if (!paused) start(); };

    /* Colourway switch: black and Phantom Blue are two separate sets of pictures.
       Switching resets the gallery to its first view and restarts playback — unless
       the 3D model is open: it is the same view in both colours and simply changes
       colour in place. */
    colorwayOptions.forEach((option) => {
      option.addEventListener('click', () => {
        const choice = option.dataset.variantOption;
        if (!choice || choice === variant) return;
        const shared = slides()[current];
        const stay = Boolean(shared) && !shared.dataset.colorway;
        variant = choice;
        document.body.dataset.variant = choice;
        colorwayOptions.forEach((other) => {
          const active = other.dataset.variantOption === choice;
          other.classList.toggle('is-active', active);
          other.setAttribute('aria-pressed', String(active));
        });
        if (stay) {
          show(slides().indexOf(shared));
        } else {
          allSlides.forEach((slide) => {
            slide.classList.remove('is-active');
            slide.setAttribute('aria-hidden', 'true');
            slide.inert = true;
          });
          show(0);
        }
        restart();
      });
    });

    toggle?.addEventListener('click', () => {
      paused = !paused;
      if (paused) stop(); else start();
      updateToggle();
    });
    previous?.addEventListener('click', () => { show(current - 1, 'prev'); restart(); });
    next?.addEventListener('click', () => { show(current + 1, 'next'); restart(); });
    allDots.forEach((dot) => dot.addEventListener('click', () => {
      const index = dots().indexOf(dot);
      if (index < 0 || index === current) return;
      show(index, index > current ? 'next' : 'prev');
      restart();
    }));
    showcase.addEventListener('mouseenter', stop);
    showcase.addEventListener('mouseleave', start);
    showcase.addEventListener('focusin', stop);
    showcase.addEventListener('focusout', (event) => {
      if (!showcase.contains(event.relatedTarget)) start();
    });
    showcase.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1, 'prev'); restart(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1, 'next'); restart(); }
    });
    let touchStart = 0;
    showcase.addEventListener('touchstart', (event) => { touchStart = event.changedTouches[0].clientX; stop(); }, { passive: true });
    showcase.addEventListener('touchend', (event) => {
      const distance = event.changedTouches[0].clientX - touchStart;
      if (Math.abs(distance) > 40) show(current + (distance < 0 ? 1 : -1), distance < 0 ? 'next' : 'prev');
      start();
    }, { passive: true });

    show(0);
    updateToggle();
    start();
  }

  /* =====================================================
     Copy-to-clipboard for contact addresses
     Markup contract: [data-copy] holds the literal value, an inner [data-copy-label]
     is the visible word, and data-i18n-aria localises the accessible name.
     ===================================================== */
  function setupCopyButtons() {
    const buttons = document.querySelectorAll('[data-copy]');
    if (!buttons.length) return;

    const dict = () => STRINGS[document.documentElement.lang || 'en'] || STRINGS.en;

    // One polite live region for the whole page, so a copy is announced once.
    const live = document.createElement('p');
    live.className = 'sr-only';
    live.setAttribute('aria-live', 'polite');
    document.body.appendChild(live);

    const write = async (value) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
        return;
      }
      // Fallback for file:// and older engines where the async clipboard is blocked.
      const area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', '');
      area.className = 'sr-only';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      if (!ok) throw new Error('copy rejected');
    };

    buttons.forEach((button) => {
      const label = button.querySelector('[data-copy-label]');
      let reset = null;
      button.addEventListener('click', async () => {
        const value = button.getAttribute('data-copy') || '';
        if (!value) return;
        try {
          await write(value);
        } catch (_) {
          return; // Clipboard unavailable: the visible address is still selectable.
        }
        const copied = dict()['ui.copied'] || 'Copied';
        button.classList.add('is-copied');
        button.setAttribute('aria-label', copied);
        if (label) label.textContent = copied;
        live.textContent = `${copied}: ${value}`;
        if (reset) window.clearTimeout(reset);
        reset = window.setTimeout(() => {
          button.classList.remove('is-copied');
          if (label) label.textContent = dict()['ui.copy'] || 'Copy';
          button.setAttribute('aria-label', dict()['ui.copy'] || 'Copy address');
        }, 3200);
      });
    });
  }

  /* =====================================================
     Legal pages — draft warning
     The legal texts ship with placeholders in double square brackets for the company details. While one is
     still in the text, the page says so instead of quietly going live with it.
     ===================================================== */
  function setupLegalDraft() {
    const banner = document.querySelector('[data-legal-draft]');
    if (!banner) return;
    const open = [...document.querySelectorAll('.legal__body')].some((body) => body.textContent.includes('[['));
    banner.hidden = !open;
  }

  /* =====================================================
     setup() — runs after the catalogue is initialized
     ===================================================== */
  try { setup(); }
  catch (err) {
    document.body.classList.add('js-failed');
    // eslint-disable-next-line no-console
    console.warn('[ALVIA] script failed:', err);
  }

  function setup() {
    // Before launch the shop's own pages (cart, terms, shipping) do not exist. The site's
    // server answers them with "not found" itself; this is for a host that only serves files.
    if (!SELLING && document.querySelector('main[data-selling]')) {
      window.location.replace('404.html');
      return;
    }

    // Read the motion preference FIRST: it gates the pointer/reveal effects below.
    // Declaring it after its first use threw a ReferenceError and aborted setup(),
    // which silently disabled language switching, the FAQ accordion and the mobile menu.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // The language switch is hidden in the bar on small screens; a copy of it lives at
    // the end of the menu panel there. Made before initLang() so both stay in step.
    const locale = document.querySelector('.nav__locale');
    const menuPanel = document.getElementById('primary-navigation');
    if (locale && menuPanel) {
      const copy = locale.cloneNode(true);
      copy.classList.add('nav__locale--menu');
      menuPanel.appendChild(copy);
    }

    // Initialise language FIRST so any text-bearing observers fire on localized text.
    initLang();
    setupShowcase();
    setupCopyButtons();
    setupLegalDraft();
    setupExperience(reduceMotion);

    /* -------- Hairline border on the nav once you scroll -------- */
    const nav = document.getElementById('nav');
    if (nav) {
      const onScroll = () => {
        nav.classList.toggle('is-scrolled', window.scrollY > 24);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      onScroll();
    }

    /* -------- Reveal on scroll -------- */
    const reveals = document.querySelectorAll('.reveal');
    if (!reduceMotion && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
            // Once the reveal has played, release the element: its own hover and press
            // transitions take over from the reveal transition (see "Motion" in styles.css).
            const delay = parseFloat(e.target.style.getPropertyValue('--reveal-delay')) || 0;
            window.setTimeout(() => e.target.classList.add('is-settled'), delay + 1400);
            const figure = e.target.matches('.fact-rail__item') && e.target.querySelector('strong');
            if (figure) window.setTimeout(() => countUp(figure), delay);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach((el) => io.observe(el));
    } else {
      reveals.forEach((el) => el.classList.add('is-in'));
    }

    /* -------- Active nav link highlight -------- */
    const sections = document.querySelectorAll('main section[id]');
    const navLinks = document.querySelectorAll('.nav__links a, .nav__brand');
    const currentPage = document.body.dataset.page;
    if (currentPage) {
      navLinks.forEach((a) => {
        const active = a.dataset.pageLink === currentPage;
        a.classList.toggle('is-active', active);
        if (active) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    }
    if (!currentPage && sections.length && navLinks.length && 'IntersectionObserver' in window) {
      const secIO = new IntersectionObserver((entries) => {
        const active = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!active) return;
        const id = active.target.id;
        navLinks.forEach((a) => {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
        });
      }, { threshold: [0.1, 0.35, 0.6], rootMargin: '-20% 0px -55% 0px' });
      sections.forEach((s) => secIO.observe(s));
    }

    /* -------- Mobile reference navigation -------- */
    const menuToggle = document.querySelector('.nav__toggle');
    const mobileMenu = document.getElementById('primary-navigation');
    if (menuToggle && mobileMenu) {
      const setMenuLabel = (open) => {
        const lang = document.documentElement.lang || 'en';
        const dict = STRINGS[lang] || STRINGS.en;
        menuToggle.setAttribute('aria-label', dict[open ? 'nav.close' : 'nav.open'] || dict['nav.menu'] || 'Menu');
      };
      const closeMenu = () => {
        mobileMenu.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        setMenuLabel(false);
      };
      menuToggle.addEventListener('click', () => {
        const open = !mobileMenu.classList.contains('is-open');
        mobileMenu.classList.toggle('is-open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        setMenuLabel(open);
      });
      mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenu();
      });
      document.addEventListener('click', (event) => {
        if (!mobileMenu.classList.contains('is-open')) return;
        if (!event.target.closest('.nav--reference')) closeMenu();
      });
    }

    /* -------- Glide for in-page anchors --------
       Native smooth scrolling is short and browser-defined. This tweens the same
       distance over a long ease-out, so an in-page jump moves in the same rhythm as
       the rest of the site. Reduced motion jumps straight there; a manual scroll or a
       key press ends the glide at once. While it runs, the stylesheet's scroll-behavior
       is switched off — otherwise the browser would animate every single frame. */
    function glideTo(targetY, instant) {
      const root = document.documentElement;
      const startY = window.scrollY;
      const distance = targetY - startY;
      if (instant || Math.abs(distance) < 2) {
        root.style.scrollBehavior = 'auto';
        window.scrollTo(0, targetY);
        root.style.scrollBehavior = '';
        return;
      }
      let stopped = false;
      const release = () => { stopped = true; root.style.scrollBehavior = ''; };
      const duration = Math.min(1900, 750 + Math.abs(distance) * .35);
      root.style.scrollBehavior = 'auto';
      window.addEventListener('wheel', release, { passive: true, once: true });
      window.addEventListener('touchstart', release, { passive: true, once: true });
      window.addEventListener('keydown', release, { once: true });
      const started = performance.now();
      const step = (now) => {
        if (stopped) return;
        const progress = Math.min(1, (now - started) / duration);
        window.scrollTo(0, Math.round(startY + distance * (1 - Math.pow(1 - progress, 4))));
        if (progress < 1) window.requestAnimationFrame(step); else release();
      };
      window.requestAnimationFrame(step);
    }

    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (ev) => {
        const href = a.getAttribute('href') || '';
        if (href === '#') { ev.preventDefault(); return; }
        const target = document.querySelector(href);
        if (!target) return;
        ev.preventDefault();
        const navHeight = document.getElementById('nav')?.offsetHeight || 0;
        const y = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
        glideTo(y, reduceMotion);
      });
    });

    /* -------- FAQ accordion --------
       Class toggle drives the grid-template-rows animation; aria-expanded
       is the AT hook. The `hidden` attribute is intentionally NOT toggled
       (it would set display:none and snap the panel closed). */
    document.querySelectorAll('.faq__q').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq__item');
        if (!item) return;
        const open = !item.classList.contains('is-open');
        document.querySelectorAll('.faq__item.is-open').forEach((other) => {
          if (other === item) return;
          other.classList.remove('is-open');
          other.querySelector('.faq__q')?.setAttribute('aria-expanded', 'false');
          other.querySelector('.faq__a')?.setAttribute('aria-hidden', 'true');
        });
        item.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
        item.querySelector('.faq__a')?.setAttribute('aria-hidden', String(!open));
      });
    });

    /* -------- Language switch --------
       Persisted choice beats browser language; falls back to EN. */
    document.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        if (lang && STRINGS[lang]) applyLang(lang);
      });
    });
  }

  /* -------- Motion that needs a hand from the script: reveal pacing, headlines that
     rise word by word, and cards that know where the pointer is. The movement itself
     is in the stylesheet ("Motion"). No tilt and no scroll-progress meter. -------- */
  function setupExperience(reduceMotion) {
    // Reducing motion also means opting out of reveals: without `is-ready` the
    // stylesheet keeps every element visible, so nothing depends on this script.
    if (reduceMotion) return;
    document.body.classList.add('is-ready');

    document.querySelectorAll('.reveal').forEach((element) => {
      const siblings = [...(element.parentElement?.querySelectorAll(':scope > .reveal') || [])];
      const siblingIndex = Math.max(0, siblings.indexOf(element));
      element.style.setProperty('--reveal-delay', `${Math.min(siblingIndex, 6) * 130}ms`);
    });

    const headlines = [...document.querySelectorAll('h1.reveal, h2.reveal')];
    headlines.forEach(splitHeadline);
    // Line breaks move once the web font is in; the lines are counted again then.
    document.fonts?.ready.then(() => headlines.forEach(numberLines));
    /* A language change rewrites the text and with it the wrapped words. A headline
       still waiting below the fold is wrapped again; one already on show stays plain. */
    document.addEventListener('alvia:langchange', () => {
      headlines.forEach((headline) => {
        if (headline.querySelector('.word')) return;
        if (headline.classList.contains('is-in')) headline.classList.remove('is-split');
        else splitHeadline(headline);
      });
    });

    document.querySelectorAll('.collection-card, .community-card, .arch-card--text').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const box = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${event.clientX - box.left}px`);
        card.style.setProperty('--my', `${event.clientY - box.top}px`);
      });
    });
  }

  /* Wraps every word of a headline in a mask (.word) with the word itself inside
     (.word__in), leaving the markup around the text as it is, so the stylesheet can
     let each word rise out of its line. Spaces stay ordinary text: the headline wraps
     and reads exactly as before. */
  function splitHeadline(headline) {
    const walker = document.createTreeWalker(headline, NodeFilter.SHOW_TEXT);
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach((node) => {
      if (!node.nodeValue.trim()) return;
      const pieces = document.createDocumentFragment();
      node.nodeValue.split(/([ \t\n]+)/).forEach((part) => {
        if (!part) return;
        if (!part.trim()) { pieces.appendChild(document.createTextNode(' ')); return; }
        const mask = document.createElement('span');
        const word = document.createElement('span');
        mask.className = 'word';
        word.className = 'word__in';
        word.textContent = part;
        mask.appendChild(word);
        pieces.appendChild(mask);
      });
      node.parentNode.replaceChild(pieces, node);
    });
    headline.classList.add('is-split');
    numberLines(headline);
  }

  // Tells each word which line it stands on, so the lines can follow one another.
  function numberLines(headline) {
    let line = -1;
    let top = null;
    headline.querySelectorAll('.word').forEach((word) => {
      const y = word.offsetTop;
      if (top === null || Math.abs(y - top) > 4) { line += 1; top = y; }
      word.style.setProperty('--line', line);
    });
  }

  /* Figures count up to their value the first time they are seen. Digits keep their
     place (figure spaces pad the shorter numbers), so nothing around them shifts. */
  function countUp(element) {
    const parts = element.textContent.split(/(\d+)/);
    if (parts.length < 2) return;
    const started = performance.now();
    let written = element.textContent;
    const step = (now) => {
      if (element.textContent !== written) return; // translated meanwhile: leave the new text alone
      const progress = Math.min(1, (now - started) / 1500);
      const eased = 1 - Math.pow(1 - progress, 4);
      written = parts.map((part, i) => (i % 2 ? String(Math.round(Number(part) * eased)).padStart(part.length, ' ') : part)).join('');
      element.textContent = written;
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }
})();
