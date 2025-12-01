import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Mail, Phone, ArrowLeft, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Instructor {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  profile_image_url: string | null;
  expertise: string[] | null;
  team_role: string;
  status: string;
  hourly_rate: number | null;
}

const Instructors = () => {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [filteredInstructors, setFilteredInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);

  useEffect(() => {
    checkAuth();
    loadInstructors();
  }, []);

  useEffect(() => {
    filterInstructors();
  }, [instructors, searchQuery, roleFilter, statusFilter]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    setIsAdmin(roles?.role === "admin");
  };

  const loadInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInstructors(data || []);
    } catch (error: any) {
      toast.error("Failed to load instructors");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterInstructors = () => {
    let filtered = instructors;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (instructor) =>
          instructor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          instructor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          instructor.expertise?.some((exp) => exp.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((instructor) => instructor.team_role === roleFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((instructor) => instructor.status === statusFilter);
    }

    setFilteredInstructors(filtered);
  };

  const handleDelete = async () => {
    if (!selectedInstructor) return;

    try {
      const { error } = await supabase
        .from("instructors")
        .delete()
        .eq("id", selectedInstructor.id);

      if (error) throw error;

      toast.success("Instructor deleted successfully");
      setInstructors(instructors.filter((i) => i.id !== selectedInstructor.id));
      setDeleteDialogOpen(false);
      setSelectedInstructor(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete instructor");
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      instructor: "bg-blue-100 text-blue-700",
      speaker: "bg-purple-100 text-purple-700",
      teaching_assistant: "bg-green-100 text-green-700",
      coordinator: "bg-orange-100 text-orange-700",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      inactive: "bg-gray-100 text-gray-700",
      on_leave: "bg-yellow-100 text-yellow-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const formatRole = (role: string) => {
    return role.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading instructors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/dashboard")} size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold">Team & Instructors</h1>
                <p className="text-sm text-muted-foreground">Manage your teaching team</p>
              </div>
            </div>
            {isAdmin && (
              <Button onClick={() => navigate("/instructors/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Add Instructor
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, email, or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="instructor">Instructor</SelectItem>
              <SelectItem value="speaker">Speaker</SelectItem>
              <SelectItem value="teaching_assistant">Teaching Assistant</SelectItem>
              <SelectItem value="coordinator">Coordinator</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Instructors Grid */}
        {filteredInstructors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                  ? "No instructors found matching your filters"
                  : "No instructors yet"}
              </p>
              {isAdmin && (
                <Button onClick={() => navigate("/instructors/new")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Instructor
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstructors.map((instructor) => (
              <Card key={instructor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={instructor.profile_image_url || undefined} />
                      <AvatarFallback className="text-lg">
                        {instructor.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1 truncate">{instructor.full_name}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getRoleColor(instructor.team_role)} variant="secondary">
                          {formatRole(instructor.team_role)}
                        </Badge>
                        <Badge className={getStatusColor(instructor.status)} variant="secondary">
                          {instructor.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {instructor.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{instructor.bio}</p>
                  )}

                  {instructor.expertise && instructor.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {instructor.expertise.slice(0, 3).map((exp, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {exp}
                        </Badge>
                      ))}
                      {instructor.expertise.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{instructor.expertise.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{instructor.email}</span>
                    </div>
                    {instructor.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{instructor.phone}</span>
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/instructors/${instructor.id}/edit`)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedInstructor(instructor);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Instructor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedInstructor?.full_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Instructors;
