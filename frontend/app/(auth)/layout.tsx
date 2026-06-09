export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">FitStudio Pro</h1>
          <p className="mt-1 text-sm text-foreground/60">Manage your training studio</p>
        </div>
        {children}
      </div>
    </div>
  );
}
