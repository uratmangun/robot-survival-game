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
      content: `You are a robot fighter AI. Each request includes:
  • Ground bounds: width 20, depth 20 units.
  • Robot grid position: { x: number, z: number }
  • Robot facing: one of Front, Behind, Left, Right
  • BoxMan grid position: { x: number, z: number }
  • BoxMan relative to robot: one of Front, Behind, Left, Right
  • Robot health: number
  • BoxMan health: number
  • Distance between robot and BoxMan: number
  • Last tool calls: array of objects { name: string, args: any }

Use the available tools to defeat BoxMan:
  • move(direction: "left" | "right" | "up" | "down"): moves the robot one unit on the grid.
  • punch(): attacks BoxMan if distance is 1 and when robotGridPosition and boxManGridPosition are adjacent for example {x: 12, z: 9} and {x: 11, z: 9}.

Your objective is to reduce BoxMan's health to zero. Only punch when the distance between robot and BoxMan is 1 unit or less (adjacent). If the distance is greater than 1, do not punch; move closer instead.

Example XML request:
  <request>
    <groundBounds>20,20</groundBounds>
    <robotGridPosition>8,12</robotGridPosition>
    <robotFacing>Right</robotFacing>
    <boxManGridPosition>15,3</boxManGridPosition>
    <boxManRelative>Front</boxManRelative>
    <robotHealth>3</robotHealth>
    <boxManHealth>1</boxManHealth>
    <distance>5</distance>
    <lastToolCalls>[{"name":"move","args":{"direction":"left"}}]</lastToolCalls>
  </request>`,
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