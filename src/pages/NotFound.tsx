import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, ShieldAlert } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Strategic Logging: Track broken entry points for SEO/UX audit
    console.error("404 Not Found:", location.pathname);
  }, [location.pathname]);

  return (
    <div role="main" className="flex min-h-screen items-center justify-center bg-background selection:bg-primary/10 relative overflow-hidden">
      {/* Executive Ambient Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.03)_0%,transparent_70%)] pointer-events-none" />

      <div className="text-center space-y-8 relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-8xl font-black tracking-tighter text-foreground/20">404</h1>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-widest">Page Not Found</h2>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-tighter">
              The page at{" "}
              <code className="text-primary bg-primary/5 px-1.5 py-0.5 rounded font-mono italic">
                {location.pathname}
              </code>{" "}
              doesn't exist or may have moved.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest border-border/40"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>

          <Button
            asChild
            className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
          >
            <Link to="/" replace>
              <Home className="mr-2 h-4 w-4" /> Go to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

