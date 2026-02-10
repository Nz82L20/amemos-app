import PWARegister from "./pwa-register";

export const metadata = {
  title: "Amemos - Italia ODV",
  description: "Amemos - inserimento vendite",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#111111" />

        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Amemos" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>

      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, Arial, sans-serif",
          background: "#111",
          color: "#fff",
        }}
      >
        {/* registra il Service Worker per PWA */}
        <PWARegister />

        {children}
      </body>
    </html>
  );
}

