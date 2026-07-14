export default function ConciergeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full -m-4 lg:-m-6 px-5 pt-2 pb-6 lg:px-8 lg:pt-3 lg:pb-8">
      {children}
    </div>
  );
}
