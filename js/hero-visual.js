// Canvas network background for hero section
(function(){
  const canvas = document.createElement('canvas');
  canvas.id = 'network-bg';
  canvas.className = 'network-bg';
  document.querySelector('.hero').prepend(canvas);
  const ctx = canvas.getContext('2d');
  let nodes = [], links = [];
  const NODE_COUNT = window.innerWidth < 600 ? 12 : 24;
  const LINK_DIST = 140;
  const colors = ['#2d9cdb', '#27ae60', '#fff'];

  function resizeCanvas() {
    canvas.width = document.querySelector('.hero').offsetWidth;
    canvas.height = document.querySelector('.hero').offsetHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function createNetwork() {
    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 3 + Math.random() * 2,
        color: colors[i % colors.length]
      });
    }
  }
  createNetwork();

  function drawNetwork() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw links
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          ctx.save();
          ctx.globalAlpha = 0.12 + 0.18 * (1 - dist / LINK_DIST);
          ctx.strokeStyle = '#2d9cdb';
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
    // Draw nodes
    for (const node of nodes) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, 2 * Math.PI);
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = node.color;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.restore();
    }
  }

  function updateNetwork() {
    for (const node of nodes) {
      node.x += node.vx;
      node.y += node.vy;
      // Bounce off edges
      if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
      if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
    }
  }

  function animate() {
    updateNetwork();
    drawNetwork();
    requestAnimationFrame(animate);
  }
  animate();
})();

// Animate hero text on load
window.addEventListener('DOMContentLoaded', function() {
  var title = document.querySelector('.hero h2');
  var subtitle = document.querySelector('.hero p');
  if(title && subtitle) {
    title.style.opacity = 1;
    title.style.transform = 'translateY(0)';
    subtitle.style.opacity = 1;
    subtitle.style.transform = 'translateY(0)';
  }
});
