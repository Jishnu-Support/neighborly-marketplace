export const vehicleTypeOptions = ["Two wheeler", "Three wheeler", "Four wheeler", "Multi wheel / commercial"] as const;

export const vehicleMakesByType: Record<string, string[]> = {
  "Two wheeler": ["TVS", "Hero", "Honda", "Bajaj", "Royal Enfield", "Suzuki", "Yamaha", "KTM", "Jawa", "Yezdi", "Triumph", "BMW Motorrad", "Kawasaki", "Ducati", "Aprilia", "Vespa", "Ather Energy", "Ola Electric", "Revolt Motors", "Ampere", "Ultraviolette", "Simple Energy", "Other / not listed"],
  "Three wheeler": ["Bajaj", "TVS", "Mahindra", "Piaggio", "Atul Auto", "Force Motors", "Euler Motors", "Omega Seiki", "Kinetic Green", "YC Electric", "Lohia Auto", "Other / not listed"],
  "Four wheeler": ["Maruti Suzuki", "Tata Motors", "Mahindra", "Hyundai", "Toyota", "Kia", "Honda", "Renault", "Volkswagen", "Skoda", "MG Motor", "Nissan", "Jeep", "Mercedes-Benz", "BMW", "Audi", "Volvo", "BYD", "Citroën", "Force Motors", "Other / not listed"],
  "Multi wheel / commercial": ["Tata Motors", "Ashok Leyland", "Eicher", "Mahindra", "BharatBenz", "Force Motors", "Isuzu", "SML Isuzu", "Volvo", "Scania", "Other / not listed"],
};

export const vehicleModelsByTypeAndMake: Record<string, Record<string, string[]>> = {
  "Two wheeler": {
    TVS: ["Jupiter", "Ntorq 125", "Apache RTR 160", "Apache RTR 200", "Raider", "Sport", "Radeon", "iQube"],
    Hero: ["Splendor Plus", "HF Deluxe", "Glamour", "Passion Plus", "Xtreme 125R", "Xtreme 160R", "Pleasure Plus", "Destini", "Vida V1"],
    Honda: ["Activa", "Dio", "Shine 125", "SP 125", "Unicorn", "Hornet 2.0", "CB350"],
    Bajaj: ["Pulsar 125", "Pulsar NS200", "Platina", "Dominar 400", "Chetak"],
    "Royal Enfield": ["Classic 350", "Hunter 350", "Bullet 350", "Meteor 350", "Himalayan", "Interceptor 650", "Continental GT 650"],
    Suzuki: ["Access 125", "Burgman Street", "Avenis", "Gixxer", "V-Strom SX"],
    Yamaha: ["FZ-S", "R15", "MT-15", "Fascino 125", "RayZR 125", "Aerox 155"],
    KTM: ["Duke 200", "Duke 250", "Duke 390", "RC 390", "Adventure 390"],
    Jawa: ["42", "Perak", "350"], Yezdi: ["Roadster", "Adventure", "Scrambler"],
    Triumph: ["Speed 400", "Scrambler 400 X", "Speed T4"],
    "BMW Motorrad": ["G 310 R", "G 310 GS", "F 900 GS", "R 1300 GS"],
    Kawasaki: ["Ninja 300", "Ninja 500", "Z650", "Versys 650"],
    Ducati: ["Monster", "Scrambler Icon", "Multistrada V4"],
    Aprilia: ["SR 160", "RS 457", "Tuono 457"], Vespa: ["VXL 150", "SXL 150", "ZX 125"],
    "Ather Energy": ["Rizta", "450X"], "Ola Electric": ["S1 X", "S1 Pro"],
    "Revolt Motors": ["RV1", "RV400"], Ampere: ["Nexus", "Magnus Neo"],
    Ultraviolette: ["F77 Mach 2", "F77 SuperStreet"], "Simple Energy": ["Simple One", "Simple OneS"],
  },
  "Three wheeler": {
    Bajaj: ["RE", "Maxima Z", "Maxima X Wide", "Maxima C", "Riki P4005", "Riki C4005"],
    TVS: ["King Deluxe", "King Kargo HD EV"],
    Mahindra: ["Treo", "Treo Plus", "Treo Yaari", "e-Alfa Plus", "Zor Grand", "UDO"],
    Piaggio: ["Ape City", "Ape Xtra", "Ape E-City", "Ape Xtra Bada"],
    "Atul Auto": ["Gemini", "Elite Plus"],
    "Force Motors": ["Citylife", "Urbania"],
    "Euler Motors": ["HiLoad EV", "Storm EV"],
    "Omega Seiki": ["Rage+", "Stream City Qik"],
    "Kinetic Green": ["Safar Smart", "Safar Shakti"],
    "YC Electric": ["E-Rickshaw", "E-Loader"],
    "Lohia Auto": ["Humsafar", "Narain DX"],
  },
  "Four wheeler": {
    "Maruti Suzuki": ["Swift", "Baleno", "WagonR", "Brezza", "Dzire", "Ertiga", "Fronx", "Grand Vitara", "Alto K10"],
    "Tata Motors": ["Punch", "Nexon", "Tiago", "Altroz", "Harrier", "Safari", "Curvv"],
    Mahindra: ["Thar", "Scorpio-N", "XUV 3XO", "XUV700", "Bolero"],
    Hyundai: ["i20", "Venue", "Creta", "Exter", "Verna", "Aura", "Alcazar"],
    Toyota: ["Innova Crysta", "Innova Hycross", "Fortuner", "Glanza", "Urban Cruiser Hyryder", "Rumion"],
    Kia: ["Sonet", "Seltos", "Carens", "Carnival"],
    Honda: ["City", "Amaze", "Elevate"], Renault: ["Kwid", "Triber", "Kiger"],
    Volkswagen: ["Taigun", "Virtus", "Tiguan"], Skoda: ["Kushaq", "Slavia", "Kodiaq"],
    "MG Motor": ["Comet EV", "Windsor EV", "Astor", "Hector", "ZS EV"],
    Nissan: ["Magnite", "X-Trail"], Jeep: ["Compass", "Meridian", "Wrangler"],
    "Mercedes-Benz": ["A-Class Limousine", "C-Class", "E-Class", "GLC"],
    BMW: ["2 Series Gran Coupe", "3 Series", "X1", "X5"], Audi: ["A4", "Q3", "Q5"],
    Volvo: ["XC40", "XC60", "EX30"], BYD: ["Atto 3", "eMAX 7", "Seal"],
    Citroën: ["C3", "C3 Aircross", "Basalt"],
    "Force Motors": ["Gurkha", "Trax Cruiser"],
  },
  "Multi wheel / commercial": {
    "Tata Motors": ["Ace", "Intra", "Yodha", "Prima", "Signa", "Ultra", "LPT", "Starbus", "Cityride"],
    "Ashok Leyland": ["Dost", "Bada Dost", "Partner", "BOSS", "AVTR", "Viking", "Oyster", "Cheetah"],
    Eicher: ["Pro 2049", "Pro 3015", "Pro 6016", "Skyline Pro"],
    Mahindra: ["Jeeto", "Zeo", "Furio 7", "Furio 11", "Blazo X 28"],
    BharatBenz: ["1217R", "1617R", "1923C", "2823C", "3528C"],
    "Force Motors": ["Traveller", "Urbania", "Trax Cruiser"],
    Isuzu: ["D-MAX", "S-CAB", "S-CAB Z", "V-Cross", "Hi-Lander"],
    "SML Isuzu": ["Samrat", "Sartaj", "Prestige", "Executive LX"],
    Volvo: ["FM", "FMX", "FH", "9400"], Scania: ["P-series", "G-series", "R-series"],
  },
};

export const commercialVehicleSubcategories: Record<string, Record<string, string[]>> = {
  Trucks: {
    "Tata Motors": ["Ace", "Intra", "Yodha", "Prima", "Signa", "Ultra", "LPT"],
    "Ashok Leyland": ["Dost", "Bada Dost", "Partner", "BOSS", "AVTR"],
    Eicher: ["Pro 2049", "Pro 3015", "Pro 6016"], Mahindra: ["Jeeto", "Zeo", "Furio 7", "Furio 11", "Blazo X 28"],
    BharatBenz: ["1217R", "1617R", "1923C", "2823C", "3528C"], Isuzu: ["D-MAX", "S-CAB", "S-CAB Z"],
    "SML Isuzu": ["Samrat", "Sartaj", "Prestige"], Volvo: ["FM", "FMX", "FH"], Scania: ["P-series", "G-series", "R-series"],
  },
  Buses: {
    "Tata Motors": ["Starbus", "Starbus Prime", "Cityride", "Ultra Bus", "Magna"],
    "Ashok Leyland": ["Viking", "Oyster", "Cheetah", "Sunshine"], Eicher: ["Skyline Pro", "Starline"],
    "Force Motors": ["Traveller", "Urbania"], Volvo: ["9400", "9600"], Scania: ["F-series", "K-series"],
  },
  Cranes: { "ACE": ["F150", "F200", "F250", "Hydra 12", "Hydra 14"], "Escorts Kubota": ["Hydra 10", "Hydra 14", "Hydra 16"], SANY: ["STC250", "STC500", "SAC1300"], XCMG: ["QY25K", "QY50K", "XCA1600"] },
  "Earth movers": {
    JCB: ["3DX", "3DX Xtra", "4DX", "30Plus", "140X", "210LC", "437"],
    "Tata Hitachi": ["Shinrai", "EX 70", "EX 130", "EX 210"], Komatsu: ["PC71", "PC130", "PC210", "D85"],
    Caterpillar: ["320", "323", "426", "950"], "CASE Construction": ["770 NX", "851 EX", "1107 EX"],
  },
  Tractors: {
    Mahindra: ["OJA 2121", "OJA 2124", "JIVO 245 DI", "575 DI XP Plus", "YUVO TECH+ 585 DI", "ARJUN 555 DI"],
    Swaraj: ["744 FE", "855 FE", "963 FE"], Sonalika: ["DI 745 III", "DI 750 III", "Tiger DI 55"],
    "Massey Ferguson": ["1035 DI", "241 DI Dynatrack", "246 Dynatrack"],
    "John Deere": ["5050 D", "5310", "5405"], "New Holland": ["3630 TX", "5620 TX", "Excel 4710"],
    Eicher: ["380", "485", "557"], Kubota: ["MU4501", "MU5502", "L4508"],
  },
  "Road construction equipment": {
    JCB: ["VMT 330", "VMT 860"], Caterpillar: ["120 GC", "CS11 GC", "AP500"],
    Ammann: ["ARX 26", "ARX 90", "ABG 2820"], CASE: ["845B", "1107 EX"],
  },
  "Mining equipment": {
    JCB: ["455 ZX", "JS 370 LC"], Komatsu: ["PC2000", "HD785"],
    Caterpillar: ["320", "352", "777"], BEML: ["BH205E", "BD155"],
  },
  "Special-purpose vehicles": {
    "Tata Motors": ["Winger Ambulance", "Starbus Firex", "Signa RMC"],
    "Force Motors": ["Traveller Ambulance", "Traveller School Bus"],
  },
};

export function getVehicleModelsForType(vehicleType: string, make: string) {
  return vehicleModelsByTypeAndMake[vehicleType]?.[make] || [];
}

export function buildAutomobileTaxonomyPaths() {
  return ["Sales", "Service"].flatMap((activity) => Object.entries(vehicleMakesByType).flatMap(([vehicleType, makes]) => {
    if (vehicleType !== "Multi wheel / commercial") {
      return makes.flatMap((make) => {
        const models = getVehicleModelsForType(vehicleType, make);
        return models.length ? models.map((model) => [activity, vehicleType, make, model]) : [[activity, vehicleType, make]];
      });
    }
    return Object.entries(commercialVehicleSubcategories).flatMap(([subCategory, companies]) =>
      Object.entries(companies).flatMap(([make, models]) => models.map((model) => [activity, vehicleType, subCategory, make, model]))
    );
  }));
}
