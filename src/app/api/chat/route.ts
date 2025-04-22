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
          name: "check_address",
          description: "Get the connected wallet address.",
          parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "check_balance",
          description: "Get the balance of the connected wallet or an ERC-20 token if address is provided.",
          parameters: {
            type: "object",
            properties: {
              address: {
                type: "string",
                description: "Optional user address.",
              }
            },
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "faucet",
          description: "Show the faucet URL.",
          parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "mint_test_token",
          description: "Mint test tokens to the connected wallet.",
          parameters: {
            type: "object",
            properties: {
              amount: {
                type: "string",
                description: "Amount of test tokens to mint."
              }
            },
            required: ["amount"],
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "transfer",
          description: "Transfer tokens or ETH to a specified address.",
          parameters: {
            type: "object",
            properties: {
              address: {
                type: "string",
                description: "Recipient address."
              },
              amount: {
                type: "string",
                description: "Amount to transfer."
              },
              token_name: {
                type: "string",
                description: "Optional ERC-20 token name."
              }
            },
            required: ["address", "amount"],
            additionalProperties: false,
          },
        },
      }
    ];
    const systemMessage = {
      role: "system",
      content: `This chatbot is intended solely for interacting with the Base Ethereum and Base Sepolia networks.
Available tool calls:
  - check_address: Get the connected wallet address.
  - check_balance: Get the balance of the connected wallet optional address (string).
  - faucet: Show the faucet URL for obtaining testnet tokens.
  - mint_test_token: Mint test tokens to the connected wallet. Requires parameter: amount (number).
  - transfer: Transfer tokens or ETH to a specified address. Requires parameters: address (string), amount (string), and optional token_name (string).

If a question falls outside these tools, respond with list of the tools they can use and their descriptions.`,
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