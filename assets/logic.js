/* eslint-disable */

(function () {
  const vscode = acquireVsCodeApi();

  // Handle messages coming from extension
  window.addEventListener("message", (event) => {
    const message = event.data;
    if (message.type === "add" || message.type === "end") {
      handleIncomingMessage(message);
    } else if (message.type === "refresh") {
      refreshView();
    }
  });

  const chatBody = document.getElementById("chat-body");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const textContainers = [];

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

      const textContainer = addMessage("", "CodePal");
      textContainer.response = "";
      textContainers.push(textContainer);
    }
  }

  function handleIncomingMessage(message) {
    const textContainer = textContainers[textContainers.length - 1];

    if (textContainer) {
      switch (message.type) {
        case "add":
          textContainer.response += message.value.choices[0].delta.content;
          textContainer.innerHTML = renderMarkdown(textContainer.response);
        break;
        case "end":
          textContainer.response = "";
        break;
      }
    }
  }

  function renderMarkdown(markdownText) {
    let md = markdownText;

    const pattern = /(?:^`|[^`]`)([^`]+)(?:`[^`]|`)/gm; // Credits to https://t.me/samsonendale
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

  function refreshView() {
    chatBody.innerHTML = "";
    textContainers = [];
  }

  function addMessage(text, sender) {
    const messageElement = document.createElement("div");

    const senderContainer = document.createElement("div");
    senderContainer.classList.add("sender-container");
    const senderName = document.createElement("p");
    senderName.style.fontWeight = "bold";

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

    return textContainer;
  }
})();

/* eslint-enable */
