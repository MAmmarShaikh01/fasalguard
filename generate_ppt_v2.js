const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const path = require("path");

function renderIconSvg(IconComponent, color, size) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

async function main() {
  const ri = require("react-icons/fa");
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Muhammad Ammar Shaikh & Azhar";
  pres.title = "FasalGuard - Final Year Project";

  const C = {
    green: "22C55E", greenDark: "15803D", greenDeep: "064E3B",
    greenBg: "F0FDF4", navy: "1E293B", white: "FFFFFF",
    text: "1E293B", textMuted: "64748B", cardBg: "F8FAFC",
    cardBorder: "E2E8F0", accent: "0891B2", accentLight: "ECFEFF",
  };
  const FONT = "Inter";
  const cs = () => ({ type: "outer", color: "000000", blur: 6, offset: 2, angle: 45, opacity: 0.10 });

  const icons = {
    leaf: await iconToBase64Png(ri.FaLeaf, "#22C55E", 256),
    leafW: await iconToBase64Png(ri.FaLeaf, "#FFFFFF", 256),
    camera: await iconToBase64Png(ri.FaCamera, "#22C55E", 256),
    brain: await iconToBase64Png(ri.FaBrain, "#22C55E", 256),
    chart: await iconToBase64Png(ri.FaChartLine, "#22C55E", 256),
    bulb: await iconToBase64Png(ri.FaLightbulb, "#22C55E", 256),
    check: await iconToBase64Png(ri.FaCheckCircle, "#22C55E", 256),
    book: await iconToBase64Png(ri.FaBookOpen, "#0891B2", 256),
    flask: await iconToBase64Png(ri.FaFlask, "#22C55E", 256),
    chartBar: await iconToBase64Png(ri.FaChartBar, "#22C55E", 256),
    trophy: await iconToBase64Png(ri.FaTrophy, "#22C55E", 256),
    search: await iconToBase64Png(ri.FaSearch, "#22C55E", 256),
    cogs: await iconToBase64Png(ri.FaCogs, "#22C55E", 256),
    rocket: await iconToBase64Png(ri.FaRocket, "#FFFFFF", 256),
    grad: await iconToBase64Png(ri.FaUserGraduate, "#FFFFFF", 256),
    db: await iconToBase64Png(ri.FaDatabase, "#0891B2", 256),
    clipboard: await iconToBase64Png(ri.FaClipboardList, "#0891B2", 256),
  };

  function addSecTitle(s, title) {
    s.addText(title, { x: 0.6, y: 0.3, w: 8.8, h: 0.6, fontSize: 26, fontFace: FONT, color: C.navy, bold: true, margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 0.85, w: 0.9, h: 0.05, fill: { color: C.green } });
  }

  // ============== SLIDE 1 — TITLE ==============
  {
    const s = pres.addSlide();
    s.background = { color: C.greenDeep };
    s.addImage({ data: icons.leafW, x: 7.5, y: 0.3, w: 2, h: 2, transparency: 80, rotate: 15 });
    s.addText("FasalGuard", { x: 1, y: 0.8, w: 8, h: 1.2, fontSize: 48, fontFace: FONT, color: C.white, bold: true, align: "center", margin: 0 });
    s.addText("AI-Powered Plant Disease Detection System", { x: 1, y: 2.0, w: 8, h: 0.6, fontSize: 18, fontFace: FONT, color: C.white, align: "center", margin: 0, transparency: 20 });
    s.addShape(pres.shapes.LINE, { x: 3.5, y: 2.8, w: 3, h: 0, line: { color: C.white, width: 1.5, transparency: 50 } });
    s.addText("Muhammad Ammar Shaikh & Azhar", { x: 1, y: 3.1, w: 8, h: 0.5, fontSize: 16, fontFace: FONT, color: C.white, align: "center", margin: 0, bold: true });
    s.addText("SMIT Students  |  Final Year Project  2026", { x: 1, y: 3.6, w: 8, h: 0.4, fontSize: 12, fontFace: FONT, color: C.white, align: "center", margin: 0, transparency: 40 });
    s.addNotes("Title slide. Introduce FasalGuard — an AI-powered plant disease detection system. Mention it's a final year project at SMIT.");
  }

  // ============== SLIDE 2 — OUTLINE ==============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    addSecTitle(s, "Presentation Outline");

    const secs = [
      ["01", "Introduction", "Project overview, motivation & objectives"],
      ["02", "Problem Statement", "Crop losses, lack of expert access"],
      ["03", "Literature Review", "Existing approaches & research gap"],
      ["04", "Methodology", "System design, model pipeline, implementation"],
      ["05", "Results & Discussion", "Performance analysis & findings"],
    ];
    secs.forEach((sec, i) => {
      const sy = 1.2 + i * 0.85;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: sy, w: 8.8, h: 0.7, fill: { color: i % 2 === 0 ? C.greenBg : C.cardBg }, shadow: cs() });
      s.addText(sec[0], { x: 0.8, y: sy, w: 0.6, h: 0.7, fontSize: 20, fontFace: FONT, color: C.greenDark, bold: true, valign: "middle", margin: 0 });
      s.addText(sec[1], { x: 1.6, y: sy, w: 2.5, h: 0.7, fontSize: 15, fontFace: FONT, color: C.navy, bold: true, valign: "middle", margin: 0 });
      s.addText(sec[2], { x: 4.3, y: sy, w: 4.9, h: 0.7, fontSize: 12, fontFace: FONT, color: C.textMuted, valign: "middle", margin: 0 });
    });
    s.addNotes("Outline the presentation structure: Introduction, Problem Statement, Literature Review, Methodology, and Results.");
  }

  // ============== SLIDE 3 — INTRODUCTION ==============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    addSecTitle(s, "Introduction");

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.15, w: 4.2, h: 2.5, fill: { color: C.cardBg }, shadow: cs() });
    s.addImage({ data: icons.leaf, x: 0.8, y: 1.25, w: 0.45, h: 0.45 });
    s.addText("What is FasalGuard?", { x: 1.35, y: 1.25, w: 3.3, h: 0.45, fontSize: 14, fontFace: FONT, color: C.navy, bold: true, valign: "middle", margin: 0 });
    s.addText("An AI-powered mobile app that identifies plant diseases instantly from leaf photos using deep learning. Designed for farmers and gardeners with limited access to expert plant pathologists.", { x: 0.8, y: 1.8, w: 3.8, h: 1.7, fontSize: 11, fontFace: FONT, color: C.text, margin: 0 });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.2, y: 1.15, w: 4.2, h: 2.5, fill: { color: C.accentLight }, shadow: cs() });
    s.addImage({ data: icons.trophy, x: 5.4, y: 1.25, w: 0.45, h: 0.45 });
    s.addText("Objectives", { x: 5.95, y: 1.25, w: 3.3, h: 0.45, fontSize: 14, fontFace: FONT, color: C.navy, bold: true, valign: "middle", margin: 0 });
    s.addText([
      { text: "Real-time disease detection using YOLOv8 + ViT cascade", options: { bullet: true, breakLine: true, fontSize: 11, fontFace: FONT, color: C.text } },
      { text: "High accuracy across diverse crop species", options: { bullet: true, breakLine: true, fontSize: 11, fontFace: FONT, color: C.text } },
      { text: "User-friendly mobile interface for non-technical users", options: { bullet: true, breakLine: true, fontSize: 11, fontFace: FONT, color: C.text } },
      { text: "Actionable treatment recommendations", options: { bullet: true, fontSize: 11, fontFace: FONT, color: C.text } },
    ], { x: 5.4, y: 1.8, w: 3.8, h: 1.7, margin: 0 });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 3.9, w: 8.8, h: 1.4, fill: { color: C.greenBg }, shadow: cs() });
    s.addText("Motivation", { x: 0.8, y: 4.0, w: 8.4, h: 0.35, fontSize: 13, fontFace: FONT, color: C.greenDark, bold: true, margin: 0 });
    s.addText("Agriculture employs ~42% of Pakistan's workforce. Plant diseases cause 20-40% annual crop yield losses. Most farmers lack timely expert diagnosis. A smartphone AI solution can democratize plant healthcare, reduce losses, and improve food security.", { x: 0.8, y: 4.35, w: 8.4, h: 0.8, fontSize: 11, fontFace: FONT, color: C.text, margin: 0 });

    s.addNotes("Introduce FasalGuard: an AI-powered mobile app for plant disease detection. Objectives include real-time detection with YOLOv8+ViT, high accuracy, user-friendly interface, and actionable recommendations. Motivation: 42% of Pakistan's workforce in agriculture, 20-40% crop losses from diseases, lack of expert access.");
  }

  // ============== SLIDE 4 — PROBLEM STATEMENT ==============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    addSecTitle(s, "Problem Statement");

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.15, w: 8.8, h: 0.85, fill: { color: C.cardBg }, shadow: cs() });
    s.addImage({ data: icons.search, x: 0.8, y: 1.25, w: 0.5, h: 0.5 });
    s.addText("Core Problem", { x: 1.45, y: 1.15, w: 3, h: 0.5, fontSize: 15, fontFace: FONT, color: C.navy, bold: true, valign: "middle", margin: 0 });
    s.addText("Plant diseases are detected too late, causing significant crop losses. Farmers lack access to expert plant pathologists for timely and accurate diagnosis, especially in rural areas.", { x: 0.8, y: 1.7, w: 8.4, h: 0.3, fontSize: 12, fontFace: FONT, color: C.text, margin: 0 });

    const problems = [
      ["20-40%", "Annual crop losses due to plant diseases globally"],
      ["42%", "of Pakistan's workforce employed in agriculture"],
      ["70%", "of disease impact preventable with early detection"],
      ["Limited", "access to plant pathologists in rural areas"],
    ];
    problems.forEach((p, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = 0.6 + col * 4.55;
      const cy = 2.3 + row * 1.4;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: cy, w: 4.25, h: 1.2, fill: { color: i % 2 === 0 ? C.greenBg : C.accentLight }, shadow: cs() });
      s.addText(p[0], { x: cx + 0.15, y: cy + 0.1, w: 1.2, h: 0.5, fontSize: 22, fontFace: FONT, color: C.greenDark, bold: true, margin: 0 });
      s.addText(p[1], { x: cx + 1.4, y: cy + 0.1, w: 2.7, h: 1.0, fontSize: 11, fontFace: FONT, color: C.text, margin: 0 });
    });

    s.addNotes("Cover the core problem: 20-40% annual crop losses from diseases, 42% of Pakistan's workforce in agriculture, 70% preventable with early detection, and limited rural access to plant pathologists.");
  }

  // ============== SLIDE 5 — LITERATURE REVIEW ==============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    addSecTitle(s, "Literature Review");

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.15, w: 4.2, h: 2.2, fill: { color: C.cardBg }, shadow: cs() });
    s.addImage({ data: icons.book, x: 0.8, y: 1.25, w: 0.45, h: 0.45 });
    s.addText("Existing Approaches", { x: 1.35, y: 1.25, w: 3.3, h: 0.45, fontSize: 14, fontFace: FONT, color: C.navy, bold: true, valign: "middle", margin: 0 });
    s.addText([
      { text: "PlantVillage dataset: 54k images, 38 classes — standard benchmark for leaf disease classification", options: { bullet: true, breakLine: true, fontSize: 11, fontFace: FONT, color: C.text } },
      { text: "CNN-based approaches: ResNet, EfficientNet, DenseNet achieve 90-97% on PlantVillage but fail on real field photos", options: { bullet: true, breakLine: true, fontSize: 11, fontFace: FONT, color: C.text } },
      { text: "Transformers (ViT) outperform CNNs on fine-grained classification but require more data", options: { bullet: true, breakLine: true, fontSize: 11, fontFace: FONT, color: C.text } },
      { text: "Mobile apps: PlantNet, PlantSnap — limited to plant ID, not disease diagnosis", options: { bullet: true, fontSize: 11, fontFace: FONT, color: C.text } },
    ], { x: 0.8, y: 1.8, w: 3.8, h: 1.4, margin: 0 });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.2, y: 1.15, w: 4.2, h: 2.2, fill: { color: C.accentLight }, shadow: cs() });
    s.addImage({ data: icons.bulb, x: 5.4, y: 1.25, w: 0.45, h: 0.45 });
    s.addText("Research Gap", { x: 5.95, y: 1.25, w: 3.3, h: 0.45, fontSize: 14, fontFace: FONT, color: C.navy, bold: true, valign: "middle", margin: 0 });
    s.addText([
      { text: "Existing models trained on lab images fail on real-world field photos (background noise, lighting variations)", options: { bullet: true, breakLine: true, fontSize: 11, fontFace: FONT, color: C.text } },
      { text: "No integrated pipeline combining leaf detection + disease classification + treatment in a single mobile app", options: { bullet: true, breakLine: true, fontSize: 11, fontFace: FONT, color: C.text } },
      { text: "Limited offline capability and local language support in existing solutions", options: { bullet: true, fontSize: 11, fontFace: FONT, color: C.text } },
    ], { x: 5.4, y: 1.8, w: 3.8, h: 1.4, margin: 0 });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 3.6, w: 8.8, h: 1.7, fill: { color: C.greenBg }, shadow: cs() });
    s.addImage({ data: icons.rocket, x: 0.8, y: 3.7, w: 0.45, h: 0.45 });
    s.addText("Our Contribution", { x: 1.35, y: 3.7, w: 7.8, h: 0.45, fontSize: 14, fontFace: FONT, color: C.greenDark, bold: true, valign: "middle", margin: 0 });
    s.addText([
      { text: "YOLOv8 + ViT cascade: leaf detection cropping bridges lab-to-real-world accuracy gap", options: { bullet: true, breakLine: true, fontSize: 11, fontFace: FONT, color: C.text } },
      { text: "End-to-end mobile solution: capture → detect → classify → treat → chat", options: { bullet: true, breakLine: true, fontSize: 11, fontFace: FONT, color: C.text } },
      { text: "RAG-powered chatbot for follow-up plant care questions using Groq LLaMA 3.3 70B", options: { bullet: true, fontSize: 11, fontFace: FONT, color: C.text } },
    ], { x: 0.8, y: 4.2, w: 8.4, h: 1.0, margin: 0 });

    s.addNotes("Literature review: PlantVillage dataset is the standard benchmark (54k images, 38 classes). CNNs achieve 90-97% on lab images but fail on real field photos. Transformers outperform CNNs on fine-grained tasks. Existing apps like PlantNet focus on plant ID, not disease diagnosis. Research gap: lab-to-real-world accuracy drop, no integrated detection+classification+treatment pipeline. Our contribution: YOLO+ViT cascade bridges the gap, end-to-end mobile solution, RAG chatbot.");
  }

  // ============== SLIDE 6 — METHODOLOGY OVERVIEW ==============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    addSecTitle(s, "Methodology");

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.15, w: 8.8, h: 4.1, fill: { color: C.cardBg }, shadow: cs() });

    // Flow
    const flow = [
      "Image Capture",
      "Quality Check",
      "YOLOv8 Leaf Detection",
      "ViT Classifier",
      "Results",
    ];
    flow.forEach((f, i) => {
      const fx = 0.8 + i * 1.8;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: fx, y: 1.4, w: 1.55, h: 0.9, fill: { color: C.green }, shadow: cs() });
      s.addText(f, { x: fx, y: 1.4, w: 1.55, h: 0.9, fontSize: 11, fontFace: FONT, color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });
      if (i < flow.length - 1) {
        s.addText("\u2192", { x: fx + 1.5, y: 1.4, w: 0.3, h: 0.9, fontSize: 20, fontFace: FONT, color: C.greenDark, align: "center", valign: "middle", margin: 0 });
      }
    });

    // Details below
    const details = [
      ["1. Image Capture", "User takes photo via camera or uploads from gallery. Image compressed to 1024px, 0.7 quality."],
      ["2. Quality Check", "Blur detection (Laplacian variance < 80), darkness (< 50 brightness), leaf presence (green ratio > 0.35). Flags poor quality for user retake."],
      ["3. YOLOv8 Detection", "YOLOv8n trained on PlantDoc dataset (2,328 images). Detects leaf bounding box, adds 10px padding, crops. Fallback: full image if no leaf found."],
      ["4. ViT Classification", "Vision Transformer fine-tuned on PlantVillage (54k images, 38 classes, ~93% accuracy). Input: 224x224, normalized to [-1, 1]. Returns top-3 predictions."],
      ["5. Result Generation", "Severity analysis (Laplacian edge-based). Knowledge base lookup for treatment, watering, care guides. Response: disease, confidence, severity, treatment."],
    ];

    details.forEach((d, i) => {
      const dy = 2.55 + i * 0.55;
      s.addText(d[0], { x: 0.8, y: dy, w: 2.5, h: 0.45, fontSize: 11, fontFace: FONT, color: C.greenDark, bold: true, margin: 0 });
      s.addText(d[1], { x: 3.3, y: dy, w: 5.9, h: 0.45, fontSize: 9.5, fontFace: FONT, color: C.text, margin: 0 });
    });

    s.addNotes("Methodology flow: Image Capture (camera/gallery, compressed) → Quality Check (blur, darkness, leaf presence) → YOLOv8 leaf detection and cropping → ViT classifier (38 classes, 93% accuracy) → Result generation (severity analysis, knowledge base lookup).");
  }

  // ============== SLIDE 7 — TECH STACK ==============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    addSecTitle(s, "Technology Stack");

    const tech = [
      ["Layer", "Technology", "Details"],
      ["Mobile App", "React Native + Expo SDK 56", "Cross-platform, TypeScript, Zustand"],
      ["Backend API", "FastAPI (Python 3.12)", "REST API on HuggingFace Spaces"],
      ["Object Detection", "YOLOv8n (Ultralytics)", "PlantDoc-trained, 6.2 MB model"],
      ["Classification", "Vision Transformer (HuggingFace)", "PlantVillage fine-tuned, 153 MB"],
      ["Chat", "Groq + LLaMA 3.3 70B", "RAG-based plant care assistant"],
      ["Container", "Docker (Python 3.12-slim)", "Deployed on HuggingFace Spaces"],
      ["Build", "EAS Cloud", "Android APK distribution"],
    ];

    const rows = tech.map((r, ri) => r.map((c, ci) => ({
      text: c,
      options: {
        fontSize: ri === 0 ? 11 : 10, fontFace: FONT, bold: ri === 0,
        color: ri === 0 ? C.white : (ci === 0 ? C.greenDark : C.text),
        fill: { color: ri === 0 ? C.greenDark : (ri % 2 === 0 ? C.cardBg : C.white) },
      },
    })));

    s.addTable(rows, {
      x: 0.6, y: 1.15, w: 8.8, colW: [1.8, 3.5, 3.5],
      rowH: [0.4, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38, 0.38],
      border: { pt: 0.5, color: C.cardBorder },
    });

    s.addNotes("Tech stack table: React Native/Expo frontend, FastAPI backend, YOLOv8n for leaf detection, ViT for classification (93% accuracy), Groq LLaMA for chat, Docker container on HuggingFace Spaces, EAS Cloud for APK build.");
  }

  // ============== SLIDE 8 — DATASET ==============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    addSecTitle(s, "Dataset");

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.15, w: 4.2, h: 2.0, fill: { color: C.greenBg }, shadow: cs() });
    s.addImage({ data: icons.db, x: 0.8, y: 1.25, w: 0.45, h: 0.45 });
    s.addText("PlantVillage Dataset", { x: 1.35, y: 1.25, w: 3.3, h: 0.45, fontSize: 14, fontFace: FONT, color: C.navy, bold: true, valign: "middle", margin: 0 });
    s.addText([
      { text: "54,309 labeled leaf images", options: { bullet: true, breakLine: true, fontSize: 12, fontFace: FONT, color: C.text } },
      { text: "38 disease/health classes", options: { bullet: true, breakLine: true, fontSize: 12, fontFace: FONT, color: C.text } },
      { text: "14 crop species", options: { bullet: true, breakLine: true, fontSize: 12, fontFace: FONT, color: C.text } },
      { text: "Lab-captured, uniform backgrounds", options: { bullet: true, fontSize: 12, fontFace: FONT, color: C.text } },
    ], { x: 0.8, y: 1.8, w: 3.8, h: 1.2, margin: 0 });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.2, y: 1.15, w: 4.2, h: 2.0, fill: { color: C.accentLight }, shadow: cs() });
    s.addImage({ data: icons.cogs, x: 5.4, y: 1.25, w: 0.45, h: 0.45 });
    s.addText("PlantDoc Dataset (YOLO)", { x: 5.95, y: 1.25, w: 3.3, h: 0.45, fontSize: 14, fontFace: FONT, color: C.navy, bold: true, valign: "middle", margin: 0 });
    s.addText([
      { text: "2,568 images for leaf detection", options: { bullet: true, breakLine: true, fontSize: 12, fontFace: FONT, color: C.text } },
      { text: "Real-world field conditions", options: { bullet: true, breakLine: true, fontSize: 12, fontFace: FONT, color: C.text } },
      { text: "38 plant species with bounding boxes", options: { bullet: true, breakLine: true, fontSize: 12, fontFace: FONT, color: C.text } },
      { text: "YOLOv8n achieves 57.3% mAP50", options: { bullet: true, fontSize: 12, fontFace: FONT, color: C.text } },
    ], { x: 5.4, y: 1.8, w: 3.8, h: 1.2, margin: 0 });

    // Crop classes
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 3.4, w: 8.8, h: 2.0, fill: { color: C.cardBg }, shadow: cs() });
    s.addText("38 Plant Disease Classes by Crop", { x: 0.8, y: 3.5, w: 8.4, h: 0.35, fontSize: 13, fontFace: FONT, color: C.navy, bold: true, margin: 0 });

    const crops = [
      ["Apple (4)", "Scab, Black Rot, Cedar Rust, Healthy"],
      ["Corn (4)", "Cercospora, Common Rust, N. Leaf Blight, Healthy"],
      ["Grape (4)", "Black Rot, Black Measles, Leaf Blight, Healthy"],
      ["Potato (3)", "Early Blight, Late Blight, Healthy"],
      ["Tomato (10)", "Bacterial Spot, Early Blight, Late Blight, Leaf Mold, Septoria, Spider Mites, Target Spot, Y. Leaf Curl, Mosaic Virus, Healthy"],
      ["Others (9)", "Blueberry, Cherry, Orange, Peach, Pepper, Raspberry, Soybean, Squash, Strawberry"],
    ];
    const cropRows = crops.map((c, ri) => [
      { text: c[0], options: { fontSize: 10, fontFace: FONT, bold: true, color: C.greenDark, fill: { color: ri % 2 === 0 ? C.white : C.cardBg } } },
      { text: c[1], options: { fontSize: 9.5, fontFace: FONT, color: C.text, fill: { color: ri % 2 === 0 ? C.white : C.cardBg } } },
    ]);
    s.addTable(cropRows, { x: 0.8, y: 3.9, w: 8.4, colW: [1.5, 6.9], rowH: [0.24, 0.24, 0.24, 0.24, 0.4, 0.24], border: { pt: 0.5, color: C.cardBorder } });

    s.addNotes("Dual dataset approach: PlantVillage (54k images, 38 classes, 14 crops) for ViT classifier training, and PlantDoc (2.5k real-world images) for YOLOv8 leaf detection training. Key crops include Apple, Corn, Grape, Potato, Tomato with 38 total classes.");
  }

  // ============== SLIDE 9 — RESULTS ==============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    addSecTitle(s, "Results & Discussion");

    // Metrics
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 1.15, w: 4.2, h: 2.8, fill: { color: C.cardBg }, shadow: cs() });
    s.addImage({ data: icons.chart, x: 0.8, y: 1.25, w: 0.45, h: 0.45 });
    s.addText("ViT Classifier Performance", { x: 1.35, y: 1.25, w: 3.3, h: 0.45, fontSize: 14, fontFace: FONT, color: C.navy, bold: true, valign: "middle", margin: 0 });
    s.addText([
      { text: "Accuracy: ~93% on PlantVillage test set", options: { bullet: true, breakLine: true, fontSize: 12, fontFace: FONT, color: C.text } },
      { text: "38-class classification", options: { bullet: true, breakLine: true, fontSize: 12, fontFace: FONT, color: C.text } },
      { text: "Top-3 accuracy: ~97%", options: { bullet: true, breakLine: true, fontSize: 12, fontFace: FONT, color: C.text } },
      { text: "Inference time: 3-5 seconds on CPU", options: { bullet: true, breakLine: true, fontSize: 12, fontFace: FONT, color: C.text } },
      { text: "Confidence threshold: 55% for reliable results", options: { bullet: true, fontSize: 12, fontFace: FONT, color: C.text } },
    ], { x: 0.8, y: 1.8, w: 3.8, h: 2.0, margin: 0 });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.2, y: 1.15, w: 4.2, h: 2.8, fill: { color: C.accentLight }, shadow: cs() });
    s.addImage({ data: icons.cogs, x: 5.4, y: 1.25, w: 0.45, h: 0.45 });
    s.addText("YOLOv8 Detection", { x: 5.95, y: 1.25, w: 3.3, h: 0.45, fontSize: 14, fontFace: FONT, color: C.navy, bold: true, valign: "middle", margin: 0 });
    s.addText([
      { text: "mAP50: 57.3% on PlantDoc test set", options: { bullet: true, breakLine: true, fontSize: 12, fontFace: FONT, color: C.text } },
      { text: "Leaf detection confidence threshold: 0.25", options: { bullet: true, breakLine: true, fontSize: 12, fontFace: FONT, color: C.text } },
      { text: "Single highest-confidence bbox selected", options: { bullet: true, breakLine: true, fontSize: 12, fontFace: FONT, color: C.text } },
      { text: "10px padding added to crop region", options: { bullet: true, breakLine: true, fontSize: 12, fontFace: FONT, color: C.text } },
      { text: "Graceful fallback to full image on failure", options: { bullet: true, fontSize: 12, fontFace: FONT, color: C.text } },
    ], { x: 5.4, y: 1.8, w: 3.8, h: 2.0, margin: 0 });

    // App metrics
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 4.2, w: 8.8, h: 1.2, fill: { color: C.greenBg }, shadow: cs() });
    s.addImage({ data: icons.rocket, x: 0.8, y: 4.3, w: 0.5, h: 0.5 });
    s.addText("App Performance", { x: 1.4, y: 4.2, w: 3, h: 0.4, fontSize: 14, fontFace: FONT, color: C.greenDark, bold: true, margin: 0 });
    s.addText("End-to-end inference: 5-8 seconds. App bundle size (APK): ~50 MB. Backend API response: under 3 seconds for prediction. Chat response: 1-2 seconds (Groq API). Archive size reduced from 309 MB to 11 MB after dependency trimming.", { x: 0.8, y: 4.65, w: 8.4, h: 0.6, fontSize: 11, fontFace: FONT, color: C.text, margin: 0 });

    s.addNotes("Results: ViT achieves ~93% accuracy (97% top-3) on PlantVillage test set with 3-5 second CPU inference. YOLOv8n achieves 57.3% mAP50 on PlantDoc. End-to-end app performance: 5-8 seconds total. APK size ~50 MB. Backend response under 3 seconds. Archive trimmed from 309 MB to 11 MB.");
  }

  // ============== SLIDE 10 — DISCUSSION ==============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    addSecTitle(s, "Discussion & Limitations");

    const discuss = [
      ["Challenge", "Impact", "Mitigation"],
      ["Lab vs real-world gap", "Accuracy drops on field photos", "YOLOv8 cropping focuses classifier on leaf"],
      ["PlantDoc mAP (57.3%)", "Some missed detections", "Fallback to full image when no leaf found"],
      ["Limited to 38 classes", "Cannot detect unknown diseases", "Expandable architecture, retrainable model"],
      ["CPU inference (3-5s)", "Not real-time for video", "Acceptable for single photo use case"],
      ["No offline support", "Requires internet connection", "Planned: TFLite conversion for offline mode"],
      ["English-only interface", "Limits rural adoption", "Planned: Urdu/Sindhi localization"],
    ];

    const rows = discuss.map((r, ri) => r.map((c, ci) => ({
      text: c,
      options: {
        fontSize: ri === 0 ? 11 : 10, fontFace: FONT, bold: ri === 0,
        color: ri === 0 ? C.white : (ci === 0 ? C.greenDark : C.text),
        fill: { color: ri === 0 ? C.greenDark : (ri % 2 === 0 ? C.cardBg : C.white) },
      },
    })));

    s.addTable(rows, {
      x: 0.6, y: 1.15, w: 8.8, colW: [2.2, 3.3, 3.3],
      rowH: [0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
      border: { pt: 0.5, color: C.cardBorder },
    });

    // Bottom CTA
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 4.8, w: 8.8, h: 0.55, fill: { color: C.greenBg }, shadow: cs() });
    s.addText("Despite limitations, FasalGuard demonstrates a viable pipeline for real-world plant disease detection. The YOLO+ViT cascade approach effectively bridges the lab-to-real-world gap.", {
      x: 0.8, y: 4.8, w: 8.4, h: 0.55, fontSize: 11, fontFace: FONT, color: C.greenDark, align: "center", valign: "middle", margin: 0,
    });

    s.addNotes("Discussion of limitations: lab-to-real-world gap (mitigated by YOLO cropping), 57.3% mAP on PlantDoc (fallback to full image), limited to 38 classes (expandable), 3-5s CPU inference (acceptable for photos), no offline mode or multi-language support (planned). Overall, the pipeline demonstrates viability.");
  }

  // ============== SLIDE 11 — FUTURE WORK ==============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    addSecTitle(s, "Future Work");

    const futures = [
      { icon: icons.brain, title: "Model Improvement", desc: "Retrain on New Plant Diseases Dataset (87k augmented real-field images). Swap ViT for ConvNeXt-Base." },
      { icon: icons.bulb, title: "Offline Inference", desc: "Convert model to TFLite for on-device inference — no internet required." },
      { icon: icons.camera, title: "Real-time Scanning", desc: "Continuous camera analysis without manual capture. Video-based disease detection." },
      { icon: icons.trophy, title: "Multi-Language", desc: "Add Urdu, Sindhi, and regional language support for broader accessibility." },
      { icon: icons.check, title: "iOS Release", desc: "Build for iOS via EAS. Expand user reach beyond Android." },
      { icon: icons.chart, title: "Weather Integration", desc: "Integrate weather API for disease risk forecasting based on environmental conditions." },
    ];

    futures.forEach((f, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = 0.6 + col * 3.1;
      const cy = 1.2 + row * 2.0;

      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: cy, w: 2.85, h: 1.75, fill: { color: C.cardBg }, shadow: cs() });
      s.addImage({ data: f.icon, x: cx + 1.1, y: cy + 0.1, w: 0.6, h: 0.6 });
      s.addText(f.title, { x: cx + 0.15, y: cy + 0.75, w: 2.55, h: 0.35, fontSize: 13, fontFace: FONT, color: C.navy, bold: true, align: "center", margin: 0 });
      s.addText(f.desc, { x: cx + 0.15, y: cy + 1.1, w: 2.55, h: 0.55, fontSize: 10, fontFace: FONT, color: C.textMuted, align: "center", margin: 0 });
    });

    s.addNotes("Future work: improve model with larger real-field dataset and ConvNeXt-Base, offline TFLite inference, real-time camera scanning, multi-language support (Urdu, Sindhi), iOS release, and weather API integration for risk forecasting.");
  }

  // ============== SLIDE 12 — THANK YOU ==============
  {
    const s = pres.addSlide();
    s.background = { color: C.greenDeep };
    s.addImage({ data: icons.leafW, x: 4.3, y: 0.5, w: 1.4, h: 1.4, transparency: 60, rotate: 10 });

    s.addText("Thank You", { x: 1, y: 2.0, w: 8, h: 1, fontSize: 44, fontFace: FONT, color: C.white, bold: true, align: "center", margin: 0 });
    s.addShape(pres.shapes.LINE, { x: 3.5, y: 3.1, w: 3, h: 0, line: { color: C.white, width: 2, transparency: 50 } });
    s.addText("Questions?", { x: 1, y: 3.3, w: 8, h: 0.6, fontSize: 20, fontFace: FONT, color: C.white, align: "center", margin: 0, transparency: 20 });
    s.addText("Muhammad Ammar Shaikh & Azhar  |  SMIT", { x: 1, y: 4.0, w: 8, h: 0.5, fontSize: 14, fontFace: FONT, color: C.white, align: "center", margin: 0, transparency: 40 });
    s.addImage({ data: icons.grad, x: 2.8, y: 4.6, w: 0.4, h: 0.4, transparency: 50 });
    s.addText("github.com/MAmmarShaikh01/fasalguard", { x: 3.3, y: 4.6, w: 5, h: 0.4, fontSize: 11, fontFace: FONT, color: C.white, valign: "middle", margin: 0, transparency: 50 });

    s.addNotes("Closing slide. Thank the audience. Open for questions. Provide GitHub link.");
  }

  const outputPath = path.join(__dirname, "FasalGuard_Academic.pptx");
  await pres.writeFile({ fileName: outputPath });
  console.log("Saved:", outputPath);
}
main().catch(console.error);
