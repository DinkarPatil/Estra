import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Playfair_Display } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { NotificationProvider } from '@/contexts/notification-context';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'Estra Glimmora | AGI-Powered Real Estate Intelligence',
  description: 'Global AI-powered real estate investment platform with predictive intelligence',
  openGraph: {
    title: 'Estra Glimmora',
    description: 'Global AI-powered real estate investment platform with predictive intelligence',
    images: ['/EstraGlimmora_logo.png'],
  },
};

const FOUC_SCRIPT = `
(function(){
  try {
    var t = localStorage.getItem('glimmora-theme');
    if (t === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch(e){}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline theme-detection — runs before hydration to prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${playfair.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
