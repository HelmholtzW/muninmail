
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google'; // Correct import for Geist font objects
import './globals.css';
import { MuninMailAppLayout } from '@/components/layout/munin-mail-app-layout';
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/toaster";


const geistSans = Geist({ // Use the font object directly
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({ // Use the font object directly
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MuninMail',
  description: 'A clean and focused email experience by MuninMail.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MuninMailAppLayout>
            {children}
          </MuninMailAppLayout>
          {/* Toaster is already included with MuninMailAppLayout, so no need to add it again here if it's part of that layout */}
        </ThemeProvider>
      </body>
    </html>
  );
}
