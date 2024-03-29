import {
  CancellationToken,
  InlineCompletionContext,
  InlineCompletionItem,
  InlineCompletionItemProvider,
  InlineCompletionTriggerKind,
  Position,
  Range,
  TextDocument,
  window,
  workspace,
} from "vscode";
import { logger } from "./logger";
import { MessageList, Model, ApiResponse } from "./CloudflareAgent";
import { CloudflareAgent } from "./CloudflareAgent";
import { CodePalStatusBarItem } from "./CodePalStatusBarItem";

type DisplayedCompletion = {
  id: string;
  completion: string;
  displayedAt: number;
};

export class CompletionProvider implements InlineCompletionItemProvider {
  private logger = logger(); // TODO: Readonly when in production
  private triggerMode: "automatic" | "manual" | "disabled" = "automatic";
  private displayedCompletion: DisplayedCompletion | null = null;
  private statusbar: CodePalStatusBarItem;
  private agent: CloudflareAgent;

  public constructor(statusbar: CodePalStatusBarItem, agent: CloudflareAgent) {
    this.statusbar = statusbar;
    this.updateConfiguration();
    workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("codepal") || event.affectsConfiguration("editor.inlineSuggest")) {
        this.updateConfiguration();
      }
    });
    this.agent = agent;
  }

  public async provideInlineCompletionItems(
    document: TextDocument,
    position: Position,
    context: InlineCompletionContext,
    token: CancellationToken,
  ): Promise<InlineCompletionItem[] | null> {
    if (this.displayedCompletion) {
      // TODO: auto dismiss by new completion
    }

    if (context.triggerKind === InlineCompletionTriggerKind.Automatic && this.triggerMode === "manual") {
      this.logger.debug("Skip automatic trigger when triggerMode is manual.");
      return null;
    }

    // Skip when triggered automatically
    if (
      context.triggerKind === InlineCompletionTriggerKind.Automatic &&
      window.activeTextEditor &&
      !window.activeTextEditor.selection.isEmpty
    ) {
      this.logger.debug("Text selected, skipping.");
      return null;
    }

    // Check if autocomplete widget is visible
    if (context.selectedCompletionInfo !== undefined) {
      this.logger.debug("Autocomplete widget is visible, skipping.");
      return null;
    }

    // Skip
    if (token?.isCancellationRequested) {
      this.logger.debug("Completion request is canceled before API request.");
      return null;
    }

    // Warning: DO NOT CHANGE ENCODING OF THESE! Even if your editor panic about it.
    const prefix: string = "<｜fim▁begin｜>";
    const infix: string = "<｜fim▁hole｜>";
    const suffix: string = "<｜fim▁end｜>";

    let text = document.getText();
    // add infix at the caret position.
    text = text.slice(0, document.offsetAt(position)) + infix + text.slice(document.offsetAt(position));
    // add prefix.
    text = prefix.concat(text);
    // add suffix.
    text = text.concat(suffix);

    const messageList: MessageList = {
      messages: [{ role: "user", content: text }],
    };

    try {
      this.statusbar.toLoading();
      const response: ApiResponse = await this.agent.getCompletion(Model.Base, messageList);
      this.logger.debug("Responese from endpoint", response.success);
      this.statusbar.update();

      return [
        new InlineCompletionItem(
          response.result.response,
          new Range(position.line, position.character, position.line, position.character),
          {
            command: "codepal.applyCallback",
            title: "CodePal Inline Completion Command",
            arguments: ["ping", "pong"],
          },
        ),
      ];
    } catch (error: any) {
      this.logger.error(error);
    }
    return null;
  }

  private updateConfiguration() {
    if (!workspace.getConfiguration("editor").get("inlineSuggest.enabled", true)) {
      this.triggerMode = "disabled";
    } else {
      this.triggerMode = workspace.getConfiguration("codepal").get("inlineCompletion.triggerMode", "automatic");
    }
  }
}
