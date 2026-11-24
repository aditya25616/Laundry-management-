import "./globals.css";

export const metadata = {
  title: "Hostel Laundry Management",
  description: "Hostel Laundry Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}