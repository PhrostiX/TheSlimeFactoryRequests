# Level Requests Database

A modern, beautiful Geometry Dash level request dashboard with frosted glass UI effects. Browse, search, and track level submissions stored in Google Sheets.

## Features

- **Search**: Find submissions by Level ID or Username
- **Latest Submissions**: View all submissions sorted by date
- **Latest Sends**: See levels marked as sent
- **Modern UI**: Frosted glass effects with gradient backgrounds
- **Responsive**: Works on all device sizes

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your Google Sheets CSV URL:

```env
PUBLIC_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/e/2PACX-1vRFdrX_IrcGXsMzWOW-Fi_i6XumIo1VyQ7dfXKIR-wJXiaqkQgfrnyRG73MxigqKd492B3WMVQVnhto/pub?gid=938415408&single=true&output=csv
```

**How to get your Google Sheets CSV URL:**

1. Open your Google Sheet
2. Go to **File** → **Share** → **Publish to web**
3. Choose **Comma-separated values (.csv)** from the dropdown
4. Click **Publish**
5. Copy the generated URL and paste it in `.env.local`

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

- `app/` - Next.js app directory with pages and API routes
- `lib/requests.ts` - CSV parsing and data fetching logic
- `app/globals.css` - Global styles with frosted glass utilities

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
