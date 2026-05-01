import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Clock, ArrowLeft, Search, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL_WIDE, PAGE_TITLE, PAGE_SUBTITLE, CARD, META_TEXT } from "@/lib/uiTokens";

const CATEGORIES = ["All", "Career Tips", "Industry Insights", "Skills Development", "Job Search", "Interview Prep"];

export default function Blog() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts", selectedCategory, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false });
      if (selectedCategory !== "All") query = query.eq("category", selectedCategory);
      if (searchTerm) query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className={PAGE_SHELL_WIDE}>
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/learning")} className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className={PAGE_TITLE}>Insights</h1>
        </div>
        <p className={PAGE_SUBTITLE}>Career tips, industry insights, and interview prep.</p>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search articles…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-9 text-sm rounded-xl"
        />
      </div>

      {/* Categories — wrap, no scroll */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "h-8 px-3 rounded-lg text-xs font-medium border transition-colors",
              selectedCategory === category
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/40 bg-background hover:border-border",
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-2">
          {posts.map((post) => (
            <Card
              key={post.id}
              className={cn(CARD, "cursor-pointer hover:border-primary/40 transition-colors overflow-hidden")}
              onClick={() => navigate(`/app/learning/blog/${post.slug}`)}
            >
              <div className="flex">
                {post.featured_image && (
                  <div className="w-24 h-24 shrink-0 overflow-hidden">
                    <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 p-3 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold line-clamp-2">{post.title}</h3>
                    {post.is_featured && <Badge variant="outline" className="text-[10px] shrink-0">Featured</Badge>}
                  </div>
                  {post.excerpt && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {post.category && (
                      <Badge variant="outline" className="text-[10px]">{post.category}</Badge>
                    )}
                    {post.published_at && (
                      <span className={cn(META_TEXT, "flex items-center gap-1")}>
                        <Calendar className="h-3 w-3" /> {format(new Date(post.published_at), "MMM d")}
                      </span>
                    )}
                    <span className={cn(META_TEXT, "flex items-center gap-1")}>
                      <Clock className="h-3 w-3" /> {post.reading_time_mins || 3}m
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No articles match"
          description="Try a different search or category."
          action={{ label: "Clear filters", onClick: () => { setSearchTerm(""); setSelectedCategory("All"); } }}
        />
      )}
    </div>
  );
}
