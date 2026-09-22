import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { business } from '@/data/business';

export interface PDFEventData {
  eventName: string;
  eventDate: string;
  guestCount: string;
  customNotes: string;
  tableData: (string | number)[][]; // ['#', 'Item Name', 'Category', 'Description']
}

export interface PDFQuoteData {
  customerName: string;
  customerEmail: string;
  mobile: string;
  events: PDFEventData[];
}

export const generateQuotePDF = async (data: PDFQuoteData) => {
  const { customerName, customerEmail, mobile, events } = data;
  
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
  
  // Load Logo
  try {
    const logoBase64 = await fetch('/assets/brindapdflogo.png')
      .then(res => res.blob())
      .then(blob => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      }));
    
    // Adjust dimensions as needed based on the logo's aspect ratio
    doc.addImage(logoBase64, 'PNG', 20, 3, 22, 22);
    
    // Add company name next to the logo
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Brinda Catering", 46, 19);
  } catch (err) {
    console.error("Failed to load logo for PDF", err);
    // Fallback if logo fails
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Brinda Catering", 20, 19);
  }
  
  // Quote Request Title
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(16);
  doc.text("OFFICIAL QUOTATION REQUEST", 20, 45);
  
  // --- Details Box ---
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.setFillColor(bgWarm[0], bgWarm[1], bgWarm[2]);
  doc.roundedRect(20, 52, pageWidth - 40, 22, 2, 2, 'FD');
  
  // Details Headers
  doc.setFontSize(10);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont("helvetica", "bold");
  doc.text("CUSTOMER DETAILS", 24, 60);
  
  doc.setFont("helvetica", "normal");
  const labelOffset = 15;
  const col2 = 80;
  const col3 = 140;

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Name:", 24, 66);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(customerName, 24 + labelOffset, 66);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Email:", col2, 66);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(customerEmail, col2 + labelOffset, 66);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Mobile:", col3, 66);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(mobile, col3 + labelOffset, 66);

  let currentY = 85;

  // --- Loop through Events ---
  for (const event of events) {
    // Check if we need to add a new page for the event header
    if (currentY + 30 > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text(event.eventName.toUpperCase(), 20, currentY);
    
    currentY += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`Date: ${event.eventDate || 'TBD'}  |  Guests: ${event.guestCount || 'TBD'}`, 20, currentY);
    
    currentY += 8;

    if (event.tableData.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Item Name', 'Category', 'Description']],
        body: event.tableData,
        theme: 'grid',
        headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: bgWarm },
        styles: { fontSize: 10, cellPadding: 4, lineColor: borderCol },
        margin: { top: 20, bottom: 40, left: 20, right: 20 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    if (event.customNotes.trim()) {
      if (currentY + 40 > pageHeight - 40) {
        doc.addPage();
        currentY = 20;
      }
  
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(`NOTES FOR ${event.eventName.toUpperCase()}:`, 20, currentY);
      
      currentY += 4;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const splitNotes = doc.splitTextToSize(event.customNotes, pageWidth - 48);
      const boxHeight = (splitNotes.length * 5) + 10;
      
      doc.setDrawColor(accent[0], accent[1], accent[2]);
      doc.setFillColor(bgWarm[0], bgWarm[1], bgWarm[2]);
      doc.roundedRect(20, currentY, pageWidth - 40, Math.max(20, boxHeight), 2, 2, 'FD');
      
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(splitNotes, 24, currentY + 7);
      
      currentY += Math.max(20, boxHeight) + 15;
    }
  }

  // Check if signoff needs a new page
  if (currentY + 10 > pageHeight - 40) {
    doc.addPage();
    currentY = 20;
  }

  // --- Sign off ---
  doc.setFont("helvetica", "italic");
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Thank you for choosing Brinda Catering. We will get back to you with a quote soon.", pageWidth / 2, currentY, { align: "center" });

  // --- Footer on all pages ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.rect(0, pageHeight - 22, pageWidth, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    // Line 1: Full address
    const fullAddress = business.addressLines.join(', ');
    doc.text(`${business.name} | ${fullAddress}`, pageWidth / 2, pageHeight - 14, { align: "center" });
    
    // Line 2: Phone + WhatsApp
    doc.text(`Phone: ${business.phone} | WhatsApp: ${business.whatsapp}`, pageWidth / 2, pageHeight - 7, { align: "center" });
    
    // Page number
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 10, pageHeight - 6, { align: "right" });
  }

  // Save PDF
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`Brinda_Caterers_Quote_${dateStr}.pdf`);
};
