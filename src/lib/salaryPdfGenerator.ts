import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function generateSalaryAnalysisPDF(elementId: string, filename: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("PDF element not found:", elementId);
    return false;
  }

  try {
    // Make element visible for capture
    element.style.position = "absolute";
    element.style.left = "-9999px";
    element.style.top = "0";
    element.style.display = "block";
    document.body.appendChild(element);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff"
    });

    // Calculate dimensions for A4
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      0,
      position,
      imgWidth,
      imgHeight
    );
    heightLeft -= pageHeight;

    // Add additional pages if content overflows
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;
    }

    pdf.save(filename);

    // Cleanup
    element.style.position = "";
    element.style.left = "";
    element.style.top = "";
    element.style.display = "none";

    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return false;
  }
}