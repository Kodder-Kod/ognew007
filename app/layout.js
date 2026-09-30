import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./componets/footer/page";

export const metadata = {
  title: "Point of Sale",
  description: "Created by Chisend",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
      >

        {children}
   
      </body>
    </html>
  );
}
