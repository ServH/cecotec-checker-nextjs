import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cecotec Endpoint Checker',
  description: 'Herramienta para verificar categorías y productos Cecotec',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}