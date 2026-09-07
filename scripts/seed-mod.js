// Jeu de données de démo pour tester les écrans protégés en local (jamais servi en prod).
// Usage : node scripts/shot.mjs <url> <out.png> --eval="$(cat scripts/seed-mod.js)"
(() => {
  const b64 = o => btoa(JSON.stringify(o)).replace(/=+$/, '');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = [
    b64({ alg: 'HS256', typ: 'JWT' }),
    b64({ email: 'contact.aircraft2sell@gmail.com', exp: exp, role: 'authenticated' }),
    'signature-de-demo'
  ].join('.');
  sessionStorage.setItem('a2s_admin_session', token);

  const now = new Date();
  const iso = d => new Date(now.getTime() - d * 86400000).toISOString();
  localStorage.setItem('a2s_listings', JSON.stringify([
    { id: 1, make: 'Cirrus', model: 'SR22 G6', year: 2019, price: 685000, currency: 'EUR',
      category: 'Avions légers', hours: 820, country: 'France', airport: 'LFPN',
      desc: "Cirrus SR22 G6 entretenu en centre agréé, avionique Garmin Perspective+, parachute CAPS révisé en 2024. Carnets complets depuis l'origine.",
      seller: 'Aéroclub de Toussus', status: 'pending', submittedAt: now.toISOString() },
    { id: 2, make: 'Cessna', model: 'Citation CJ3+', year: 2016, price: 5950000, currency: 'EUR',
      category: "Jets d'affaires", hours: 2450, country: 'Suisse', airport: 'LSGG',
      desc: 'Citation CJ3+ configuration 8 places, programme moteur ProAdvantage, intérieur refait en 2023.',
      seller: 'Alpine Jet Services', status: 'pending', submittedAt: iso(1) },
    { id: 3, make: 'Robinson', model: 'R44 Raven II', year: 2014, price: 320000, currency: 'EUR',
      category: 'Hélicoptères', hours: 1180, country: 'Espagne', airport: 'LEMD',
      desc: 'R44 Raven II, révision 2200 h effectuée en 2023, flottabilité et radio altimètre installés.',
      seller: 'Heli Ibérica', status: 'pending', submittedAt: iso(2) },
    { id: 4, make: 'Daher', model: 'TBM 940', year: 2021, price: 4300000, currency: 'EUR',
      category: 'Turbopropulseurs', hours: 610, country: 'France', airport: 'LFBT',
      desc: 'TBM 940 sous garantie constructeur, HomeSafe actif, peinture neuve.',
      seller: 'Pyrénées Aviation', status: 'live', moderatedAt: iso(3) },
    { id: 5, make: 'Piper', model: 'PA-28 Archer', year: 1998, price: 118000, currency: 'EUR',
      category: 'Avions légers', hours: 4300, country: 'Belgique', airport: 'EBKT',
      desc: 'Archer III bien suivi, moteur 780 h depuis révision générale.',
      seller: 'Flanders Flying', status: 'live', moderatedAt: iso(5) },
    { id: 6, make: 'Tecnam', model: 'P2008', year: 2020, price: 148000, currency: 'EUR',
      category: 'ULM', hours: 340, country: 'Italie', airport: 'LIPU',
      desc: 'Photos floues et description incomplète, dossier à reprendre.',
      seller: 'Vendeur particulier', status: 'rejected',
      rejectionReason: 'Photos insuffisantes ou de mauvaise qualité', moderatedAt: iso(4) }
  ]));
})();
