import './globals.css';
import QueryProvider from '@/components/QueryProvider';
import GlobalHeader from '@/components/GlobalHeader';

export const metadata = {
  title: 'Nebula - Semantic Movie Search',
  description: 'Discover movies through AI-powered semantic search',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <QueryProvider>
          <GlobalHeader />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
