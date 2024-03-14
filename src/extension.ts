import { ExtensionContext, languages, workspace } from "vscode";
import { logger } from "./logger";
import { codepalCommands } from "./commands";
import { CodePalStatusBarItem } from "./CodePalStatusBarItem";
import { CompletionProvider } from "./CompletionProvider";
import { CloudflareAgent } from "./CloudflareAgent";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  logger().info("Activating CodePal extension");

  const config = workspace.getConfiguration("codepal")
  const statusBarItem = new CodePalStatusBarItem();

  const cloudflareAgent = new CloudflareAgent(
    config.get<string>("api.CloudflareAccountID"),
    config.get<string>("api.CloudflareApiToken")
  );
  const provider = new CompletionProvider(statusBarItem, cloudflareAgent);

  context.subscriptions.push(
    languages.registerInlineCompletionItemProvider({ pattern: "**" }, provider),
    statusBarItem.register(),
    ...codepalCommands(),
  );

  workspace.onDidChangeConfiguration(async (event) => {
    statusBarItem.update();
    if (
      event.affectsConfiguration("codepal.api.CloudflareAccountID") || 
      event.affectsConfiguration("codepal.api.CloudflareApiToken")
    ) {
      cloudflareAgent.updateConfiguration(
        config.get<string>("api.CloudflareAccountID"),
        config.get<string>("api.CloudflareApiToken")
      );
      statusBarItem.update();
      logger().info("Account or Token changed.");
    }
  });

  logger().info("Activated CodePal extension");
}

// this method is called when your extension is deactivated
export async function deactivate() {
  logger().info("Deactivating CodePal extension.");
}
