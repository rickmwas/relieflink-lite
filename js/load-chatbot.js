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

    // Append HTML body content (except full HTML structure)
    const bodyContent = temp.querySelector('body') || temp;
    Array.from(bodyContent.children).forEach(el => {
      document.body.appendChild(el.cloneNode(true));
    });

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
  .catch(err => console.error("Chatbot failed to load:", err));
