import './globals.css';
import { Inter, Roboto } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-roboto', display: 'swap' });

export const metadata = {
  title: 'Collaborative Editor',
  description: 'Real-time collaborative document editor',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${roboto.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}