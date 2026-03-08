import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import { format } from "date-fns";
import { useEffect } from "react";
import { toast } from "sonner";
import { FileText, Clock, ArrowLeft, User, Calendar, Tag, Share2, Eye, ExternalLink, Sun, Moon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";
import logoIcon from "@/assets/logo-icon.png";

export default function PublicBlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const { data: post, isLoading } = useQuery({
    queryKey: ["public-blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Increment views
  const viewMutation = useMutation({
    mutationFn: async (postId: string) => {
      await supabase.from("blog_posts").update({ views: (post?.views || 0) + 1 }).eq("id", postId);
    },
  });

  useEffect(() => {
    if (post?.id) viewMutation.mutate(post.id);
  }, [post?.id]);

  // Dynamic meta tags
  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} - GroUp Academy Blog`;
    const setMeta = (prop: string, content: string, attr = "property") => {
      let el = document.querySelector(`meta[${attr}="${prop}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, prop); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    const url = `https://groupacademy.lovable.app/blog/${post.slug}`;
    setMeta("og:title", post.title);
    setMeta("og:description", post.excerpt || post.title);
    setMeta("og:url", url);
    setMeta("og:type", "article");
    if (post.featured_image) setMeta("og:image", post.featured_image);
    setMeta("twitter:title", post.title, "name");
    setMeta("twitter:description", post.excerpt || post.title, "name");
    if (post.featured_image) setMeta("twitter:image", post.featured_image, "name");
    setMeta("description", post.excerpt || post.title, "name");
  }, [post]);

  const handleShare = async () => {
    const shareUrl = post?.external_url || window.location.href;
    try {
      await navigator.share({ title: post?.title, text: post?.excerpt || "", url: shareUrl });
    } catch {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    }
  };

  const jsonLd = post ? {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: post.author_name ? { "@type": "Person", name: post.author_name } : undefined,
    image: post.featured_image || undefined,
    url: `https://groupacademy.lovable.app/blog/${post.slug}`,
    publisher: { "@type": "Organization", name: "GroUp Academy", logo: { "@type": "ImageObject", url: "https://groupacademy.lovable.app/favicon.png" } },
  } : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <img src={theme === "dark" ? logoLight : logoDark} alt="GroUp Academy" className="h-10 w-auto cursor-pointer" onClick={() => navigate("/")} />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/auth")}>Sign In</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8">
        {isLoading ? (
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-8" />
            <Skeleton className="h-64 w-full mb-6 rounded-xl" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : !post ? (
          <div className="max-w-3xl mx-auto text-center py-12">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Article Not Found</h2>
            <p className="text-muted-foreground mb-4">This article may have been removed or is not yet published.</p>
            <Button onClick={() => navigate("/blog")}><ArrowLeft className="h-4 w-4 mr-2" />Back to Blog</Button>
          </div>
        ) : (
          <article className="max-w-3xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => navigate("/blog")} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />Back to Blog
            </Button>

            <div className="flex flex-wrap gap-2 mb-3">
              {post.category && <Badge variant="outline">{post.category}</Badge>}
              {post.tags?.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="gap-1"><Tag className="h-3 w-3" />{tag}</Badge>
              ))}
              {post.external_url && <Badge className="gap-1 bg-blue-600 hover:bg-blue-700 text-white"><ExternalLink className="h-3 w-3" />External</Badge>}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mb-4">{post.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              {post.author_name && <span className="flex items-center gap-1"><User className="h-4 w-4" />{post.author_name}</span>}
              {post.published_at && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(new Date(post.published_at), "MMMM d, yyyy")}</span>}
              {post.reading_time_mins && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{post.reading_time_mins} min read</span>}
              {(post.views ?? 0) > 0 && <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{post.views} views</span>}
            </div>

            {post.featured_image && (
              <div className="rounded-xl overflow-hidden mb-6 shadow-sm border border-border/50">
                <img src={post.featured_image} alt={post.title} className="w-full h-auto object-cover max-h-[400px]" />
              </div>
            )}

            {post.excerpt && (
              <p className="text-lg text-muted-foreground mb-4 font-medium leading-relaxed border-l-4 border-primary/20 pl-4">{post.excerpt}</p>
            )}

            <Separator className="mb-6" />

            {post.external_url ? (
              <Card className="bg-muted/30 border-dashed mb-8">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <ExternalLink className="h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold text-lg">Read the full article</h3>
                  <p className="text-muted-foreground max-w-md">This article is hosted on an external site.</p>
                  <Button size="lg" className="gap-2" onClick={() => window.open(post.external_url!, "_blank", "noopener,noreferrer")}>
                    Read on External Site <ExternalLink className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="prose prose-neutral dark:prose-invert max-w-none mb-8">
                {post.content ? (
                  <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br/>") }} />
                ) : (
                  <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg">No content available.</div>
                )}
              </div>
            )}

            <Separator className="mb-6" />

            <div className="flex items-center justify-between mb-8">
              <Button variant="outline" size="sm" onClick={handleShare}><Share2 className="h-4 w-4 mr-2" />Share</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/blog")}>More Articles <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </div>

            {/* CTA */}
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-2">Want personalized career insights?</h3>
                <p className="text-sm text-muted-foreground mb-4">Sign up free to access AI career agents and 300+ courses.</p>
                <Button onClick={() => navigate("/auth?tab=signup")}>Create Free Account <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </CardContent>
            </Card>
          </article>
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
            <button onClick={() => navigate("/blog")} className="hover:text-foreground transition-colors">Blog</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
