// Mascot artwork as plain SVG strings so the same art is used by the
// React components, the OG images and the static design preview.
// Animation hooks (classes) are styled in globals.css:
//   .m-bob   whole character idles up and down
//   .m-blink eyes blink
//   .m-lamp  headlamp glow pulses (cat)
//   .m-tail  tail sways (cat)
//   .m-case  briefcase swings (dog)

const OUT = "#1B1533"; // outline ink shared by both characters

export const CAT_SVG = `
<svg viewBox="0 0 240 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Trencher cat in a yellow hard hat">
  <defs>
    <linearGradient id="cat-beam" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#FFF4B8" stop-opacity="0.6"/>
      <stop offset="1" stop-color="#FFF4B8" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g class="m-bob">
    <!-- tail -->
    <g class="m-tail">
      <path d="M148 236 C188 252 216 236 213 204 C211 186 199 178 190 185" fill="none" stroke="${OUT}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M148 236 C188 252 216 236 213 204 C211 186 199 178 190 185" fill="none" stroke="#F2A25C" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M205 214 l12 -3 M200 230 l10 6" stroke="#D9803A" stroke-width="5" stroke-linecap="round"/>
    </g>
    <!-- body -->
    <ellipse cx="120" cy="214" rx="54" ry="44" fill="#F2A25C" stroke="${OUT}" stroke-width="5"/>
    <ellipse cx="120" cy="222" rx="31" ry="28" fill="#FFE6C7"/>
    <path d="M78 196 q8 4 10 12 M162 196 q-8 4 -10 12" stroke="#D9803A" stroke-width="5" fill="none" stroke-linecap="round"/>
    <!-- front paws -->
    <ellipse cx="98" cy="254" rx="16" ry="11" fill="#FFE6C7" stroke="${OUT}" stroke-width="5"/>
    <ellipse cx="142" cy="254" rx="16" ry="11" fill="#FFE6C7" stroke="${OUT}" stroke-width="5"/>
    <!-- ears poking out from under the hat -->
    <path d="M60 104 L30 66 L84 84 Z" fill="#F2A25C" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M58 96 L42 76 L72 86 Z" fill="#FFB8C2"/>
    <path d="M180 104 L210 66 L156 84 Z" fill="#F2A25C" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M182 96 L198 76 L168 86 Z" fill="#FFB8C2"/>
    <!-- head -->
    <ellipse cx="120" cy="132" rx="74" ry="60" fill="#F2A25C" stroke="${OUT}" stroke-width="5"/>
    <path d="M50 138 h16 M48 150 h14 M190 138 h-16 M192 150 h-14" stroke="#D9803A" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="120" cy="158" rx="34" ry="24" fill="#FFE6C7"/>
    <!-- trench dirt smudge -->
    <ellipse cx="166" cy="160" rx="10" ry="5" fill="#7A4A2A" opacity="0.35" transform="rotate(-18 166 160)"/>
    <!-- blush -->
    <ellipse cx="80" cy="158" rx="11" ry="7" fill="#FF7E95" opacity="0.45"/>
    <ellipse cx="160" cy="158" rx="11" ry="7" fill="#FF7E95" opacity="0.45"/>
    <!-- eyes -->
    <g class="m-blink">
      <ellipse cx="94" cy="134" rx="14" ry="16" fill="${OUT}"/>
      <ellipse cx="146" cy="134" rx="14" ry="16" fill="${OUT}"/>
      <circle cx="99" cy="128" r="5" fill="#fff"/>
      <circle cx="151" cy="128" r="5" fill="#fff"/>
      <circle cx="90" cy="140" r="2.2" fill="#fff"/>
      <circle cx="142" cy="140" r="2.2" fill="#fff"/>
    </g>
    <!-- nose + mouth -->
    <path d="M114 150 h12 l-6 7 z" fill="#FF7E95" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M120 157 q-4 8 -11 5 M120 157 q4 8 11 5" fill="none" stroke="${OUT}" stroke-width="3.5" stroke-linecap="round"/>
    <!-- whiskers -->
    <path d="M70 150 l-26 -4 M70 158 l-24 4 M170 150 l26 -4 M170 158 l24 4" stroke="${OUT}" stroke-width="2.5" stroke-linecap="round"/>
    <!-- hard hat -->
    <path d="M58 98 C58 44 88 30 120 30 C152 30 182 44 182 98 Z" fill="#FFC531" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M110 33 h20 v64 h-20 z" fill="#FFD966"/>
    <path d="M78 52 C88 42 100 38 108 37" stroke="#FFF1B3" stroke-width="5" fill="none" stroke-linecap="round"/>
    <rect x="40" y="92" width="160" height="17" rx="8.5" fill="#F0AE12" stroke="${OUT}" stroke-width="5"/>
    <!-- headlamp -->
    <path d="M120 66 L70 0 L170 0 Z" fill="url(#cat-beam)" class="m-lamp"/>
    <circle cx="120" cy="66" r="14" fill="#5A5470" stroke="${OUT}" stroke-width="4"/>
    <circle cx="120" cy="66" r="8" fill="#FFF4B8" class="m-lamp"/>
  </g>
</svg>`;

export const DOG_SVG = `
<svg viewBox="0 0 240 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Business dog in a navy suit">
  <g class="m-bob">
  <!-- legs and feet (drawn first, the jacket overlaps them) -->
  <path d="M85 226 h30 v30 h-30 z M125 226 h30 v30 h-30 z" fill="#24315E" stroke="${OUT}" stroke-width="4.5" stroke-linejoin="round"/>
  <path d="M120 236 v18" stroke="${OUT}" stroke-width="3" opacity=".35"/>
  <ellipse cx="97" cy="259" rx="20" ry="9" fill="#F5D6A8" stroke="${OUT}" stroke-width="4.5"/>
  <ellipse cx="143" cy="259" rx="20" ry="9" fill="#F5D6A8" stroke="${OUT}" stroke-width="4.5"/>
  <g transform="translate(0 -26)">
    <!-- briefcase -->
    <g class="m-case">
      <path d="M182 210 v-8 a6 6 0 0 1 6 -6 h14 a6 6 0 0 1 6 6 v8" fill="none" stroke="${OUT}" stroke-width="5"/>
      <rect x="168" y="208" width="54" height="40" rx="7" fill="#9A5B33" stroke="${OUT}" stroke-width="5"/>
      <path d="M168 224 h54" stroke="${OUT}" stroke-width="4"/>
      <rect x="189" y="219" width="12" height="10" rx="2" fill="#FFC531" stroke="${OUT}" stroke-width="3"/>
    </g>
    <!-- suit body -->
    <path d="M72 180 C62 200 58 236 60 262 H180 C182 236 178 200 168 180 C150 170 90 170 72 180 Z"
      fill="#2E3D73" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M100 176 L120 222 L140 176 Z" fill="#F7F7FB" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M86 178 L120 236 L98 252 L80 196 Z M154 178 L120 236 L142 252 L160 196 Z" fill="#24315E" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
    <!-- tie -->
    <path d="M113 180 h14 l-3 10 h-8 z" fill="#E5484D" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M116 190 h8 l6 32 l-10 10 l-10 -10 z" fill="#E5484D" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M118 200 l9 6 M117 211 l11 7" stroke="#B9303A" stroke-width="2.5"/>
    <!-- lapel pin -->
    <circle cx="146" cy="200" r="4.5" fill="#FFC531" stroke="${OUT}" stroke-width="2.5"/>
    <!-- sleeves -->
    <path d="M76 184 C62 196 58 214 62 228 L80 230 C80 214 84 202 90 192 Z" fill="#2E3D73" stroke="${OUT}" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M164 184 C176 192 182 200 184 210 L168 220 C164 210 158 202 150 194 Z" fill="#2E3D73" stroke="${OUT}" stroke-width="4.5" stroke-linejoin="round"/>
    <!-- paw holding the case -->
    <ellipse cx="174" cy="214" rx="12" ry="10" fill="#F5D6A8" stroke="${OUT}" stroke-width="4.5"/>
    <!-- other paw -->
    <ellipse cx="71" cy="232" rx="12" ry="10" fill="#F5D6A8" stroke="${OUT}" stroke-width="4.5"/>
    <!-- floppy ears (behind head) -->
    <path d="M70 80 C34 80 26 150 50 166 C66 174 78 130 84 98 Z" fill="#A8653A" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M170 80 C206 80 214 150 190 166 C174 174 162 130 156 98 Z" fill="#A8653A" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
    <!-- head -->
    <ellipse cx="120" cy="116" rx="66" ry="60" fill="#F5D6A8" stroke="${OUT}" stroke-width="5"/>
    <!-- eye patch -->
    <path d="M128 92 C146 80 168 92 166 114 C164 128 146 130 134 122 C126 114 122 100 128 92 Z" fill="#C98A55"/>
    <!-- muzzle -->
    <ellipse cx="120" cy="146" rx="36" ry="25" fill="#FFF1DC"/>
    <!-- brows: serious business -->
    <path d="M86 96 q12 -8 24 -2 M130 94 q12 -6 24 2" stroke="${OUT}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <!-- eyes -->
    <g class="m-blink">
      <ellipse cx="98" cy="116" rx="11" ry="13" fill="${OUT}"/>
      <ellipse cx="142" cy="116" rx="11" ry="13" fill="${OUT}"/>
      <circle cx="102" cy="111" r="4.2" fill="#fff"/>
      <circle cx="146" cy="111" r="4.2" fill="#fff"/>
    </g>
    <!-- blush -->
    <ellipse cx="78" cy="140" rx="10" ry="6" fill="#FF7E95" opacity="0.4"/>
    <ellipse cx="162" cy="140" rx="10" ry="6" fill="#FF7E95" opacity="0.4"/>
    <!-- nose + smile -->
    <ellipse cx="120" cy="134" rx="13" ry="9" fill="${OUT}"/>
    <ellipse cx="116" cy="131" rx="4" ry="2.5" fill="#fff" opacity="0.7"/>
    <path d="M120 143 v6 M104 150 q16 14 32 0" fill="none" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>
    <path d="M114 156 q6 8 12 0" fill="#FF7E95" stroke="${OUT}" stroke-width="3"/>
  </g>
  </g>

</svg>`;
