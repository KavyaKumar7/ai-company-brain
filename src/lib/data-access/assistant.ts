import "server-only";

import { createClient } from "@/lib/supabase/server";

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citedChunkIds: string[];
  createdAt: string;
};

type ConversationRow = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  cited_chunk_ids: string[];
  created_at: string;
};

function mapConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: MessageRow): AssistantMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    citedChunkIds: row.cited_chunk_ids ?? [],
    createdAt: row.created_at,
  };
}

function isMissingAssistantTable(message: string) {
  return (
    (message.includes("conversations") ||
      message.includes("messages") ||
      message.includes("answer_feedback") ||
      message.includes("knowledge_gaps")) &&
    (message.includes("schema cache") ||
      message.includes("does not exist") ||
      message.includes("Could not find the table"))
  );
}

export async function listConversations({
  orgId,
  userId,
}: {
  orgId: string;
  userId: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, created_at, updated_at")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(12);

  if (error) {
    if (isMissingAssistantTable(error.message)) {
      return [];
    }

    throw new Error(`Failed to load conversations: ${error.message}`);
  }

  return ((data ?? []) as unknown as ConversationRow[]).map(mapConversation);
}

export async function createConversation({
  orgId,
  userId,
  title,
}: {
  orgId: string;
  userId: string;
  title: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      organization_id: orgId,
      user_id: userId,
      title,
    })
    .select("id, title, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return mapConversation(data as unknown as ConversationRow);
}

export async function getConversationMessages({
  orgId,
  conversationId,
}: {
  orgId: string;
  conversationId: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("id, role, content, cited_chunk_ids, created_at")
    .eq("organization_id", orgId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingAssistantTable(error.message)) {
      return [];
    }

    throw new Error(`Failed to load messages: ${error.message}`);
  }

  return ((data ?? []) as unknown as MessageRow[]).map(mapMessage);
}

export async function createMessage({
  orgId,
  conversationId,
  role,
  content,
  citedChunkIds = [],
}: {
  orgId: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  citedChunkIds?: string[];
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      organization_id: orgId,
      conversation_id: conversationId,
      role,
      content,
      cited_chunk_ids: citedChunkIds,
    })
    .select("id, role, content, cited_chunk_ids, created_at")
    .single();

  if (error) {
    throw new Error(`Failed to create message: ${error.message}`);
  }

  return mapMessage(data as unknown as MessageRow);
}

export async function touchConversation({
  orgId,
  conversationId,
}: {
  orgId: string;
  conversationId: string;
}) {
  const supabase = await createClient();

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("organization_id", orgId)
    .eq("id", conversationId);
}

export async function createAnswerFeedback({
  orgId,
  userId,
  messageId,
  rating,
  note,
}: {
  orgId: string;
  userId: string;
  messageId: string;
  rating: "helpful" | "incorrect" | "outdated";
  note: string | null;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("answer_feedback").insert({
    organization_id: orgId,
    user_id: userId,
    message_id: messageId,
    rating,
    note,
  });

  if (error) {
    throw new Error(`Failed to create answer feedback: ${error.message}`);
  }
}

export async function createKnowledgeGap({
  orgId,
  userId,
  question,
}: {
  orgId: string;
  userId: string;
  question: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("knowledge_gaps").insert({
    organization_id: orgId,
    question,
    created_by: userId,
  });

  if (error) {
    throw new Error(`Failed to create knowledge gap: ${error.message}`);
  }
}
