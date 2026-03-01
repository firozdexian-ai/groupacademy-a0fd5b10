import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MyCoursesTab } from "@/components/learning/MyCoursesTab";

export default function AppMyLearning() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/learning")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">My Learning</h1>
          <p className="text-muted-foreground text-sm">Track your progress and achievements</p>
        </div>
      </div>
      <MyCoursesTab />
    </div>
  );
}
