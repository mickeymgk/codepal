import { ExtensionContext, languages, workspace, window, debug, commands } from "vscode";
import { logger } from "./logger";
import { codepalCommands } from "./commands";
import { CodePalStatusBarItem } from "./CodePalStatusBarItem";
import { CompletionProvider } from "./CompletionProvider";
import { CloudflareAgent } from "./CloudflareAgent";
import { CodePalViewProvider } from "./CodePalViewProvider";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  logger().info("Activating CodePal extension");

  const config = workspace.getConfiguration("codepal-vscode");
  const statusBarItem = new CodePalStatusBarItem();

  const accountId = config.get<string>("api.CloudflareAccountID");
  const apiToken = config.get<string>("api.CloudflareApiToken");

  const cloudflareAgent = new CloudflareAgent(accountId, apiToken);
  const provider = new CompletionProvider(statusBarItem, cloudflareAgent);
  const codePalViewProvider = new CodePalViewProvider(context, cloudflareAgent, statusBarItem);

  context.subscriptions.push(
    languages.registerInlineCompletionItemProvider({ pattern: "**" }, provider),
    statusBarItem.register(),
    ...codepalCommands(),
    window.registerWebviewViewProvider(CodePalViewProvider.viewType, codePalViewProvider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );

  workspace.onDidChangeConfiguration(async (event) => {
    statusBarItem.update();
    if (
      event.affectsConfiguration("codepal-vscode.api.CloudflareAccountID") ||
      event.affectsConfiguration("codepal-vscode.api.CloudflareApiToken")
    ) {
      cloudflareAgent.updateConfiguration(
        config.get<string>("api.CloudflareAccountID"),
        config.get<string>("api.CloudflareApiToken"),
      );
      statusBarItem.update();
      logger().info("Account or Token changed.");
    }
  });

  debug.onDidChangeActiveDebugSession(() => {
    statusBarItem.update();
  });
  commands.registerCommand("codepal-vscode.refreshChat", () => codePalViewProvider.refresh());
  logger().info("Activated CodePal extension");
}

// this method is called when your extension is deactivated
export async function deactivate() {
  logger().info("Deactivating CodePal extension.");
}
