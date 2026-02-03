import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Plus, Building2, Bot, Coins, BadgeCheck, Pencil, Trash2, Eye, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
}

interface CompanyAgent {
  id: string;
  agent_id: string;
  company_id: string;
  sponsorship_type: string | null;
  monthly_budget: number | null;
  credits_used: number | null;
  is_active: boolean | null;
  created_at: string | null;
  ai_agents: {
    id: string;
    name: string;
    description: string;
    agent_key: string;
    icon: string | null;
    color: string | null;
    bg_color: string | null;
    credit_cost: number | null;
    category: string | null;
    is_active: boolean | null;
    total_conversations: number | null;
    expertise_areas: string[] | null;
  } | null;
  companies: Company | null;
}

const SPONSORSHIP_TYPES = [
  { value: "full", label: "Full Sponsorship", description: "Company pays all credits" },
  { value: "partial", label: "Partial Sponsorship", description: "Company subsidizes credits" },
  { value: "branded", label: "Branded Only", description: "User pays, company branding" },
];

const AGENT_CATEGORIES = [
  { value: "career", label: "Career" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Education" },
  { value: "wellness", label: "Wellness" },
  { value: "industry", label: "Industry Specific" },
];

export function CompanyAgentsManager() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<CompanyAgent | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  
  // Form state for new agent
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    system_prompt: "",
    expertise_areas: "",
    category: "finance",
    credit_cost: 10,
    sponsorship_type: "branded",
    monthly_budget: 1000,
  });

  // Fetch companies
  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ["companies-for-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, logo_url, industry")
        .order("name");
      if (error) throw error;
      return data as Company[];
    },
  });

  // Fetch company agents with related data
  const { data: companyAgents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ["company-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_agents")
        .select(`
          *,
          ai_agents (
            id, name, description, agent_key, icon, color, bg_color, 
            credit_cost, category, is_active, total_conversations, expertise_areas
          ),
          companies (id, name, logo_url, industry)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CompanyAgent[];
    },
  });

  // Create new sponsored agent
  const createAgentMutation = useMutation({
    mutationFn: async (data: typeof formData & { company_id: string }) => {
      // First create the AI agent
      const agentKey = `${data.name.toLowerCase().replace(/\s+/g, "-")}-${selectedCompany.slice(0, 8)}`;
      
      const { data: newAgent, error: agentError } = await supabase
        .from("ai_agents")
        .insert({
          agent_key: agentKey,
          name: data.name,
          description: data.description,
          system_prompt: data.system_prompt,
          expertise_areas: data.expertise_areas.split(",").map(s => s.trim()).filter(Boolean),
          category: data.category,
          credit_cost: data.credit_cost,
          company_id: data.company_id,
          agent_type: "company_sponsored",
          icon: "Building2",
          color: "text-blue-600",
          bg_color: "bg-blue-500/10",
          capabilities: ["text"],
          is_active: true,
          is_featured: false,
        })
        .select()
        .single();
      
      if (agentError) throw agentError;

      // Then create the company_agents linkage
      const { error: linkError } = await supabase
        .from("company_agents")
        .insert({
          agent_id: newAgent.id,
          company_id: data.company_id,
          sponsorship_type: data.sponsorship_type,
          monthly_budget: data.monthly_budget,
          credits_used: 0,
          is_active: true,
        });

      if (linkError) throw linkError;
      return newAgent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-agents"] });
      toast.success("Company agent created successfully!");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create agent");
    },
  });

  // Toggle agent active status
  const toggleAgentMutation = useMutation({
    mutationFn: async ({ agentId, companyAgentId, isActive }: { agentId: string; companyAgentId: string; isActive: boolean }) => {
      // Update both tables
      await supabase
        .from("ai_agents")
        .update({ is_active: isActive })
        .eq("id", agentId);
      
      const { error } = await supabase
        .from("company_agents")
        .update({ is_active: isActive })
        .eq("id", companyAgentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-agents"] });
      toast.success("Agent status updated");
    },
    onError: () => {
      toast.error("Failed to update agent status");
    },
  });

  // Delete agent
  const deleteAgentMutation = useMutation({
    mutationFn: async ({ agentId, companyAgentId }: { agentId: string; companyAgentId: string }) => {
      // Delete company_agents link first
      await supabase
        .from("company_agents")
        .delete()
        .eq("id", companyAgentId);
      
      // Then delete the agent
      const { error } = await supabase
        .from("ai_agents")
        .delete()
        .eq("id", agentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-agents"] });
      toast.success("Agent deleted");
    },
    onError: () => {
      toast.error("Failed to delete agent");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      system_prompt: "",
      expertise_areas: "",
      category: "finance",
      credit_cost: 10,
      sponsorship_type: "branded",
      monthly_budget: 1000,
    });
    setSelectedCompany("");
  };

  const handleSubmit = () => {
    if (!selectedCompany) {
      toast.error("Please select a company");
      return;
    }
    if (!formData.name || !formData.description || !formData.system_prompt) {
      toast.error("Please fill all required fields");
      return;
    }
    createAgentMutation.mutate({ ...formData, company_id: selectedCompany });
  };

  const selectedCompanyData = companies.find(c => c.id === selectedCompany);

  // Stats
  const totalAgents = companyAgents.length;
  const activeAgents = companyAgents.filter(a => a.is_active).length;
  const totalBudget = companyAgents.reduce((sum, a) => sum + (a.monthly_budget || 0), 0);
  const totalUsed = companyAgents.reduce((sum, a) => sum + (a.credits_used || 0), 0);

  if (loadingAgents || loadingCompanies) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Company Sponsored Agents</h2>
          <p className="text-muted-foreground">
            Manage B2B AI agents sponsored by partner companies
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Sponsored Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Company Sponsored Agent</DialogTitle>
              <DialogDescription>
                Create a new AI agent sponsored by a partner company
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Company Selection */}
              <div className="space-y-2">
                <Label>Sponsoring Company *</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={company.logo_url || ""} />
                            <AvatarFallback className="text-xs">
                              {company.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{company.name}</span>
                          {company.industry && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {company.industry}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCompanyData && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedCompanyData.logo_url || ""} />
                        <AvatarFallback>
                          {selectedCompanyData.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {selectedCompanyData.name}
                          <BadgeCheck className="h-4 w-4 text-blue-500" />
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedCompanyData.industry || "Company"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Agent Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Agent Name *</Label>
                  <Input
                    placeholder="e.g., Financial Advisor"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={v => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Input
                  placeholder="Brief description of what this agent does"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Expertise Areas (comma-separated)</Label>
                <Input
                  placeholder="e.g., Personal Loans, Savings, Credit Cards"
                  value={formData.expertise_areas}
                  onChange={e => setFormData({ ...formData, expertise_areas: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>System Prompt *</Label>
                <Textarea
                  placeholder="Define the agent's personality, expertise, and response style..."
                  value={formData.system_prompt}
                  onChange={e => setFormData({ ...formData, system_prompt: e.target.value })}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Include company-specific knowledge, brand voice, and expertise areas
                </p>
              </div>

              {/* Sponsorship Settings */}
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium">Sponsorship Settings</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sponsorship Type</Label>
                    <Select 
                      value={formData.sponsorship_type} 
                      onValueChange={v => setFormData({ ...formData, sponsorship_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SPONSORSHIP_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <p>{type.label}</p>
                              <p className="text-xs text-muted-foreground">{type.description}</p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Credit Cost (per session)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.credit_cost}
                      onChange={e => setFormData({ ...formData, credit_cost: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Monthly Credit Budget</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.monthly_budget}
                    onChange={e => setFormData({ ...formData, monthly_budget: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum credits the company will subsidize per month
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={createAgentMutation.isPending}>
                {createAgentMutation.isPending ? "Creating..." : "Create Agent"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAgents}</p>
                <p className="text-sm text-muted-foreground">Sponsored Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Bot className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeAgents}</p>
                <p className="text-sm text-muted-foreground">Active Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Coins className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalBudget.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUsed.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Credits Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sponsored Agents</CardTitle>
          <CardDescription>
            All company-sponsored AI agents on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companyAgents.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium mb-1">No Sponsored Agents Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first company-sponsored agent to get started
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Sponsorship</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyAgents.map(ca => (
                  <TableRow key={ca.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${ca.ai_agents?.bg_color || "bg-blue-500/10"}`}>
                          <Bot className={`h-4 w-4 ${ca.ai_agents?.color || "text-blue-600"}`} />
                        </div>
                        <div>
                          <p className="font-medium">{ca.ai_agents?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ca.ai_agents?.category} • {ca.ai_agents?.credit_cost} credits
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={ca.companies?.logo_url || ""} />
                          <AvatarFallback className="text-xs">
                            {ca.companies?.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium flex items-center gap-1">
                            {ca.companies?.name}
                            <BadgeCheck className="h-3 w-3 text-blue-500" />
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ca.companies?.industry}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {ca.sponsorship_type || "branded"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">
                        {(ca.monthly_budget || 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="font-mono">
                          {(ca.credits_used || 0).toLocaleString()}
                        </span>
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ 
                              width: `${Math.min(100, ((ca.credits_used || 0) / (ca.monthly_budget || 1)) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={ca.is_active ?? false}
                        onCheckedChange={(checked) => 
                          ca.ai_agents && toggleAgentMutation.mutate({
                            agentId: ca.ai_agents.id,
                            companyAgentId: ca.id,
                            isActive: checked,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (ca.ai_agents) {
                              deleteAgentMutation.mutate({
                                agentId: ca.ai_agents.id,
                                companyAgentId: ca.id,
                              });
                            }
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
