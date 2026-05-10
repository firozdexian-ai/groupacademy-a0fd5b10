import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CourseJSONImporter() {
  const [json, setJson] = useState("");
  const [busy, setBusy] = useState(false);

  const handleProcess = async () => {
    if (!json.trim()) {
      toast.error("Paste JSON data first");
      return;
    }
    setBusy(true);
    try {
      const parsed = JSON.parse(json);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      // TODO: wire to admin import endpoint
      toast.success(`Parsed ${items.length} course${items.length === 1 ? "" : "s"}. Import pipeline pending.`);
    } catch (err: any) {
      toast.error(err?.message ?? "Invalid JSON");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Course Importer
          </CardTitle>
          <CardDescription>
            Paste a JSON array of course objects to bulk-create or update courses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder='[{"title":"Intro to AI","slug":"intro-ai","description":"..."}]'
            className="min-h-[280px] font-mono text-xs"
          />
          <div className="flex justify-end">
            <Button onClick={handleProcess} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Process & Import
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CourseJSONImporter;
