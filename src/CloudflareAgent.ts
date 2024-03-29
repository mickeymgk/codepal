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
      const parsedResponse: ApiResponse = await response.json();
      logger().info("Suggestion received from server");
      return parsedResponse;
    } else {
      const errorMessage = `Error: ${response.statusText}`;
      return Promise.reject(new Error(errorMessage));
    }
  }

  public async getMessage(model: Model, prompt: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}${this.accountId}/ai/run/${model}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (response.ok) {
      const parsedResponse: ApiResponse = await response.json();
      logger().info("Message received from server", parsedResponse);
      return parsedResponse;
    } else {
      const errorMessage = `Error: ${response.statusText}`;
      return Promise.reject(new Error(errorMessage));
    }
  }

  public updateConfiguration(accountId: string = "", apiToken: string = "") {
    this.accountId = accountId;
    this.apiToken = apiToken;
  }
}
