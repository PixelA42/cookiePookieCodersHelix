import "./globals.css";

export const metadata = {
  title: "HeatREco",
  description: "Industrial heat waste recovery optimizer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
