import './globals.css';
import QueryProvider from '@/components/QueryProvider';

export const metadata = {
  title: 'Nebula - Semantic Movie Search',
  description: 'Discover movies through AI-powered semantic search',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
