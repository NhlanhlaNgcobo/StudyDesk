import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { selectModel } from "@/lib/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A question as it arrives on the request body. */
interface QuestionPayload {
  id: string;
  type: string;
  prompt: string;
  topic: string;
  marks: number;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
  sampleAnswer?: string;
  explanation?: string;
  rubricCriteria?: string[];
}

interface RawCriterion {
  criterion?: unknown;
  awarded?: unknown;
  max?: unknown;
  comment?: unknown;
}

interface CriterionMark {
  criterion: string;
  awarded: number;
  max: number;
  comment: string;
}

/** What the marker returns, before validation. */
interface GradedResult {
  questionId: string;
  score?: number;
  maxScore?: number;
  criteria?: RawCriterion[];
  nextStep?: unknown;
  misconception?: unknown;
  [key: string]: unknown;
}

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
    .filter((question: QuestionPayload) => question.type === "multiple_choice")
    .map((question: QuestionPayload) => {
      const studentAnswer = answers?.[question.id] ?? null;
      const isCorrect = studentAnswer === question.correctIndex;
      return {
        questionId: question.id,
        score: isCorrect ? question.marks : 0,
        maxScore: question.marks,
        isCorrect,
        studentAnswer,
        correctAnswer:
          (question.correctIndex !== undefined
            ? question.options?.[question.correctIndex]
            : undefined) || String(question.correctIndex ?? ""),
        correction: isCorrect
          ? "Correct answer selected."
          : question.explanation || "Review the model answer and explanation.",
        explanation: question.explanation || "",
        topic: question.topic,
      };
    });

  const freeResponseQuestions = assessment.questions.filter(
    (question: QuestionPayload) => question.type !== "multiple_choice"
  );

  let freeResponseResults: Record<string, unknown>[] = [];

  if (freeResponseQuestions.length > 0) {
    const client = new Anthropic({ apiKey });
    const model = selectModel({ userTier, subject });

    const gradingPrompt = `Mark these student responses the way a South African university examiner marks against a memo: criterion by criterion, with the marks for each line shown.

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
      "criteria": [
        { "criterion": "Accurate definition", "awarded": 2, "max": 2, "comment": "Definition is correct and uses the right terminology." },
        { "criterion": "Worked application", "awarded": 1, "max": 3, "comment": "Applied the rule but dropped the boundary condition." }
      ],
      "correction": "The specific thing to fix, in one or two sentences",
      "explanation": "Why the mark was awarded",
      "nextStep": "One concrete action that would earn the missing marks",
      "misconception": "A 3-8 word label for the specific error, or empty string if none",
      "topic": "Topic"
    }
  ]
}

MARKING RULES
- One "criteria" entry per supplied rubric criterion. If a question has no rubric criteria, infer 2-4 sensible ones from the sample answer and mark against those.
- The "awarded" values must sum exactly to "score", and the "max" values must sum exactly to "maxScore". Check this before returning.
- Award partial credit generously where the student shows correct reasoning that reaches a wrong answer, and sparingly where they reach a right answer by unsound reasoning. Say which case it is in the comment.
- "misconception" names the error itself ("confuses mean with median", "omits mens rea"), not the topic. Leave it as an empty string when the answer was essentially correct.
- "nextStep" is a specific action ("redo question 3 showing the substitution step"), never generic advice ("study more").
- Mark only what is written. Do not credit knowledge the student did not express.

Source material:
${sourceText}

Questions and answers:
${JSON.stringify(
  freeResponseQuestions.map((question: QuestionPayload) => ({
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
      max_tokens: 8192,
      system:
        "You are a rigorous South African university examiner marking against a memo. You mark criterion by criterion, you never credit what the student did not write, and you return only valid JSON with no commentary around it.",
      messages: [{ role: "user", content: gradingPrompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const parsed = JSON.parse(cleanJson(content.text));

    // Trust the criterion marks over the stated total: the per-line marks are
    // what the student is shown, so the total must agree with them.
    freeResponseResults = (parsed.results || []).map((result: GradedResult) => {
      const question = freeResponseQuestions.find(
        (q: { id: string }) => q.id === result.questionId
      ) as { marks?: number } | undefined;
      const maxScore = question?.marks ?? result.maxScore ?? 0;

      const criteria: CriterionMark[] = Array.isArray(result.criteria)
        ? result.criteria
            .filter((c): c is RawCriterion => Boolean(c) && typeof c.criterion === "string")
            .map((c) => ({
              criterion: String(c.criterion),
              awarded: Math.max(0, Number(c.awarded) || 0),
              max: Math.max(0, Number(c.max) || 0),
              comment: typeof c.comment === "string" ? c.comment : "",
            }))
        : [];

      const criterionTotal = criteria.reduce((sum, c) => sum + c.awarded, 0);
      const criterionMax = criteria.reduce((sum, c) => sum + c.max, 0);

      // Rescale if the model's rubric maxima disagree with the question's marks.
      const score =
        criteria.length > 0 && criterionMax > 0
          ? Math.round((criterionTotal / criterionMax) * maxScore * 10) / 10
          : Math.min(Math.max(Number(result.score) || 0, 0), maxScore);

      return {
        ...result,
        score,
        maxScore,
        isCorrect: score >= maxScore,
        criteria,
        nextStep: typeof result.nextStep === "string" ? result.nextStep : "",
        misconception:
          typeof result.misconception === "string" && result.misconception.trim()
            ? result.misconception.trim()
            : undefined,
      };
    });
  }

  const results = [...multipleChoiceResults, ...freeResponseResults];
  const totalScore = results.reduce((sum, item) => sum + (item.score || 0), 0);
  const totalMarks = assessment.questions.reduce(
    (sum: number, question: QuestionPayload) => sum + (question.marks || 0),
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
