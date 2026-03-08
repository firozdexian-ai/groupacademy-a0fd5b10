import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import { format } from "date-fns";
import { FileText, Clock, Search, User, Calendar, ArrowRight, Sun, Moon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";
import logoIcon from "@/assets/logo-icon.png";

const CATEGORIES = ["All", "Career Tips", "Industry Insights", "Skills Development", "Job Search", "Interview Prep"];

export default function PublicBlog() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    document.title = "Career Blog - GroUp Academy | Articles & Career Tips";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Expert career advice, industry insights, and professional development tips from GroUp Academy.");
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["public-blog-posts", selectedCategory, searchTerm],
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

  const featuredPost = posts.find((p) => p.is_featured);
  const regularPosts = posts.filter((p) => !p.is_featured);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "GroUp Academy Career Blog",
    description: "Expert career advice, industry insights, and professional development tips.",
    url: "https://groupacademy.lovable.app/blog",
    publisher: { "@type": "Organization", name: "GroUp Academy" },
    blogPost: posts.slice(0, 10).map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.excerpt,
      datePublished: p.published_at,
      author: p.author_name ? { "@type": "Person", name: p.author_name } : undefined,
      image: p.featured_image || undefined,
      url: `https://groupacademy.lovable.app/blog/${p.slug}`,
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <img
            src={theme === "dark" ? logoLight : logoDark}
            alt="GroUp Academy"
            className="h-10 w-auto cursor-pointer"
            onClick={() => navigate("/")}
          />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/auth")}>Sign In</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-hero py-12 md:py-16 text-center">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-3">Career Blog</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Expert articles, tutorials, and career tips to help you grow professionally.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-6 py-8 flex-1">
        {/* Search & Categories */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search articles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2 overflow-x-auto flex-nowrap pb-1">
            {CATEGORIES.map((cat) => (
              <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" className="shrink-0" onClick={() => setSelectedCategory(cat)}>
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-6">
            {/* Featured */}
            {featuredPost && (
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/blog/${featuredPost.slug}`)}>
                <div className="md:flex">
                  {featuredPost.featured_image && (
                    <div className="md:w-2/5 h-48 md:h-auto">
                      <img src={featuredPost.featured_image} alt={featuredPost.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className={`p-6 ${featuredPost.featured_image ? "md:w-3/5" : "w-full"}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-primary/10 text-primary">Featured</Badge>
                      {featuredPost.category && <Badge variant="outline">{featuredPost.category}</Badge>}
                    </div>
                    <h2 className="text-xl font-bold mb-2">{featuredPost.title}</h2>
                    {featuredPost.excerpt && <p className="text-muted-foreground mb-4 line-clamp-2">{featuredPost.excerpt}</p>}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {featuredPost.author_name && <span className="flex items-center gap-1"><User className="h-4 w-4" />{featuredPost.author_name}</span>}
                      {featuredPost.published_at && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(new Date(featuredPost.published_at), "MMM d, yyyy")}</span>}
                      {featuredPost.reading_time_mins && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{featuredPost.reading_time_mins} min read</span>}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Grid */}
            {regularPosts.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {regularPosts.map((post) => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/blog/${post.slug}`)}>
                    {post.featured_image && (
                      <div className="h-40 overflow-hidden">
                        <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <CardContent className={post.featured_image ? "pt-4" : "pt-6"}>
                      {post.category && <Badge variant="outline" className="mb-2">{post.category}</Badge>}
                      <h3 className="font-semibold mb-2 line-clamp-2">{post.title}</h3>
                      {post.excerpt && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.excerpt}</p>}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {post.published_at && <span>{format(new Date(post.published_at), "MMM d")}</span>}
                          {post.reading_time_mins && <span>• {post.reading_time_mins} min</span>}
                        </div>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Articles Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== "All" ? "Try adjusting your filters." : "Blog posts will be published soon."}
              </p>
              {(searchTerm || selectedCategory !== "All") && (
                <Button variant="outline" onClick={() => { setSearchTerm(""); setSelectedCategory("All"); }}>Clear Filters</Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="GroUp" className="w-8 h-8" />
            <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} GroUp Academy</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Home</button>
            <button onClick={() => navigate("/courses")} className="hover:text-foreground transition-colors">Courses</button>
            <button onClick={() => navigate("/career-services")} className="hover:text-foreground transition-colors">Services</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
