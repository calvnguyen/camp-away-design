import type { Metadata } from 'next';
import '../src/styles/index.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Camp Away',
  description: 'Design your affordable, SUV-towable tiny trailer rental.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
