# Köşe — Dövüş & Beslenme Takibi

Boks, kickboks ve MMA antrenmanlarını, beslenmeyi (kalori/makro), vücut ölçülerini ve uykuyu takip eden,
telefona kurulabilen web uygulaması (PWA). Veriler önce cihazda saklanır, isteğe bağlı olarak Supabase ile eşitlenir.

## Geliştirme

```bash
npm install
npm run dev
```

## Yayınlama (GitHub Pages)

`main` dalına her gönderimde `.github/workflows/deploy.yml` uygulamayı derleyip yayınlar.
Depoda bir kez: Settings › Pages › Source: **GitHub Actions**.

## Bulut eşitleme (Supabase)

1. supabase.com'da ücretsiz proje aç.
2. SQL Editor'de `supabase.sql` dosyasının içeriğini çalıştır.
3. Uygulamada Ayarlar › Bulut eşitleme: Project URL ve anon public key'i gir, hesap oluştur.

## iPhone'a kurulum

Safari'de uygulamanın adresini aç › Paylaş › **Ana Ekrana Ekle**.
