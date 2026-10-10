"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ExportImageOptions {
  scale?: number;
  backgroundColor?: string;
  filename?: string;
}

/**
 * HTML 엘리먼트를 고화질 PNG 이미지로 브라우저에서 바로 다운로드합니다.
 */
export async function exportElementToImage(
  element: HTMLElement,
  filename: string,
  options?: ExportImageOptions
): Promise<boolean> {
  try {
    const scale = options?.scale ?? 2; // 레티나 고해상도 지원
    const backgroundColor = options?.backgroundColor ?? "#ffffff";

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const dataUrl = canvas.toDataURL("image/png");
    const downloadName = filename.endsWith(".png") ? filename : `${filename}.png`;

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error("이미지 내보내기 실패:", error);
    throw error;
  }
}

interface ExportPdfOptions {
  filename?: string;
  orientation?: "portrait" | "landscape";
}

/**
 * HTML 엘리먼트를 A4 규격 PDF 문서로 브라우저에서 즉시 다운로드합니다.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
  options?: ExportPdfOptions
): Promise<boolean> {
  try {
    const orientation = options?.orientation ?? "portrait";

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL("image/png");

    // A4 사이즈: 210mm x 297mm
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    });

    const pageWidth = orientation === "portrait" ? 210 : 297;
    const pageHeight = orientation === "portrait" ? 297 : 210;

    // 비율에 맞게 높이 계산
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // 만약 한 장에 딱 맞게 넣어야 하는 서식인 경우 최대 높이 조절
    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    } else {
      // 여러 페이지 처리
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    const downloadName = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    pdf.save(downloadName);

    return true;
  } catch (error) {
    console.error("PDF 내보내기 실패:", error);
    throw error;
  }
}
