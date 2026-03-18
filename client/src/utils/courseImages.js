export function getYoutubeThumbnail(url) {
  if (!url) return '';
  if (url.includes('/embed/')) {
    const match = url.match(/\/embed\/([A-Za-z0-9_-]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : '';
  }
  const short = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (short) return `https://img.youtube.com/vi/${short[1]}/hqdefault.jpg`;
  const watch = url.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (watch) return `https://img.youtube.com/vi/${watch[1]}/hqdefault.jpg`;
  return '';
}

function getCourseVisualTheme(course) {
  const text = `${course?.title || ''} ${course?.category_name || ''}`.toLowerCase();

  if (text.includes('react') || text.includes('web') || text.includes('frontend')) {
    return {
      bgStart: '#c7dbff',
      bgMid: '#9dc0ff',
      bgEnd: '#86b2ff',
      art: `
        <rect x="0" y="0" width="1200" height="675" fill="url(#bg)" />
        <path d="M0 540 C180 430, 320 430, 480 540 L480 675 L0 675 Z" fill="rgba(255,255,255,0.12)" />
        <rect x="700" y="150" width="280" height="185" rx="16" fill="#eaf2ff" stroke="#3159b8" stroke-width="8" />
        <rect x="730" y="180" width="220" height="125" rx="8" fill="#2347a8" />
        <rect x="790" y="344" width="100" height="18" rx="9" fill="#3159b8" />
        <rect x="760" y="368" width="160" height="20" rx="10" fill="#4e72d7" />
        <circle cx="840" cy="235" r="68" fill="none" stroke="#1c2f79" stroke-width="10" />
        <ellipse cx="840" cy="235" rx="118" ry="44" fill="none" stroke="#1c2f79" stroke-width="10" />
        <ellipse cx="840" cy="235" rx="44" ry="118" fill="none" stroke="#1c2f79" stroke-width="10" />
        <circle cx="840" cy="235" r="12" fill="#facc15" />
        <rect x="990" y="144" width="54" height="54" rx="10" fill="#233876" />
        <path d="M1017 154 l6 10 12 2 -8 9 2 13 -12 -6 -12 6 2 -13 -8 -9 12 -2 z" fill="#facc15" />
        <rect x="620" y="170" width="52" height="52" rx="10" fill="#2563eb" />
        <path d="M634 196 h24 M646 184 v24" stroke="#ffffff" stroke-width="6" stroke-linecap="round" />
      `,
    };
  }

  if (text.includes('python') || text.includes('data') || text.includes('mysql') || text.includes('database')) {
    return {
      bgStart: '#18315b',
      bgMid: '#2754a6',
      bgEnd: '#27a2b8',
      art: `
        <rect x="0" y="0" width="1200" height="675" fill="url(#bg)" />
        <circle cx="165" cy="575" r="185" fill="rgba(255,255,255,0.08)" />
        <rect x="735" y="120" width="250" height="68" rx="28" fill="rgba(255,255,255,0.20)" />
        <rect x="735" y="228" width="250" height="68" rx="28" fill="rgba(255,255,255,0.24)" />
        <rect x="735" y="336" width="250" height="68" rx="28" fill="rgba(255,255,255,0.28)" />
        <ellipse cx="860" cy="120" rx="125" ry="28" fill="rgba(255,255,255,0.28)" />
        <ellipse cx="860" cy="228" rx="125" ry="28" fill="rgba(255,255,255,0.32)" />
        <ellipse cx="860" cy="336" rx="125" ry="28" fill="rgba(255,255,255,0.36)" />
        <rect x="580" y="300" width="100" height="170" rx="16" fill="#ffd54f" />
        <rect x="695" y="250" width="100" height="220" rx="16" fill="#60a5fa" />
        <rect x="810" y="205" width="100" height="265" rx="16" fill="#34d399" />
      `,
    };
  }

  if (text.includes('machine learning') || text.includes('deep learning') || text.includes('ai') || text.includes('tensorflow')) {
    return {
      bgStart: '#082a63',
      bgMid: '#06346f',
      bgEnd: '#042b5a',
      art: `
        <rect x="0" y="0" width="1200" height="675" fill="url(#bg)" />
        <ellipse cx="370" cy="475" rx="120" ry="34" fill="rgba(63,146,255,0.35)" />
        <rect x="310" y="220" width="120" height="180" rx="54" fill="#f3f7fb" />
        <circle cx="370" cy="180" r="56" fill="#f3f7fb" />
        <circle cx="352" cy="170" r="8" fill="#27c2d1" />
        <circle cx="388" cy="170" r="8" fill="#27c2d1" />
        <rect x="355" y="202" width="30" height="12" rx="6" fill="#27c2d1" />
        <rect x="346" y="276" width="48" height="60" rx="18" fill="#27c2d1" />
        <path d="M308 280 c-46 20-70 70-54 116" stroke="#f3f7fb" stroke-width="14" stroke-linecap="round" fill="none" />
        <path d="M432 280 c46 20 70 70 54 116" stroke="#f3f7fb" stroke-width="14" stroke-linecap="round" fill="none" />
        <path d="M340 402 v78" stroke="#f3f7fb" stroke-width="14" stroke-linecap="round" />
        <path d="M400 402 v78" stroke="#f3f7fb" stroke-width="14" stroke-linecap="round" />
        <circle cx="368" cy="210" r="96" fill="none" stroke="rgba(39,194,209,0.45)" stroke-width="8" />
        <rect x="580" y="315" width="28" height="170" rx="14" fill="#ffffff" />
        <circle cx="594" cy="268" r="42" fill="#e7f0fb" />
        <path d="M594 312 c-52 0-94 44-94 98" stroke="#e7f0fb" stroke-width="24" fill="none" stroke-linecap="round" />
        <rect x="650" y="258" width="140" height="88" rx="14" fill="#0f4fa1" stroke="#4cc9f0" stroke-width="4" />
        <rect x="680" y="286" width="82" height="14" rx="7" fill="#9dd6ff" />
      `,
    };
  }

  if (text.includes('docker') || text.includes('kubernetes') || text.includes('devops')) {
    return {
      bgStart: '#0f172a',
      bgMid: '#0f4c81',
      bgEnd: '#1d9bf0',
      art: `
        <rect x="0" y="0" width="1200" height="675" fill="url(#bg)" />
        <rect x="760" y="160" width="114" height="114" rx="20" fill="rgba(255,255,255,0.20)" />
        <rect x="900" y="160" width="114" height="114" rx="20" fill="rgba(255,255,255,0.24)" />
        <rect x="830" y="300" width="114" height="114" rx="20" fill="rgba(255,255,255,0.28)" />
        <path d="M874 217 h26 m154 0 h26 m-96 83 v26" stroke="#dff7ff" stroke-width="10" stroke-linecap="round" />
        <circle cx="260" cy="520" r="180" fill="rgba(255,255,255,0.06)" />
      `,
    };
  }

  if (text.includes('hack') || text.includes('security') || text.includes('penetration')) {
    return {
      bgStart: '#111827',
      bgMid: '#dc2626',
      bgEnd: '#f43f5e',
      art: `
        <rect x="0" y="0" width="1200" height="675" fill="url(#bg)" />
        <path d="M885 112 l130 46 v96 c0 84-58 152-130 181 c-72-29-130-97-130-181 v-96z" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.30)" stroke-width="8" />
        <path d="M885 188 c28 0 50 22 50 50 v20 h22 v40 h-144 v-40 h22 v-20 c0-28 22-50 50-50z" fill="#fee2e2" />
        <circle cx="250" cy="540" r="170" fill="rgba(255,255,255,0.05)" />
      `,
    };
  }

  if (text.includes('design') || text.includes('ui') || text.includes('ux') || text.includes('figma')) {
    return {
      bgStart: '#1e3a8a',
      bgMid: '#2563eb',
      bgEnd: '#14b8a6',
      art: `
        <rect x="0" y="0" width="1200" height="675" fill="url(#bg)" />
        <circle cx="870" cy="180" r="58" fill="rgba(255,255,255,0.18)" />
        <circle cx="1010" cy="180" r="58" fill="rgba(255,255,255,0.24)" />
        <circle cx="870" cy="320" r="58" fill="rgba(255,255,255,0.24)" />
        <circle cx="1010" cy="320" r="58" fill="rgba(255,255,255,0.18)" />
        <rect x="923" y="122" width="34" height="256" rx="17" fill="#eff6ff" />
        <circle cx="220" cy="525" r="175" fill="rgba(255,255,255,0.07)" />
      `,
    };
  }

  if (text.includes('flutter') || text.includes('mobile') || text.includes('android') || text.includes('ios')) {
    return {
      bgStart: '#0f172a',
      bgMid: '#1d4ed8',
      bgEnd: '#06b6d4',
      art: `
        <rect x="0" y="0" width="1200" height="675" fill="url(#bg)" />
        <rect x="850" y="104" width="174" height="286" rx="32" fill="rgba(255,255,255,0.20)" stroke="rgba(255,255,255,0.34)" stroke-width="8" />
        <rect x="886" y="144" width="102" height="184" rx="16" fill="rgba(255,255,255,0.18)" />
        <circle cx="937" cy="352" r="14" fill="#e0f2fe" />
        <circle cx="215" cy="530" r="172" fill="rgba(255,255,255,0.06)" />
      `,
    };
  }

  return {
    bgStart: '#0f172a',
    bgMid: '#1d4ed8',
    bgEnd: '#14b8a6',
    art: `
      <circle cx="1020" cy="120" r="180" fill="rgba(255,255,255,0.08)" />
      <circle cx="160" cy="580" r="220" fill="rgba(255,255,255,0.06)" />
    `,
  };
}

export function getFallbackBanner(course) {
  const theme = getCourseVisualTheme(course);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${theme.bgStart}" />
          <stop offset="55%" stop-color="${theme.bgMid}" />
          <stop offset="100%" stop-color="${theme.bgEnd}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#bg)" />
      ${theme.art}
      <rect x="72" y="72" width="1056" height="531" rx="36" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" />
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getCourseImage(course) {
  return (
    course?.thumbnail_url ||
    course?.image_url ||
    course?.image ||
    course?.course_image ||
    getYoutubeThumbnail(course?.preview_content_url) ||
    getFallbackBanner(course)
  );
}
