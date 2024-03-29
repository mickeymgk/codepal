import { ConfigurationTarget, workspace, window, commands, env, Uri, InputBoxValidationSeverity } from "vscode";
import { logger } from "./logger";

const configTarget = ConfigurationTarget.Global;

type Command = {
  command: string;
  callback: (...args: any[]) => any;
  thisArg?: any;
};

const gettingStarted: Command = {
  command: "codepal.gettingStarted",
  callback: () => {
    commands.executeCommand("workbench.action.openWalkthrough", "MickeyMGK.codepal#gettingStarted");
  },
};

const openOnlineHelp: Command = {
  command: "codepal.openOnlineHelp",
  callback: () => {
    env.openExternal(Uri.parse("https://github.com/mickeymgk/codepal/issues"))
  }
}

const openSettings: Command = {
  command: "codepal.openSettings",
  callback: () => {
    commands.executeCommand("workbench.action.openSettings", "@ext:MickeyMGK.codepal");
  },
};

const applyCallback: Command = {
  command: "codepal.applyCallback",
  callback: (callback) => {
    callback?.();
  },
};

const openSignUpPage: Command = {
  command: "codepal.openSignUpPage",
  callback: () => {
    env.openExternal(Uri.parse("https://dash.cloudflare.com/sign-up"))
  }
}

const triggerInlineCompletion: Command = {
  command: "codepal.triggerInlineCompletion",
  callback: () => {
    commands.executeCommand("editor.action.inlineSuggest.trigger");
  },
};

const toggleInlineCompletionTriggerMode: Command = {
  command: "codepal.toggleInlineCompletionTriggerMode",
  callback: (value: "automatic" | "manual" | undefined) => {
    const configuration = workspace.getConfiguration("codepal");
    let target = value;
    if (!target) {
      const current = configuration.get("inlineCompletion.triggerMode", "automatic");
      if (current === "automatic") {
        target = "manual";
      } else {
        target = "automatic";
      }
    }
    configuration.update("inlineCompletion.triggerMode", target, configTarget, false);
  },
};

const setAccountId: Command = {
  command: "codepal.setAccountId",
  callback: () => {
    const configuration = workspace.getConfiguration("codepal");
    window
      .showInputBox({
        prompt: "Enter your Cloudflare Account ID",
        value: configuration.get("api.CloudflareAccountID", ""),
        validateInput: (input: string) => {
          const regex = /^[a-zA-Z0-9]{32}$/;
          if (regex.test(input)) {
            return null;
          } else {
            return {
              message: "Please enter a valid account ID",
              severity: InputBoxValidationSeverity.Error,
            };
          }
        },
      })
      .then((accountId) => {
        if (accountId) {
          logger().debug("Set CodePal AccountID: ", accountId);
          configuration.update("api.CloudflareAccountID", accountId, configTarget, false);
        }
      });
  },
}

const setApiToken: Command = {
  command: "codepal.setApiToken",
  callback: () => {
    const configuration = workspace.getConfiguration("codepal");
    window
      .showInputBox({
        prompt: "Enter your Cloudflare API token",
        value: configuration.get("api.CloudflareApiToken", ""),
        password: true,
        validateInput: (input: string) => {
          const regex = /^[a-zA-Z0-9\S]{40}$/;
          if (regex.test(input)) {
            return null;
          } else {
            return {
              message: "Please enter a valid API token",
              severity: InputBoxValidationSeverity.Error,
            };
          }
        },
      })
      .then((apiToken) => {
        if (apiToken) {
          logger().debug("Set CodePal Api token: ", apiToken);
          configuration.update("api.CloudflareApiToken", apiToken, configTarget, false);
        }
      });
  },
}

export const codepalCommands = () =>
  [
    applyCallback,
    setAccountId,
    setApiToken,
    toggleInlineCompletionTriggerMode,
    openSettings,
    gettingStarted,
    openSignUpPage,
    triggerInlineCompletion,
    openOnlineHelp
  ].map((command) => commands.registerCommand(command.command, command.callback, command.thisArg));
