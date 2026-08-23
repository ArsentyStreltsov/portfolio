export async function sendNtfy({
  title,
  message,
  tags,
  priority,
}: {
  title: string;
  message: string;
  tags?: string;
  priority?: "low" | "default" | "high" | "urgent";
}) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return false;
  const baseUrl = (process.env.NTFY_URL ?? "https://ntfy.sh").replace(/\/$/, "");

  const headers: Record<string, string> = {
    Title: title,
    "Content-Type": "text/plain",
  };
  if (tags) headers.Tags = tags;
  if (priority) headers.Priority = priority;

  const res = await fetch(`${baseUrl}/${topic}`, {
    method: "POST",
    headers,
    body: message,
  });
  return res.ok;
}
