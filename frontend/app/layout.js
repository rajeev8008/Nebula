import './globals.css';

export const metadata = {
  title: 'Nebula - Semantic Movie Search',
  description: 'Discover movies through AI-powered semantic search',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
