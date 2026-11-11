// 100 g başına: [ad, kcal, protein, karbonhidrat, yağ, [[porsiyon adı, gram], ...]]
// Değerler yaklaşık ortalamalardır (pişmiş/yenmeye hazır hâl).
const RAW = [
  // --- Protein kaynakları ---
  ['Tavuk göğsü (pişmiş)', 165, 31, 0, 3.6, [['porsiyon', 150]]],
  ['Tavuk but (derisiz, pişmiş)', 190, 26, 0, 9, [['porsiyon', 150]]],
  ['Hindi göğsü (pişmiş)', 135, 30, 0, 1, [['porsiyon', 150]]],
  ['Dana kıyma (az yağlı, pişmiş)', 230, 26, 0, 14, [['porsiyon', 100]]],
  ['Dana kuşbaşı (pişmiş)', 200, 28, 0, 9, [['porsiyon', 120]]],
  ['Köfte (ızgara)', 240, 20, 6, 15, [['adet', 40]]],
  ['Tavuk döner (sadece et)', 190, 22, 3, 10, [['porsiyon', 120]]],
  ['Yumurta (haşlanmış)', 155, 13, 1.1, 11, [['adet', 50]]],
  ['Yumurta (yağda)', 196, 13.6, 0.8, 15, [['adet', 55]]],
  ['Yumurta akı', 52, 11, 0.7, 0.2, [['adet', 33]]],
  ['Menemen', 110, 5.5, 4, 8, [['porsiyon', 200]]],
  ['Ton balığı (konserve, süzülmüş)', 130, 27, 0, 2.5, [['kutu', 75]]],
  ['Somon (pişmiş)', 206, 22, 0, 13, [['porsiyon', 150]]],
  ['Levrek / çipura (ızgara)', 125, 23, 0, 3.5, [['porsiyon', 180]]],
  ['Hamsi (ızgara)', 150, 21, 0, 7, [['porsiyon', 150]]],
  ['Protein tozu (whey)', 390, 78, 8, 6, [['ölçek', 30]]],
  // --- Süt ürünleri ---
  ['Yoğurt (tam yağlı)', 62, 3.5, 4.7, 3.3, [['kase', 200], ['yemek kaşığı', 20]]],
  ['Yoğurt (yarım yağlı)', 50, 4, 5, 1.5, [['kase', 200], ['yemek kaşığı', 20]]],
  ['Süzme yoğurt', 100, 9, 4, 6, [['kase', 150], ['yemek kaşığı', 30]]],
  ['Süt (yarım yağlı)', 46, 3.2, 4.7, 1.5, [['su bardağı', 200]]],
  ['Süt (tam yağlı)', 62, 3.2, 4.7, 3.3, [['su bardağı', 200]]],
  ['Ayran', 37, 1.7, 2.6, 2, [['su bardağı', 200]]],
  ['Kefir', 55, 3.3, 4.5, 2.5, [['su bardağı', 200]]],
  ['Beyaz peynir (tam yağlı)', 265, 16, 1.5, 22, [['dilim', 30]]],
  ['Beyaz peynir (yarım yağlı)', 190, 19, 2, 12, [['dilim', 30]]],
  ['Lor peyniri', 90, 13, 3, 3, [['porsiyon', 100], ['yemek kaşığı', 20]]],
  ['Çökelek', 105, 18, 3, 2, [['porsiyon', 100], ['yemek kaşığı', 20]]],
  ['Kaşar peyniri', 350, 25, 1.5, 27, [['dilim', 20]]],
  ['Cacık', 40, 2.2, 3, 2, [['kase', 200]]],
  // --- Tahıllar ---
  ['Pirinç pilavı', 150, 2.7, 29, 2.5, [['porsiyon', 150], ['yemek kaşığı', 20]]],
  ['Bulgur pilavı', 115, 3.5, 21, 2, [['porsiyon', 150], ['yemek kaşığı', 20]]],
  ['Makarna (haşlanmış)', 150, 5.5, 30, 1, [['porsiyon', 180]]],
  ['Tam buğday makarna (haşlanmış)', 140, 6, 27, 1, [['porsiyon', 180]]],
  ['Karabuğday (haşlanmış)', 92, 3.4, 20, 0.6, [['porsiyon', 150]]],
  ['Yulaf ezmesi (kuru)', 375, 13, 62, 7, [['porsiyon', 50], ['yemek kaşığı', 10]]],
  ['Beyaz ekmek', 265, 8.5, 51, 2.5, [['dilim', 25]]],
  ['Tam buğday ekmeği', 245, 10, 43, 3.5, [['dilim', 30]]],
  ['Lavaş', 290, 9, 56, 3, [['adet', 60]]],
  ['Simit', 310, 10, 55, 6, [['adet', 110]]],
  ['Patates (haşlanmış / fırın)', 85, 2, 19, 0.1, [['orta boy', 150]]],
  ['Patates kızartması', 310, 3.4, 41, 15, [['porsiyon', 120]]],
  ['Tatlı patates (fırın)', 90, 2, 20, 0.1, [['orta boy', 150]]],
  // --- Baklagiller ve çorbalar ---
  ['Kuru fasulye (yemek)', 110, 6, 14, 3, [['porsiyon', 250]]],
  ['Nohut yemeği', 120, 6, 16, 3.5, [['porsiyon', 250]]],
  ['Barbunya pilaki', 110, 5, 14, 4, [['porsiyon', 200]]],
  ['Yeşil mercimek (haşlanmış)', 115, 9, 20, 0.4, [['porsiyon', 150]]],
  ['Nohut (haşlanmış)', 165, 9, 27, 2.6, [['porsiyon', 100]]],
  ['Mercimek çorbası', 55, 3.2, 8, 1.2, [['kase', 250]]],
  ['Ezogelin çorbası', 60, 2.5, 10, 1.3, [['kase', 250]]],
  ['Tavuk suyu çorbası', 45, 3, 5, 1.5, [['kase', 250]]],
  ['Humus', 240, 8, 15, 17, [['yemek kaşığı', 20]]],
  // --- Sebzeler ---
  ['Domates', 18, 0.9, 3.9, 0.2, [['adet', 120]]],
  ['Salatalık', 15, 0.7, 3.6, 0.1, [['adet', 120]]],
  ['Marul / yeşillik', 15, 1.4, 2.9, 0.2, [['porsiyon', 100]]],
  ['Çoban salata (yağsız)', 25, 1, 5, 0.3, [['porsiyon', 200]]],
  ['Brokoli (haşlanmış)', 35, 2.4, 7, 0.4, [['porsiyon', 150]]],
  ['Ispanak (pişmiş)', 25, 3, 3.5, 0.4, [['porsiyon', 150]]],
  ['Kabak (pişmiş)', 20, 1.2, 3.5, 0.3, [['porsiyon', 150]]],
  ['Biber', 25, 1, 5, 0.3, [['adet', 60]]],
  ['Havuç', 41, 0.9, 10, 0.2, [['adet', 70]]],
  ['Soğan', 40, 1.1, 9, 0.1, [['adet', 100]]],
  ['Zeytinyağlı taze fasulye', 75, 1.8, 7, 4.5, [['porsiyon', 200]]],
  ['Etli sebze yemeği (ortalama)', 90, 5, 6, 5, [['porsiyon', 250]]],
  ['Közlenmiş / ızgara sebze', 45, 1.5, 7, 1.5, [['porsiyon', 150]]],
  // --- Meyveler ---
  ['Muz', 89, 1.1, 23, 0.3, [['adet', 120]]],
  ['Elma', 52, 0.3, 14, 0.2, [['adet', 180]]],
  ['Portakal', 47, 0.9, 12, 0.1, [['adet', 180]]],
  ['Mandalina', 53, 0.8, 13, 0.3, [['adet', 80]]],
  ['Armut', 57, 0.4, 15, 0.1, [['adet', 170]]],
  ['Çilek', 32, 0.7, 7.7, 0.3, [['porsiyon', 150]]],
  ['Üzüm', 69, 0.7, 18, 0.2, [['salkım', 150]]],
  ['Karpuz', 30, 0.6, 7.6, 0.2, [['dilim', 300]]],
  ['Kavun', 34, 0.8, 8, 0.2, [['dilim', 250]]],
  ['Kuru kayısı', 240, 3.4, 63, 0.5, [['adet', 8]]],
  ['Hurma', 280, 2.5, 75, 0.4, [['adet', 8]]],
  ['Kuru üzüm', 300, 3, 79, 0.5, [['yemek kaşığı', 12]]],
  // --- Yağlar, kuruyemiş ---
  ['Zeytinyağı', 884, 0, 0, 100, [['yemek kaşığı', 10], ['tatlı kaşığı', 5]]],
  ['Tereyağı', 717, 0.9, 0.1, 81, [['tatlı kaşığı', 5]]],
  ['Zeytin', 145, 1, 4, 15, [['adet', 4]]],
  ['Avokado', 160, 2, 9, 15, [['yarım', 70]]],
  ['Ceviz', 654, 15, 14, 65, [['tam ceviz', 8], ['avuç', 25]]],
  ['Badem', 579, 21, 22, 50, [['avuç', 25]]],
  ['Fındık', 628, 15, 17, 61, [['avuç', 25]]],
  ['Yer fıstığı', 567, 26, 16, 49, [['avuç', 25]]],
  ['Fıstık ezmesi (şekersiz)', 590, 25, 20, 50, [['yemek kaşığı', 16]]],
  ['Tahin', 595, 17, 21, 54, [['yemek kaşığı', 15]]],
  ['Pekmez', 290, 0.5, 72, 0, [['yemek kaşığı', 20]]],
  ['Bal', 304, 0.3, 82, 0, [['tatlı kaşığı', 7]]],
  // --- Dışarıda / atıştırmalık ---
  ['Tavuk dürüm', 220, 12, 24, 8, [['adet', 250]]],
  ['Lahmacun', 250, 10, 32, 9, [['adet', 120]]],
  ['Kıymalı pide', 270, 11, 33, 10, [['dilim', 60], ['porsiyon', 300]]],
  ['Bitter çikolata', 550, 7, 45, 38, [['kare', 10]]],
  ['Sütlü çikolata', 535, 7.5, 59, 30, [['kare', 10], ['paket', 60]]],
  ['Sütlaç', 125, 3.2, 22, 2.8, [['kase', 200]]],
  ['Baklava', 430, 6, 52, 22, [['dilim', 40]]],
  ['Bisküvi', 470, 7, 68, 19, [['adet', 7]]],
  ['Cips', 536, 6.5, 53, 34, [['küçük paket', 40]]],
  ['Kola / gazlı içecek', 42, 0, 10.6, 0, [['kutu', 330], ['su bardağı', 200]]],
  ['Meyve suyu', 46, 0.3, 11, 0.1, [['su bardağı', 200]]],
  ['Çay (şekersiz)', 1, 0, 0.2, 0, [['çay bardağı', 100]]],
  ['Kesme şeker', 400, 0, 100, 0, [['adet', 2.5]]],
]

export const FOODS = RAW.map(([name, kcal, p, c, f, portions]) => ({ id: 'f:' + name, name, kcal, p, c, f, portions }))

const norm = (s) =>
  s
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')

export function searchFoods(q, custom = []) {
  const all = [...custom, ...FOODS]
  const n = norm(q.trim())
  if (!n) return all
  const words = n.split(/\s+/)
  return all
    .filter((f) => words.every((w) => norm(f.name).includes(w)))
    .sort((a, b) => norm(a.name).indexOf(words[0]) - norm(b.name).indexOf(words[0]))
}
export const foodByName = (name) => FOODS.find((f) => f.name === name)
export const macrosFor = (food, grams) => {
  const k = grams / 100
  return { kcal: food.kcal * k, p: food.p * k, c: food.c * k, f: food.f * k }
}

export const MEALS = [
  ['kahvalti', 'Kahvaltı'],
  ['ogle', 'Öğle'],
  ['aksam', 'Akşam'],
  ['ara', 'Ara öğün'],
]

// Hazır gün planları: [besin adı, gram]. Uygulama hedef kaloriye göre gramları ölçekler.
export const MEAL_PLANS = [
  {
    name: 'Klasik ev yemeği günü',
    note: 'Antrenman günleri için ideal: öğlen karbonhidrat ağırlıklı.',
    meals: {
      kahvalti: [['Yumurta (haşlanmış)', 150], ['Beyaz peynir (yarım yağlı)', 30], ['Tam buğday ekmeği', 60], ['Domates', 120], ['Salatalık', 120], ['Zeytin', 20]],
      ogle: [['Tavuk göğsü (pişmiş)', 180], ['Bulgur pilavı', 200], ['Yoğurt (yarım yağlı)', 200], ['Çoban salata (yağsız)', 200], ['Zeytinyağı', 10]],
      ara: [['Protein tozu (whey)', 30], ['Süt (yarım yağlı)', 200], ['Muz', 120], ['Yulaf ezmesi (kuru)', 40]],
      aksam: [['Kuru fasulye (yemek)', 250], ['Pirinç pilavı', 120], ['Cacık', 200], ['Marul / yeşillik', 100]],
    },
  },
  {
    name: 'Kıymalı & yulaflı gün',
    note: 'Yulaf kahvaltısı uzun süre tok tutar; akşam hafif.',
    meals: {
      kahvalti: [['Yulaf ezmesi (kuru)', 60], ['Süt (yarım yağlı)', 250], ['Protein tozu (whey)', 30], ['Muz', 120], ['Ceviz', 15]],
      ogle: [['Dana kıyma (az yağlı, pişmiş)', 130], ['Makarna (haşlanmış)', 220], ['Yoğurt (yarım yağlı)', 200], ['Çoban salata (yağsız)', 200]],
      ara: [['Süzme yoğurt', 150], ['Elma', 180], ['Badem', 20]],
      aksam: [['Ton balığı (konserve, süzülmüş)', 150], ['Tam buğday ekmeği', 60], ['Marul / yeşillik', 150], ['Domates', 120], ['Zeytinyağı', 10], ['Mercimek çorbası', 250]],
    },
  },
  {
    name: 'Balık & baklagil günü',
    note: 'Haftada 1-2 kez balık: omega-3 toparlanmaya yardımcı olur.',
    meals: {
      kahvalti: [['Menemen', 250], ['Lor peyniri', 100], ['Tam buğday ekmeği', 60], ['Salatalık', 120]],
      ogle: [['Nohut yemeği', 250], ['Bulgur pilavı', 150], ['Tavuk göğsü (pişmiş)', 120], ['Ayran', 200]],
      ara: [['Protein tozu (whey)', 30], ['Süt (yarım yağlı)', 200], ['Hurma', 24]],
      aksam: [['Levrek / çipura (ızgara)', 220], ['Patates (haşlanmış / fırın)', 250], ['Marul / yeşillik', 150], ['Zeytinyağı', 10], ['Yoğurt (yarım yağlı)', 150]],
    },
  },
  {
    name: 'Hafif dinlenme günü',
    note: 'Antrenmansız günlerde karbonhidrat biraz daha düşük, protein aynı.',
    meals: {
      kahvalti: [['Yumurta (haşlanmış)', 150], ['Çökelek', 80], ['Tam buğday ekmeği', 30], ['Domates', 120], ['Biber', 60], ['Zeytin', 20]],
      ogle: [['Köfte (ızgara)', 160], ['Közlenmiş / ızgara sebze', 200], ['Bulgur pilavı', 150], ['Cacık', 200]],
      ara: [['Süzme yoğurt', 200], ['Çilek', 150], ['Fındık', 20]],
      aksam: [['Tavuk but (derisiz, pişmiş)', 180], ['Etli sebze yemeği (ortalama)', 250], ['Yoğurt (yarım yağlı)', 200], ['Tam buğday ekmeği', 30]],
    },
  },
]
