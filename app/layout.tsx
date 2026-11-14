import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title:'Damena Construction Materials ERP', description:'Construction-material provider ERP' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="am"><body>{children}</body></html>; }
