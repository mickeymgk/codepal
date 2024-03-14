import { StatusBarAlignment, ThemeColor, window, workspace,
  // commands
 } from "vscode";
import { logger } from "./logger";
import { notifications } from "./notifications";

const label = "CodePal";
const iconLoading = "$(loading~spin)";
const iconCodePal = "$(copilot)";
const iconDisabled = "$(x)";
const iconIssueExist = "$(warning)";
const colorNormal = new ThemeColor("statusBar.foreground");
const colorWarning = new ThemeColor("statusBarItem.warningForeground");
const backgroundColorNormal = new ThemeColor("statusBar.background");
const backgroundColorWarning = new ThemeColor("statusBarItem.warningBackground");

export class CodePalStatusBarItem {
  private logger = logger();
  private item = window.createStatusBarItem(StatusBarAlignment.Right);

  constructor() {
    this.update();
    this.item.show();
  }

  public register() {
    return this.item;
  }

  public isConfigured(): boolean {
    const config = workspace.getConfiguration("codepal")
    const apiKey = config.get<string>("api.CloudflareApiToken");
    const accountId = config.get<string>("api.CloudflareAccountID");
  
    if (apiKey && accountId) {
      logger().info("Api token & account configured correctly.");
      return true;
    } else {
      logger().info("Api token or account is misconfigured.");
      return false;
    }
  }

  public update() {
    if (this.isConfigured()) {
      if (workspace.getConfiguration("codepal").get("inlineCompletion.triggerMode") === "automatic") {
        this.toAutomatic();
      } else {
        this.toManual();
      }
    } else {
      this.toIssuesExist();
    }
  }

  private toAutomatic() {
    this.item.color = colorNormal;
    this.item.backgroundColor = backgroundColorNormal;
    this.item.text = `${iconCodePal} ${label} (auto)`;
    this.item.tooltip = "CodePal automatic code completion is enabled.";
    this.item.command = {
      title: "",
      command: "codepal.applyCallback",
      arguments: [() => notifications.showInformationWhenAutomaticTrigger()],
    };
  }

  private toManual() {
    this.item.color = colorNormal;
    this.item.backgroundColor = backgroundColorNormal;
    this.item.text = `${iconCodePal} ${label} (manual)`;
    this.item.tooltip = "CodePal is standing by, click or press `Alt + \\` to trigger code completion.";
    this.item.command = {
      title: "",
      command: "codepal.applyCallback",
      arguments: [() => notifications.showInformationWhenManualTrigger()],
    };
  }

  public toLoading() {
    this.item.color = colorNormal;
    this.item.backgroundColor = backgroundColorNormal;
    this.item.text = `${iconLoading} ${label}`;
    this.item.tooltip = "CodePal is generating code completions.";
    this.item.command = {
      title: "",
      command: "codepal.applyCallback",
    };
  }

  private toDisabled() {
    this.item.color = colorWarning;
    this.item.backgroundColor = backgroundColorWarning;
    this.item.text = `${iconDisabled} ${label}`;
    this.item.tooltip = "CodePal is disabled. Click to check settings.";
    this.item.command = {
      title: "",
      command: "codepal.applyCallback",
      arguments: [() => notifications.showInformationWhenInlineSuggestDisabled()],
    };

    this.logger.info("CodePal code completion is enabled but vscode inline suggest is disabled.");
  }

  private toIssuesExist() {
    this.item.color = colorWarning;
    this.item.backgroundColor = backgroundColorWarning;
    this.item.text = `${iconIssueExist} ${label}`;
    this.item.tooltip = "CodePal is not configured corretly. Click to check settings.";
    this.item.command = {
      title: "",
      command: "codepal.applyCallback",
      arguments: [() => notifications.showInformationWhenNotConfigured()],
    };
  }

}
