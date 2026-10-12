/* ============================================================
   English / Albanian

   The page ships in English; Albanian is applied over it at
   runtime. Text nodes are matched on their English content, so
   there are no keys to keep in sync with the markup — but that
   also means an edit to the English silently loses its
   translation, which is what tools/check-i18n.py guards against.

   Two things are deliberately NOT translated:
   · the screens inside the device (.phone__screen) and the app
     component fragments (.fg). That is product interface lifted
     from the design canvas, and the app carries its own
     localisation. Half-translating it would look broken.
   · place names, which are already Albanian.
   ============================================================ */
(() => {
  'use strict';

  const SQ = {
    'THE REPAIR APP': 'APLIKACIONI PËR RIPARIME',
    'For the unexpected.': 'Për të papriturat.',
    'A SMALL SETBACK. A SMARTER COMEBACK.': 'NJË PENGESË E VOGËL. NJË RIKTHIM MË I ZGJUAR.',
    'Oh,': 'Oh,',
    'scratch.': 'një gërvishtje.',
    'Your next move,': 'Hapi yt i radhës,',
    'already in your pocket.': 'tashmë në xhepin tënd.',
    'Take a closer look': 'Shiko më nga afër',
    'SCAN. COMPARE. GET GOING.': 'SKANO. KRAHASO. VAZHDO.',
    'THE DRIVER’S SIDE': 'PËR SHOFERËT',
    'Point. Scan.': 'Fotografo. Skano.',
    'Breathe.': 'Merr frymë.',
    'A clearer repair estimate, from a few photos.': 'Një vlerësim më i qartë riparimi, nga disa foto.',
    'Your car. Your city. A more relevant estimate.': 'Makina jote. Qyteti yt. Një vlerësim më i përshtatshëm.',
    'Two photos to start. Three for a clearer picture.': 'Dy foto për të filluar. Tri për një pamje më të qartë.',
    'See the range. Understand the repair.': 'Shiko intervalin. Kupto riparimin.',
    'Compare the price. Pick your shop.': 'Krahaso çmimin. Zgjidh servisin.',
    'An offer accepted. A repair scheduled. Life moves on.': 'Oferta u pranua. Riparimi u caktua. Jeta vazhdon.',
    'Find nearby work. Quote it. Book it.': 'Gjej punë afër. Dërgo ofertën. Rezervo.',
    'Visible bodywork damage, with an estimated repair range based on your photos and vehicle details.': 'Dëmtime të dukshme të karrocerisë, me një interval riparimi bazuar në fotot dhe të dhënat e automjetit.',
    'A few photos. Your next step, sorted.': 'Disa foto. Hapi yt i radhës, i zgjidhur.',
    'Volkswagen Golf · Rear bumper': 'Volkswagen Golf · Parakolpi i pasmë',
    '85% · AI-supported': '85% · Me mbështetje AI',
    'Sand, prime + Full repaint': 'Lëmim, astar + Rilyerje e plotë',
    '1 offer from 1 shop': '1 ofertë nga 1 punëtori',
    'FROM SENT TO SCHEDULED': 'NGA KËRKESA TE REZERVIMI',
    'That feeling': 'Ajo ndjenjë',
    'when it’s': 'kur gjithçka është',
    'sorted.': 'zgjidhur.',
    'Send your request. Choose your offer. Keep the dates and the details together, right where you need them.': 'Dërgo kërkesën. Zgjidh ofertën. Mbaji datat dhe detajet bashkë, aty ku të duhen.',
    'See the shop side': 'Shiko anën e punëtorisë',
    'One app. Every next step.': 'Një aplikacion. Çdo hap i radhës.',
    'CRASHPRICER / 01': 'CRASHPRICER / 01',
    'A clearer road ahead.': 'Një rrugë më e qartë përpara.',
    'FROM DAMAGE TO DONE': 'NGA DËMTIMI TE RIPARIMI',
    'Less guessing.': 'Më pak hamendje.',
    'More': 'Më shumë',
    'going.': 'lëvizje.',
    'A repair estimate. An offer from a real shop. A way forward. All from the phone in your hand.': 'Një vlerësim riparimi. Një ofertë nga një punëtori e vërtetë. Një hap përpara. Gjithçka nga telefoni yt.',
    'Explore the app': 'Eksploro aplikacionin',
    'I run a repair shop': 'Kam një punëtori',
    'CrashPricer app previews': 'Pamje të aplikacionit CrashPricer',
    'From photos to a clearer price.': 'Nga fotot te një çmim më i qartë.',
    'Repair booked.': 'Riparimi u rezervua.',
    'A little peace of mind.': 'Pak më shumë qetësi.',
    'BUILT FOR DRIVERS. MADE FOR REPAIR SHOPS.': 'PËR SHOFERËT. PËR PUNËTORITË.',
    'SCAN THE DAMAGE': 'SKANO DËMTIMIN',
    'KNOW THE PRICE': 'MËSO ÇMIMIN',
    'CHOOSE YOUR SHOP': 'ZGJIDH PUNËTORINË',
    'GET BACK TO LIFE': 'VAZHDO PËRDITSHMËRINË',
    '01 / A LITTLE DAMAGE. A LOT OF QUESTIONS.': '01 / PAK DËMTIM. SHUMË PYETJE.',
    'Let’s clear': 'Le t’i qartësojmë',
    'things': 'gjërat',
    'up.': 'bashkë.',
    'Visible bodywork. A useful starting point.': 'Karroceria e dukshme. Një pikënisje e dobishme.',
    'Paint damage': 'Dëmtim i ngjyrës',
    'Illustrative estimate. Final scope requires inspection.': 'Vlerësim ilustrues. Puna përfundimtare kërkon inspektim.',
    'YOUR PHOTOS. A CLEARER PICTURE.': 'FOTOT E TUA. NJË PAMJE MË E QARTË.',
    'Scan. Review. Understand.': 'Skano. Kontrollo. Kupto.',
    'AI': 'AI',
    'supported estimates': 'vlerësime të mbështetura',
    'Your next step, handled.': 'Hapi yt i radhës, i zgjidhur.',
    'Photograph the damage, review the estimate and send your request. Nearby repair shops can respond with an offer.': 'Fotografo dëmtimin, kontrollo vlerësimin dhe dërgo kërkesën. Punëtoritë afër mund të përgjigjen me ofertë.',
    'TWO SIDES. ONE SMOOTHER REPAIR.': 'DY PALË. NJË RIPARIM MË I LEHTË.',
    'Good for your car.': 'Mirë për veturën.',
    'Great for your shop.': 'Shkëlqyeshëm për punëtorinë.',
    'Follow the journey from the other side. Set your area, send an offer and keep your booked work in view.': 'Shiko procesin nga ana tjetër. Cakto zonën, dërgo ofertë dhe ndiq punët e rezervuara.',
    'Repair shop app screens': 'Ekranet e aplikacionit për punëtori',
    '01 / Coverage': '01 / Zona',
    '02 / Offers': '02 / Ofertat',
    '03 / Bookings': '03 / Rezervimet',
    'CONNECTED.': 'TË LIDHUR.',
    'Your area. Your next opportunity.': 'Zona jote. Mundësia jote e radhës.',
    'Your price. Your schedule. Your offer.': 'Çmimi yt. Orari yt. Oferta jote.',
    'Accepted. Scheduled. All in one place.': 'Pranuar. Planifikuar. Gjithçka në një vend.',
    /* — chrome — */
    'Skip to content': 'Kalo te përmbajtja',
    'CrashPricer home': 'CrashPricer, faqja kryesore',
    'Primary': 'Kryesore',
    'Footer': 'Fundi i faqes',
    'Open menu': 'Hap menynë',
    'Close menu': 'Mbyll menynë',
    'Language': 'Gjuha',
    'How it works': 'Si funksionon',
    'For drivers': 'Për shoferët',
    'For repair shops': 'Për punëtoritë',
    'FAQ': 'Pyetje',
    'Get CrashPricer': 'Merr CrashPricer',

    /* — hero flow — */
    'Scan': 'Skano',
    'Compare': 'Krahaso',
    'Book': 'Rezervo',
    'Know the': 'Mëso',
    'price.': 'çmimin.',

    /* — hero — */
    'Vehicle body damage, handled from your phone': 'Dëmtimet e karrocerisë, të zgjidhura nga telefoni',
    'Scan the damage.': 'Skano dëmtimin.',
    'Know the price.': 'Mëso çmimin.',
    'Photograph the damaged panel and CrashPricer returns an estimated repair range in euros — then puts your request in front of repair shops nearby.':
      'Fotografo panelin e dëmtuar dhe CrashPricer të kthen një interval të vlerësuar riparimi në euro — pastaj ia dërgon kërkesën punëtorive afër teje.',
    'Start a scan': 'Fillo një skanim',
    'See how it works': 'Shiko si funksionon',
    'per scan': 'për skanim',
    '2–3 photos': '2–3 foto',
    'needed': 'nevojiten',
    'accuracy': 'saktësi',
    'Scroll to see it work': 'Lëviz poshtë për ta parë',

    /* — floating fragments — */
    'Last scan': 'Skanimi i fundit',
    'VW Golf · Front bumper': 'VW Golf · Parakolpi i përparmë',
    'Typical accuracy': 'Saktësia tipike',
    'Guided flow': 'Hap pas hapi',
    'Step 1 of 4 · Vehicle': 'Hapi 1 nga 4 · Automjeti',
    'City': 'Qyteti',
    'Priced against local rates': 'Çmuar sipas tarifave lokale',
    'Guided capture': 'Fotografim i udhëzuar',
    'Step 2 of 4 · Photos': 'Hapi 2 nga 4 · Fotot',
    'Photos added': 'Foto të shtuara',
    '3 of 3 · All set': '3 nga 3 · Gati',
    'Camera or library': 'Kamera ose galeria',
    'Estimated repair cost': 'Kosto e vlerësuar e riparimit',
    'Evidence': 'Dëshmia',
    '90% · Strong photos': '90% · Foto të qarta',
    'Replace panel + Paint match': 'Ndërrim paneli + Përputhje ngjyre',
    'Your offers': 'Ofertat e tua',
    '3 offers from 3 shops': '3 oferta nga 3 punëtori',
    'Audi A4 · Rear bumper': 'Audi A4 · Parakolpi i pasmë',
    'Prishtina': 'Prishtinë',
    'Ready in 2 days': 'Gati për 2 ditë',
    'New request': 'Kërkesë e re',
    'Rear bumper · Crack': 'Parakolpi i pasmë · Plasaritje',
    'Owner estimate': 'Vlerësimi i pronarit',
    'Repair window': 'Afati i riparimit',
    'Mon 24 → Wed 26': 'Hën 24 → Mër 26',

    /* — chapter copy — */
    '01 — Vehicle': '01 — Automjeti',
    'Start with the car.': 'Fillo me veturën.',
    'Brand, model, year and city. It takes a minute, and it is what lets the estimate be priced against the right vehicle at the right local rates.':
      'Marka, modeli, viti dhe qyteti. Zgjat një minutë, dhe është ajo që bën që vlerësimi të llogaritet për automjetin e duhur me tarifat lokale të duhura.',
    'Four guided steps, no forms to hunt through': 'Katër hapa të udhëzuar, pa formularë të fshehur',
    'Priced against local body and paint rates': 'Çmuar sipas tarifave lokale të karrocerisë dhe ngjyrës',
    'Nothing to install, nothing to book': 'Asgjë për të instaluar, asgjë për të rezervuar',
    '02 — Photos': '02 — Fotot',
    'Two photos. Three is better.': 'Dy foto. Tri janë më mirë.',
    'Add at least two clear shots of the damaged panel — camera or library, your call. Three makes the estimate stronger, and you can drop any of them before continuing.':
      'Shto të paktën dy foto të qarta të panelit të dëmtuar — kamera ose galeria, si të duash. Tri e forcojnë vlerësimin, dhe mund t’i heqësh para se të vazhdosh.',
    'Two to continue, three recommended': 'Dy për të vazhduar, tri të rekomanduara',
    'Camera or photo library': 'Kamera ose galeria e fotove',
    'Review and remove before you send': 'Shiko dhe hiq para se t’i dërgosh',
    '03 — Estimate': '03 — Vlerësimi',
    'A real number, before you go.': 'Një shifër e vërtetë, para se të shkosh.',
    'An estimated repair range in euros with the detected panel, the damage type and severity, whether it needs repair or replacement — and an evidence score saying how much to trust it.':
      'Një interval i vlerësuar riparimi në euro me panelin e identifikuar, llojin e dëmtimit dhe ashpërsinë, nëse duhet riparim apo ndërrim — dhe një pikëzim dëshmie që tregon sa duhet t’i besosh.',
    'Evidence score on every estimate': 'Pikëzim dëshmie në çdo vlerësim',
    'Repair vs. replace, paint match included': 'Riparim apo ndërrim, me përputhje ngjyre',
    'Says so when a shop needs to look': 'Të thotë kur duhet ta shohë një punëtori',
    '04 — Offers': '04 — Ofertat',
    'Shops come to you.': 'Punëtoritë vijnë te ti.',
    'Every request sits in one list, grouped by vehicle. Shops reply with a price and a timeline, and the ones still waiting stay visible until they do.':
      'Çdo kërkesë qëndron në një listë, e grupuar sipas automjetit. Punëtoritë përgjigjen me çmim dhe afat, dhe ato që ende presin mbeten të dukshme derisa të përgjigjen.',
    'Real offers, not lead forms': 'Oferta reale, jo formularë kontakti',
    'Price, city and repair time': 'Çmimi, qyteti dhe koha e riparimit',
    'Nothing is committed until you accept': 'Asgjë nuk është e detyrueshme derisa të pranosh',

    /* — rail and step labels — */
    'Vehicle': 'Automjeti',
    'Photos': 'Fotot',
    'Estimate': 'Vlerësimi',
    'Offers': 'Ofertat',

    /* — how it works — */
    'How CrashPricer works': 'Si funksionon CrashPricer',
    'Four steps between damage': 'Katër hapa mes dëmtimit',
    'and a booked repair.': 'dhe një riparimi të rezervuar.',
    'Add the vehicle': 'Shto automjetin',
    'Brand, model, year and city, so the estimate is priced against the right car at local rates.':
      'Marka, modeli, viti dhe qyteti, që vlerësimi të llogaritet për veturën e duhur me tarifa lokale.',
    'Photograph the damage': 'Fotografo dëmtimin',
    'At least two clear photos of the panel — camera or library. Three makes the estimate stronger.':
      'Të paktën dy foto të qarta të panelit — kamera ose galeria. Tri e forcojnë vlerësimin.',
    'Review the estimate': 'Shiko vlerësimin',
    'Detected panel, damage type and severity, with a repair range in euros and how far to trust it.':
      'Paneli i identifikuar, lloji i dëmtimit dhe ashpërsia, me një interval riparimi në euro dhe sa duhet t’i besosh.',
    'Choose an offer': 'Zgjidh një ofertë',
    'Compare replies from repair shops, accept one, and book the drop-off.':
      'Krahaso përgjigjet e punëtorive, prano njërën dhe rezervo dorëzimin.',

    /* — guess the price — */
    'Try it yourself': 'Provoje vetë',
    'What would you have guessed?': 'Sa do të kishit hamendësuar?',
    'Rear bumper': 'Parakolpi i pasmë',
    'Crack': 'Plasaritje',
    'Medium': 'Mesatar',
    'Your guess, in euros': 'Hamendja jote, në euro',
    'Drag to your guess': 'Rrëshqite te hamendja jote',
    'Reveal the estimate': 'Zbulo vlerësimin',
    'Inside the range': 'Brenda intervalit',
    'Off by': 'Larg me',

    /* — for drivers — */
    'Know what a repair could cost before you visit a shop.': 'Mëso sa mund të kushtojë një riparim para se të shkosh në punëtori.',
    'An estimated range in euros, generated from your own photos and priced against local body and paint rates — with an evidence score that tells you how much to trust it.':
      'Një interval i vlerësuar në euro, i gjeneruar nga fotot e tua dhe i çmuar sipas tarifave lokale të karrocerisë dhe ngjyrës — me një pikëzim dëshmie që tregon sa duhet t’i besosh.',
    'Evidence 90% · Strong photos': 'Dëshmia 90% · Foto të qarta',
    'Compare offers side by side': 'Krahaso ofertat krah për krah',
    'Price, rating, city and repair time in one list, grouped per vehicle with the cheapest flagged.':
      'Çmimi, vlerësimi, qyteti dhe koha e riparimit në një listë, të grupuara sipas automjetit me më të lirën të shënuar.',
    'About two minutes of your time': 'Rreth dy minuta nga koha jote',
    'One request, sent once. Shops answer you — you don’t drive around town collecting quotes.':
      'Një kërkesë, e dërguar një herë. Punëtoritë të përgjigjen ty — nuk sillesh nëpër qytet për oferta.',
    'No more uncertainty': 'Fund pasigurisë',
    'You walk in already knowing the part, the damage type, the severity and a fair range.':
      'Hyn tashmë duke ditur pjesën, llojin e dëmtimit, ashpërsinë dhe një interval të drejtë.',
    'Everything on your phone': 'Gjithçka në telefonin tënd',
    'Scan, estimate, offers, booking, drop-off and pick-up — one thread from start to finish.':
      'Skanimi, vlerësimi, ofertat, rezervimi, dorëzimi dhe marrja — një fill i vetëm nga fillimi në fund.',

    /* — parts marketplace — */
    'For drivers and shops': 'Për shoferë dhe punëtori',
    'Parts, from whoever': 'Pjesë, nga kushdo që',
    'already has them.': 'i ka tashmë.',
    'The same app carries a marketplace for body parts, wheels, lights and paint — listed by repair shops and by private sellers. CrashPricer shows the item, the price and the address; payment and pickup are arranged directly with the seller.':
      'I njëjti aplikacion ka edhe një treg për pjesë karrocerie, rrota, fenerë dhe ngjyra — të listuara nga punëtoritë dhe nga shitës privatë. CrashPricer tregon artikullin, çmimin dhe adresën; pagesa dhe marrja rregullohen drejtpërdrejt me shitësin.',
    'Search by part, model or shop': 'Kërko sipas pjesës, modelit ose punëtorisë',
    'Filter to body parts, wheels, lights or paint': 'Filtro në pjesë karrocerie, rrota, fenerë ose ngjyrë',
    'Distance from you on every listing': 'Largësia nga ti në çdo listim',
    'Shop or private seller, labelled on the listing': 'Punëtori apo shitës privat, e shënuar në listim',

    /* — for repair shops — */
    'Damage requests,': 'Kërkesa për dëmtime,',
    'already qualified.': 'tashmë të kualifikuara.',
    'Shops on CrashPricer see damage cases from drivers in their coverage area — photos, detected part and severity attached — and reply with a single offer: price, repair time, drop-off. No cold leads, no scoping over the phone.':
      'Punëtoritë në CrashPricer shohin rastet e dëmtimeve nga shoferët në zonën e tyre të mbulimit — me foto, pjesën e identifikuar dhe ashpërsinë — dhe përgjigjen me një ofertë të vetme: çmimi, koha e riparimit, dorëzimi. Pa kontakte të ftohta, pa vlerësime në telefon.',
    'Draw a radius of 10, 25, 50 or 100 km around your city': 'Cakto një rreze prej 10, 25, 50 ose 100 km rreth qytetit tënd',
    'See how many open requests fall inside it before you commit': 'Shiko sa kërkesa të hapura bien brenda saj para se të vendosësh',
    'Every request arrives with the owner’s estimate already on it': 'Çdo kërkesë vjen me vlerësimin e pronarit tashmë në të',
    'Accepted work arrives with the owner’s contact attached': 'Puna e pranuar vjen me kontaktin e pronarit',
    'Join as a repair shop': 'Bashkohu si punëtori',

    /* — coverage — */
    'Coverage': 'Mbulimi',
    'What a scan actually covers.': 'Çfarë mbulon vërtet një skanim.',
    'A scan, start to estimate': 'Një skanim, nga fillimi te vlerësimi',
    'Photos per scan': 'Foto për skanim',
    'Typical estimate accuracy': 'Saktësia tipike e vlerësimit',
    'Body panels it can price': 'Panele karrocerie që i çmon',
    'Scan volume, partner counts and review scores publish once the numbers are real.':
      'Numri i skanimeve, i partnerëve dhe vlerësimet publikohen kur shifrat të jenë reale.',
    'Live across Kosovo': 'Aktiv në tërë Kosovën',
    'Municipalities CrashPricer covers': 'Komunat që mbulon CrashPricer',

    /* — faq — */
    'Questions,': 'Pyetje,',
    'answered.': 'përgjigje.',
    'The estimate says so itself when a case needs a shop to look at it in person.':
      'Vlerësimi e thotë vetë kur një rast duhet parë nga një punëtori.',
    'What exactly does CrashPricer estimate?': 'Çfarë vlerëson saktësisht CrashPricer?',
    'Visible bodywork damage. From your photos it identifies the affected panel, the damage type and the severity, then returns an estimated repair range in euros — including whether the panel is likely to be repaired or replaced, and whether paint needs matching.':
      'Dëmtimet e dukshme të karrocerisë. Nga fotot e tua identifikon panelin e prekur, llojin e dëmtimit dhe ashpërsinë, pastaj kthen një interval të vlerësuar riparimi në euro — përfshirë nëse paneli ka gjasa të riparohet apo të ndërrohet, dhe nëse ngjyra duhet përputhur.',
    'Where do the prices come from?': 'Nga vijnë çmimet?',
    'Rates from local auto body and paint shops, not a generic table. The estimate screen names the pricing source it used so you can see what the range is based on.':
      'Nga tarifat e punëtorive lokale të karrocerisë dhe ngjyrës, jo nga një tabelë e përgjithshme. Ekrani i vlerësimit e emërton burimin e çmimeve që ka përdorur, që ta shohësh mbi çfarë bazohet intervali.',
    'Is the estimate a final price?': 'A është vlerësimi çmim përfundimtar?',
    'No. It is a range with an evidence score attached, and it can change after clearer photos or a shop inspection. The binding numbers are the offers repair shops send you afterwards.':
      'Jo. Është një interval me një pikëzim dëshmie, dhe mund të ndryshojë pas fotove më të qarta ose një inspektimi në punëtori. Shifrat detyruese janë ofertat që të dërgojnë punëtoritë më pas.',
    'How do repair shops see my request?': 'Si e shohin punëtoritë kërkesën time?',
    'Only when you publish it. Shops whose coverage area includes your location receive the case with the photos and the detected damage, and can reply with an offer. Most reply within a few hours.':
      'Vetëm kur ta publikosh. Punëtoritë, zona e mbulimit e të cilave përfshin vendndodhjen tënde, e marrin rastin me fotot dhe dëmtimin e identifikuar, dhe mund të përgjigjen me një ofertë. Shumica përgjigjen brenda pak orësh.',
    'What happens to the offers I don’t take?': 'Çfarë ndodh me ofertat që nuk i pranoj?',
    'Accepting one offer notifies that shop and declines the others automatically — you don’t have to turn anyone down yourself. Until you accept, nothing is committed, and there is a free window to withdraw a booking afterwards.':
      'Pranimi i një oferte njofton atë punëtori dhe i refuzon të tjerat automatikisht — nuk duhet t’i refuzosh vetë. Derisa të pranosh, asgjë nuk është e detyrueshme, dhe ka një afat pa pagesë për ta tërhequr rezervimin më pas.',
    'Where does CrashPricer work?': 'Ku funksionon CrashPricer?',
    'Across all 22 municipalities in Kosovo at launch, with estimates priced in euros. More regions follow.':
      'Në të 22 komunat e Kosovës në nisje, me vlerësime në euro. Rajone të tjera vijnë më pas.',

    /* — closing — */
    'Your repair': 'Riparimi yt',
    'Download CrashPricer, photograph the damage, and know what you’re dealing with before anyone quotes you a number.':
      'Shkarko CrashPricer, fotografo dëmtimin dhe mëso me çfarë ke të bësh para se dikush të të japë një shifër.',
    'Get started': 'Fillo tani',
    'Download on the': 'Shkarkoje në',
    'Get it on': 'Merre në',

    /* — footer — */
    'Point. Scan. Get the price.': 'Foto. Skano. Mëso çmimin.',
    'Product': 'Produkti',
    'Download': 'Shkarko',
    'Business': 'Biznes',
    'Company': 'Kompania',
    'Privacy': 'Privatësia',
    'Terms': 'Kushtet',
    'Legal': 'Ligjore',
    'Support': 'Ndihma',
    'Company details': 'Të dhënat e kompanisë',
    'Delete account': 'Fshi llogarinë',
    'Prishtinë, Kosovo': 'Prishtinë, Kosovë',
  };

  /* Lines that carry inline markup translate whole, by id. */
  const SQ_HTML = {
    'why-h': 'Dëmtimi është stresues.<br />Por <em>procesi</em> nuk ka pse të jetë.',
    'final-2': 'fillon me një <em>skanim</em>.',
  };

  /* Curly and straight quotes have to compare equal — the markup uses one and
     a dictionary entry may well use the other, and a silent miss here looks
     exactly like a missing translation. */
  const norm = (s) => s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  const LOOKUP = Object.create(null);
  for (const k of Object.keys(SQ)) LOOKUP[norm(k)] = SQ[k];

  const SKIP = /(^|\s)(phone__screen|scr|fg|i18n-skip)(\s|$)/;
  const LETTER = /[A-Za-z]/;
  const STORE = 'crashpricer-lang';

  const original = new Map();      // text node  -> English
  const originalHtml = new Map();  // element    -> English innerHTML
  const originalAttr = new Map();  // element    -> English aria-label
  let lang = 'en';

  function skipped(node) {
    for (let el = node.parentElement; el; el = el.parentElement) {
      const tag = el.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE') return true;
      if (el.hasAttribute('data-i18n')) return true;      // handled whole
      if (SKIP.test(el.className || '')) return true;     // app interface
    }
    return false;
  }

  function apply(next) {
    lang = next;
    const sq = next === 'sq';

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const raw = node.nodeValue;
      if (!LETTER.test(raw) || skipped(node)) continue;
      if (!original.has(node)) original.set(node, raw);
      const source = original.get(node);
      const key = source.trim().replace(/\s+/g, ' ');
      const value = sq ? LOOKUP[norm(key)] : null;
      node.nodeValue = value
        ? source.slice(0, source.indexOf(source.trim()[0])) + value + source.match(/\s*$/)[0]
        : source;
    }

    for (const el of document.querySelectorAll('[data-i18n]')) {
      if (!originalHtml.has(el)) originalHtml.set(el, el.innerHTML);
      const value = sq ? SQ_HTML[el.getAttribute('data-i18n')] : null;
      el.innerHTML = value || originalHtml.get(el);
    }

    for (const el of document.querySelectorAll('[aria-label]')) {
      if (!originalAttr.has(el)) originalAttr.set(el, el.getAttribute('aria-label'));
      const source = originalAttr.get(el);
      el.setAttribute('aria-label', (sq && LOOKUP[norm(source)]) || source);
    }

    document.documentElement.lang = sq ? 'sq' : 'en';
    for (const b of document.querySelectorAll('.langtoggle button')) {
      const on = b.dataset.lang === next;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    try { localStorage.setItem(STORE, next); } catch (e) { /* private mode */ }

    /* Labels that other scripts write themselves — the menu button's, which
       depends on whether the menu is open — cannot be restored from the
       snapshot taken here. Let them re-apply their own. */
    dispatchEvent(new CustomEvent('crashpricer:lang', { detail: next }));
  }

  /* site.js writes the burger label itself, so it needs the dictionary too */
  window.snapT = (text) => (lang === 'sq' && LOOKUP[norm(text)]) || text;

  let start = 'en';
  try { start = localStorage.getItem(STORE) || start; } catch (e) { /* ignore */ }
  if (start !== 'sq' && start !== 'en') start = 'en';
  try {
    if (!localStorage.getItem(STORE) && (navigator.language || '').toLowerCase().startsWith('sq')) {
      start = 'sq';
    }
  } catch (e) { /* ignore */ }

  addEventListener('click', (e) => {
    const b = e.target.closest('.langtoggle button');
    if (b) apply(b.dataset.lang);
  });

  apply(start);
})();
