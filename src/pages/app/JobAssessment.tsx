import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Mic,
  MicOff,
  Loader2,
  Clock,
  AlertCircle,
  Brain,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  type: "mcq" | "voice" | "text";
  question: string;
  options?: string[];
  timeLimit?: number;
}

interface Assessment {
  id: string;
  job_id: string;
  talent_id: string;
  questions: Question[];
  answers: Record<string, any> | null;
  status: string;
  expires_at: string | null;
  jobs?: {
    title: string;
    company_name: string;
  };
}

export default function JobAssessment() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { talent } = useTalent();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (assessmentId) fetchAssessment();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assessmentId]);

  const fetchAssessment = async () => {
    try {
      const { data, error } = await supabase
        .from("job_assessments")
        .select(`*, jobs (title, company_name)`)
        .eq("id", assessmentId)
        .single();

      if (error) throw error;

      let questionsData: Question[] = [];
      if (data.questions) {
        const rawQuestions = data.questions as any;
        if (Array.isArray(rawQuestions)) {
          questionsData = rawQuestions as Question[];
        } else {
          if (rawQuestions.mcq_questions) {
            questionsData = [...questionsData, ...rawQuestions.mcq_questions.map((q: any) => ({ ...q, type: "mcq" }))];
          }
          if (rawQuestions.voice_questions) {
            questionsData = [
              ...questionsData,
              ...rawQuestions.voice_questions.map((q: any) => ({ ...q, type: "voice", timeLimit: 120 })),
            ];
          }
          if (rawQuestions.text_questions) {
            questionsData = [
              ...questionsData,
              ...rawQuestions.text_questions.map((q: any) => ({ ...q, type: "text" })),
            ];
          }
        }
      }

      setAssessment({ ...data, questions: questionsData, answers: data.answers as Record<string, any> | null });
      if (data.answers) setAnswers(data.answers as Record<string, any>);

      if (data.status === "pending") {
        await supabase
          .from("job_assessments")
          .update({ status: "in_progress", started_at: new Date().toISOString() })
          .eq("id", assessmentId);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load assessment");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        uploadVoiceAnswer(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 120) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // CTO Fix: Audio Upload to Storage (Found in Source 312: assessment-audio bucket)
  const uploadVoiceAnswer = async (blob: Blob) => {
    if (!assessment || !talent) return;
    setUploading(true);
    const questionId = assessment.questions[currentQuestionIndex].id;
    const fileName = `${assessment.id}/${talent.id}_${questionId}_${Date.now()}.webm`;

    try {
      const { data, error } = await supabase.storage
        .from("assessment-audio")
        .upload(fileName, blob, { contentType: "audio/webm", upsert: true });

      if (error) throw error;

      // Store only the path in DB JSONB to avoid row-size limits
      const updatedAnswers = {
        ...answers,
        [questionId]: { type: "voice", storagePath: data.path },
      };
      setAnswers(updatedAnswers);

      // Auto-save progress
      await supabase.from("job_assessments").update({ answers: updatedAnswers }).eq("id", assessment.id);
      toast.success("Voice response saved");
    } catch (error) {
      console.error("Upload Error:", error);
      toast.error("Failed to upload audio response");
    } finally {
      setUploading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const saveProgress = async () => {
    if (!assessment) return;
    await supabase.from("job_assessments").update({ answers }).eq("id", assessment.id);
  };

  const handleNext = async () => {
    await saveProgress();
    if (assessment && currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!assessment) return;
    setSubmitting(true);
    try {
      await supabase
        .from("job_assessments")
        .update({
          answers,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", assessment.id);

      toast.success("Submitted! Analyzing...");
      await supabase.functions.invoke("analyze-job-assessment", { body: { assessmentId: assessment.id } });
      navigate(`/app/job-assessment/${assessment.id}/results`);
    } catch (error) {
      toast.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (!assessment)
    return (
      <div className="p-4 text-center">
        <AlertCircle className="mx-auto" />
        <p>Assessment not found</p>
      </div>
    );

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === assessment.questions.length - 1;
  const hasCurrentAnswer = !!answers[currentQuestion?.id];

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">AI Assessment</h1>
          <p className="text-sm text-muted-foreground">
            {assessment.jobs?.title} - {assessment.jobs?.company_name}
          </p>
        </div>
        <Badge variant="outline">
          {currentQuestionIndex + 1}/{assessment.questions.length}
        </Badge>
      </div>

      <Progress value={progress} className="mb-4 h-2" />

      <Card className="mb-6">
        <CardHeader>
          <Badge className="w-fit">{currentQuestion.type}</Badge>
          <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentQuestion.type === "mcq" && (
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(v) => handleAnswerChange(currentQuestion.id, v)}
              className="space-y-3"
            >
              {currentQuestion.options?.map((opt, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50">
                  <RadioGroupItem value={opt} id={`opt-${i}`} />
                  <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer">
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === "voice" && (
            <div className="flex flex-col items-center gap-4 p-6 bg-accent/30 rounded-lg">
              {isRecording ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                    <Mic className="text-destructive" />
                  </div>
                  <p className="font-mono">
                    {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}
                  </p>
                  <Button onClick={stopRecording} variant="destructive">
                    Stop Recording
                  </Button>
                </>
              ) : uploading ? (
                <>
                  <Loader2 className="animate-spin h-10 w-10 text-primary" />
                  <p>Uploading to secure storage...</p>
                </>
              ) : hasCurrentAnswer ? (
                <>
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <p className="text-sm text-muted-foreground">Response Uploaded Successfully</p>
                  <Button onClick={startRecording} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" /> Redo Recording
                  </Button>
                </>
              ) : (
                <Button onClick={startRecording} className="gap-2">
                  <Mic /> Start Voice Response
                </Button>
              )}
            </div>
          )}

          {currentQuestion.type === "text" && (
            <Textarea
              placeholder="Type your answer..."
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              rows={6}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex((p) => p - 1)}
          disabled={currentQuestionIndex === 0}
          className="flex-1"
        >
          Previous
        </Button>
        {isLastQuestion ? (
          <Button onClick={handleSubmit} disabled={submitting || !hasCurrentAnswer} className="flex-1">
            {submitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />}
            {submitting ? "Analyzing..." : "Finish & Submit"}
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={!hasCurrentAnswer} className="flex-1">
            Next <ArrowRight className="ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
