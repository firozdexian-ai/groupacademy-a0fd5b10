import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireAnyAdminRole?: boolean; // Allows admin OR talent_exec
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  requireAnyAdminRole = false 
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState<AppRole | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error("Please sign in to access this page");
          navigate("/auth");
          return;
        }

        // Check for admin role specifically
        if (requireAdmin) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "admin")
            .maybeSingle();

          if (!roleData) {
            toast.error("Admin access required");
            navigate("/my-learning");
            return;
          }
          setUserRole("admin");
        }

        // Check for any admin-level role (admin OR talent_exec)
        if (requireAnyAdminRole) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .in("role", ["admin", "talent_exec"]);

          if (!roleData || roleData.length === 0) {
            toast.error("Dashboard access required");
            navigate("/my-learning");
            return;
          }
          
          // Set the highest role (admin takes precedence)
          const hasAdmin = roleData.some(r => r.role === "admin");
          setUserRole(hasAdmin ? "admin" : "talent_exec");
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("Auth check error:", error);
        toast.error("Authentication error");
        navigate("/auth");
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
    
    // Listen for auth state changes to handle session expiration
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, requireAdmin, requireAnyAdminRole]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Export hook for getting user role
export const useUserRole = () => {
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsLoading(false);
          return;
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .in("role", ["admin", "talent_exec"]);

        if (roleData && roleData.length > 0) {
          const hasAdmin = roleData.some(r => r.role === "admin");
          setRole(hasAdmin ? "admin" : "talent_exec");
        }
      } catch (error) {
        console.error("Error fetching role:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, []);

  return { role, isLoading };
};
