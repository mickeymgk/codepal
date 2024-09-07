import fetch from "node-fetch";
import { logger } from "./logger";

export interface Message {
  role: string;
  content: string;
}

export interface MessageList {
  messages: Message[];
}

export interface ErrorResponse {
  message: string;
}

export interface ApiResponse {
  errors: ErrorResponse[];
  messages: string[];
  result: any;
  success: boolean;
}

export enum Model {
  Instruct = "@hf/thebloke/deepseek-coder-6.7b-instruct-awq",
  Base = "@hf/thebloke/deepseek-coder-6.7b-base-awq",
}

interface onData {
  onData?: (res: string) => void;
}

export class CloudflareAgent {
  private readonly baseUrl = "https://api.cloudflare.com/client/v4/accounts/";
  private accountId: string;
  private apiToken: string;

  constructor(accountId: string = "", apiToken: string = "") {
    this.accountId = accountId;
    this.apiToken = apiToken;
  }

  public async getCompletion(model: Model, data: MessageList): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}${this.accountId}/ai/run/${model}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const parsedResponse: ApiResponse = (await response.json()) as ApiResponse;
      logger().info("Suggestion received from server");
      return parsedResponse;
    } else {
      const errorMessage = `Error: ${response.statusText}`;
      return Promise.reject(new Error(errorMessage));
    }
  }

  public async getStream(model: Model, prompt: string, onData: (data: string) => void, onEnd: () => void) {
    try {
      const response = await fetch(`${this.baseUrl}${this.accountId}/ai/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiToken}`
        },
        body: JSON.stringify({
          model: model,
          stream: true,
          messages: [{ role: "user", content: prompt }] as Message[],
        }),
      });

      const res = response.body;

      if (!res) {
        throw new Error('Response body is null');
      }

      let buffer: string = '';
      let messageBuffer: string = '';

      res.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();

        let lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (let line of lines) {
          line = line.trim();
          if (line.startsWith('data: ')) {
            const dataLine = line.substring(6).trim();

            if (dataLine === '[DONE]') {
              console.log('Stream ended by server with [DONE]');
              onEnd();
              return;
            }
            messageBuffer += dataLine;
          } else if (line === '') {
            if (messageBuffer) {
              try {
                const message: any = JSON.parse(messageBuffer);
                onData(message);
              } catch (err) {
                console.error('Failed to parse message:', err);
              }
              messageBuffer = '';
            }
          }
        }
      });

      res.on('end', () => {
        onEnd();
      });

      res.on('error', (err: Error) => {
        console.error('Stream error:', err);
      });

    } catch (error) {
      logger().error("Error:", error);
    }
  }

  public updateConfiguration(accountId: string = "", apiToken: string = "") {
    this.accountId = accountId;
    this.apiToken = apiToken;
  }
}
