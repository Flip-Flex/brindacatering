import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PDFQuoteData {
  customerName: string;
  customerEmail: string;
  mobile: string;
  eventDate: string;
  guestCount: string;
  customNotes: string;
  tableData: (string | number)[][]; // ['#', 'Item Name', 'Category', 'Description']
}

export const generateQuotePDF = (data: PDFQuoteData) => {
  const { customerName, customerEmail, mobile, eventDate, guestCount, customNotes, tableData } = data;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // --- Brand Colors (RGB) ---
  const primary: [number, number, number] = [18, 60, 42]; // #123c2a Deep Forest Green
  const accent: [number, number, number] = [198, 161, 91]; // #c6a15b Muted Antique Gold
  const bgWarm: [number, number, number] = [247, 242, 232]; // #f7f2e8 Warm Ivory
  const textDark: [number, number, number] = [24, 34, 29]; // #18221d Deep Charcoal
  const textMuted: [number, number, number] = [105, 119, 109]; // #69776d Sage Gray
  const borderCol: [number, number, number] = [221, 211, 191]; // #ddd3bf
  
  // --- Header Background ---
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');
  
  // Gold accent line
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 28, pageWidth, 2, 'F');
  
  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("BRINDA CATERERS", 20, 19);
  
  // Quote Request Title
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(16);
  doc.text("OFFICIAL QUOTATION REQUEST", 20, 45);
  
  // --- Details Box ---
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.setFillColor(bgWarm[0], bgWarm[1], bgWarm[2]);
  doc.roundedRect(20, 52, pageWidth - 40, 32, 2, 2, 'FD');
  
  // Details Headers
  doc.setFontSize(10);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont("helvetica", "bold");
  doc.text("CUSTOMER DETAILS", 24, 60);
  doc.text("EVENT DETAILS", pageWidth / 2, 60);
  
  doc.setFont("helvetica", "normal");
  const labelOffset = 15;
  const rightCol = pageWidth / 2;

  // Customer Col
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Name:", 24, 66);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(customerName, 24 + labelOffset, 66);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Email:", 24, 72);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(customerEmail, 24 + labelOffset, 72);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Mobile:", 24, 78);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(mobile, 24 + labelOffset, 78);

  // Event Col
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Date:", rightCol, 66);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(eventDate, rightCol + labelOffset, 66);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Guests:", rightCol, 72);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(guestCount, rightCol + labelOffset, 72);
  
  // --- Menu Table ---
  let finalY = 90;
  
  if (tableData.length > 0) {
    autoTable(doc, {
      startY: 95,
      head: [['#', 'Item Name', 'Category', 'Description']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: bgWarm },
      styles: { fontSize: 10, cellPadding: 4, lineColor: borderCol },
      margin: { left: 20, right: 20 },
    });

    finalY = (doc as any).lastAutoTable.finalY || 95;
  }

  let currentY = finalY + 15;

  // --- Special Instructions Box ---
  if (customNotes.trim()) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text("SPECIAL INSTRUCTIONS:", 20, currentY);
    
    currentY += 4;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const splitNotes = doc.splitTextToSize(customNotes, pageWidth - 48);
    const boxHeight = (splitNotes.length * 5) + 10;
    
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setFillColor(bgWarm[0], bgWarm[1], bgWarm[2]);
    doc.roundedRect(20, currentY, pageWidth - 40, Math.max(20, boxHeight), 2, 2, 'FD');
    
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(splitNotes, 24, currentY + 7);
    
    currentY += Math.max(20, boxHeight) + 15;
  }

  // --- Sign off ---
  doc.setFont("helvetica", "italic");
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Thank you for choosing Brinda Caterers. We will get back to you with a quote soon.", pageWidth / 2, currentY, { align: "center" });

  // --- Footer ---
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Brinda Caterers | 123 Food Street, Culinary City | +1 234 567 8900", pageWidth / 2, pageHeight - 6, { align: "center" });

  // Save PDF
  doc.save(`Brinda_Caterers_Quote_${eventDate.replace(/\//g, '-') || 'Download'}.pdf`);
};
