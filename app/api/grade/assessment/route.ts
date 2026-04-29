import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { selectModel } from "@/lib/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanJson(text: string) {
  return text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Anthropic API key not configured." }, { status: 503 });
  }

  const { assessment, answers, sourceSummary = [], sourceText = "", userTier = "free", subject } =
    await req.json();

  if (!assessment || !Array.isArray(assessment.questions)) {
    return NextResponse.json({ error: "Assessment payload is required." }, { status: 400 });
  }

  const multipleChoiceResults = assessment.questions
    .filter((question: any) => question.type === "multiple_choice")
    .map((question: any) => {
      const studentAnswer = answers?.[question.id] ?? null;
      const isCorrect = studentAnswer === question.correctIndex;
      return {
        questionId: question.id,
        score: isCorrect ? question.marks : 0,
        maxScore: question.marks,
        isCorrect,
        studentAnswer,
        correctAnswer:
          question.options?.[question.correctIndex] || String(question.correctIndex ?? ""),
        correction: isCorrect
          ? "Correct answer selected."
          : question.explanation || "Review the model answer and explanation.",
        explanation: question.explanation || "",
        topic: question.topic,
      };
    });

  const freeResponseQuestions = assessment.questions.filter(
    (question: any) => question.type !== "multiple_choice"
  );

  let freeResponseResults: any[] = [];

  if (freeResponseQuestions.length > 0) {
    const client = new Anthropic({ apiKey });
    const model = selectModel({ userTier, subject });

    const gradingPrompt = `Mark the student responses for this StudyDesk assessment.

Assessment title: ${assessment.title}
Selected sources: ${sourceSummary.join(", ") || "Module sources"}

Return only valid JSON:
{
  "results": [
    {
      "questionId": "q1",
      "score": 3,
      "maxScore": 5,
      "isCorrect": false,
      "studentAnswer": "Student text",
      "correctAnswer": "Marking target",
      "correction": "What the student should improve",
      "explanation": "Why the mark was awarded",
      "topic": "Topic"
    }
  ]
}

Grade using the supplied rubric criteria, sample answer, and source material. Award partial credit where appropriate.

Source material:
${sourceText}

Questions and answers:
${JSON.stringify(
  freeResponseQuestions.map((question: any) => ({
    questionId: question.id,
    prompt: question.prompt,
    topic: question.topic,
    marks: question.marks,
    rubricCriteria: question.rubricCriteria || [],
    correctAnswer: question.correctAnswer || "",
    sampleAnswer: question.sampleAnswer || "",
    studentAnswer: answers?.[question.id] ?? "",
  }))
)}`;

    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system:
        "You are a rigorous academic marker for StudyDesk. Return only valid JSON with scores, corrections, and explanations.",
      messages: [{ role: "user", content: gradingPrompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const parsed = JSON.parse(cleanJson(content.text));
    freeResponseResults = parsed.results || [];
  }

  const results = [...multipleChoiceResults, ...freeResponseResults];
  const totalScore = results.reduce((sum, item) => sum + (item.score || 0), 0);
  const totalMarks = assessment.questions.reduce(
    (sum: number, question: any) => sum + (question.marks || 0),
    0
  );
  const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
  const weakTopics = Array.from(
    new Set(results.filter((item) => item.score < item.maxScore).map((item) => item.topic))
  );

  return NextResponse.json({
    totalScore,
    totalMarks,
    percentage,
    weakTopics,
    results,
  });
}
