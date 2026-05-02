import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const RETRY_DELAY_MS = 2000;
const TIMEOUT_MS = 10000;

/**
 * Anthropic prompt-cache TTL is 5 minutes. The static system prompt + the
 * per-resident cultural-register block are identical across many calls per
 * shift for the same resident, so marking them as cached cuts repeated input
 * cost by ~90%. The user message is per-call and not cached.
 */
interface ClaudeCallOptions {
  model?: string;
  systemPrompt: string;
  /**
   * When set, the system prompt is split into a cached prefix + uncached
   * suffix. Use this when the static portion of the system prompt (template +
   * cultural-register block) is reused but a small variable tail differs per
   * call. Pass the cached prefix as `systemPrompt` and the uncached suffix
   * as `systemPromptSuffix`.
   *
   * If null, the full systemPrompt is sent as a single cached block.
   */
  systemPromptSuffix?: string;
  userPrompt: string;
  maxTokens?: number;
  /**
   * Set to false to disable prompt caching for this call (rare — only when
   * the system prompt is genuinely unique per call and caching would waste
   * the slot). Defaults to true.
   */
  cacheSystem?: boolean;
}

export type ClaudeModel =
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5"
  | (string & {});

/**
 * Pick a model for the workload. Use Sonnet for the one expensive call per
 * note (clinical structuring, clinician summary, family update). Use Haiku
 * for translation passes, classification, and rolling-summary refresh — it's
 * roughly 10× cheaper and quality is sufficient when the input is already
 * structured.
 */
export function modelFor(
  workload: "structure" | "translate" | "classify" | "summarize"
): ClaudeModel {
  switch (workload) {
    case "structure":
    case "summarize":
      return "claude-sonnet-4-6";
    case "translate":
    case "classify":
      return "claude-haiku-4-5";
  }
}

export async function callClaude({
  model = "claude-sonnet-4-6",
  systemPrompt,
  systemPromptSuffix,
  userPrompt,
  maxTokens = 1024,
  cacheSystem = true,
}: ClaudeCallOptions): Promise<string> {
  // Build the system parameter: when cacheSystem is true, mark the cached
  // prefix with cache_control. The Anthropic SDK accepts either a string or
  // an array of content blocks; we use the array form when caching.
  const buildSystem = () => {
    if (!cacheSystem) {
      return systemPromptSuffix
        ? `${systemPrompt}\n\n${systemPromptSuffix}`
        : systemPrompt;
    }
    type SystemBlock = {
      type: "text";
      text: string;
      cache_control?: { type: "ephemeral" };
    };
    const blocks: SystemBlock[] = [
      { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
    ];
    if (systemPromptSuffix) {
      blocks.push({ type: "text", text: systemPromptSuffix });
    }
    return blocks;
  };

  const makeCall = () =>
    anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      // The SDK types accept string | TextBlockParam[]; we conditionally
      // build one or the other above.
      system: buildSystem() as unknown as string,
      messages: [{ role: "user", content: userPrompt }],
    });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await makeCall();
    clearTimeout(timeout);

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    return textBlock.text;
  } catch (error: unknown) {
    // Retry once on 5xx or timeout
    const isRetryable =
      error instanceof Anthropic.APIError
        ? error.status >= 500
        : error instanceof Error && error.name === "AbortError";

    if (isRetryable) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));

      const response = await makeCall();
      const textBlock = response.content.find(
        (block) => block.type === "text"
      );
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text response from Claude on retry");
      }
      return textBlock.text;
    }

    throw error;
  }
}

export function parseJsonResponse<T>(raw: string): T {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();
  return JSON.parse(cleaned) as T;
}
