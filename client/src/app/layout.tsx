import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/Providers";

export const metadata = {
  title: "JobAI - Your AI-powered Job Application Assistant",
  description: "Streamline your job applications with AI-powered assistance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
