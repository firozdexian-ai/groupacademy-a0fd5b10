import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TracksTab } from "@/components/learning/TracksTab";

export default function AppProfessions() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/learning")} className="mb-4 -ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Career Tracks</h1>
        <p className="text-muted-foreground">Explore structured learning paths for your profession</p>
      </div>
      <TracksTab />
    </div>
  );
}
