// Project Data
const projects = [
  {
    id: 2,
    title: "Hearthstone AI",
    shortDesc:
      "Our flagship AI model with 99.4% accuracy, supporting fingerspelling and speech-to-text across Python and JavaScript frameworks, optimized for Raspberry Pi. Also combined with future work for ISL models and dynamic gestures using LSTM.",
    image: "hearthstone-ai.jpg",
    specs: [
      "Accuracy: 99.4%",
      "Frameworks: Python, Mediapipe, Tensorflow, JavaScript",
      "Platform: Raspberry Pi Optimized",
      "Features: Fingerspelling + Speech-to-Text",
    ],
    techStack: [
      "TensorFlow",
      "MediaPipe",
      "Python",
      "JavaScript",
      "Raspberry Pi",
    ],
    description:
      "Hearthstone AI is the heart of our project — a high-accuracy model that understands both hand signs and spoken words. Built on TensorFlow and MediaPipe, it runs smoothly on a Raspberry Pi and works seamlessly in both Python backends and JavaScript frontends. We're actively developing word gesture recognition to move beyond isolated signs.",
  },
  {
    id: 1,
    title: "Hearthstone Glove",
    shortDesc:
      "Early prototype using Arduino and flex sensors to translate ASL fingerspelling.",
    image: "hearthstone-glove.jpg",
    specs: [
      "Hardware: Arduino Uno",
      "Sensors: 5 Flex Sensors",
      "Detection: Fingerspelling Only",
      "Status: Legacy Prototype",
    ],
    techStack: ["Arduino C", "Flex Sensors", "Analog Circuits"],
    description:
      "Our first iteration — a hardware-based glove that captured finger bends to recognize fingerspelling letters. Though it laid the foundation, we moved on to a more powerful AI-driven approach.",
  },
  {
    id: 4,
    title: "Hearthstone ASL Course",
    shortDesc:
      "Gamified learning platform that teaches ASL through interactive lessons, progression tracking, and a complete course system built with HTML, CSS, and JavaScript.",
    image: "hearthstone-asl-course.jpg",
    specs: [
      "Tech Stack: HTML/CSS/JS",
      "Gamification: XP, Achievements, Levels",
      "Course Structure: Modular",
      "Progress Tracking: Yes",
    ],
    techStack: ["HTML5", "CSS3", "JavaScript", "Gamification"],
    description:
      "Learning ASL should be fun. Our ASL Course platform turns education into a game — complete lessons, earn XP, progress through the tree and build real signing skills. Built entirely with web technologies for maximum accessibility.",
  },
  {
    id: 3,
    title: "Hearthstone PI",
    shortDesc:
      "The main hardware that runs our model to be able to serve detection.",
    image: "hearthstone-asl-course.jpg",
    specs: [
      "Tech Stack: HTML/CSS/JS",
      "Gamification: XP, Achievements, Levels",
      "Course Structure: Modular",
      "Progress Tracking: Yes",
    ],
    techStack: ["HTML5", "CSS3", "JavaScript", "Gamification"],
    description:
      "Through a careful balance of cost and functionality, we have arrived at a combination of the raspberry pi 5 and the pi cam 1.3. Boasting an in house PCB design, power bank as a power source and fully custom build, this hardware allows for our mission to be achievable.",
  },
];

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  initializeProgressBar();
  initializeProjects();
  initParticles(); // Add particle system
});

// ========== PROGRESS BAR ==========
function initializeProgressBar() {
  const progressBar = document.getElementById("progressBar");
  if (!progressBar) return;

  window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    progressBar.style.width = `${progress}%`;
  });
}

// ========== PROJECTS INITIALIZATION ==========
function initializeProjects() {
  const track = document.getElementById("projectsTrack");
  if (!track) return;

  // Generate project panels
  projects.forEach((project, index) => {
    const panel = createProjectPanel(project, index);
    track.appendChild(panel);
  });

  // Initialize Intersection Observer after a slight delay to ensure DOM is ready
  setTimeout(() => {
    initializeIntersectionObserver();
  }, 100);
}

// Create individual project panel DOM
function createProjectPanel(project, index) {
  const panel = document.createElement("div");
  panel.className = "project-panel";
  panel.dataset.projectId = project.id;

  // Spec sheet items
  const specsHtml = project.specs
    .map((spec) => `<div class="spec-item">${spec}</div>`)
    .join("");

  // Tech pills
  const techPillsHtml = project.techStack
    .map((tech) => `<span class="tech-pill">${tech}</span>`)
    .join("");

  panel.innerHTML = `
        <h2>${project.title}</h2>
        <p class="description">${project.description}</p>

        <div class="spec-sheet">
            ${specsHtml}
        </div>

        <div class="tech-stack">
            ${techPillsHtml}
        </div>

        <div class="button-group">
            <a href="#" class="project-btn btn-primary">View Demo</a>
            <a href="#" class="project-btn btn-secondary">GitHub</a>
        </div>
    `;

  return panel;
}

// ========== INTERSECTION OBSERVER (Project Switch) ==========
function initializeIntersectionObserver() {
  const panels = document.querySelectorAll(".project-panel");
  const stickyImage = document.getElementById("stickyImage");
  const imageGlow = document.querySelector(".image-glow");

  if (panels.length === 0 || !stickyImage) return;

  // Set initial image
  if (projects.length > 0) {
    updateStickyImage(stickyImage, projects[0].image);
  }

  const observerOptions = {
    root: null,
    rootMargin: "-30% 0px -30% 0px",
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const projectId = parseInt(entry.target.dataset.projectId);
        const project = projects.find((p) => p.id === projectId);

        if (project) {
          // Update active state
          panels.forEach((p) => p.classList.remove("active"));
          entry.target.classList.add("active");

          // Trigger glitch-scale transition on image
          triggerImageTransition(stickyImage, project.image);
        }
      }
    });
  }, observerOptions);

  panels.forEach((panel) => observer.observe(panel));
}

// Update sticky image with glitch effect
function triggerImageTransition(imageElement, newSrc) {
  imageElement.classList.remove("active");
  imageElement.classList.add("glitch-effect"); // Add glitch animation

  setTimeout(() => {
    updateStickyImage(imageElement, newSrc);
    imageElement.classList.remove("glitch-effect");
    imageElement.classList.add("active");
  }, 400); // Glitch duration 400ms
}

// Helper: Update image src
function updateStickyImage(imageElement, src) {
  // For now, use a gradient placeholder since images don't exist
  // In production, this would set imageElement.src = src;
  imageElement.style.background = generatePlaceholderGradient();
  imageElement.src =
    'data:image/svg+xml,%3Csvg width="500" height="300" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="500" height="300" fill="%230a0a0a"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial, sans-serif" font-size="24" fill="%2300D4FF" text-anchor="middle"%3EProject Preview%3C/text%3E%3C/svg%3E';
}

// Generate a cool placeholder gradient
function generatePlaceholderGradient() {
  const gradients = [
    "linear-gradient(135deg, #00D4FF 0%, #0066ff 100%)",
    "linear-gradient(135deg, #ff00d4 0%, #00D4FF 100%)",
    "linear-gradient(135deg, #00ffaa 0%, #00D4FF 100%)",
    "linear-gradient(135deg, #ff0066 0%, #ff00d4 100%)",
    "linear-gradient(135deg, #6600ff 0%, #ff00d4 100%)",
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
}

// ========== NEURAL MESH PARTICLES ==========
function initParticles() {
  const canvas = document.createElement("canvas");
  canvas.id = "particleCanvas";
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "-1";
  canvas.style.pointerEvents = "none";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let width, height;
  const particles = [];
  const particleCount = 70; // 60-80 nodes
  const connectionDistance = 120;
  const mouseRepelDist = 150;
  const mouse = { x: null, y: null };

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  window.addEventListener("resize", resize);

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener("mouseout", () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Initialize size BEFORE creating particles
  resize();

  // Create particles with valid positions
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 2, // 2-4px
    });
  }

  function update() {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(0, 212, 255, 0.4)"; // line opacity
    ctx.fillStyle = "rgba(0, 212, 255, 0.9)"; // particle opacity

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      if (mouse.x != null) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseRepelDist) {
          const force = (mouseRepelDist - dist) / mouseRepelDist;
          p.x += (dx / dist) * force * 5;
          p.y += (dy / dist) * force * 5;
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectionDistance) {
          ctx.lineWidth = 1 - dist / connectionDistance;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(update);
  }

  update();
}
