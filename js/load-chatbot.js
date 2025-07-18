fetch('chatbot.html')
  .then(res => res.text())
  .then(html => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    // Extract and apply <style> and <script> from chatbot.html
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Append style
    temp.querySelectorAll('style').forEach(style => {
      document.head.appendChild(style.cloneNode(true));
    });

    // Remove any existing chatbot container before injecting
    const oldChatbot = document.querySelector('.chatbot-container');
    if (oldChatbot) oldChatbot.remove();

    // Append HTML body content (except full HTML structure)
    const bodyContent = temp.querySelector('body') || temp;
    Array.from(bodyContent.children).forEach(el => {
      document.body.appendChild(el.cloneNode(true));
    });

    // Re-attach chatbot event listeners after injection
    // No custom event handlers here; let chatbot.html JS handle everything
    // Manually trigger chatbot initialization if present
    setTimeout(() => {
      // Directly run chatbot event binding code after injection
      try {
        const chatbotButton = document.getElementById('chatbotButton');
        const chatbotWindow = document.getElementById('chatbotWindow');
        const chatbotClose = document.getElementById('chatbotClose');
        const chatbotMessages = document.getElementById('chatbotMessages');
        const userInput = document.getElementById('userInput');
        const sendButton = document.getElementById('sendButton');
        if (chatbotButton && chatbotWindow && chatbotClose && chatbotMessages && userInput && sendButton) {
          chatbotButton.addEventListener('click', function() {
            chatbotWindow.classList.toggle('active');
          });
          chatbotClose.addEventListener('click', function() {
            chatbotWindow.classList.remove('active');
          });
          sendButton.addEventListener('click', sendMessage);
          userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
              sendMessage();
            }
          });
          function sendMessage() {
            const message = userInput.value.trim();
            if (message) {
              if (typeof addUserMessage === 'function') addUserMessage(message);
              userInput.value = '';
              if (typeof respondToMessage === 'function') respondToMessage(message);
            }
          }
          // Initial bot greeting
          if (typeof addBotMessage === 'function') {
            addBotMessage("Jambo! I'm ReliefBot, your assistant for ReliefLink Lite. How can I help you today? You can ask about: requesting help, offering help, login/registration, admin dashboard, real-time features, map, or security.");
          }
        }
      } catch (e) { /* ignore */ }
    }, 200);

    // Evaluate scripts
    temp.querySelectorAll('script').forEach(script => {
      const s = document.createElement('script');
      if (script.src) {
        s.src = script.src;
      } else {
        s.textContent = script.textContent;
      }
      document.body.appendChild(s);
    });
  })
  .catch(err => {
    console.error("Chatbot failed to load:", err);
    // Show visible error message
    let errorDiv = document.getElementById('chatbot-error-message');
    if (errorDiv) {
      errorDiv.style.display = 'block';
    } else {
      // Fallback: alert if error div not found
      alert('Chatbot failed to load. Please refresh or check your connection.');
    }
  });

async function getTinyLlamaResponse(message) {
  try {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tinyllama', prompt: message })
    });
    let responseText = '';
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      responseText += decoder.decode(value);
    }
    // NDJSON: last line with "response" is the answer
    const lines = responseText.trim().split('\n');
    let answer = "Sorry, I couldn't find an answer.";
    for (const line of lines.reverse()) {
      try {
        const obj = JSON.parse(line);
        if (obj.response) {
          answer = obj.response;
          break;
        }
      } catch (e) {}
    }
    return answer;
  } catch (e) {
    return "Sorry, I couldn't reach the TinyLlama service right now.";
  }
}
