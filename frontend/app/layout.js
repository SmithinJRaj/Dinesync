import "./globals.css";

export const metadata = {
  title: "DineSync",
  description: "DineSync MVP",
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
