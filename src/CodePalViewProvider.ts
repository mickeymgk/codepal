import * as vscode from "vscode";
import { ExtensionContext, Uri, Webview, WebviewView } from "vscode";
import { ApiResponse, CloudflareAgent, Model } from "./CloudflareAgent";
import { CodePalStatusBarItem } from "./CodePalStatusBarItem";

export class CodePalViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "codepal-vscode.chatView";

  private view?: WebviewView;
  private context: ExtensionContext;
  private extensionUri: Uri;
  private agent: CloudflareAgent;
  private statusBar: CodePalStatusBarItem;

  constructor(context: ExtensionContext, agent: CloudflareAgent, statusBar: CodePalStatusBarItem) {
    this.context = context;
    this.extensionUri = context.extensionUri;
    this.agent = agent;
    this.statusBar = statusBar;
  }

  public resolveWebviewView(webviewView: WebviewView) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview, this.extensionUri);

    console.log(this.getHtmlForWebview(webviewView.webview, this.extensionUri));

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "getMessage":
          this.getMessage(data.value);
          break;
      }
    });
  }

  private async getMessage(message: string) {
    let prompt = "";
    const selection = vscode.window.activeTextEditor?.selection;
    const selectedText = vscode.window.activeTextEditor?.document.getText(selection);

    if (selection && selectedText) {
      prompt = `${prompt}\n${selectedText}\n`;
    } else {
      prompt = message;
    }

    this.statusBar.toLoading();
    const response: ApiResponse = await this.agent.getMessage(Model.Instruct, prompt);

    if (this.view) {
      this.view.webview.postMessage({ type: "addResponse", value: response.result.response });
    }
    this.statusBar.update();
  }

  private getHtmlForWebview(webview: Webview, extensionUri: Uri) {
    const codicons = webview.asWebviewUri(
      Uri.joinPath(extensionUri, "node_modules", "@vscode/codicons", "dist", "codicon.css"),
    );
    const logic = webview.asWebviewUri(Uri.joinPath(extensionUri, "assets", "logic.js"));
    const highlight = webview.asWebviewUri(Uri.joinPath(extensionUri, "assets", "highlight.min.js"));
    const vscodeTheme = webview.asWebviewUri(Uri.joinPath(extensionUri, "assets", "vs2015.min.css"));

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CodePal Chat</title>
    
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: var(--vscode-sideBar-background);
        }
    
        .chat-container {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
    
        .chat-header {
          background-color: var(--vscode-sideBar-background);
          color: white;
          padding: 10px;
          text-align: center;
        }
    
        .chat-body {
          flex-grow: 1;
          padding: 10px;
          overflow-y: auto;
        }
    
        .chat-message {
          margin-bottom: 8px;
          padding: 5px;
          border-radius: 5px;
        }
    
        .chat-input-container {
          height: 34px;
          display: flex;
          align-items: center;
          margin: 12px;
          background-color: var(--vscode-input-background);
          border: 1px solid var(--vscode-input-border);
          border-radius: 2px;
        }
    
        .chat-input-container:focus-within {
          border: 1px solid var(--vscode-inputOption-activeBorder);
        }
    
        .chat-input-container input {
          outline: none;
          width: 100%;
          padding: 6px;
          color: var(--vscode-input-foreground);
          background-color: var(--vscode-input-background);
          border: none;
          font-size: 13px;
        }
    
        .chat-input-container button {
          padding: 6px;
          background-color: transparent;
          border: none;
          cursor: pointer;
        }
    
        .send-icon {
          fill: var(--vscode-activityBar-foreground);
        }
    
        .icon {
          width: 16px;
          height: 16px;
        }
    
        .sender-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .codeview-container {
          margin-bottom: 16px;
        }
      </style>
      <link href="${codicons}" rel="stylesheet" />
      <link href="${vscodeTheme}" rel="stylesheet" />
    </head>
    <body>
      <div class="chat-container">
        <div class="chat-body" id="chat-body">
        </div>
        <div class="chat-input-container">
          <input type="text" id="chat-input" placeholder="Type a message...">
          <button id="send-btn">
            <svg class="send-icon" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M1 1.91L1.78 1.5L15 7.44899V8.3999L1.78 14.33L1 13.91L2.58311 8L1 1.91ZM3.6118 8.5L2.33037 13.1295L13.5 7.8999L2.33037 2.83859L3.6118 7.43874L9 7.5V8.5H3.6118Z" />
            </svg>
          </button>
      </div>
      <script src="${highlight}"></script>
      <script>hljs.highlightAll();</script>
      <script src="${logic}"></script>
    </body>
    </html>`;
  }
}
