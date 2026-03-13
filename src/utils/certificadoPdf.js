function plantillaCertificadoHTML(){
    return `
    <!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Certificado de Finalización – SixSeven Academy</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@400;700;800&family=Dancing+Script:wght@600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e8edf0;
      font-family: 'Montserrat', sans-serif;
      padding: 40px 20px;
    }

    .certificate {
      width: 780px;
      min-height: 540px;
      background: #ffffff;
      display: flex;
      position: relative;
      box-shadow: 0 8px 48px rgba(0,0,0,0.18);
      overflow: hidden;
    }

    /* ── Sidebar stripes ── */
    .sidebar {
      width: 28px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
    }
    .stripe-teal   { background: #3ab8b8; flex: 3; }
    .stripe-dark   { background: #1a7a8a; flex: 4; }
    .stripe-yellow { background: #f5c518; flex: 1.2; }

    /* ── Main content ── */
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 32px 44px 36px 36px;
    }

    /* ── Header / logo ── */
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 30px;
    }

    .logo-icon {
      width: 54px;
      height: 54px;
    }

    .logo-text {
      font-family: 'Montserrat', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: #1a7a8a;
      letter-spacing: -0.5px;
    }

    /* ── Title ── */
    .cert-title {
      font-family: 'Cormorant Garamond', serif;
      font-size: 32px;
      font-weight: 600;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #1a1a2e;
      text-align: center;
      margin-bottom: 28px;
      padding-bottom: 18px;
      border-bottom: 1px solid #d0dde0;
    }

    /* ── Body copy ── */
    .awarded-label {
      font-size: 13px;
      font-weight: 400;
      color: #555;
      margin-bottom: 6px;
      letter-spacing: 0.3px;
    }

    .student-name {
      font-family: 'Montserrat', sans-serif;
      font-size: 28px;
      font-weight: 800;
      color: #111;
      letter-spacing: 0.5px;
      margin-bottom: 24px;
    }

    .description {
      font-size: 13px;
      color: #444;
      line-height: 1.75;
      max-width: 480px;
      padding: 14px 18px;
      border-left: 3px solid #3ab8b8;
      background: #f4fafc;
      margin-bottom: 36px;
    }

    /* ── Signature ── */
    .signature-block {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }

    .signature-script {
      font-family: 'Dancing Script', cursive;
      font-size: 30px;
      color: #1a1a2e;
      line-height: 1;
    }

    .signature-line {
      width: 160px;
      height: 1px;
      background: #999;
      margin: 6px 0 4px;
    }

    .signature-role {
      font-size: 11px;
      color: #666;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* ── Decorative corner ── */
    .corner-accent {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 90px;
      height: 90px;
      opacity: 0.07;
    }
  </style>
</head>
<body>
  <div class="certificate">

    <!-- Sidebar -->
    <div class="sidebar">
      <div class="stripe-teal"></div>
      <div class="stripe-dark"></div>
      <div class="stripe-yellow"></div>
    </div>

    <!-- Main content -->
    <div class="content">

      <!-- Header -->
      <div class="header">
        <!-- Logo SVG inline (graduation cap + head silhouette) -->
        <svg class="logo-icon" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- head silhouette -->
          <ellipse cx="27" cy="30" rx="14" ry="16" fill="#3ab8b8" opacity="0.25"/>
          <path d="M18 38 Q20 50 27 52 Q34 50 36 38" fill="#3ab8b8" opacity="0.18"/>
          <!-- graduation cap -->
          <polygon points="27,8 44,16 27,24 10,16" fill="#f5c518"/>
          <rect x="38" y="16" width="3" height="10" rx="1.5" fill="#f5c518"/>
          <circle cx="39.5" cy="27" r="2.5" fill="#f5c518"/>
          <!-- tassel lines -->
          <line x1="44" y1="16" x2="44" y2="22" stroke="#1a7a8a" stroke-width="2"/>
        </svg>
        <span class="logo-text">SixSeven Academy</span>
      </div>

      <!-- Title -->
      <div class="cert-title">Certificado de Finalización</div>

      <!-- Body -->
      <p class="awarded-label">Otorgado a:</p>
      <p class="student-name">NOMBRE DEL ESTUDIANTE</p>

      <div class="description">
        Por completar satisfactoriamente el curso de <strong>[Nombre de la materia]</strong><br>
        en el período <strong>[Duración materia]</strong>
      </div>

      <!-- Signature -->
      <div class="signature-block">
        <span class="signature-script">Director</span>
        <div class="signature-line"></div>
        <span class="signature-role">Director Académico</span>
      </div>

    </div>

    <!-- Decorative corner -->
    <svg class="corner-accent" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
      <circle cx="90" cy="90" r="70" fill="#3ab8b8"/>
    </svg>

  </div>
</body>
</html>
`
}