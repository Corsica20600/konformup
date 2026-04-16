import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getOrganizationSettings } from "@/lib/organization";
import { getTrainerResourceBySlug, type TrainerResourceDefinition, type TrainerResourceSlug } from "@/lib/trainer-resources";

const SOURCE_PDF_PATH = path.join(process.cwd(), "assets", "deroule-pedagogique-sst-source.pdf");
const DEFAULT_LOGO_PATH = path.join(process.cwd(), "public", "logo-organisme.png");
const FALLBACK_LOGO_PATH = path.join(process.cwd(), "public", "logo.jpg");

async function resolveLocalLogoPath(logoUrl: string | null | undefined) {
  const relativeLogoPath =
    logoUrl && logoUrl.startsWith("/") ? path.join(process.cwd(), "public", logoUrl.replace(/^\//, "")) : null;

  if (relativeLogoPath) {
    try {
      await readFile(relativeLogoPath);
      return relativeLogoPath;
    } catch {
      return DEFAULT_LOGO_PATH;
    }
  }

  return DEFAULT_LOGO_PATH;
}

async function readLogoBytes(logoPath: string) {
  try {
    return await readFile(logoPath);
  } catch {
    return readFile(FALLBACK_LOGO_PATH);
  }
}

function drawSharedFooter(params: {
  page: import("pdf-lib").PDFPage;
  pageIndex: number;
  pageCount: number;
  organizationName: string;
  font: import("pdf-lib").PDFFont;
}) {
  const { page, pageIndex, pageCount, organizationName, font } = params;
  const { width } = page.getSize();

  page.drawRectangle({
    x: 24,
    y: 18,
    width: width - 48,
    height: 24,
    color: rgb(0.95, 0.93, 0.88),
    opacity: 0.9
  });

  page.drawText(`${organizationName}  |  Support formateur`, {
    x: 34,
    y: 26,
    size: 10,
    font,
    color: rgb(0.17, 0.19, 0.18)
  });

  page.drawText(`Page ${pageIndex + 1}/${pageCount}`, {
    x: width - 92,
    y: 26,
    size: 10,
    font,
    color: rgb(0.17, 0.19, 0.18)
  });
}

async function applyBranding(document: PDFDocument, resource: TrainerResourceDefinition) {
  const organization = await getOrganizationSettings();
  const organizationName = organization.organization_name || "Konformup";
  const pageCount = document.getPageCount();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const fontBold = await document.embedFont(StandardFonts.HelveticaBold);
  const logoPath = await resolveLocalLogoPath(organization.logo_url);
  const logoBytes = await readLogoBytes(logoPath);
  const logo =
    path.extname(logoPath).toLowerCase() === ".jpg" || path.extname(logoPath).toLowerCase() === ".jpeg"
      ? await document.embedJpg(logoBytes)
      : await document.embedPng(logoBytes);

  document.getPages().forEach((page, index) => {
    const { width, height } = page.getSize();
    drawSharedFooter({ page, pageIndex: index, pageCount, organizationName, font });

    page.drawText("KONFORMUP", {
      x: width - 128,
      y: height - 30,
      size: 11,
      font: fontBold,
      color: rgb(0.17, 0.19, 0.18),
      opacity: 0.85
    });

    if (index === 0) {
      const scaled = logo.scale(0.2);

      page.drawRectangle({
        x: 24,
        y: height - 64,
        width: width - 48,
        height: 28,
        color: rgb(0.95, 0.93, 0.88),
        opacity: 0.95
      });

      page.drawImage(logo, {
        x: 30,
        y: height - 60,
        width: scaled.width,
        height: scaled.height
      });

      page.drawText(resource.title, {
        x: 96,
        y: height - 50,
        size: 12,
        font: fontBold,
        color: rgb(0.17, 0.19, 0.18)
      });

      page.drawText(`Entite : ${organizationName}`, {
        x: width - 180,
        y: height - 50,
        size: 10,
        font,
        color: rgb(0.17, 0.19, 0.18)
      });
    }
  });
}

export async function generateTrainerResourcePdf(resourceSlug: TrainerResourceSlug) {
  const resource = getTrainerResourceBySlug(resourceSlug);

  if (!resource) {
    throw new Error("Ressource formateur introuvable.");
  }

  const sourceBytes = await readFile(SOURCE_PDF_PATH);
  const document = await PDFDocument.load(sourceBytes);
  await applyBranding(document, resource);

  return {
    resource,
    bytes: await document.save()
  };
}
