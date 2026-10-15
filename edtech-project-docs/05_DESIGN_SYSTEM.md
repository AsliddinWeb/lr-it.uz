# Dizayn tizimi (Design System)

> Maqsad: sotib olinadigan **premium admin-panel shablonlari** darajasidagi (masalan, Untitled UI, Tremor, Metronic) ko'rinish va his-tuyg'u. Oddiy, "default Tailwind" ko'rinishdan qat'iyan qochish kerak.

## 1. Brend
- Loyiha nomi: **EdTech**
- Logotip: minimal monogram (masalan, qavariq kvadrat ichida "E" harfi yoki oddiy geometrik belgi) — emoji yoki stok-ikonka emas, maxsus chizilgan SVG.

## 2. Rang tizimi — Light va Dark rejim

### Light rejim
| Token | Hex | Vazifa |
|---|---|---|
| `bg` | `#F8F9FC` | Asosiy fon |
| `surface` | `#FFFFFF` | Kartalar |
| `surface-2` | `#F1F2F8` | Ichki bloklar (masalan, jadval boshi) |
| `border` | `#E6E8F0` | Chiziqlar |
| `text-primary` | `#131522` | Asosiy matn |
| `text-muted` | `#6B7085` | Ikkinchi darajali matn |
| `primary` | `#4338CA` | Asosiy aksent (indigo, to'yingan) |
| `primary-soft` | `#EEF0FD` | Aksent fon (badge, ikon foni) |
| `success` | `#0E9F6E` | Tasdiqlangan, faol holatlar |
| `warning` | `#D97706` | Kutilayotgan holatlar |
| `danger` | `#DC2626` | Rad etilgan, xato |
| `accent` | `#E8590C` | Ikkinchi aksent (gamifikatsiya, CTA) |

### Dark rejim
| Token | Hex | Vazifa |
|---|---|---|
| `bg` | `#0B0D14` | Asosiy fon |
| `surface` | `#12141F` | Kartalar |
| `surface-2` | `#1A1D2B` | Ichki bloklar |
| `border` | `#242838` | Chiziqlar |
| `text-primary` | `#F1F2F8` | Asosiy matn |
| `text-muted` | `#8A8FA3` | Ikkinchi darajali matn |
| `primary` | `#6366F1` | Aksent (dark fonga moslashtirilgan, yorqinroq) |
| `primary-soft` | `#1E1F3A` | Aksent fon |
| `success` / `warning` / `danger` / `accent` | mos ravishda yorqinlashtirilgan variantlar | Kontrastni saqlash uchun |

Rejim almashinuvi `next-themes` orqali, `<html class="dark">` strategiyasi bilan. Har bir foydalanuvchi tanlovi `localStorage`da saqlanadi va profil dropdownida (Quyosh/Oy ikonlari, Lucide `Sun`/`Moon`) almashtiriladi.

## 3. Tipografiya
- **Display/sarlavha shrift**: `Sora` (700–800 og'irlik) — sarlavhalarda xarakter beradi.
- **Matn shrifti**: `Inter` (400–600) — o'qilishi oson, dashboardlarda ma'lumot zichligi yuqori bo'lgani uchun neytral shrift kerak.
- **Raqamli ma'lumot shrifti**: `Inter` tabular-nums variantida — statistik raqamlar, jadval ustunlari tekis turishi uchun.
- Sarlavha o'lchamlari: H1 `36–44px`, H2 `28px`, H3 `20px`, body `14–15px`, caption `12px`.

## 4. Ikonlar — qat'iy qoida
- **Faqat Lucide Icons** ishlatiladi (chiziq uslubi, `stroke-width: 1.75`).
- **Emoji hech qanday holatda ishlatilmaydi** — na matnda, na komponentlarda, na bildirishnomalarda.
- Har bir ikon o'z rangdor fonli "chip" ichida beriladi (masalan, `bg-primary-soft` fonda `text-primary` ikon) — statistik kartalar, feature bloklari, sidebar ikonkalarida izchil qo'llaniladi.

## 5. Komponent tizimi (shadcn/ui asosida, to'liq qayta stillangan)

### Sidebar (ochiladigan-yopiladigan)
- Kengaytirilgan holat: `264px`, ikon + matn.
- Yig'ilgan (collapsed) holat: `72px`, faqat ikon, hover'da tooltip.
- Holat almashinuvi animatsiyali (`transition: width 200ms ease`), Zustand orqali saqlanadi.
- Faol bo'lim — chap tomonda ingichka vertikal chiziq (`primary` rang) + fon `primary-soft`.
- Pastda: foydalanuvchi kartasi (avatar, ism, rol) — bosilganda profil dropdown ochiladi.

### Topbar
- Chap tomonda: sahifa sarlavhasi + breadcrumb.
- O'rtada/o'ngda: **global qidiruv** (`Cmd/Ctrl+K` bilan ochiladigan command-palette uslubida, natijalar kategoriyalarga bo'lingan: kurslar, o'quvchilar, so'rovlar).
- O'ngda: bildirishnoma qo'ng'irog'i (badge bilan), tungi/kunduzgi almashtirgich, profil dropdown (avatar → ism/rol, "Profil", "Sozlamalar", ajratuvchi chiziq, "Chiqish").

### Statistik kartalar (stat cards)
- Har birida: ikon-chip, katta raqam (`Sora`, bold), label, va **trend indikatori** (yashil/qizil o'q + foiz, masalan `+12% shu oyda`).
- Kartalar orasidagi bo'shliq katta emas, lekin har biri o'z ichida "nafas oladigan" padding (`24–28px`) bilan.

### Grafik/chart kartalar
- Recharts asosida: chiziqli grafik (foydalanuvchilar o'sishi), ustunli grafik (haftalik faollik), donut/radial grafik (kurs tugatish foizi, XP progressi — oddiy progress-bar o'rniga **radial progress ring** ishlatiladi, bu "premium" tuyg'u beradi).
- Grafik ranglari — `primary`/`accent`/`success` tokenlaridan, gridlar juda ingichka va xira (`border` rangida, 30% opacity).

### Jadval (data table)
- Sticky sarlavha, qatorlar hover'da `surface-2` fon oladi.
- Har qatorda status **badge** (rangli, quyuq emas — `soft` fon + to'q matn: masalan `bg-success/10 text-success`).
- Jadval ustida: qidiruv maydoni, filter dropdown, ustun ko'rsatish/yashirish tugmasi.

### Bento-grid tartib
- Dashboard bosh sahifalarida statistik kartalar, grafiklar va ro'yxatlar **teng bo'lmagan o'lchamdagi grid** (bento-style) ichida joylashtiriladi — bu shablon "3 ustunli teng kartalar" ko'rinishidan farq qiladi va o'ziga xoslik beradi.

### Kartalar (umumiy)
- `rounded-2xl`, ingichka `border`, juda yumshoq soya (`shadow-sm`, hover'da `shadow-md`).
- Fon rangda **hech qachon** to'q gradient yoki qattiq soya ishlatilmaydi — premium his aynan intizomli minimalizmdan keladi.

## 6. Signature elementlar (loyihaga xos, generic emas)
- **Radial XP progress ring** — har bir kurs kartasi va student dashboardida, oddiy chiziqli progress-bar o'rniga.
- **Command-palette qidiruv** (`Cmd+K`) — barcha dashboardlarda bir xil, tez ishlaydigan global qidiruv tajribasi.
- **So'rov oqimi vizualizatsiyasi** — Author/Admin panelda so'rov holatlari (`kutilmoqda → tasdiqlangan/rad etilgan`) kichik status-timeline sifatida ko'rsatiladi, oddiy jadval qatoridan farqli.
- **Sertifikat kartasi** — chizilgan dashed ramka, QR-kod va unikal raqam bilan, jamoat sahifasida ham, dashboardda ham bir xil vizual tilda.

## 7. Motion (animatsiya)
- Sahifa o'tishlarida yengil fade/slide (150–200ms).
- Sidebar kengayish/yig'ilish — animatsiyali.
- Statistik raqamlar sahifa yuklanganda `0`dan haqiqiy qiymatgacha animatsiyali hisoblanadi (count-up effekti).
- `prefers-reduced-motion` hurmat qilinadi — bunday holatda barcha animatsiyalar o'chiriladi.

## 8. Responsivlik
- Breakpointlar: mobil (`<640px`), planshet (`640–1024px`), desktop (`>1024px`).
- Mobilda sidebar to'liq yashirinadi, tepada hamburger orqali overlay sifatida ochiladi.
- Statistik kartalar mobilda 1 ustun, planshetda 2, desktopda 4 ustunga tushadi.
- Jadvallar mobilda gorizontal skroll yoki karta ko'rinishiga o'tadi.

## 9. Nima ishlatilmaydi
- Emoji (hech qachon, hech qayerda).
- Tayyor shablonlarga xos generik ranglar (masalan, standart Tailwind `indigo-600`/`gray-500` to'g'ridan-to'g'ri — token orqali ishlatiladi, hardcode qilinmaydi).
- Qattiq/to'q gradient fonlar, ortiqcha soya effektlari.
- Standart chiziqli progress-bar (statistik ko'rsatkichlar uchun radial ring ishlatiladi).
