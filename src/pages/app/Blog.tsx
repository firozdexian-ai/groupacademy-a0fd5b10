import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Clock, ArrowLeft, Search, User, Calendar, ArrowRight, Zap, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Strategic Insights Node
 * High-fidelity editorial registry for industry telemetry and career logic.
 * 2026 Standard: Executive Logic typography with kinetic filter sequences.
 */

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

  const featuredPost = posts?.find((p) => p.is_featured);
  const regularPosts = posts?.filter((p) => !p.is_featured) || [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 pb-40 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Navigation Handshake */}
      <header className="flex flex-col gap-10">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app/learning")}
            className="group rounded-xl h-11 pl-3 pr-5 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary/5 -ml-3"
          >
            <ArrowLeft className="w-4 h-4 mr-3 transition-transform group-hover:-translate-x-1" />
            Back to Registry
          </Button>

          <Badge
            variant="outline"
            className="rounded-lg border-primary/20 text-primary font-black uppercase text-[9px] tracking-widest italic"
          >
            Editorial v2.6
          </Badge>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-[20px] bg-primary/10 flex items-center justify-center border border-primary/20">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">
                  Strategic Insights
                </h1>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] mt-2 italic">
                  Career Intelligence Registry
                </p>
              </div>
            </div>
          </div>

          {/* Search Console */}
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Query insights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 bg-card/50 backdrop-blur-sm border-2 border-border/40 rounded-2xl font-bold tracking-tight focus-visible:ring-primary/10 transition-all shadow-inner"
            />
          </div>
        </div>
      </header>

      {/* Kinetic Filter Protocol */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
        {CATEGORIES.map((category) => (
          <Button
            key={category}
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "shrink-0 rounded-xl px-6 h-10 font-black uppercase text-[10px] tracking-widest transition-all",
              selectedCategory === category
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-muted/50 text-muted-foreground/60 hover:bg-muted",
            )}
          >
            {category}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-10">
          <Skeleton className="h-[400px] w-full rounded-[40px] bg-muted/40" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-[32px] bg-muted/40" />
            ))}
          </div>
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-12">
          {/* Featured Post: Primary Node */}
          {featuredPost && (
            <Card
              className="group overflow-hidden rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl hover:border-primary/40 transition-all duration-500 cursor-pointer shadow-2xl"
              onClick={() => navigate(`/app/learning/blog/${featuredPost.slug}`)}
            >
              <div className="md:flex items-stretch min-h-[400px]">
                {featuredPost.featured_image && (
                  <div className="md:w-1/2 relative overflow-hidden">
                    <img
                      src={featuredPost.featured_image}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                  </div>
                )}
                <div
                  className={cn(
                    "p-10 flex flex-col justify-center",
                    featuredPost.featured_image ? "md:w-1/2" : "w-full",
                  )}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest px-3 py-1">
                      <Zap className="h-3 w-3 mr-1.5 fill-current" /> Featured Logic
                    </Badge>
                    {featuredPost.category && (
                      <Badge
                        variant="outline"
                        className="border-border/60 text-[9px] font-black uppercase tracking-widest px-3 py-1"
                      >
                        {featuredPost.category}
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-[0.95] mb-4 group-hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h2>
                  {featuredPost.excerpt && (
                    <p className="text-lg text-muted-foreground font-medium leading-relaxed italic line-clamp-3 mb-8">
                      {featuredPost.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                    {featuredPost.published_at && (
                      <span className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(featuredPost.published_at), "MMM d, yyyy")}
                      </span>
                    )}
                    <span className="flex items-center gap-2 text-primary">
                      <Clock className="h-3.5 w-3.5" />
                      {featuredPost.reading_time_mins || 5} Min Read
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Regular Posts Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {regularPosts.map((post) => (
              <Card
                key={post.id}
                className="group rounded-[32px] border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/40 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
                onClick={() => navigate(`/app/learning/blog/${post.slug}`)}
              >
                {post.featured_image && (
                  <div className="h-52 overflow-hidden relative">
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  </div>
                )}
                <div className="p-8 flex-1 flex flex-col">
                  {post.category && (
                    <Badge
                      variant="secondary"
                      className="mb-4 w-fit bg-primary/5 text-primary border-none text-[8px] font-black uppercase tracking-widest"
                    >
                      {post.category}
                    </Badge>
                  )}
                  <h3 className="text-xl font-black uppercase tracking-tighter italic leading-none mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground/80 font-medium leading-relaxed line-clamp-2 mb-6">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-border/40">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                      {format(new Date(post.published_at || Date.now()), "MMM d")} • {post.reading_time_mins || 3} min
                    </span>
                    <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="rounded-[40px] border-2 border-dashed border-border/40 bg-muted/5 py-24 text-center animate-in zoom-in-95 duration-700">
          <div className="h-20 w-20 rounded-[32px] bg-muted/10 flex items-center justify-center mx-auto mb-8 border border-border/40 rotate-3">
            <Target className="h-10 w-10 text-muted-foreground/20" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Insights Registry Empty</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic mb-10 max-w-xs mx-auto leading-relaxed">
            No editorial artifacts match this logic sequence. Adjust parameters or wait for next telemetry sync.
          </p>
          <Button
            variant="outline"
            className="rounded-xl px-10 h-12 font-black uppercase tracking-widest text-[10px] border-2"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("All");
            }}
          >
            Clear Logic Protocol
          </Button>
        </Card>
      )}
    </div>
  );
}
