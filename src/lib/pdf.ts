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

export interface PricingItemData {
  name: string;
  category: string;
  quantity: number;
  pricePerPlate: number;
  discount: number;
}

export interface EventPricingData {
  strategy: 'itemized' | 'per_plate';
  perPlatePrice: number;
  perPlateQuantity: number;
  perPlateDiscount: number;
  items: PricingItemData[];
}

export interface PDFQuoteData {
  customerName: string;
  customerEmail: string;
  mobile: string;
  events: PDFEventData[];
  pricing?: Record<string, EventPricingData>;
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

  // --- Pricing Data Generation ---
  if (data.pricing && Object.keys(data.pricing).length > 0) {
    doc.addPage();
    currentY = 20;

    // Title for Pricing
    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.rect(20, currentY - 8, pageWidth - 40, 16, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("COST ESTIMATION", pageWidth / 2, currentY + 3, { align: 'center' });
    currentY += 20;
    
    let globalSubtotal = 0;
    let globalDiscount = 0;
    let grandTotal = 0;

    for (const [eventName, evState] of Object.entries(data.pricing)) {
      const items = evState.items || [];
      if (!items || items.length === 0) continue;

      if (currentY + 20 > pageHeight - 40) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(`Event: ${eventName.toUpperCase()}`, 20, currentY);
      currentY += 6;
      
      let eventTotal = 0;

      if (evState.strategy === 'per_plate') {
        const qty = evState.perPlateQuantity || 0;
        const price = evState.perPlatePrice || 0;
        const disc = evState.perPlateDiscount || 0;
        
        const itemBaseTotal = qty * price;
        const itemDiscountAmt = itemBaseTotal * (disc / 100);
        
        eventTotal = itemBaseTotal - itemDiscountAmt;
        globalSubtotal += itemBaseTotal;
        globalDiscount += itemDiscountAmt;
        
        const head = disc > 0 
          ? [['Guests', 'Price/Plate', 'Discount (%)', 'Event Total']]
          : [['Guests', 'Price/Plate', 'Event Total']];
          
        const body = disc > 0
          ? [[qty, `Rs ${price}`, `${disc}%`, `Rs ${Math.max(0, eventTotal).toLocaleString(undefined, { maximumFractionDigits: 0 })}`]]
          : [[qty, `Rs ${price}`, `Rs ${Math.max(0, eventTotal).toLocaleString(undefined, { maximumFractionDigits: 0 })}`]];

        // Draw Event Summary Table
        autoTable(doc, {
          startY: currentY,
          head: head,
          body: body,
          theme: 'grid',
          headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: bgWarm },
          styles: { fontSize: 10, cellPadding: 4, lineColor: borderCol },
          margin: { left: 20, right: 20 },
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 15;
        
      } else {
        // Determine if this event has any discount
        const hasDiscount = items.some(item => (item.discount || 0) > 0);
        
        const head = hasDiscount 
          ? [['S.No', 'Type', 'Qty', 'Price/Plate', 'Discount %', 'Total']]
          : [['S.No', 'Type', 'Qty', 'Price/Plate', 'Total']];
          
        const body = items.map((item, idx) => {
          const itemBaseTotal = item.quantity * item.pricePerPlate;
          const itemDiscountAmt = itemBaseTotal * ((item.discount || 0) / 100);
          
          const lineTotal = itemBaseTotal - itemDiscountAmt;
          const totalValue = Math.max(0, lineTotal);
          eventTotal += totalValue;
          
          globalSubtotal += itemBaseTotal;
          globalDiscount += itemDiscountAmt;
          
          const typeStr = `${item.name}\n(${item.category})`;
          if (hasDiscount) {
            return [idx + 1, typeStr, item.quantity, `Rs ${item.pricePerPlate}`, `${item.discount || 0}%`, `Rs ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`];
          } else {
            return [idx + 1, typeStr, item.quantity, `Rs ${item.pricePerPlate}`, `Rs ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`];
          }
        });
        
        autoTable(doc, {
          startY: currentY,
          head: head,
          body: body,
          theme: 'grid',
          headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: bgWarm },
          styles: { fontSize: 9, cellPadding: 4, lineColor: borderCol },
          margin: { top: 20, bottom: 40, left: 20, right: 20 },
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 7;
        
        // Print event total below table
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.text(`Total for ${eventName}: Rs ${eventTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, pageWidth - 20, currentY, { align: "right" });
        currentY += 15;
      }
      
      grandTotal += eventTotal;
    }
    
    // Invoice Style Totals
    if (currentY + 40 > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }

    const startX = pageWidth - 80;
    const lineX = pageWidth - 20;
    
    doc.setFontSize(10);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    
    // Subtotal
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", startX, currentY);
    doc.text(`Rs ${globalSubtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, lineX, currentY, { align: "right" });
    currentY += 8;

    // Discount
    if (globalDiscount > 0) {
      doc.text("Total Discount:", startX, currentY);
      doc.text(`- Rs ${globalDiscount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, lineX, currentY, { align: "right" });
      currentY += 8;
    }
    
    // Line separator
    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.line(startX, currentY - 3, lineX, currentY - 3);
    
    // Grand Total
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text("GRAND TOTAL:", startX, currentY + 3);
    doc.text(`Rs ${grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, lineX, currentY + 3, { align: "right" });
    
    currentY += 25;
  }

  // Check if signoff needs a new page
  if (currentY + 10 > pageHeight - 40) {
    doc.addPage();
    currentY = 20;
  }

  // --- Sign off ---
  doc.setFont("helvetica", "italic");
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  
  if (data.pricing && Object.keys(data.pricing).length > 0) {
    doc.text("Thank you for choosing Brinda Catering. Please review the estimated costs above.", pageWidth / 2, currentY, { align: "center" });
  } else {
    doc.text("Thank you for choosing Brinda Catering. We will get back to you with a quote soon.", pageWidth / 2, currentY, { align: "center" });
  }

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
