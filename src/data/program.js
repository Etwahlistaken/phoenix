// 24 haftalık kuvvet & kondisyon programı. Ekipman: dambıl, bench, sağlık topu,
// direnç lastiği, kum torbası.
export const PHASES = [
  { from: 1, to: 4, name: 'Alışma', sets: '2-3', reps: '12-15', rest: '60 sn', desc: 'Hareketleri öğren, eklemleri ve bağ dokusunu hazırla. Her sette 3-4 tekrar daha yapabilecekken bırak.' },
  { from: 5, to: 12, name: 'Kas gelişimi', sets: '3-4', reps: '8-12', rest: '75-90 sn', desc: 'Ağırlığı artır. Son 2 tekrar zorlayıcı olmalı ama form bozulmamalı.' },
  { from: 13, to: 24, name: 'Güç & patlayıcılık', sets: '4', reps: '6-10', rest: '90-120 sn', desc: 'Daha ağır yükler, hareketin itiş kısmını patlayıcı yap. Sağlık topu atışlarında maksimum hız.' },
]
export const phaseFor = (week) => PHASES.find((p) => week >= p.from && week <= p.to) || PHASES[PHASES.length - 1]

export const EXERCISES = {
  goblet: { name: 'Goblet squat', how: 'Dambılı göğsünde tut, ayaklar omuz genişliğinde. Kalçanı geriye-aşağı indir, dizler ayak ucu yönünde, topuklar yerde. Göğüs dik.', tip: 'Dambıl hafif kalırsa inişi 3 saniyeye yay.' },
  dbbench: { name: 'Dambıl bench press', how: 'Bench\'e uzan, kürek kemiklerini sıkıştır. Dambılları göğüs hizasına indir, dirsekler gövdeyle ~45°. Yukarı it.', tip: 'Yumruk gücünün temeli: itişi hızlı, inişi kontrollü yap.' },
  row: { name: 'Tek kol dambıl row', how: 'Bir el ve diz bench\'te, sırt düz. Dambılı kalçana doğru çek, dirsek gövdeye yakın. Tepe noktada 1 sn sık.', tip: 'Sırt kasları yumruğu geri çeker ve omzu korur.' },
  rdl: { name: 'Dambıl Romanian deadlift', how: 'Dambıllar önde, dizler hafif bükük. Kalçanı geriye iterek dambılları bacak boyunca indir, sırt dümdüz. Arka bacakta gerilme hissedince kalçayla kalk.', tip: 'Bel yuvarlanıyorsa daha az in.' },
  ohp: { name: 'Dambıl omuz press', how: 'Ayakta, karın sıkı. Dambılları omuz hizasından başın üstüne it, beli kavislendirme.', tip: 'Gard tutma dayanıklılığını artırır.' },
  plank: { name: 'Plank', how: 'Dirsekler omuz altında, vücut tek çizgi. Karnı ve kalçayı sık. Süre tut.', tip: 'Tekrar yerine saniye yaz (ör. 40).', timed: true },
  slam: { name: 'Sağlık topu slam', how: 'Topu başının üstüne kaldır, tüm vücudunla yere çarp. Çömelerek al, tekrarla.', tip: 'Her tekrar maksimum hız — bu bir güç egzersizi.' },
  split: { name: 'Bulgarian split squat', how: 'Arka ayak bench\'te, ön ayak ileride. Dik gövdeyle aşağı in, ön diz ayak ucunu çok geçmesin. Ön topukla it.', tip: 'Denge zor geliyorsa önce normal lunge yap.' },
  pushup: { name: 'Şınav', how: 'Eller omuzdan biraz geniş, vücut düz çizgi. Göğüs yere yaklaşana dek in, it.', tip: 'Zor gelirse elleri bench\'e koy; kolay gelirse ayakları yükselt.' },
  bandrow: { name: 'Direnç lastiği row', how: 'Lastiği sabit bir yere bağla. Dirsekleri geriye çek, kürek kemiklerini birleştir, yavaşça bırak.', tip: 'Omuz sağlığı için haftada en az 2 kez çekiş hareketi.' },
  hipthrust: { name: 'Hip thrust', how: 'Sırtın üst kısmı bench\'te, dambıl kasıkta. Kalçanı yukarı it, tepe noktada kalçayı sık. Çene göğse yakın.', tip: 'Tekme ve takedown gücü kalçadan gelir.' },
  twist: { name: 'Sağlık topu Russian twist', how: 'Otur, gövde hafif geride, ayaklar yerde ya da havada. Topu sağa-sola döndür; omuzlar da dönsün.', tip: 'Kroşe ve tekmedeki dönme gücünü geliştirir.' },
  carry: { name: 'Farmer carry (dambıl taşıma)', how: 'İki elde ağır dambıl, dik yürü. Omuzlar geride, karın sıkı.', tip: 'Metre ya da saniye yaz. Kavrama gücü clinch ve güreşte altın değerinde.', timed: true },
  pullapart: { name: 'Lastik pull-apart', how: 'Lastiği göğüs hizasında tut, kolları düz açarak göğsüne değdir. Yavaş dön.', tip: 'Yumruk atan omuzlar öne yuvarlanır; bu hareket dengeler.' },
  chestpass: { name: 'Sağlık topu göğüs pası (duvara)', how: 'Dövüş duruşunda, topu göğüsten duvara patlayıcı it. Yakala, tekrarla.', tip: 'Direkt yumruğun güç versiyonu.' },
}

export const WORKOUTS = {
  kuvvetA: {
    title: 'Kuvvet A — İtiş & bacak',
    warmup: '5 dk ip atlama veya hafif koşu + omuz/kalça çevirme + 10 vücut ağırlığı squat',
    list: ['goblet', 'dbbench', 'row', 'rdl', 'ohp', 'slam', 'plank'],
    finisher: null,
  },
  kuvvetB: {
    title: 'Kuvvet B — Tek bacak, çekiş & kondisyon',
    warmup: '5 dk gölge boksu + dinamik esneme + 10 şınav',
    list: ['split', 'pushup', 'bandrow', 'hipthrust', 'chestpass', 'twist', 'carry', 'pullapart'],
    finisher: 'Kondisyon bitirişi: kum torbasında 2 dk çalış / 1 dk dinlen. 1-4. hafta: 4 raunt, 5-12. hafta: 6 raunt, 13+. hafta: 8 raunt (3 dk / 1 dk).',
  },
}

export const DAY_NOTES = {
  boks: 'Ders günü. Dersten 2-3 saat önce karbonhidratlı bir öğün ye, yanına su al. Dersten sonra "Öğren" bölümünden çalışılan tekniği puanla.',
  kickboks: 'Ders günü. Kalça ve hamstring esnekliği için dersten sonra 5-10 dk esneme ekle.',
  mma: 'Ders günü. Yer çalışması boyun ve kalçayı zorlar; ısınmayı atlama, tırnaklarını kısa tut.',
  kondisyon: '30 dk: 5 dk ısınma, ardından 8 × (30 sn tempolu / 90 sn hafif) koşu, ip veya torba. 5 dk soğuma.',
  torba: '5 dk ısınma + 6 × 2 dk torba (1 dk dinlenme). Her rauntta tek bir tekniğe odaklan: jab, 1-2, low kick…',
  kosu: 'Konuşabilecek tempoda 25-35 dk. Kondisyonun temeli bu hafif tempolu koşulardır.',
  ip: '10 × 1 dk ip / 30 sn dinlenme. Ayak oyununa ve baldır dayanıklılığına çok iyi gelir.',
  yuruyus: '30-45 dk tempolu yürüyüş. Toparlanmayı hızlandırır, yağ yakımına katkı sağlar.',
  mobilite: '15-20 dk: kalça açıcılar, hamstring, omuz ve göğüs esnetme. Derin nefes.',
  dinlenme: 'Tam dinlenme. Kas dinlenirken büyür: proteinini tamamla, 8 saat uyu, istersen 20-30 dk yürü.',
}

export const TIPS = [
  'Yeni başlayan için en büyük avantaj: ilk 6 ayda kas kazanırken yağ yakmak mümkün. Proteinini ve uykunu aksatma.',
  'Tartıdaki sayı yanıltabilir. Bel çevresi ve aynadaki görüntü gelişimi daha iyi gösterir.',
  'Derse aç gitme: 2-3 saat önce karbonhidrat + protein, dersten sonra 1-2 saat içinde proteinli bir öğün.',
  'Teknik her zaman güçten önce gelir. Yavaş ve doğru tekrar, hızlı ve yanlış tekrardan değerlidir.',
  'Günde 2,5-3,5 litre su. Antrenmanda kaybettiğin her kilo için 1,5 litre su iç.',
  'Uyku en güçlü toparlanma aracıdır. Her gün aynı saatte yatmak, süreden bile önemlidir.',
  'İlk haftalarda kas ağrısı normaldir; eklem ağrısı değildir. Keskin ağrıda dur.',
  'Gard yukarıda, çene aşağıda. Yorulduğunda ilk düşen eller olur — ona dikkat et.',
  'Sparringde amaç kazanmak değil, öğrenmektir. %50 güç, %100 dikkat.',
  'Nefesini tutma. Her yumrukta kısa ve keskin nefes ver.',
  'Atıştırmalıkları yasaklama, değiştir: cips yerine kuruyemiş + meyve, çikolata yerine süzme yoğurt + bal.',
  'Bir günü kaçırmak sorun değil. İki gün üst üste kaçırmamaya bak.',
  'Her hafta bir önceki haftadan sadece biraz daha iyi ol: 1 tekrar, 1 kg ya da 1 raunt fazla.',
  'Ayak oyunu her şeydir. İp atlamak ve gölge boksu evde yapılabilecek en iyi yatırım.',
]
