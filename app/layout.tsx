export const metadata = {
  title: "Amemos",
  description: "Gestione vendite Amemos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, Arial, sans-serif",
          background: "#111",
          color: "#fff",
        }}
      >
        {children}
      </body>
    </html>
  );
}
