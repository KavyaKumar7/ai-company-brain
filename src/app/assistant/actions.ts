"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getOrgContext } from "@/lib/auth/get-org-context";
import { generateGroundedAnswer } from "@/lib/ai/grounded-answer";
import { createActivityLog } from "@/lib/data-access/activity-log";
import {
  createAnswerFeedback,
  createConversation,
  createKnowledgeGap,
  createMessage,
  touchConversation,
} from "@/lib/data-access/assistant";
import { retrieveApprovedChunks } from "@/lib/rag/retrieve";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithParam(path: string, key: "error" | "message", value: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(value)}`);
}

function titleFromQuestion(question: string) {
  return question.length > 60 ? `${question.slice(0, 57)}...` : question;
}

export async function askAssistantAction(formData: FormData) {
  const context = await getOrgContext();

  if (!context) {
    redirect("/login");
  }

  const question = getString(formData, "question");
  let conversationId = getString(formData, "conversationId") || null;

  if (!question) {
    redirectWithParam("/assistant", "error", "Ask a question first.");
  }

  try {
    if (!conversationId) {
      const conversation = await createConversation({
        orgId: context.orgId,
        userId: context.userId,
        title: titleFromQuestion(question),
      });
      conversationId = conversation.id;
    }

    await createMessage({
      orgId: context.orgId,
      conversationId,
      role: "user",
      content: question,
    });

    const chunks = await retrieveApprovedChunks({
      orgId: context.orgId,
      question,
    });
    const { answer, usedAi } = await generateGroundedAnswer({
      question,
      chunks,
    });
    const assistantMessage = await createMessage({
      orgId: context.orgId,
      conversationId,
      role: "assistant",
      content: answer,
      citedChunkIds: chunks.map((chunk) => chunk.id),
    });

    await touchConversation({
      orgId: context.orgId,
      conversationId,
    });

    if (answer === "I don't have verified information on that.") {
      await createKnowledgeGap({
        orgId: context.orgId,
        userId: context.userId,
        question,
      });
    }

    await createActivityLog({
      orgId: context.orgId,
      userId: context.userId,
      action: "assistant.question_answered",
      targetType: "message",
      targetId: assistantMessage.id,
      metadata: {
        citedChunkCount: chunks.length,
        usedAi,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Assistant could not answer.";
    redirectWithParam(
      conversationId ? `/assistant?conversationId=${conversationId}` : "/assistant",
      "error",
      `${message} Make sure migration 011 has been run in Supabase.`
    );
  }

  revalidatePath("/assistant");
  redirect(`/assistant?conversationId=${conversationId}`);
}

export async function submitAnswerFeedbackAction(formData: FormData) {
  const context = await getOrgContext();

  if (!context) {
    redirect("/login");
  }

  const messageId = getString(formData, "messageId");
  const conversationId = getString(formData, "conversationId");
  const rating = getString(formData, "rating") as
    | "helpful"
    | "incorrect"
    | "outdated";
  const note = getString(formData, "note") || null;
  const question = getString(formData, "question");
  const pagePath = `/assistant?conversationId=${conversationId}`;

  if (!messageId || !conversationId) {
    redirectWithParam("/assistant", "error", "Feedback target is missing.");
  }

  if (!["helpful", "incorrect", "outdated"].includes(rating)) {
    redirectWithParam(pagePath, "error", "Choose a valid feedback rating.");
  }

  await createAnswerFeedback({
    orgId: context.orgId,
    userId: context.userId,
    messageId,
    rating,
    note,
  });

  if (rating === "incorrect" || rating === "outdated") {
    await createKnowledgeGap({
      orgId: context.orgId,
      userId: context.userId,
      question: question || note || "Assistant answer needs review.",
    });
  }

  await createActivityLog({
    orgId: context.orgId,
    userId: context.userId,
    action: "assistant.feedback_created",
    targetType: "message",
    targetId: messageId,
    metadata: { rating },
  });

  revalidatePath("/assistant");
  redirectWithParam(pagePath, "message", "Feedback saved.");
}
