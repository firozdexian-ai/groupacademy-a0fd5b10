import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Share2,
  Linkedin,
  Facebook,
  MessageCircle,
  Send,
  CheckCircle2,
  Link as LinkIcon,
  Copy,
  Check,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Content {
  id: string;
  title: string;
  content_type: string;
  current_enrollment: number;
  is_published: boolean;
  description?: string;
}

interface ShareLog {
  channel: string;
  shared_at: string;
}

export function ContentOutreachManager() {
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareLogs, setShareLogs] = useState<ShareLog[]>([]);
  const [activeTab, setActiveTab] = useState("linkedin");
  const [customChannel, setCustomChannel] = useState("");

  // Load published content
  const loadContents = useCallback(async () => {
    const { data, error } = await supabase
      .from("content")
      .select("id, title, content_type, current_enrollment, is_published, description")
      .eq("is_published", true)
      .in("content_type", ["recorded_course", "batch_class", "live_webinar"])
      .order("title");

    if (error) {
      console.error("Error loading content:", error);
      return;
    }

    setContents(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  // Load share logs when content is selected
  useEffect(() => {
    if (selectedContent && isShareOpen) {
      loadShareLogs();
    }
  }, [selectedContent, isShareOpen]);

  const loadShareLogs = async () => {
    if (!selectedContent) return;
    const { data } = await supabase
      .from("content_share_logs")
      .select("channel, shared_at")
      .eq("content_id", selectedContent.id);
    setShareLogs(data || []);
  };

  const isShared = (channel: string) => shareLogs.some((log) => log.channel === channel);

  const recordShare = async (channel: string) => {
    if (!selectedContent) return;
    try {
      const { error } = await supabase.from("content_share_logs").insert({
        content_id: selectedContent.id,
        channel: channel,
        shared_at: new Date().toISOString(),
      });
      if (!error) {
        setShareLogs((prev) => [...prev, { channel, shared_at: new Date().toISOString() }]);
        toast.success(`Marked as shared on ${channel}`);
      }
    } catch (err) {
      console.error("Failed to log share", err);
    }
  };

  const contentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      recorded_course: "Course",
      batch_class: "Batch",
      live_webinar: "Webinar",
    };
    return labels[type] || type;
  };

  // --- Share Logic ---
  const getShareLink = (source: string) => {
    if (!selectedContent) return "";
    // Note: Adjust the URL structure if your routes differ
    const typeSlug = selectedContent.content_type === "live_webinar" ? "events" : "courses";
    // Using ID for simplicity, but if you have slugs, use them
    return `${window.location.origin}/app/learning/${typeSlug}/${selectedContent.id}?source=${source}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const copyLink = async (source: string) => {
    const link = getShareLink(source);
    await copyToClipboard(link);
    toast.success(`Link for ${source} copied!`);
    if (source !== "linkedin" && source !== "facebook" && source !== "whatsapp") {
      recordShare(source);
    }
  };

  const handleSocialShare = (platform: "linkedin" | "facebook" | "whatsapp" | "telegram") => {
    if (!selectedContent) return;
    const link = getShareLink(platform);
    recordShare(platform);

    let url = "";
    switch (platform) {
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(`Check out this course: ${selectedContent.title}\n${link}`)}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(selectedContent.title)}`;
        break;
    }
    window.open(url, "_blank", "width=600,height=600");
  };

  const templates = selectedContent
    ? {
        english:
          `🚀 Learning Opportunity: ${selectedContent.title}\n\n` +
          `📚 Type: ${contentTypeLabel(selectedContent.content_type)}\n` +
          `🔥 Trending: ${selectedContent.current_enrollment} students enrolled\n\n` +
          `${selectedContent.description?.slice(0, 100)}...\n\n` +
          `Upskill yourself today! Join here: ${getShareLink(activeTab)}\n\n` +
          `#learning #upskill #career #education`,

        bangla:
          `📢 নতুন কোর্স এলার্ট: ${selectedContent.title}\n\n` +
          `📚 ধরণ: ${contentTypeLabel(selectedContent.content_type)}\n` +
          `🔥 জনপ্রিয়তা: ${selectedContent.current_enrollment} জন শিক্ষার্থী\n\n` +
          `আপনার স্কিল ডেভেলপমেন্ট শুরু করুন আজই!\n\n` +
          `🔗 জয়েন লিংক: ${getShareLink(activeTab)}\n\n` +
          `#career #learning #bdjobs`,
      }
    : { english: "", bangla: "" };

  const copyTemplate = async (text: string) => {
    await copyToClipboard(text);
    toast.success("Caption copied!");
  };

  if (isLoading && contents.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Content Outreach
          </CardTitle>
          <CardDescription>
            Promote your courses and webinars across social channels to boost enrollments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Content to Promote</label>
            <Select
              value={selectedContent?.id || ""}
              onValueChange={(value) => {
                const content = contents.find((c) => c.id === value);
                setSelectedContent(content || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a course or webinar..." />
              </SelectTrigger>
              <SelectContent>
                {contents.map((content) => (
                  <SelectItem key={content.id} value={content.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {contentTypeLabel(content.content_type)}
                      </Badge>
                      <span>{content.title}</span>
                      <span className="text-muted-foreground text-xs">({content.current_enrollment} enrolled)</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedContent && (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30 animate-in fade-in-50">
              <div>
                <h3 className="font-medium">{selectedContent.title}</h3>
                <p className="text-sm text-muted-foreground">Ready to share across channels</p>
              </div>
              <Button onClick={() => setIsShareOpen(true)} className="gap-2">
                <Share2 className="w-4 h-4" /> Promote Content
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Promote: {selectedContent?.title}</DialogTitle>
            <DialogDescription>Share this content to increase enrollments. Track progress below.</DialogDescription>
          </DialogHeader>

          <div className="flex gap-6 mt-4">
            {/* Left Sidebar: Checklist */}
            <div className="w-1/3 border-r pr-6 space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Checklist</h4>
              <div className="space-y-2">
                {[
                  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-600" },
                  { id: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-500" },
                  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-green-500" },
                  { id: "telegram", label: "Telegram", icon: Send, color: "text-sky-500" },
                ].map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setActiveTab(channel.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all ${
                      activeTab === channel.id ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <channel.icon className={`w-4 h-4 ${channel.color}`} />
                      <span>{channel.label}</span>
                    </div>
                    {isShared(channel.id) && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  </button>
                ))}

                <div className="pt-2 mt-2 border-t">
                  <button
                    onClick={() => setActiveTab("custom")}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all ${
                      activeTab === "custom" ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <LinkIcon className="w-4 h-4 text-gray-500" />
                      <span>Custom Link</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side: Action Area */}
            <div className="flex-1 space-y-6">
              {activeTab === "linkedin" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 border border-blue-100">
                    <p className="font-semibold mb-1">LinkedIn Strategy</p>
                    Post on your feed and in professional learning groups. Use English.
                  </div>
                  <div>
                    <Label className="mb-2 block">Post Template (English)</Label>
                    <Textarea value={templates.english} readOnly rows={6} className="text-xs bg-muted/30" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyTemplate(templates.english)}
                      className="mt-2 w-full"
                    >
                      <Copy className="w-3 h-3 mr-2" /> Copy Caption
                    </Button>
                  </div>
                  <Button
                    className="w-full bg-[#0077b5] hover:bg-[#006396]"
                    onClick={() => handleSocialShare("linkedin")}
                  >
                    <Linkedin className="w-4 h-4 mr-2" /> Share on LinkedIn
                  </Button>
                </div>
              )}

              {activeTab === "facebook" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 border border-blue-100">
                    <p className="font-semibold mb-1">Facebook Strategy</p>
                    Share in student groups and education pages using Bangla.
                  </div>
                  <div>
                    <Label className="mb-2 block">Post Template (Bangla)</Label>
                    <Textarea value={templates.bangla} readOnly rows={6} className="text-xs bg-muted/30" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyTemplate(templates.bangla)}
                      className="mt-2 w-full"
                    >
                      <Copy className="w-3 h-3 mr-2" /> Copy Caption
                    </Button>
                  </div>
                  <Button
                    className="w-full bg-[#1877F2] hover:bg-[#166fe5]"
                    onClick={() => handleSocialShare("facebook")}
                  >
                    <Facebook className="w-4 h-4 mr-2" /> Share on Facebook
                  </Button>
                </div>
              )}

              {(activeTab === "whatsapp" || activeTab === "telegram") && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="bg-green-50 p-3 rounded-md text-sm text-green-800 border border-green-100">
                    <p className="font-semibold mb-1">Direct Messaging</p>
                    Share in student community channels.
                  </div>
                  <Button
                    className={`w-full ${activeTab === "whatsapp" ? "bg-[#25D366] hover:bg-[#20bd5a]" : "bg-[#0088cc] hover:bg-[#0077b5]"}`}
                    onClick={() => handleSocialShare(activeTab as any)}
                  >
                    {activeTab === "whatsapp" ? (
                      <MessageCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Share on {activeTab === "whatsapp" ? "WhatsApp" : "Telegram"}
                  </Button>
                </div>
              )}

              {activeTab === "custom" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="space-y-2">
                    <Label>Channel Name</Label>
                    <Input
                      placeholder="e.g., email_newsletter"
                      value={customChannel}
                      onChange={(e) => setCustomChannel(e.target.value)}
                    />
                  </div>
                  <div className="pt-2">
                    <Label className="mb-2 block">Generated Tracking Link</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={getShareLink(customChannel || "custom")} className="bg-muted" />
                      <Button onClick={() => copyLink(customChannel || "custom")}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full mt-4"
                    onClick={() => {
                      recordShare(customChannel || "custom");
                      toast.success("Marked as shared!");
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" /> Mark as Done Manually
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
