/* ============================================================
   aircraft-db.js — Aircraft2Sell
   Base de données complète des marques et modèles d'aéronefs
   Usage: window.AIRCRAFT_DB
   ============================================================ */

const AIRCRAFT_DB = {

  /* ── AVIONS LÉGERS / MONOMOTEURS ─────────────────────────── */
  'Cessna': {
    cat: 'light',
    models: ['150','152','162 Skycatcher','172 Skyhawk','172 Skyhawk SP','172 Skyhawk G1000',
      '177 Cardinal','180','182 Skylane','182 Skylane G1000','185 Skywagon',
      '206 Stationair','207 Skywagon','208 Caravan','208B Grand Caravan',
      '210 Centurion','310','336 Skymaster','337 Skymaster','340','402','414','421',
      'TTx (T240)','Citation CJ1','Citation CJ2','Citation CJ3','Citation CJ4',
      'Citation Mustang','Citation M2','Citation XLS','Citation Sovereign',
      'Citation X','Citation Latitude','Citation Longitude','Citation Ascend']
  },
  'Piper': {
    cat: 'light',
    models: ['PA-18 Super Cub','PA-22 Tri-Pacer','PA-24 Comanche','PA-28 Cherokee',
      'PA-28-140','PA-28-151 Warrior','PA-28-161 Warrior II','PA-28-181 Archer',
      'PA-28-181 Archer III','PA-28R Arrow','PA-28R-200 Arrow II','PA-28RT-201 Arrow IV',
      'PA-32 Cherokee Six','PA-32-300 Six','PA-32R Lance','PA-34 Seneca',
      'PA-34-200T Seneca II','PA-34-220T Seneca V','PA-38 Tomahawk','PA-44 Seminole',
      'PA-46 Malibu','PA-46-350P Malibu Mirage','PA-46-500TP Meridian',
      'PA-46R Matrix','M350','M500','M600','M600/SLS']
  },
  'Beechcraft': {
    cat: 'light',
    models: ['A23 Musketeer','B23 Musketeer','B19 Sport','B36TC Bonanza','B55 Baron',
      'B58 Baron','D17 Staggerwing','E33 Debonair','F33A Bonanza','G36 Bonanza',
      'V35 Bonanza','V35B Bonanza','B36TC Bonanza','58P Baron Pressurized',
      '60 Duke','65 Queen Air','70 Queen Air','80 Queen Air','90 King Air',
      'A90 King Air','C90 King Air','C90GTx King Air','E90 King Air',
      'F90 King Air','100 King Air','200 King Air','B200 King Air','B200GT King Air',
      '300 King Air','B300 King Air','350 King Air','350i King Air',
      '350ER King Air','1900 Airliner','1900D']
  },
  'Mooney': {
    cat: 'light',
    models: ['M20A','M20B Mark 21','M20C Ranger','M20D Master','M20E Super 21',
      'M20F Executive','M20G Statesman','M20J 201','M20K 231','M20K 252 TSE',
      'M20L PFM','M20M Bravo','M20R Ovation','M20S Eagle','M20TN Acclaim Type S',
      'M20V Acclaim Ultra','M20U Ovation 3']
  },
  'Robin': {
    cat: 'light',
    models: ['DR 200','DR 253 Regent','DR 300','DR 315','DR 340','DR 360','DR 400',
      'DR 400/120','DR 400/140B','DR 400/160','DR 400/180','DR 400/200R',
      'DR 401','DR 500','R 1180 TD','R 2100 A','R 2112','R 2160 Alpha',
      'ATL','Alpha 160A','Alpha 160D']
  },
  'Diamond': {
    cat: 'light',
    models: ['DA20 Katana','DA20-C1 Eclipse','DA40 Diamond Star','DA40 NG',
      'DA40 XLS','DA40 TDI','DA42 Twin Star','DA42 NG','DA42-VI',
      'DA50 RG','DA62','HK36 Super Dimona','DV20 Katana']
  },
  'Cirrus': {
    cat: 'light',
    models: ['SR20','SR20 G2','SR20 G3','SR22','SR22 G2','SR22 G3','SR22 G5','SR22 G6',
      'SR22T','SR22T G6','SR22 GTS','SR22T GTS','Vision Jet SF50']
  },
  'Socata / TBM': {
    cat: 'light',
    models: ['Rallye 100','Rallye 150','Rallye 235','MS 880','MS 893 Rallye 180',
      'TB 9 Tampico','TB 10 Tobago','TB 20 Trinidad','TB 21 Trinidad TC',
      'TBM 700','TBM 850','TBM 900','TBM 910','TBM 930','TBM 940','TBM 960']
  },
  'Tecnam': {
    cat: 'light',
    models: ['P92 Echo','P92 Eaglet','P92 RG','P96 Golf','P2002 JF','P2002 Sierra',
      'P2004 Bravo','P2006T','P2010','P2012 Traveller','P-Mentor']
  },
  'Grumman': {
    cat: 'light',
    models: ['AA-1 Yankee','AA-1B Trainer','AA-1C T-Cat','AA-5 Traveler',
      'AA-5A Cheetah','AA-5B Tiger','GA-7 Cougar','Ag Cat']
  },
  'Mudry': {
    cat: 'light',
    models: ['CAP 10','CAP 10B','CAP 20','CAP 21','CAP 230','CAP 231','CAP 232',
      'CAP 222','CAP 330','CAP 332']
  },
  'Extra': {
    cat: 'light',
    models: ['EA-300','EA-300/L','EA-300/S','EA-300/SC','EA-200','EA-230',
      'EA-330LX','EA-330SC','EA-500','EA-400']
  },
  'Aquila': { cat: 'light', models: ['AT01','AT01-100','AT01-A210'] },
  'BRM Aero': { cat: 'light', models: ['Bristell','Bristell UL','Bristell NG5'] },
  'Pipistrel': {
    cat: 'light',
    models: ['Sinus','Sinus 912','Virus','Virus SW 121','Virus SW 128',
      'Alpha Trainer','Panthera','Velis Electro','Taurus']
  },
  'Ultravia': { cat: 'light', models: ['Pelican Club','Pelican PL'] },

  /* ── TURBOPROPULSEURS ────────────────────────────────────── */
  'Pilatus': {
    cat: 'turbo',
    models: ['PC-6 Porter','PC-6/B2-H4 Turbo Porter','PC-7 Turbotrainer',
      'PC-9','PC-12','PC-12/45','PC-12/47','PC-12/47E','PC-12 NGX',
      'PC-21','PC-24']
  },
  'Daher (TBM)': {
    cat: 'turbo',
    models: ['TBM 700','TBM 700C2','TBM 850','TBM 900','TBM 910','TBM 930','TBM 940','TBM 960']
  },
  'Piper (Turbine)': {
    cat: 'turbo',
    models: ['PA-46-500TP Meridian','PA-46-600TP M600','PA-46-M600/SLS']
  },
  'Cessna (Turbine)': {
    cat: 'turbo',
    models: ['208 Caravan','208B Grand Caravan','208B EX','208B Grand Caravan EX']
  },
  'Beechcraft (Turbine)': {
    cat: 'turbo',
    models: ['90 King Air','C90 King Air','C90GTx','E90','100','200','B200','B200GT',
      '300','B300','350','350i','350ER','1900','1900C','1900D']
  },
  'Daher Kodiak': { cat: 'turbo', models: ['100','Quest Kodiak 100','Kodiak 900'] },
  'Vulcanair': { cat: 'turbo', models: ['P.68 Observer','P.68C','P.68TC','V1.0','Viator'] },
  'Partenavia': { cat: 'turbo', models: ['P.68 Victor','P.68B','P.68C','P.68R'] },

  /* ── JETS D'AFFAIRES ─────────────────────────────────────── */
  'Cessna Citation': {
    cat: 'jet',
    models: ['Citation I','Citation II','Citation S/II','Citation III','Citation V',
      'Citation VI','Citation VII','CJ1','CJ1+','CJ2','CJ2+','CJ3','CJ3+','CJ4',
      'Citation Mustang','Citation M2','Citation M2+','Citation XLS','Citation XLS+',
      'Citation Sovereign','Citation Sovereign+','Citation X','Citation X+',
      'Citation Latitude','Citation Longitude','Citation Ascend']
  },
  'Bombardier Learjet': {
    cat: 'jet',
    models: ['23','24','25','28','29','31','35','35A','36','40','45','45XR',
      '55','60','60XR','70','75','75 Liberty','85']
  },
  'Bombardier Challenger': {
    cat: 'jet',
    models: ['300','350','600','601','601-3A','604','605','650','3500']
  },
  'Bombardier Global': {
    cat: 'jet',
    models: ['Express','5000','6000','7500','8000','Global XRS']
  },
  'Gulfstream': {
    cat: 'jet',
    models: ['G100','G150','G200','G280','G300','G350','G400','G450','G500',
      'G550','G600','G650','G650ER','G700','G800','GIII','GIV','GIV-SP','GV','GV-SP']
  },
  'Dassault Falcon': {
    cat: 'jet',
    models: ['10','20','50','900','900B','900C','900DX','900EX','900EX EASy',
      '900LX','2000','2000EX','2000EX EASy','2000LX','2000LXS','2000S',
      '7X','8X','6X','10X']
  },
  'Embraer Phenom': {
    cat: 'jet',
    models: ['100','100E','100EV','300','300E','300F']
  },
  'Embraer Legacy': {
    cat: 'jet',
    models: ['450','500','600','650','650E']
  },
  'Embraer Praetor': {
    cat: 'jet',
    models: ['500','600']
  },
  'HondaJet': {
    cat: 'jet',
    models: ['HA-420','Elite','Elite II','Elite S']
  },
  'Pilatus PC-24': { cat: 'jet', models: ['PC-24'] },
  'Daher Kodiak (Jet)': { cat: 'jet', models: ['Kodiak 100 Jet'] },
  'Textron Aviation': {
    cat: 'jet',
    models: ['Citation Ascend','Citation CJ4 Gen2','Citation Longitude']
  },
  'IAI (Astra/Galaxy)': {
    cat: 'jet',
    models: ['Astra SPX','Gulfstream G100','Galaxy','Gulfstream G200','Gulfstream G280']
  },
  'Nextant Aerospace': { cat: 'jet', models: ['G90XT','604XT'] },
  'Eclipse Aerospace': { cat: 'jet', models: ['Eclipse 500','Eclipse 550'] },
  'Aerion': { cat: 'jet', models: ['AS2'] },

  /* ── HÉLICOPTÈRES ────────────────────────────────────────── */
  'Robinson': {
    cat: 'heli',
    models: ['R22 Alpha','R22 Beta','R22 Beta II','R22 Mariner',
      'R44 Astro','R44 Raven I','R44 Raven II','R44 Clipper','R44 Cadet',
      'R66','R66 Turbine']
  },
  'Bell': {
    cat: 'heli',
    models: ['47','206 JetRanger','206B JetRanger III','206L LongRanger',
      '206L-3','206L-4','212','214','222','230','407','407GX','407GXi',
      '412','412EP','412HP','429','430','505 Jet Ranger X','525 Relentless']
  },
  'Airbus Helicopters (Eurocopter)': {
    cat: 'heli',
    models: ['AS350 B2 Écureuil','AS350 B3 Écureuil','AS355 Twin Écureuil',
      'AS355F2','AS355N','AS355NP',
      'EC120 Colibri','EC130 B4','EC130 T2',
      'EC135 P2','EC135 P2+','EC135 T2','EC135 T2+','EC135 P3','EC135 T3',
      'EC145','EC145 T2','EC155','EC155 B1',
      'H125','H130','H135','H145','H145M','H155','H160','H175','H225',
      'BK117 B-2','BK117 C-1','BK117 C-2 (EC145)','BK117 D-2 (H145)']
  },
  'Leonardo (AgustaWestland)': {
    cat: 'heli',
    models: ['A109A','A109A II','A109C','A109E Power','A109K2','A109S Grand',
      'A119 Koala','AW109 Grand New','AW109 SP Grand New',
      'AW119 Koala Mk II','AW139','AW169','AW189',
      'A119','A139']
  },
  'Sikorsky': {
    cat: 'heli',
    models: ['S-58T','S-61','S-70 Black Hawk','S-76 A','S-76 B','S-76 C',
      'S-76 C++','S-76 C+','S-76 D','S-92','S-300C','S-300Cbi']
  },
  'MD Helicopters': {
    cat: 'heli',
    models: ['MD 500','MD 500C','MD 500D','MD 500E','MD 520N','MD 530F',
      'MD 600N','MD 900 Explorer','MD 902 Explorer']
  },
  'Guimbal': { cat: 'heli', models: ['Cabri G2'] },
  'Enstrom': {
    cat: 'heli',
    models: ['280 Shark','280FX','F-28A','F-28C','F-28F','480','480B']
  },
  'Schweizer': { cat: 'heli', models: ['300C','300CB','300CBi','333'] },

  /* ── ULM / ULTRALÉGERS ───────────────────────────────────── */
  'Rans': { cat: 'ulm', models: ['S-6ES','S-7','S-9 Chaos','S-12 Airaile','S-20','S-21'] },
  'Zenith': { cat: 'ulm', models: ['CH 601','CH 650','CH 750','CH 750 Cruzer','STOL CH 801'] },
  'Flight Design': {
    cat: 'ulm',
    models: ['CT2K','CTSW','CTLS','CTLS-ELA','CTLSi','F2','F4']
  },
  'Ikarus': { cat: 'ulm', models: ['C42','C42B','C42C','C42D'] },
  'AutoGyro': { cat: 'ulm', models: ['Calidus','MTOsport','MTO Sport 2017','Cavalon','Cavalon Pro'] },
  'DynAero': { cat: 'ulm', models: ['MCR-01','MCR-4S','MCR Club','MCR ULC','CR 100'] },
  'Fantasy Air': { cat: 'ulm', models: ['Cora 02','Allegro 2000','Allegro SW'] },
  'TL Ultralight': { cat: 'ulm', models: ['TL-2000 Sting','TL-3000 Sirius','TL-96 Star'] },
  'Aeroprakt': { cat: 'ulm', models: ['A-22 Fox','A-22LS','A-22L2','A-32','A-36'] },
  'P&M Aviation': { cat: 'ulm', models: ['Quik GT450','Quik R','Quik S','PulsR','Pegasus'] },
  'Kolb': { cat: 'ulm', models: ['Twinstar','Firestar','FireFly','Mark III','UltraStar'] },
  'Comco Ikarus': { cat: 'ulm', models: ['Fox','C22','C42'] },
  'Dova': { cat: 'ulm', models: ['DV-1 Skylark'] },
  'EuroFox': { cat: 'ulm', models: ['EuroFox 912','EuroFox 915'] },
  'Savannah': { cat: 'ulm', models: ['S','VG','XL','Jabiru'] },

  /* ── AVIONS DE LIGNE / RÉGIONAUX ─────────────────────────── */
  'ATR': {
    cat: 'airliner',
    models: ['ATR 42-300','ATR 42-500','ATR 42-600','ATR 42-600S',
      'ATR 72-200','ATR 72-500','ATR 72-600']
  },
  'Bombardier Q (Dash 8)': {
    cat: 'airliner',
    models: ['DHC-8-100','DHC-8-200','DHC-8-300','DHC-8-400 (Q400)',
      'Q100','Q200','Q300','Q400','Q400 NextGen']
  },
  'Embraer ERJ': {
    cat: 'airliner',
    models: ['ERJ-135','ERJ-140','ERJ-145','ERJ-145XR']
  },
  'Embraer E-Jet': {
    cat: 'airliner',
    models: ['E170','E175','E190','E190-E2','E195','E195-E2']
  },
  'Boeing': {
    cat: 'airliner',
    models: ['737-300','737-400','737-500','737-600','737-700','737-800','737-900',
      '737 MAX 7','737 MAX 8','737 MAX 9','737 MAX 10',
      '747-400','747-8','757-200','767-200','767-300','777-200','777-300',
      '777X','787-8','787-9','787-10']
  },
  'Airbus': {
    cat: 'airliner',
    models: ['A318','A319','A319neo','A320','A320neo','A321','A321neo','A321XLR',
      'A220-100','A220-300',
      'A330-200','A330-300','A330-800neo','A330-900neo',
      'A340-200','A340-300','A340-500','A340-600',
      'A350-900','A350-1000','A380-800']
  },
  'De Havilland Canada': {
    cat: 'airliner',
    models: ['DHC-1 Chipmunk','DHC-2 Beaver','DHC-3 Otter','DHC-4 Caribou',
      'DHC-6 Twin Otter','DHC-6-300','DHC-6-400',
      'DHC-7','Dash 8 Q100','Dash 8 Q200','Dash 8 Q300','Dash 8 Q400']
  },
  'Fokker': {
    cat: 'airliner',
    models: ['F27 Friendship','F28 Fellowship','F50','F70','F100']
  },
  'BAe / British Aerospace': {
    cat: 'airliner',
    models: ['ATP','Jetstream 31','Jetstream 41','BAe 146-100','BAe 146-200',
      'BAe 146-300','Avro RJ70','Avro RJ85','Avro RJ100']
  },

  /* ── MILITAIRES / CLASSIQUES (occasion) ─────────────────── */
  'North American': {
    cat: 'light',
    models: ['T-6 Texan','T-6G','T-28 Trojan','P-51 Mustang','B-25 Mitchell']
  },
  'Yakovlev': {
    cat: 'light',
    models: ['Yak-11','Yak-18T','Yak-52','Yak-55']
  },
  'Aero Vodochody': {
    cat: 'light',
    models: ['L-39 Albatros','L-39C','L-39ZA','L-159 ALCA']
  },
  'Zlin': {
    cat: 'light',
    models: ['Z-42','Z-43','Z-126','Z-226','Z-242','Z-526','Z-726']
  },

  /* ── AUTRE ────────────────────────────────────────────────── */
  'Autre / Other': {
    cat: 'light',
    models: ['Modèle personnalisé']
  }
};

/* Retourne la liste des marques triées */
function getAircraftMakes(catFilter) {
  const makes = Object.keys(AIRCRAFT_DB);
  if(!catFilter || catFilter === 'all') return makes.sort();
  return makes.filter(m => AIRCRAFT_DB[m].cat === catFilter).sort();
}

/* Retourne les modèles d'une marque */
function getAircraftModels(make) {
  return AIRCRAFT_DB[make] ? AIRCRAFT_DB[make].models : [];
}

/* Retourne la catégorie d'une marque */
function getAircraftCat(make) {
  return AIRCRAFT_DB[make] ? AIRCRAFT_DB[make].cat : 'light';
}
