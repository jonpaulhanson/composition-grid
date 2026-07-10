/** Browsers frequently report an empty or generic `file.type` for HEIC/HEIF files (a known
 * platform quirk), so the extension is checked as a fallback rather than trusting MIME type alone. */
export function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === 'image/heic' || type === 'image/heif') return true;
  return /\.(heic|heif)$/i.test(file.name);
}

/** Converts a HEIC/HEIF file to JPEG entirely client-side (WASM), so the image never leaves
 * the browser — consistent with the rest of the app. Can take a few seconds for large photos.
 * `heic2any` bundles a ~1.5MB WASM codec, so it's dynamically imported here rather than at the
 * top of the module — otherwise every visitor would pay that download, not just HEIC uploaders. */
export async function convertHeicToJpeg(file: File): Promise<File> {
  const { default: heic2any } = await import('heic2any');
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
  const blob = Array.isArray(result) ? result[0] : result;
  const name = file.name.replace(/\.(heic|heif)$/i, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg' });
}
