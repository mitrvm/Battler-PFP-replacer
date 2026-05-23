import { startAvatarReplacement } from "./avatar-replacer";

function bootstrap(): void {
  startAvatarReplacement();
}

if (document.body) {
  bootstrap();
} else {
  window.addEventListener("DOMContentLoaded", bootstrap, { once: true });
}
