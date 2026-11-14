import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DAMENA ERP - የግንባታ እቃዎች እና የስራ ቦታ አስተዳደር',
  description: 'የሲሚንቶ ክምችት፣ የኮንክሪት ብሎክ ምርት እና የደንበኛ አገልግሎት አስተዳደር።',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="am">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
