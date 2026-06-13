const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const path = require("path");

// Icon helpers
function renderIconSvg(IconComponent, color = "#000000", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

async function main() {
  const { FaLeaf, FaCamera, FaMobileAlt, FaServer, FaBrain, FaChartLine, FaLightbulb, FaRocket, FaCheckCircle, FaArrowRight, FaShieldAlt, FaTint, FaQuestionCircle, FaGithub } = require("react-icons/fa");

  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Muhammad Ammar Shaikh & Azhar";
  pres.title = "FasalGuard - AI-Powered Plant Disease Detection";

  const C = {
    green: "22C55E",
    greenDark: "15803D",
    greenBg: "F0FDF4",
    navy: "1E293B",
    white: "FFFFFF",
    text: "1E293B",
    textMuted: "64748B",
    cardBg: "F8FAFC",
    cardBorder: "E2E8F0",
  };

  const FONT = "Inter";

  // Helper: reusable shadow factory
  const cardShadow = () => ({ type: "outer", color: "000000", blur: 6, offset: 2, angle: 45, opacity: 0.10 });

  // Load icon helper
  async function loadIcons() {
    return {
      leaf: await iconToBase64Png(FaLeaf, "#" + C.green, 256),
      leafWhite: await iconToBase64Png(FaLeaf, "#FFFFFF", 256),
      camera: await iconToBase64Png(FaCamera, "#" + C.green, 256),
      mobile: await iconToBase64Png(FaMobileAlt, "#" + C.green, 256),
      server: await iconToBase64Png(FaServer, "#" + C.green, 256),
      brain: await iconToBase64Png(FaBrain, "#" + C.green, 256),
      chart: await iconToBase64Png(FaChartLine, "#" + C.green, 256),
      bulb: await iconToBase64Png(FaLightbulb, "#" + C.green, 256),
      rocket: await iconToBase64Png(FaRocket, "#" + C.white, 256),
      check: await iconToBase64Png(FaCheckCircle, "#" + C.green, 256),
      arrow: await iconToBase64Png(FaArrowRight, "#" + C.green, 256),
      shield: await iconToBase64Png(FaShieldAlt, "#" + C.green, 256),
      question: await iconToBase64Png(FaQuestionCircle, "#" + C.white, 256),
      github: await iconToBase64Png(FaGithub, "#" + C.navy, 256),
    };
  }

  const icons = await loadIcons();

  // ===================================================================
  // SLIDE 1 — TITLE
  // ===================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.greenDark };

    // Decorative top-right leaf
    s.addImage({ data: icons.leafWhite, x: 7.5, y: 0.3, w: 2, h: 2, transparency: 80, rotate: 15 });

    s.addText("FasalGuard", {
      x: 1, y: 1.2, w: 8, h: 1.2, fontSize: 48, fontFace: FONT,
      color: C.white, bold: true, align: "center", margin: 0,
    });

    s.addText("AI-Powered Plant Disease Detection", {
      x: 1, y: 2.4, w: 8, h: 0.6, fontSize: 20, fontFace: FONT,
      color: C.white, align: "center", margin: 0, transparency: 20,
    });

    s.addText("Apni Fasal Ki Hifazat Karein", {
      x: 1, y: 3.1, w: 8, h: 0.5, fontSize: 16, fontFace: FONT,
      color: C.white, align: "center", margin: 0, italic: true, transparency: 40,
    });

    // Separator line
    s.addShape(pres.shapes.LINE, {
      x: 3.5, y: 3.8, w: 3, h: 0, line: { color: C.white, width: 1.5, transparency: 50 },
    });

    s.addText("Muhammad Ammar Shaikh & Azhar", {
      x: 1, y: 4.0, w: 8, h: 0.5, fontSize: 16, fontFace: FONT,
      color: C.white, align: "center", margin: 0, bold: true,
    });

    s.addText("SMIT Students  |  Final Year Project", {
      x: 1, y: 4.5, w: 8, h: 0.4, fontSize: 13, fontFace: FONT,
      color: C.white, align: "center", margin: 0, transparency: 40,
    });

    s.addNotes("Title slide. Introduce FasalGuard as an AI-powered plant disease detection app. Mention it's a final year project by Muhammad Ammar Shaikh and Azhar at SMIT.");
  }

  // ===================================================================
  // SLIDE 2 — PROBLEM STATEMENT
  // ===================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };

    s.addText("The Problem", {
      x: 0.8, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: FONT,
      color: C.navy, bold: true, margin: 0,
    });

    // Green underline accent
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 1.0, w: 1.2, h: 0.06, fill: { color: C.green },
    });

    const problems = [
      "Plant diseases cause 20-40% of global crop losses annually",
      "Small farmers lack access to expert plant pathologists",
      "Manual diagnosis is slow, subjective, and often inaccurate",
      "Late detection leads to uncontrolled spread and economic loss",
    ];

    s.addText(problems.map((p, i) => ({
      text: p, options: { bullet: true, breakLine: i < problems.length - 1, fontSize: 16, fontFace: FONT, color: C.text, paraSpaceAfter: 10 },
    })), { x: 0.8, y: 1.4, w: 8.4, h: 3.0 });

    // Bottom stat card
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 4.5, w: 8.4, h: 0.8, fill: { color: C.greenBg },
      shadow: cardShadow(),
    });
    s.addText([
      { text: "70% ", options: { bold: true, fontSize: 22, color: C.greenDark, fontFace: FONT } },
      { text: "of plant disease impact could be reduced with early detection", options: { fontSize: 14, color: C.text, fontFace: FONT } },
    ], { x: 0.8, y: 4.5, w: 8.4, h: 0.8, align: "center", valign: "middle" });

    s.addNotes("Discuss the problem space: crop losses, lack of expert access, late detection. Emphasize that early detection can reduce impact by 70%.");
  }

  // ===================================================================
  // SLIDE 3 — SOLUTION OVERVIEW
  // ===================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };

    s.addText("Our Solution", {
      x: 0.8, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: FONT,
      color: C.navy, bold: true, margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 1.0, w: 1.2, h: 0.06, fill: { color: C.green },
    });

    s.addText("FasalGuard is an AI-powered mobile app that instantly identifies plant diseases from a leaf photo", {
      x: 0.8, y: 1.3, w: 8.4, h: 0.6, fontSize: 15, fontFace: FONT, color: C.textMuted, margin: 0,
    });

    // Three solution cards
    const solutionCards = [
      { icon: icons.mobile, title: "Snap & Detect", desc: "Take a photo or upload from gallery — get disease identification in seconds" },
      { icon: icons.brain, title: "AI-Powered", desc: "YOLOv8 + Vision Transformer cascade achieves ~93% accuracy on 38 disease classes" },
      { icon: icons.bulb, title: "Actionable Insights", desc: "Receive treatment advice, severity assessment, and plant care guides" },
    ];

    solutionCards.forEach((card, i) => {
      const cx = 0.8 + i * 3.0;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: cx, y: 2.3, w: 2.7, h: 3.0, fill: { color: C.cardBg },
        shadow: cardShadow(),
      });
      s.addImage({ data: card.icon, x: cx + 0.95, y: 2.5, w: 0.8, h: 0.8 });
      s.addText(card.title, {
        x: cx, y: 3.4, w: 2.7, h: 0.5, fontSize: 16, fontFace: FONT,
        color: C.navy, bold: true, align: "center", margin: 0,
      });
      s.addText(card.desc, {
        x: cx + 0.2, y: 3.9, w: 2.3, h: 1.2, fontSize: 12, fontFace: FONT,
        color: C.textMuted, align: "center", margin: 0,
      });
    });

    s.addNotes("Present the three pillars of FasalGuard: Snap & Detect (easy mobile capture), AI-Powered (YOLO + ViT cascade with 93% accuracy), and Actionable Insights (treatment, severity, care guides).");
  }

  // ===================================================================
  // SLIDE 4 — SYSTEM ARCHITECTURE
  // ===================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };

    s.addText("System Architecture", {
      x: 0.8, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: FONT,
      color: C.navy, bold: true, margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 1.0, w: 1.2, h: 0.06, fill: { color: C.green },
    });

    // Architecture flow boxes
    const layers = [
      { y: 1.3, label: "React Native App (Expo SDK 56)", icon: icons.mobile, w: 8.4, color: C.greenBg, textColor: C.greenDark },
    ];

    // Flow arrow = LINE
    const arrowY = (y) => {
      s.addShape(pres.shapes.LINE, { x: 4.8, y, w: 0.4, h: 0, line: { color: C.textMuted, width: 2 } });
    };

    // App layer
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 1.3, w: 8.4, h: 0.65, fill: { color: C.greenBg },
      shadow: cardShadow(),
    });
    s.addImage({ data: layers[0].icon, x: 1.0, y: 1.38, w: 0.45, h: 0.45 });
    s.addText(layers[0].label, {
      x: 1.6, y: 1.3, w: 7.4, h: 0.65, fontSize: 14, fontFace: FONT,
      color: layers[0].textColor, bold: true, valign: "middle", margin: 0,
    });

    arrowY(2.1);

    // API layer
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 2.25, w: 8.4, h: 0.65, fill: { color: "EFF6FF" },
      shadow: cardShadow(),
    });
    s.addImage({ data: icons.server, x: 1.0, y: 2.33, w: 0.45, h: 0.45 });
    s.addText("FastAPI Backend (HuggingFace Spaces)", {
      x: 1.6, y: 2.25, w: 7.4, h: 0.65, fontSize: 14, fontFace: FONT,
      color: "1D4ED8", bold: true, valign: "middle", margin: 0,
    });

    arrowY(3.05);

    // Model layer
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 3.2, w: 8.4, h: 0.65, fill: { color: "FEF3C7" },
      shadow: cardShadow(),
    });
    s.addImage({ data: icons.brain, x: 1.0, y: 3.28, w: 0.45, h: 0.45 });
    s.addText("YOLOv8 → ViT Classifier → Severity Analysis → Knowledge Base", {
      x: 1.6, y: 3.2, w: 7.4, h: 0.65, fontSize: 13, fontFace: FONT,
      color: "92400E", bold: true, valign: "middle", margin: 0,
    });

    // Bottom response
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 1.5, y: 4.3, w: 7.0, h: 0.7, fill: { color: C.greenBg },
      shadow: cardShadow(),
    });
    s.addImage({ data: icons.check, x: 1.7, y: 4.38, w: 0.5, h: 0.5 });
    s.addText("Response: Disease + Confidence + Severity + Treatment + Care Guide", {
      x: 2.3, y: 4.3, w: 6.0, h: 0.7, fontSize: 13, fontFace: FONT,
      color: C.greenDark, bold: true, valign: "middle", margin: 0,
    });

    s.addNotes("Walk through the system architecture: React Native app sends image to FastAPI backend on HuggingFace Spaces. The model pipeline runs YOLOv8 leaf detection, ViT classification, severity analysis, and knowledge base lookup. Response contains disease name, confidence score, severity, treatment, and care guide.");
  }

  // ===================================================================
  // SLIDE 5 — TECH STACK
  // ===================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };

    s.addText("Technology Stack", {
      x: 0.8, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: FONT,
      color: C.navy, bold: true, margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 1.0, w: 1.2, h: 0.06, fill: { color: C.green },
    });

    // Table-like layout using text
    const techData = [
      ["Layer", "Technology", "Purpose"],
      ["Frontend", "React Native + Expo SDK 56", "Cross-platform mobile app"],
      ["State", "Zustand + AsyncStorage", "State management & persistence"],
      ["Backend", "FastAPI (Python 3.12)", "REST API server"],
      ["Model 1", "YOLOv8n (PlantDoc)", "Leaf detection & cropping"],
      ["Model 2", "Vision Transformer (93%)", "38-class disease classifier"],
      ["Chat", "Groq + LLaMA 3.3 70B", "Plant care assistant (RAG)"],
      ["Deploy", "HuggingFace Spaces (Docker)", "Cloud hosting"],
      ["Build", "EAS Cloud → APK", "Android distribution"],
    ];

    const rows = techData.map((row, ri) => row.map((cell, ci) => ({
      text: cell,
      options: {
        fontSize: ri === 0 ? 12 : 11,
        fontFace: FONT,
        bold: ri === 0,
        color: ri === 0 ? C.white : (ci === 0 ? C.greenDark : C.text),
        fill: { color: ri === 0 ? C.greenDark : (ri % 2 === 0 ? C.cardBg : C.white) },
        align: ci === 0 ? "left" : "left",
      },
    })));

    s.addTable(rows, {
      x: 0.8, y: 1.3, w: 8.4,
      colW: [1.8, 3.2, 3.4],
      rowH: [0.45, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38],
      border: { pt: 0.5, color: C.cardBorder },
    });

    s.addNotes("Run through the tech stack: React Native/Expo for the mobile app, FastAPI Python for the backend, YOLOv8 for leaf detection, Vision Transformer for classification, Groq LLaMA for chat, HuggingFace Spaces for deployment, and EAS for APK build.");
  }

  // ===================================================================
  // SLIDE 6 — MODEL PIPELINE
  // ===================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };

    s.addText("AI Model Pipeline", {
      x: 0.8, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: FONT,
      color: C.navy, bold: true, margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 1.0, w: 1.2, h: 0.06, fill: { color: C.green },
    });

    // Pipeline steps
    const steps = [
      { label: "1. Quality Check", desc: "Blur, darkness, leaf presence", color: C.cardBg },
      { label: "2. YOLOv8 Detection", desc: "Leaf bounding box + crop", color: "EFF6FF" },
      { label: "3. ViT Classifier", desc: "38 classes, ~93% accuracy", color: C.greenBg },
      { label: "4. Severity Analysis", desc: "Edge-based severity estimation", color: "FEF3C7" },
      { label: "5. Knowledge Base", desc: "Treatment + care guide lookup", color: "F3E8FF" },
    ];

    steps.forEach((step, i) => {
      const sy = 1.4 + i * 0.8;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: 0.8, y: sy, w: 8.4, h: 0.65, fill: { color: step.color },
        shadow: cardShadow(),
      });
      s.addText(step.label, {
        x: 1.0, y: sy, w: 3.5, h: 0.65, fontSize: 14, fontFace: FONT,
        color: C.navy, bold: true, valign: "middle", margin: 0,
      });
      s.addText(step.desc, {
        x: 4.5, y: sy, w: 4.5, h: 0.65, fontSize: 13, fontFace: FONT,
        color: C.textMuted, valign: "middle", margin: 0,
      });

      if (i < steps.length - 1) {
        s.addShape(pres.shapes.LINE, {
          x: 5.0, y: sy + 0.65, w: 0, h: 0.15, line: { color: C.cardBorder, width: 2 },
        });
      }
    });

    // Bottom detail
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 5.0, w: 8.4, h: 0.45, fill: { color: C.greenBg },
      shadow: cardShadow(),
    });
    s.addText("Graceful fallback: If YOLO fails, full image is used. If ViT fails, TFLite fallback activates.", {
      x: 1.0, y: 5.0, w: 8.0, h: 0.45, fontSize: 11, fontFace: FONT,
      color: C.textMuted, valign: "middle", margin: 0,
    });

    s.addNotes("Detail the 5-step AI pipeline: Quality Check (blur/darkness/leaf), YOLOv8 leaf detection and cropping, Vision Transformer classifier (38 classes, 93% accuracy), severity analysis via edge detection, and knowledge base lookup for treatment and care guides. Graceful fallbacks at every stage.");
  }

  // ===================================================================
  // SLIDE 7 — MOBILE APP SCREENS
  // ===================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };

    s.addText("Mobile App Screens", {
      x: 0.8, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: FONT,
      color: C.navy, bold: true, margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 1.0, w: 1.2, h: 0.06, fill: { color: C.green },
    });

    const screens = [
      { icon: icons.mobile, title: "Loading", desc: "Dark green splash, animated logo, 2.5s auto-transition" },
      { icon: icons.mobile, title: "Home", desc: "Header, leaf hero, Take Photo & Upload buttons" },
      { icon: icons.camera, title: "Camera", desc: "Live preview, capture button, gallery picker" },
      { icon: icons.chart, title: "Result", desc: "Disease, confidence, severity, treatment, care guide" },
      { icon: icons.check, title: "History", desc: "Past scans with severity-colored accent bars" },
      { icon: icons.question, title: "Chat", desc: "Groq-powered Q&A about plant care" },
    ];

    // 3x2 grid
    screens.forEach((screen, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = 0.8 + col * 3.0;
      const cy = 1.4 + row * 1.9;

      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: cx, y: cy, w: 2.7, h: 1.6, fill: { color: C.cardBg },
        shadow: cardShadow(),
      });
      s.addImage({ data: screen.icon, x: cx + 0.15, y: cy + 0.15, w: 0.4, h: 0.4 });
      s.addText(screen.title, {
        x: cx + 0.65, y: cy + 0.15, w: 1.9, h: 0.4, fontSize: 14, fontFace: FONT,
        color: C.navy, bold: true, valign: "middle", margin: 0,
      });
      s.addText(screen.desc, {
        x: cx + 0.15, y: cy + 0.7, w: 2.4, h: 0.8, fontSize: 11, fontFace: FONT,
        color: C.textMuted, margin: 0,
      });
    });

    s.addNotes("Showcase the 6 main screens of the mobile app: Loading (splash), Home (scan options), Camera (live viewfinder), Result (diagnosis with severity/treatment), History (past scans), and Chat (AI-powered plant care Q&A).");
  }

  // ===================================================================
  // SLIDE 8 — APP FLOW
  // ===================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };

    s.addText("User Flow", {
      x: 0.8, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: FONT,
      color: C.navy, bold: true, margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 1.0, w: 1.2, h: 0.06, fill: { color: C.green },
    });

    // Flow steps
    const flowSteps = [
      "Launch App → Loading Screen (2.5s)",
      "Home Screen: Tap 'Take Photo' or 'Upload Image'",
      "Camera Permission Dialog (first use)",
      "Capture/Gallery → Quality Check",
      "YOLO Crop + ViT Classify → Analysis (~3-5s)",
      "Result: Disease, Severity, Treatment, Care Guide",
      "Save to History → Chat follow-up options",
    ];

    s.addText(flowSteps.map((step, i) => ({
      text: step,
      options: {
        bullet: { type: "number" },
        breakLine: i < flowSteps.length - 1,
        fontSize: 14,
        fontFace: FONT,
        color: C.text,
        paraSpaceAfter: 8,
      },
    })), { x: 1.0, y: 1.4, w: 8.0, h: 3.5 });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 1.0, y: 4.9, w: 8.0, h: 0.5, fill: { color: C.greenBg },
      shadow: cardShadow(),
    });
    s.addText("End-to-end time: ~5-8 seconds from photo to result", {
      x: 1.0, y: 4.9, w: 8.0, h: 0.5, fontSize: 13, fontFace: FONT,
      color: C.greenDark, align: "center", valign: "middle", bold: true, margin: 0,
    });

    s.addNotes("Walk through the complete user flow: launch, loading screen, home with two scan options, permission dialog, capture/gallery, quality check, AI analysis (3-5 seconds), result display with severity/treatment, history save, and chat follow-up. Total end-to-end time is about 5-8 seconds.");
  }

  // ===================================================================
  // SLIDE 9 — PLANTVILLAGE CLASSES
  // ===================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };

    s.addText("38 Plant Disease Classes", {
      x: 0.8, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: FONT,
      color: C.navy, bold: true, margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 1.0, w: 1.2, h: 0.06, fill: { color: C.green },
    });

    s.addText("Trained on the PlantVillage dataset — 14 crop species, 38 disease/health classes", {
      x: 0.8, y: 1.2, w: 8.4, h: 0.5, fontSize: 13, fontFace: FONT, color: C.textMuted, margin: 0,
    });

    const crops = [
      ["Apple", "Apple Scab, Black Rot, Cedar Rust, Healthy"],
      ["Corn", "Cercospora, Common Rust, N. Leaf Blight, Healthy"],
      ["Grape", "Black Rot, Black Measles, Leaf Blight, Healthy"],
      ["Potato", "Early Blight, Late Blight, Healthy"],
      ["Tomato", "Bacterial Spot, Early Blight, Late Blight, Leaf Mold, Septoria, Spider Mites, Target Spot, Y. Leaf Curl, Mosaic Virus, Healthy"],
      ["Others", "Blueberry, Cherry, Orange, Peach, Pepper, Raspberry, Soybean, Squash, Strawberry"],
    ];

    const cropRows = crops.map((crop, ri) => [
      { text: crop[0], options: { fontSize: 12, fontFace: FONT, bold: true, color: C.greenDark, fill: { color: ri % 2 === 0 ? C.cardBg : C.white } } },
      { text: crop[1], options: { fontSize: 11, fontFace: FONT, color: C.text, fill: { color: ri % 2 === 0 ? C.cardBg : C.white } } },
    ]);

    s.addTable(cropRows, {
      x: 0.8, y: 1.8, w: 8.4,
      colW: [1.5, 6.9],
      rowH: [0.45, 0.45, 0.45, 0.45, 0.55, 0.55],
      border: { pt: 0.5, color: C.cardBorder },
    });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.8, y: 4.9, w: 8.4, h: 0.5, fill: { color: C.greenBg },
      shadow: cardShadow(),
    });
    s.addText("Accuracy: ~93% on lab images (PlantVillage)  |  Real-world accuracy improved via YOLO leaf cropping", {
      x: 0.8, y: 4.9, w: 8.4, h: 0.5, fontSize: 12, fontFace: FONT,
      color: C.greenDark, align: "center", valign: "middle", bold: true, margin: 0,
    });

    s.addNotes("Cover the 38 PlantVillage classes across 14 crop species. Key crops: Apple, Corn, Grape, Potato, Tomato. Model achieves ~93% accuracy on lab images. Real-world accuracy improved by YOLOv8 leaf cropping that helps the classifier focus on the leaf region.");
  }

  // ===================================================================
  // SLIDE 10 — KEY FEATURES
  // ===================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };

    s.addText("Key Features", {
      x: 0.8, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: FONT,
      color: C.navy, bold: true, margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 1.0, w: 1.2, h: 0.06, fill: { color: C.green },
    });

    const features = [
      { icon: icons.rocket, title: "Instant Diagnosis", desc: "3-5 second inference from photo to result" },
      { icon: icons.shield, title: "YOLO + ViT Cascade", desc: "Leaf detection enhances real-world accuracy" },
      { icon: icons.bulb, title: "Smart Warnings", desc: "Low confidence, multiple plants, poor quality alerts" },
      { icon: icons.chart, title: "Severity Assessment", desc: "Edge-based severity percentage estimation" },
      { icon: icons.check, title: "Treatment Advice", desc: "Disease-specific treatment recommendations" },
      { icon: icons.leaf, title: "Plant Care Guides", desc: "Watering frequency, sunlight, and soil needs" },
      { icon: icons.check, title: "Scan History", desc: "Persist past diagnoses via AsyncStorage" },
      { icon: icons.question, title: "RAG Chatbot", desc: "Groq-powered Q&A on any plant care topic" },
    ];

    // 4x2 grid
    features.forEach((feat, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const cx = 0.8 + col * 2.2;
      const cy = 1.4 + row * 1.9;

      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: cx, y: cy, w: 2.0, h: 1.6, fill: { color: C.cardBg },
        shadow: cardShadow(),
      });
      s.addImage({ data: feat.icon, x: cx + 0.7, y: cy + 0.15, w: 0.6, h: 0.6 });
      s.addText(feat.title, {
        x: cx + 0.1, y: cy + 0.8, w: 1.8, h: 0.35, fontSize: 12, fontFace: FONT,
        color: C.navy, bold: true, align: "center", margin: 0,
      });
      s.addText(feat.desc, {
        x: cx + 0.1, y: cy + 1.1, w: 1.8, h: 0.4, fontSize: 9, fontFace: FONT,
        color: C.textMuted, align: "center", margin: 0,
      });
    });

    s.addNotes("Highlight the 8 key features: Instant 3-5 second diagnosis, YOLO+ViT cascade for real-world accuracy, smart warnings for low confidence/multiple plants, severity assessment, treatment advice, plant care guides, persistent scan history, and Groq-powered RAG chatbot for follow-up questions.");
  }

  // ===================================================================
  // SLIDE 11 — CHALLENGES & SOLUTIONS
  // ===================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };

    s.addText("Challenges & Solutions", {
      x: 0.8, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: FONT,
      color: C.navy, bold: true, margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 1.0, w: 1.2, h: 0.06, fill: { color: C.green },
    });

    const challenges = [
      ["Lab-to-real-world accuracy gap", "YOLOv8 leaf cropping focuses classifier on leaf region"],
      ["HF Spaces rejects binary files", "Git LFS tracks .pt model weights"],
      ["Peer dependency conflicts", "Removed unused TensorFlow packages"],
      ["Large EAS archive (309 MB)", "Trimmed Electron, TensorFlow, dev deps → 11 MB"],
      ["Camera auto-launch on mobile", "Redesigned home with button-based camera trigger"],
      ["Permission handling", "Custom modal dialog before native system prompt"],
    ];

    const chalRows = challenges.map((row, ri) => [
      { text: row[0], options: { fontSize: 12, fontFace: FONT, bold: true, color: C.text, fill: { color: ri % 2 === 0 ? C.cardBg : C.white }, align: "left" } },
      { text: row[1], options: { fontSize: 11, fontFace: FONT, color: C.textMuted, fill: { color: ri % 2 === 0 ? C.cardBg : C.white }, align: "left" } },
    ]);

    s.addTable(chalRows, {
      x: 0.8, y: 1.3, w: 8.4,
      colW: [3.2, 5.2],
      rowH: [0.55, 0.55, 0.55, 0.55, 0.55, 0.55],
      border: { pt: 0.5, color: C.cardBorder },
    });

    s.addNotes("Discuss the key challenges faced and their solutions: lab-to-real-world accuracy gap (solved by YOLO cropping), HF Spaces binary rejection (Git LFS), peer dependency conflicts (removed TensorFlow), 309 MB archive (trimmed to 11 MB), camera auto-launch (button-based redesign), and permission handling (custom dialog).");
  }

  // ===================================================================
  // SLIDE 12 — FUTURE WORK
  // ===================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.white };

    s.addText("Future Work", {
      x: 0.8, y: 0.4, w: 8, h: 0.7, fontSize: 32, fontFace: FONT,
      color: C.navy, bold: true, margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y: 1.0, w: 1.2, h: 0.06, fill: { color: C.green },
    });

    const futureItems = [
      "Retrain ViT on augmented real-field dataset (87k images from New Plant Diseases Dataset)",
      "Swap ViT-base for ConvNeXt-Base for higher real-world accuracy",
      "Add offline inference via TFLite conversion (remove backend dependency)",
      "Multi-language support (Urdu, Sindhi, regional languages)",
      "Real-time camera scanning without manual capture",
      "iOS version via EAS Build",
      "Integrate weather API for disease risk forecasting",
    ];

    s.addText(futureItems.map((item, i) => ({
      text: item, options: { bullet: true, breakLine: i < futureItems.length - 1, fontSize: 14, fontFace: FONT, color: C.text, paraSpaceAfter: 8 },
    })), { x: 0.8, y: 1.4, w: 8.4, h: 3.5 });

    s.addNotes("Outline future improvements: retrain on larger real-field dataset, swap to ConvNeXt-Base for higher accuracy, add offline TFLite inference for no-internet use, multi-language support, real-time scanning, iOS version, and weather-based risk forecasting.");
  }

  // ===================================================================
  // SLIDE 13 — THANK YOU
  // ===================================================================
  {
    const s = pres.addSlide();
    s.background = { color: C.greenDark };

    s.addImage({ data: icons.leafWhite, x: 4.3, y: 0.6, w: 1.4, h: 1.4, transparency: 60, rotate: 10 });

    s.addText("Thank You", {
      x: 1, y: 2.2, w: 8, h: 1, fontSize: 44, fontFace: FONT,
      color: C.white, bold: true, align: "center", margin: 0,
    });

    s.addShape(pres.shapes.LINE, {
      x: 3.5, y: 3.3, w: 3, h: 0, line: { color: C.white, width: 2, transparency: 50 },
    });

    s.addText("Questions?", {
      x: 1, y: 3.5, w: 8, h: 0.6, fontSize: 20, fontFace: FONT,
      color: C.white, align: "center", margin: 0, transparency: 20,
    });

    s.addText("Muhammad Ammar Shaikh & Azhar  |  SMIT", {
      x: 1, y: 4.3, w: 8, h: 0.5, fontSize: 14, fontFace: FONT,
      color: C.white, align: "center", margin: 0, transparency: 40,
    });

    s.addImage({ data: icons.github, x: 1.5, y: 4.8, w: 0.35, h: 0.35, transparency: 50 });
    s.addText("github.com/MAmmarShaikh01/fasalguard", {
      x: 1.9, y: 4.8, w: 5, h: 0.35, fontSize: 11, fontFace: FONT,
      color: C.white, valign: "middle", margin: 0, transparency: 50,
    });

    s.addNotes("Closing slide. Thank the audience and open for questions. Provide GitHub link for the project.");
  }

  // ===================================================================
  // SAVE
  // ===================================================================
  const outputPath = path.join(__dirname, "FasalGuard_Presentation.pptx");
  await pres.writeFile({ fileName: outputPath });
  console.log("Presentation saved to:", outputPath);
}

main().catch(console.error);
