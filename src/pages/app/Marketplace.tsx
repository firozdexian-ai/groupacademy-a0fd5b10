import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MARKETPLACE_SCHOOLS, MARKETPLACE_SCHOOL_MAP } from "@/lib/constants/marketplaceCategories";
import { Search, Briefcase, Clock, Coins, Filter, ChevronRight, Sparkles } from "lucide-react";
import { format } from "date-fns";

export default function Marketplace() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: gigs, isLoading } = useQuery({
    queryKey: ["marketplace-gigs", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("marketplace_gigs")
        .select("*")
        .in("status", ["approved", "active"])
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (selectedCategory) {
        query = query.eq("skill_category", selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filtered = gigs?.filter(
    (g: any) =>
      !search ||
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" /> Gig Marketplace
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find freelance projects aligned with your skills
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search gigs..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <Button
          variant={!selectedCategory ? "default" : "outline"}
          size="sm"
          className="shrink-0"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Button>
        {MARKETPLACE_SCHOOLS.map((school) => (
          <Button
            key={school.value}
            variant={selectedCategory === school.value ? "default" : "outline"}
            size="sm"
            className="shrink-0"
            onClick={() => setSelectedCategory(school.value)}
          >
            {school.label}
          </Button>
        ))}
      </div>

      {/* Gigs list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : !filtered?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No gigs available yet</p>
          <p className="text-sm mt-1">Check back soon for new projects!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((gig: any) => (
            <Card
              key={gig.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/app/marketplace/${gig.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {gig.is_featured && (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 text-[10px]">
                          <Sparkles className="h-3 w-3 mr-0.5" /> Featured
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {MARKETPLACE_SCHOOL_MAP[gig.skill_category]?.label || gig.skill_category}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {gig.pricing_type === "fixed" ? "Fixed Price" : "Open to Bids"}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-1">{gig.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {gig.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {gig.budget_amount && (
                        <span className="flex items-center gap-1">
                          <Coins className="h-3 w-3 text-amber-500" />
                          {gig.budget_amount} credits
                        </span>
                      )}
                      {gig.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(gig.deadline), "MMM d")}
                        </span>
                      )}
                      <span>{gig.total_bids} bid{gig.total_bids !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
