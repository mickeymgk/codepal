/* eslint-disable */

(function () {
  const vscode = acquireVsCodeApi();

  let response = "";

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.type) {
      case "addResponse": {
        response = message.value;
        addMessage(response, "CodePal");
        break;
      }
    }
  });

  const chatBody = document.getElementById("chat-body");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

  // TODO: Add option to ignore "shift + enter".
  chatInput.addEventListener("keyup", function (e) {
    if (e.keyCode === 13 || e.key === "Enter") {
      sendMessage();
    }
  });

  sendBtn.addEventListener("click", () => {
    sendMessage();
  });

  function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
      addMessage(message, "You");
      chatInput.value = "";

      vscode.postMessage({
        type: "getMessage",
        value: message,
      });
    }
  }

  function renderMarkdown(markdownText) {
    let md = markdownText;

    const pattern = /(?:^`|[^`]`)([^`]+)(?:`[^`]|`)/gm; // Credits to https://t.me/SamAsEnd
    md = md.replace(pattern, '<code style="margin-left:4px; margin-right:4px;>$1</code>');

    const codeRegex = /```([\s\S]*?)\n([\s\S]+?)\n```/g;
    md = md.replace(codeRegex, function (match, lang, code) {
      lang = lang.trim();
      // If language is empty, pass null to highlightAuto for automatic detection
      if (lang === "") {
        lang = null;
      }
      const codeViewContainer = createCodeView(code);
      return codeViewContainer.outerHTML;
    });

    return md;
  }

  function createCodeView(code) {
    const container = document.createElement("div");
    container.classList.add("codeview-container");

    const codeBlock = document.createElement("pre");
    codeBlock.classList.add("hljs");
    codeBlock.style.backgroundColor = "transparent";
    codeBlock.textContent = code;

    const codeElement = document.createElement("code");
    codeElement.style.backgroundColor = "transparent";
    codeElement.appendChild(codeBlock);
    container.appendChild(codeElement);

    container.style.overflowX = "auto";
    container.style.overflowY = "hidden";

    hljs.highlightElement(codeBlock);
    return container;
  }

  function addMessage(text, sender) {
    const messageElement = document.createElement("div");

    const senderContainer = document.createElement("div");
    senderContainer.classList.add("sender-container");
    const senderName = document.createElement("p");

    const icon = document.createElement("div");
    icon.classList.add("icon", "codicon", "codicon-copilot");

    if (sender === "CodePal") {
      messageElement.style.textAlign = "left";
      senderContainer.appendChild(icon);
    }
    senderContainer.appendChild(senderName);
    senderName.textContent = sender;

    messageElement.appendChild(senderContainer);

    const textContainer = document.createElement("div");
    textContainer.innerHTML = renderMarkdown(text);

    messageElement.appendChild(textContainer);
    messageElement.classList.add("chat-message");

    chatBody.appendChild(messageElement);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
})();

/* eslint-enable */
