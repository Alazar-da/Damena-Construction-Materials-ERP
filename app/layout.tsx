import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DAMENA ERP - የግንባታ እቃዎች እና የስራ ቦታ አስተዳደር',
  description: 'የሲሚንቶ ክምችት፣ የኮንክሪት ብሎክ ምርት እና የደንበኛ አገልግሎት አስተዳደር።',
  other: {
    google: 'notranslate',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="am" translate="no" className="notranslate">
      <head>
        <meta name="google" content="notranslate" />
        <meta httpEquiv="Content-Language" content="am" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-sky-500 selection:text-white notranslate" translate="no">
        {children}
      </body>
    </html>
  );
}
