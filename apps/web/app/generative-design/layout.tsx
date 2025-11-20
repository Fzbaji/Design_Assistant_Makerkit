import { ReactNode } from 'react';

export default function GenerativeDesignLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen">
      {children}
    </div>
  );
}
