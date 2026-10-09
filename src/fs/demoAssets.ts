import officeUrl from "../assets/demo/office.jpg";
import lakeAUrl from "../assets/demo/lake-a.jpg";
import lakeBUrl from "../assets/demo/lake-b.jpg";

/**
 * Демо-набор, встроенный в бандл как data-URI (assetsInlineLimit в vite.config).
 * Никаких fetch — демо-скан не делает ни одного сетевого запроса,
 * что важно для строгого CSP (connect-src 'none') и офлайн-работы.
 *
 * Состав: точная пара (один Blob дважды) + похожая пара + ничего лишнего.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: "image/jpeg" });
}

export function loadDemoFiles(): File[] {
  const now = Date.now();
  const mk = (blob: Blob, name: string, ageMs: number): File =>
    new File([blob], name, { type: "image/jpeg", lastModified: now - ageMs });
  const office = dataUrlToBlob(officeUrl);
  const lakeA = dataUrlToBlob(lakeAUrl);
  const lakeB = dataUrlToBlob(lakeBUrl);
  return [
    mk(office, "office-original.jpg", 90_000),
    mk(office, "office-copy.jpg", 10_000),
    mk(lakeA, "lake-morning-1.jpg", 80_000),
    mk(lakeB, "lake-morning-2.jpg", 20_000),
  ];
}
