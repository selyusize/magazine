// Healthcheck контейнера (Docker/Traefik): сервер Next отвечает. Medusa намеренно не проверяется —
// её недоступность не должна снимать витрину с балансировки.
export function GET() {
  return Response.json({ status: "ok" });
}
