import Link from "next/link";
import { redirect } from "next/navigation";

import { askAssistantAction, submitAnswerFeedbackAction } from "@/app/assistant/actions";
import { StatusMessage } from "@/components/admin/status-message";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getOrgContext } from "@/lib/auth/get-org-context";
import {
  getConversationMessages,
  listConversations,
  type AssistantMessage,
} from "@/lib/data-access/assistant";
import { listDocuments } from "@/lib/data-access/documents";

type AssistantPageProps = {
  searchParams: Promise<{
    conversationId?: string;
    error?: string;
    message?: string;
  }>;
};

function findPreviousQuestion(messages: AssistantMessage[], messageIndex: number) {
  for (let index = messageIndex - 1; index >= 0; index -= 1) {
    if (messages[index].role === "user") {
      return messages[index].content;
    }
  }

  return "";
}

export default async function AssistantPage({ searchParams }: AssistantPageProps) {
  const [params, context] = await Promise.all([
    searchParams,
    getOrgContext(),
  ]);

  if (!context) {
    redirect("/login");
  }

  const [conversations, documents] = await Promise.all([
    listConversations({ orgId: context.orgId, userId: context.userId }),
    listDocuments(context.orgId),
  ]);
  const activeConversationId =
    params.conversationId || conversations[0]?.id || null;
  const messages = activeConversationId
    ? await getConversationMessages({
        orgId: context.orgId,
        conversationId: activeConversationId,
      })
    : [];
  const approvedDocuments = documents.filter(
    (document) => document.status === "approved"
  );

  return (
    <AppShell context={context}>
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
              <CardDescription>
                Your recent assistant sessions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                className={buttonVariants({
                  className: "mb-3 w-full",
                })}
                href="/assistant"
              >
                New question
              </Link>
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No conversations yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <Link
                      className={buttonVariants({
                        variant:
                          conversation.id === activeConversationId
                            ? "secondary"
                            : "outline",
                        className: "w-full justify-start truncate",
                      })}
                      href={`/assistant?conversationId=${conversation.id}`}
                      key={conversation.id}
                    >
                      {conversation.title}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Knowledge status</CardTitle>
              <CardDescription>
                Assistant uses approved chunks only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{approvedDocuments.length} approved documents</p>
              <p>
                OpenAI generation and semantic retrieval use approved,
                extracted document chunks only.
              </p>
            </CardContent>
          </Card>
        </aside>

        <main className="flex flex-col gap-6">
          <PageHeader
            eyebrow="Verified assistant"
            title="Ask your company brain"
            description="Answers are grounded in approved company document chunks. If the knowledge is missing, the assistant should say it does not have verified information."
          />

          <StatusMessage error={params.error} message={params.message} />

          <Card>
            <CardHeader>
              <CardTitle>Ask a question</CardTitle>
              <CardDescription>
                Ask for a fact, explanation, or summary from your approved
                company knowledge.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={askAssistantAction} className="space-y-3">
                {activeConversationId ? (
                  <input
                    name="conversationId"
                    type="hidden"
                    value={activeConversationId}
                  />
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    name="question"
                    placeholder="What is our cancellation policy?"
                    required
                  />
                </div>
                <Button type="submit">Ask assistant</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
              <CardDescription>
                Source chips show which chunks were used as context.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ask a question to start a conversation.
                </p>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      className={
                        message.role === "assistant"
                          ? "rounded-lg border bg-muted/40 p-4"
                          : "rounded-lg border border-primary/30 bg-primary/10 p-4"
                      }
                      key={message.id}
                    >
                      <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        {message.role}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {message.content}
                      </p>
                      {message.role === "assistant" ? (
                        <div className="mt-4 space-y-3">
                          {message.citedChunkIds.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {message.citedChunkIds.map((chunkId, chunkIndex) => (
                                <span
                                  className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary"
                                  key={chunkId}
                                >
                                  Source chunk {chunkIndex + 1}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              No verified source chunks found.
                            </p>
                          )}
                          <form
                            action={submitAnswerFeedbackAction}
                            className="flex flex-wrap items-end gap-2"
                          >
                            <input
                              name="conversationId"
                              type="hidden"
                              value={activeConversationId ?? ""}
                            />
                            <input
                              name="messageId"
                              type="hidden"
                              value={message.id}
                            />
                            <input
                              name="question"
                              type="hidden"
                              value={findPreviousQuestion(messages, index)}
                            />
                            <Select
                              className="h-8 min-w-28 text-xs"
                              name="rating"
                              required
                            >
                              <option value="helpful">Helpful</option>
                              <option value="incorrect">Incorrect</option>
                              <option value="outdated">Outdated</option>
                            </Select>
                            <input
                              className="h-8 min-w-48 rounded-lg border border-input bg-background px-2 text-xs"
                              name="note"
                              placeholder="Optional note"
                            />
                            <Button size="sm" type="submit" variant="outline">
                              Save feedback
                            </Button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </AppShell>
  );
}
