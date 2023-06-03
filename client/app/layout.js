import './globals.css';

export const metadata = {
  title: 'Superfluid Devmode Dashboard',
  description: 'Superfluid Devmode Dashboard for local development',
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
