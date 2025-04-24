import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
  
    const openai = new OpenAI({
      baseURL: 'https://api.together.xyz/v1',
      apiKey: process.env.TOGETHER_API_KEY,
    });
    const tools: OpenAI.ChatCompletionTool[] = [
      {
        type: "function",
        function: {
          name: "move",
          description: "move the player",
          parameters: {
            type: "object",
            properties: {
              direction: {
                type: "string",
                enum: ["left", "right", "up", "down"],
                description: "direction to move the player",
              }
            },
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "punch",
          description: "punch something in front of you",
          parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
        },
      }
    ];
    const systemMessage = {
      role: "system",
      content: `You are a game controller. Use the available tools as needed:
  • move(direction: "left" | "right" | "up" | "down"): moves the player accordingly
  • punch(): makes the player punch objects in front
  If user asks you to do something that is not possible, list all the things you can do instead.
`,
    };
    const payloadMessages = [systemMessage, ...messages];
    const response = await openai.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
      messages: payloadMessages,
      tools,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error("No message choices returned from AI");
    }

    const message = response.choices[0].message;
    const content = message.content;
    const tool_calls = message.tool_calls;
    return new Response(JSON.stringify({ content, tool_calls }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown server error';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}