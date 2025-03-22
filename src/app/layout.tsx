import './globals.css';

export const metadata = {
  title: 'Collaborative Editor',
  description: 'Real-time collaborative document editor',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}