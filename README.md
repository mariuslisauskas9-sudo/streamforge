# StreamForge

Kūrėjų ir streamerių valdymo platforma.

## Tech stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Shadcn/ui** komponentai (Radix UI)
- **Supabase** (auth + duomenų bazė)
- **FullCalendar**

## Pradžia

### 1. Klonavimas ir priklausomybių diegimas

```bash
npm install
```

### 2. Supabase projekto sukūrimas

1. Sukurkite projektą [supabase.com](https://supabase.com)
2. Eikite į **SQL Editor** ir vykdykite `schema.sql` failą
3. Nukopijuokite projekto URL ir anon raktą

### 3. Aplinkos kintamieji

```bash
cp .env.local.example .env.local
```

Užpildykite `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Administratoriaus paskyros sukūrimas

Supabase Authentication skirtuke sukurkite vartotoją ir nustatykite jo rolę `admin` tiesiai `profiles` lentelėje:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'jusu@email.com';
```

### 5. Paleidimas

```bash
npm run dev
```

Atverkite [http://localhost:3000](http://localhost:3000)

## Puslapiai

| Puslapis | Aprašymas | Rolė |
|---|---|---|
| `/login` | Prisijungimo forma | Visi |
| `/admin` | Administracinis pultas su statistika | Admin |
| `/admin/clients` | Klientų ir kandidatų tinklelis | Admin |
| `/admin/clients/[id]` | Pilnas kliento profilis | Admin |
| `/admin/calendar` | Visų klientų renginių kalendorius | Admin |
| `/client` | Kliento pultas | Klientas |
| `/client/calendar` | Asmeninis kalendorius | Klientas |
| `/client/profile` | Profilio redagavimas | Klientas |

## Duomenų bazės struktūra

- `profiles` — vartotojų profiliai (admin/client rolės)
- `platform_links` — socialinių tinklų nuorodos
- `events` — renginiai / transliacijos
- `candidates` — potencialūs klientai
- `admin_notes` — administratoriaus pastabos apie klientus

## Rolių sistema

- **admin** — visapusis prieiga prie visų duomenų ir puslapių
- **client** — mato tik savo duomenis
- Apsauga: `proxy.ts` (Next.js 16 middleware) + layout lygio tikrinimas
