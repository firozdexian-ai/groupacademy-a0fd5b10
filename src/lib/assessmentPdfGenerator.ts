import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface Assessment {
  id: string;
  full_name: string;
  profession_categories?: {
    name: string;
  };
}

export async function generateScorecardPDF(assessment: Assessment) {
  const element = document.getElementById("scorecard-pdf-content");
  if (!element) {
    throw new Error("Scorecard template not found");
  }

  // Temporarily make element visible for capture
  const originalPosition = element.style.position;
  const originalLeft = element.style.left;
  element.style.position = "fixed";
  element.style.left = "0";
  element.style.top = "0";
  element.style.zIndex = "-1";

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    // Calculate PDF dimensions (A4)
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/png");

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

    // Generate filename
    const sanitizedName = assessment.full_name.replace(/[^a-z0-9]/gi, "_");
    const date = new Date().toISOString().split("T")[0];
    const filename = `CareerScorecard_${sanitizedName}_${date}.pdf`;

    // Download
    pdf.save(filename);
  } finally {
    // Restore original position
    element.style.position = originalPosition;
    element.style.left = originalLeft;
  }
}