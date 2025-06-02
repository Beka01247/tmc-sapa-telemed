import Ably from "ably";

export async function GET() {
  if (!process.env.ABLY_API_KEY) {
    return new Response("Ably API key not configured", { status: 500 });
  }

  const client = new Ably.Realtime(process.env.ABLY_API_KEY);
  const tokenRequestData = await client.auth.createTokenRequest({
    clientId: "ably-nextjs-demo",
  });

  return Response.json(tokenRequestData);
}
