import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Bot,
  Rocket,
  Coins,
  Sparkles,
  Loader2,
  Plug,
  Send,
  MessageCircle,
  MessagesSquare,
  Globe,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

type Template = {
  id: string;
  template_key: string;
  name: string;
  description: string | null;
  base_message_credit_cost: number | null;
  default_model: string | null;
  capabilities: string[] | null;
  is_active: boolean | null;
};

type Company = { id: string; name: string };

type Credential = {
  id: string;
  instance_id: string;
  channel_provider: string;
  is_active: boolean | null;
};

type HiredInstance = {
  id: string;
  template_id: string;
  tenant_id: string;
  name_override: string | null;
  cluster_geo_id: string | null;
  status: string | null;
  created_at: string;
  workforce_master_templates: { name: string; template_key: string } | null;
  companies: { name: string } | null;
  workforce_instance_credentials: Credential[] | null;
};

const CHANNEL_META: Record<string, { label: string; icon: typeof Send }> = {
  telegram: { label: "Telegram", icon: Send },
  whatsapp: { label: "WhatsApp", icon: MessageCircle },
  messenger: { label: "Messenger", icon: MessagesSquare },
  web: { label: "Web", icon: Globe },
};

export default function WorkforceFleet() {
  const [deployTarget, setDeployTarget] = useState<Template | null>(null);
  const [channelTarget, setChannelTarget] = useState<HiredInstance | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["workforce-master-templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("workforce_master_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Template[];
    },
  });

  const { data: instances, isLoading: instancesLoading } = useQuery({
    queryKey: ["workforce-hired-instances"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("workforce_hired_instances")
        .select(
          `id, template_id, tenant_id, name_override, cluster_geo_id, status, created_at,
           workforce_master_templates ( name, template_key ),
           companies:tenant_id ( name ),
           workforce_instance_credentials ( id, instance_id, channel_provider, is_active )`
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as HiredInstance[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Workforce
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Workforce Command Center</h1>
          <p className="text-muted-foreground mt-1">
            Deploy hired instances of your master agent templates and manage their channels.
          </p>
        </header>

        <Tabs defaultValue="fleet" className="w-full">
          <TabsList>
            <TabsTrigger value="fleet">
              <Bot className="h-3.5 w-3.5 mr-2" />
              Master Fleet
            </TabsTrigger>
            <TabsTrigger value="deployments">
              <Users className="h-3.5 w-3.5 mr-2" />
              Active Deployments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fleet">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !templates?.length ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center text-muted-foreground">
                  <Bot className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  No master templates yet. Seed your fleet to get started.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {templates.map((t) => (
                  <Card key={t.id} className="flex flex-col hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {t.template_key}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{t.name}</CardTitle>
                      <CardDescription className="line-clamp-3 min-h-[3.75rem]">
                        {t.description || "No description provided."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Coins className="h-3.5 w-3.5" />
                          Per-message credits
                        </span>
                        <span className="font-semibold">{t.base_message_credit_cost ?? 0}</span>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => setDeployTarget(t)}
                        disabled={!t.is_active}
                      >
                        <Rocket className="h-4 w-4 mr-2" />
                        Deploy to Client
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="deployments">
            {instancesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !instances?.length ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  No agents deployed yet. Use the Master Fleet tab to deploy one.
                </CardContent>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instance Name</TableHead>
                    <TableHead>Master Template</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Geo Cluster</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Connected Channels</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instances.map((inst) => {
                    const channels = inst.workforce_instance_credentials ?? [];
                    return (
                      <TableRow key={inst.id}>
                        <TableCell className="font-medium">
                          {inst.name_override ||
                            inst.workforce_master_templates?.name ||
                            "Unnamed"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono text-xs">
                            {inst.workforce_master_templates?.template_key ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>{inst.companies?.name ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {inst.cluster_geo_id || "Global"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={inst.status === "active" ? "default" : "secondary"}
                            className="capitalize"
                          >
                            {inst.status ?? "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {channels.length === 0 ? (
                              <span className="text-xs text-muted-foreground italic">
                                None
                              </span>
                            ) : (
                              channels.map((c) => {
                                const meta =
                                  CHANNEL_META[c.channel_provider] ?? {
                                    label: c.channel_provider,
                                    icon: Plug,
                                  };
                                const Icon = meta.icon;
                                return (
                                  <Badge
                                    key={c.id}
                                    variant="outline"
                                    className="gap-1"
                                  >
                                    <Icon className="h-3 w-3" />
                                    {meta.label}
                                  </Badge>
                                );
                              })
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setChannelTarget(inst)}
                          >
                            <Plug className="h-3.5 w-3.5 mr-1.5" />
                            Connect Channel
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <DeployDialog template={deployTarget} onClose={() => setDeployTarget(null)} />
      <ChannelDialog instance={channelTarget} onClose={() => setChannelTarget(null)} />
    </div>
  );
}

function DeployDialog({
  template,
  onClose,
}: {
  template: Template | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [tenantId, setTenantId] = useState("");
  const [nameOverride, setNameOverride] = useState("");
  const [clusterGeo, setClusterGeo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: companies } = useQuery({
    queryKey: ["workforce-deploy-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name")
        .limit(500);
      if (error) throw error;
      return data as Company[];
    },
    enabled: !!template,
  });

  const reset = () => {
    setTenantId("");
    setNameOverride("");
    setClusterGeo("");
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!template) return;
    if (!tenantId) {
      toast.error("Select a tenant first");
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any)
      .from("workforce_hired_instances")
      .insert({
        template_id: template.id,
        tenant_id: tenantId,
        name_override: nameOverride || null,
        cluster_geo_id: clusterGeo || null,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    toast.success("Agent successfully deployed to client!");
    qc.invalidateQueries({ queryKey: ["workforce-hired-instances"] });
    setSubmitting(false);
    reset();
    onClose();
  };

  return (
    <Dialog open={!!template} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            Deploy {template?.name}
          </DialogTitle>
          <DialogDescription>
            Provision a hired instance of this master template for a client tenant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Tenant / Company</Label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a company…" />
              </SelectTrigger>
              <SelectContent>
                {(companies ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Instance name override</Label>
            <Input
              value={nameOverride}
              onChange={(e) => setNameOverride(e.target.value)}
              placeholder={template?.name ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label>Cluster Geo ID</Label>
            <Input
              value={clusterGeo}
              onChange={(e) => setClusterGeo(e.target.value)}
              placeholder="e.g. Dhaka-Mirpur"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4 mr-2" />
            )}
            Deploy Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChannelDialog({
  instance,
  onClose,
}: {
  instance: HiredInstance | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [provider, setProvider] = useState<string>("telegram");
  const [botToken, setBotToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setProvider("telegram");
    setBotToken("");
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!instance) return;
    if (!botToken.trim()) {
      toast.error("Bot token is required");
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any)
      .from("workforce_instance_credentials")
      .upsert(
        {
          instance_id: instance.id,
          channel_provider: provider,
          bot_token: botToken.trim(),
          is_active: true,
        },
        { onConflict: "instance_id,channel_provider" }
      );

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    toast.success(`${CHANNEL_META[provider]?.label ?? provider} channel connected!`);
    qc.invalidateQueries({ queryKey: ["workforce-hired-instances"] });
    setSubmitting(false);
    reset();
    onClose();
  };

  return (
    <Dialog open={!!instance} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plug className="h-4 w-4 text-primary" />
            Connect Channel
          </DialogTitle>
          <DialogDescription>
            Link a messaging channel to{" "}
            <span className="font-medium text-foreground">
              {instance?.name_override ||
                instance?.workforce_master_templates?.name ||
                "this instance"}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Channel Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHANNEL_META).map(([key, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Bot Token / Secret</Label>
            <Input
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="••••••••••••••••"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Stored encrypted and used by the channel router to authenticate inbound webhooks.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plug className="h-4 w-4 mr-2" />
            )}
            Save Channel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
