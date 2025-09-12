import jsPDF from 'jspdf';
import autoTable from "jspdf-autotable";
import type { Workout, CoachProfile } from '@shared/schema';
import { any } from 'zod';

export class PDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private isLoggedIn: boolean;

  constructor(isLoggedIn: boolean = true) {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.isLoggedIn = isLoggedIn;
  }

  async generateWorkoutPDF(workout: Workout, coachProfile?: CoachProfile | null, filename?: string, selectedExercises?: any[]): Promise<Blob> {
    // Check if there are any exercises with glossary content or if we have manually selected exercises
    const hasGlossaryExercises = workout.weeks.some(week => 
      week.days.some(day => 
        day.exercises.some(exercise => exercise.glossaryContent)
      )
    ) || (selectedExercises && selectedExercises.length > 0);
    
    this.doc = new jsPDF();
    let yPosition = this.margin;

    // Se l'utente non è loggato, imposta un profilo coach vuoto con filigrana attiva e colori neri
    if (!this.isLoggedIn) {
      coachProfile = {
        id: '',
        name: '',
        email: '',
        phone: '',
        bio: '',
        instagram: '',
        facebook: '',
        website: '',
        logo: '',
        exportPath: '',
        pdfLineColor: '#000000',
        pdfTextColor: '#000000',
        showWatermark: true,
        useWorkoutNameAsTitle: false
      };
    }

    // Set colors from coach profile
    const lineColor = coachProfile?.pdfLineColor || '#000000';
    const textColor = coachProfile?.pdfTextColor || '#4F46E5';
    this.doc.setDrawColor(lineColor);
    this.doc.setTextColor('#000000'); // Keep body text black for readability

    // Header with coach info and logo
    yPosition = this.addHeader(workout, yPosition, coachProfile, lineColor, textColor);
    yPosition += 10;

    // Workout info
    yPosition = this.addWorkoutInfo(workout, yPosition, lineColor);
    yPosition += 10;

    // Description
    if (workout.description) {
      yPosition = this.addDescription(workout.description, yPosition, lineColor, textColor);
      yPosition += 10;
    }

    // Weekly progression
    yPosition = this.addWeeklyProgression(workout, yPosition, lineColor, textColor);

    // Dietary advice
    if (workout.dietaryAdvice) {
      yPosition = this.addDietaryAdvice(workout.dietaryAdvice, yPosition, lineColor, textColor);
      yPosition += 10;
    }
    
    // Glossary exercises section
    if (hasGlossaryExercises) {
      yPosition = this.addGlossaryExercises(workout, yPosition, lineColor, textColor, selectedExercises);
    }

    // Footer with coach contact info (includes optional small watermark)
    const pageCount = this.doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.addFooter(coachProfile, i, pageCount);
    }

    return this.doc.output('blob');
  }

  downloadPDF(blob: Blob, filename: string, exportPath?: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    
    // If export path is specified, suggest it in the filename
    if (exportPath && exportPath.trim()) {
      a.download = `${exportPath.replace(/\/$/, '')}/${filename}`;
    }
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private addHeader(workout: Workout, yPosition: number, coachProfile?: CoachProfile | null, lineColor?: string, textColor?: string): number {
    // Add logo if present - posizionato sopra il titolo
    if (coachProfile?.logo) {
      try {
        // Logo centrato sopra il titolo
        const logoSize = 30;
        const logoX = (this.pageWidth - logoSize) / 2;
        this.doc.addImage(coachProfile.logo, 'JPEG', logoX, yPosition, logoSize, logoSize);
        yPosition += logoSize + 10; // Spazio dopo il logo
      } catch (error) {
        console.warn('Could not add logo to PDF:', error);
      }
    }

    // Title - usa il nome della scheda se il flag è attivo
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(24);
    const titleRgb = this.hexToRgb(textColor || '#4F46E5');
    this.doc.setTextColor(titleRgb.r, titleRgb.g, titleRgb.b);
    
    const title = (coachProfile?.useWorkoutNameAsTitle && workout.name) 
      ? workout.name.toUpperCase() 
      : 'SCHEDA DI ALLENAMENTO';
    
    // Ridimensiona dinamicamente il titolo se eccede la larghezza utile
    const maxTitleWidth = this.pageWidth - 2 * this.margin;
    let titleFontSize = 24;
    this.doc.setFontSize(titleFontSize);
    while (this.doc.getTextWidth(title) > maxTitleWidth && titleFontSize > 12) {
      titleFontSize -= 1;
      this.doc.setFontSize(titleFontSize);
    }
    this.doc.text(title, this.pageWidth / 2, yPosition + 10, { align: 'center' });
    yPosition += 15 + Math.max(0, (24 - titleFontSize));

    // Subtitle
    this.doc.setFontSize(14);
    this.doc.setTextColor(0, 0, 0);
    const subtitle = `${workout.workoutType} - ${workout.duration} settimane`;
    const subtitleMaxWidth = this.pageWidth - 2 * this.margin;
    if (this.doc.getTextWidth(subtitle) > subtitleMaxWidth) {
      const lines = this.doc.splitTextToSize(subtitle, subtitleMaxWidth);
      this.doc.text(lines, this.pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lines.length * 6 + 3;
    } else {
      this.doc.text(subtitle, this.pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
    }

    // Coach name if present
    if (coachProfile?.name) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(`Coach: ${coachProfile.name}`, this.pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
    }

    // Coach biography if present
    if (coachProfile?.bio) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(80, 80, 80);
      const bioLines = this.doc.splitTextToSize(coachProfile.bio, this.pageWidth - 2 * this.margin);
      this.doc.text(bioLines, this.pageWidth / 2, yPosition, { align: 'center' });
      yPosition += bioLines.length * 4 + 5;
    }

    // Line separator with custom color
    if (lineColor) {
      const rgb = this.hexToRgb(lineColor);
      this.doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    } else {
      this.doc.setDrawColor(79, 70, 229);
    }
    this.doc.setLineWidth(1);
    this.doc.line(this.margin, yPosition, this.pageWidth - this.margin, yPosition);
    yPosition += 10;

    return yPosition;
  }

  private addWorkoutInfo(workout: Workout, yPosition: number, lineColor?: string): number {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);

    // Coach and client info in two columns
    const midPoint = this.pageWidth / 2;
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('LIVELLO:', this.margin, yPosition);
    this.doc.text('CLIENTE:', midPoint, yPosition);
    
    this.doc.setFont('helvetica', 'normal');
    const leftValX = this.margin + 25;
    const rightValX = midPoint + 30;
    const leftMaxW = midPoint - leftValX - 5;
    const rightMaxW = (this.pageWidth - this.margin) - rightValX - 5;
    const levelLines = this.doc.splitTextToSize(workout.level || '', Math.max(0, leftMaxW));
    const clientLines = this.doc.splitTextToSize(workout.clientName || '', Math.max(0, rightMaxW));
    this.doc.text(levelLines, leftValX, yPosition);
    this.doc.text(clientLines, rightValX, yPosition);
    yPosition += Math.max(levelLines.length, clientLines.length) * 5 + 2;

    this.doc.setFont('helvetica', 'bold');
    this.doc.text('TIPO:', this.margin, yPosition);
    this.doc.text('DURATA:', midPoint, yPosition);
    
    this.doc.setFont('helvetica', 'normal');
    const typeLines = this.doc.splitTextToSize(workout.workoutType || '', Math.max(0, leftMaxW));
    const durationLines = this.doc.splitTextToSize(`${workout.duration} settimane`, Math.max(0, rightMaxW));
    this.doc.text(typeLines, leftValX, yPosition);
    this.doc.text(durationLines, rightValX, yPosition);
    yPosition += Math.max(typeLines.length, durationLines.length) * 5 + 2;

    return yPosition;
  }

  private addDescription(description: string, yPosition: number, lineColor?: string, textColor?: string): number {
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    const titleRgb = this.hexToRgb(textColor || '#4F46E5');
    this.doc.setTextColor(titleRgb.r, titleRgb.g, titleRgb.b);
    this.doc.text('DESCRIZIONE', this.margin, yPosition);
    yPosition += 8;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    
    const lines = this.doc.splitTextToSize(description, this.pageWidth - 2 * this.margin);
    this.doc.text(lines, this.margin, yPosition);
    yPosition += lines.length * 5;

    return yPosition;
  }

  private addWeeklyProgression(workout: Workout, yPosition: number, lineColor?: string, textColor?: string): number {
  this.doc.setFont('helvetica', 'bold');
  this.doc.setFontSize(14);
  const titleRgb = this.hexToRgb(textColor || '#4F46E5');
  this.doc.setTextColor(titleRgb.r, titleRgb.g, titleRgb.b);
  this.doc.text('PROGRESSIONE SETTIMANALE', this.margin, yPosition);
  yPosition += 10;

  for (const week of workout.weeks) {
    if (yPosition > this.pageHeight - 80) {
      this.doc.addPage();
      yPosition = this.margin;
    }

    // Titolo settimana
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(0, 0, 0);
    const weekName = (week.name || `SETTIMANA ${week.number}`).toUpperCase();
    this.doc.text(weekName, this.margin, yPosition);
    yPosition += 8;

    // Note settimana
    if (week.notes) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(9);
      const noteLines = this.doc.splitTextToSize(week.notes, this.pageWidth - 2 * this.margin);
      this.doc.text(noteLines, this.margin, yPosition);
      yPosition += noteLines.length * 4;
    }

    // Giorni della settimana
    for (const day of week.days) {
      if (yPosition > this.pageHeight - 60) {
        this.doc.addPage();
        yPosition = this.margin;
      }

      // Titolo giorno
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(11);
      const dayTitleRgb = this.hexToRgb(textColor || '#4F46E5');
      this.doc.setTextColor(dayTitleRgb.r, dayTitleRgb.g, dayTitleRgb.b);
      this.doc.text(day.name || 'GIORNO', this.margin + 5, yPosition);
      yPosition += 7;

      // Note giorno
      if (day.notes) {
        this.doc.setFont('helvetica', 'italic');
        this.doc.setFontSize(8);
        const dayNoteLines = this.doc.splitTextToSize(day.notes, this.pageWidth - 2 * this.margin);
        this.doc.text(dayNoteLines, this.margin + 10, yPosition);
        yPosition += dayNoteLines.length * 3;
      }

      if (day.exercises.length > 0) {
        // Imposto dimensioni tabella
        const colWidths = [65, 20, 20, 25, 30];
        const headers = ['ESERCIZIO', 'SERIE', 'REPS', 'CARICO', 'RECUPERO'];
        const startX = this.margin + 5;
        let rowY = yPosition;

        // Header tabella
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(8);
        this.doc.setTextColor(0, 0, 0);

        let x = startX;
        headers.forEach((h, i) => {
          this.doc.setLineWidth(0.5); // più spesso (0.2 default, 0.5 medio, 1 molto spesso)
          this.doc.text(h, x + 2, rowY + 4);
          this.doc.rect(x, rowY, colWidths[i], 6);
          x += colWidths[i];
        });
        rowY += 6;

        // Righe esercizi
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(8);

        for (const exercise of day.exercises) {
          // Controllo spazio pagina
          if (rowY > this.pageHeight - 40) {
            this.doc.addPage();
            rowY = this.margin;
          }

          const rowValues = [
            exercise.name || '',
            exercise.sets || '',
            exercise.reps || '',
            exercise.load || '',
            exercise.rest || ''
          ];

          x = startX;
          rowValues.forEach((val, i) => {
            const wrapped = this.doc.splitTextToSize(val, colWidths[i] - 4);
            this.doc.text(wrapped, x + 2, rowY + 4);
            this.doc.rect(x, rowY, colWidths[i], 8);
            x += colWidths[i];
          });

          rowY += 8;

          // Note esercizio sotto la riga
          if (exercise.notes) {
            const noteLines = this.doc.splitTextToSize(`Note: ${exercise.notes}`, this.pageWidth - 2 * this.margin);
            this.doc.setFont('helvetica', 'italic');
            this.doc.setFontSize(7);
            this.doc.text(noteLines, startX, rowY + 3);
            rowY += noteLines.length * 3 + 2;
            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(8);
          }
        }

        yPosition = rowY + 10;
      }
    }

    yPosition += 5; // Spazio dopo ogni settimana
  }

  return yPosition;
}


  private addDietaryAdvice(advice: string, yPosition: number, lineColor?: string, textColor?: string): number {
    if (yPosition > this.pageHeight - 60) {
      this.doc.addPage();
      yPosition = this.margin;
    }

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    const titleRgb = this.hexToRgb(textColor || '#4F46E5');
    this.doc.setTextColor(titleRgb.r, titleRgb.g, titleRgb.b);
    this.doc.text('CONSIGLI DIETISTICI', this.margin, yPosition);
    yPosition += 8;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);
    
    const lines = this.doc.splitTextToSize(advice, this.pageWidth - 2 * this.margin);
    this.doc.text(lines, this.margin, yPosition);

    return yPosition + lines.length * 5;
  }

  private addFooter(coachProfile?: CoachProfile | null, currentPage?: number, totalPages?: number): void {
    const footerY = this.pageHeight - 25;
    
    // Coach contact info
    if (coachProfile) {
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      
      let contactInfo = [];
      if (coachProfile.email) contactInfo.push(`Email: ${coachProfile.email}`);
      if (coachProfile.phone) contactInfo.push(`Tel: ${coachProfile.phone}`);
      if (coachProfile.instagram) {
        const instagram = coachProfile.instagram.startsWith('@') || coachProfile.instagram.startsWith('http') 
          ? coachProfile.instagram 
          : `@${coachProfile.instagram}`;
        contactInfo.push(`Instagram: ${instagram}`);
      }
      if (coachProfile.facebook) {
        contactInfo.push(`Facebook: ${coachProfile.facebook}`);
      }
      if (coachProfile.website) {
        const website = coachProfile.website.startsWith('http') 
          ? coachProfile.website 
          : `https://${coachProfile.website}`;
        contactInfo.push(`Web: ${website}`);
      }
      
      if (contactInfo.length > 0) {
        const contactText = contactInfo.join(' • ');
        const lines = this.doc.splitTextToSize(contactText, this.pageWidth - 2 * this.margin);
        this.doc.text(lines, this.pageWidth / 2, footerY, { align: 'center' });
      }
    }
    
    const watermarkY = footerY + 10;

    // Generation info (piccola filigrana rimovibile)
    if (coachProfile?.showWatermark !== false) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(8);
      this.doc.setTextColor(150, 150, 150);
      this.doc.text('Generato con EasyWorkout Planner', this.margin, watermarkY);
    }

    // Page number
    if (currentPage && totalPages) {
      this.doc.setFont('helvetica', 'italic');
      this.doc.setFontSize(8);
      this.doc.setTextColor(150, 150, 150);
      const pageText = `Pagina ${currentPage} di ${totalPages}`;
      this.doc.text(pageText, this.pageWidth / 2, watermarkY, { align: 'center' });
    }

    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(8);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text(new Date().toLocaleDateString('it-IT'), this.pageWidth - this.margin, watermarkY, { align: 'right' });
  }

  // Tronca il testo aggiungendo un'ellissi se supera la larghezza massima
  private fitText(text: string, maxWidth: number): string {
    if (!text) return '';
    if (this.doc.getTextWidth(text) <= maxWidth) return text;
    const ellipsis = '…';
    let start = 0;
    let end = text.length;
    let best = '';
    // Binary search per trovare la lunghezza massima che entra
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const candidate = text.slice(0, mid) + ellipsis;
      if (this.doc.getTextWidth(candidate) <= maxWidth) {
        best = candidate;
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }
    return best || ellipsis;
  }

   private addGlossaryExercises(
    workout: Workout,
    yPosition: number,
    lineColor?: string,
    textColor?: string,
    selectedExercises?: any[]
  ): number {
    if (yPosition > this.pageHeight - 60) {
      this.doc.addPage();
      yPosition = this.margin;
    }

    // Titolo
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(14);
    const titleRgb = this.hexToRgb(textColor || "#4F46E5");
    this.doc.setTextColor(titleRgb.r, titleRgb.g, titleRgb.b);
    this.doc.text("GLOSSARIO ESERCIZI", this.margin, yPosition);
    yPosition += 12;
    this.doc.setTextColor(0, 0, 0);

    // Raccogli esercizi
    const glossaryExercises: Array<any> = [];
    workout.weeks.forEach((week) => {
      week.days.forEach((day) => {
        day.exercises.forEach((exercise) => {
          if (exercise.glossaryContent && !glossaryExercises.some((e) => e.name === exercise.name)) {
            glossaryExercises.push(exercise);
          }
        });
      });
    });

    if (selectedExercises && selectedExercises.length > 0) {
      selectedExercises.forEach((exercise) => {
        if (!glossaryExercises.some((e) => e.name === exercise.name)) {
          glossaryExercises.push({
            name: exercise.name,
            glossaryContent: exercise.glossaryContent || {
              description: exercise.description || "",
              images: exercise.images || [],
            },
          });
        }
      });
    }

    if (glossaryExercises.length === 0) return yPosition;

     const rgb = this.hexToRgb(lineColor || "#000000");

    for (const ex of glossaryExercises) {
    autoTable(this.doc, {
      startY: yPosition,
      head: [[ex.name]],
      body: [[ex.glossaryContent?.description || "Nessuna descrizione"]],
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 5,
        halign: "left",
      },
      headStyles: {
        fillColor: [rgb.r, rgb.g, rgb.b], // qui usiamo il colore personalizzato
        textColor: 255,
        fontSize: 12,
      },
      bodyStyles: {
        lineColor: [rgb.r, rgb.g, rgb.b], // bordi coerenti
        lineWidth: 0.2,
      },
      margin: { left: this.margin, right: this.margin },
    });

    yPosition = (this.doc as any).lastAutoTable.finalY + 8;

    // Immagini
    if (ex.glossaryContent?.images?.length > 0) {
      let imgX = this.margin;
      let imgY = yPosition;
      const imgW = 40;
      const imgH = 40;

      for (const img of ex.glossaryContent.images) {
        if (imgX + imgW > this.pageWidth - this.margin) {
          imgX = this.margin;
          imgY += imgH + 10;
        }
        if (imgY + imgH > this.pageHeight - 30) {
          this.doc.addPage();
          imgY = this.margin;
        }
        try {
          this.doc.addImage(img, "JPEG", imgX, imgY, imgW, imgH);
        } catch (err) {
          console.warn("Errore immagine glossario:", err);
        }
        imgX += imgW + 10;
      }
      yPosition = imgY + imgH + 15;
    }

    if (yPosition > this.pageHeight - 60) {
      this.doc.addPage();
      yPosition = this.margin;
    }
  }

  return yPosition;
}

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  
}
// ... existing code ...

// Rimuovo l'esportazione del singleton pdfGenerator poiché ora utilizzeremo l'hook usePDFGenerator
// export const pdfGenerator = new PDFGenerator(false);
