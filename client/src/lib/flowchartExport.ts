/**
 * LogiGo Flowchart Export Utilities
 * 
 * Provides export functionality for flowcharts:
 * - PNG export (Free tier): High-quality single image
 * - PDF export (Premium tier): Professional multi-page documentation
 */

import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { getNodesBounds, getViewportForBounds } from '@xyflow/react';
import type { Node } from '@xyflow/react';

export interface ExportOptions {
  filename?: string;
  backgroundColor?: string;
  quality?: number;
}

export interface PDFExportOptions extends ExportOptions {
  includeCode?: boolean;
  includeMetadata?: boolean;
  title?: string;
  author?: string;
}

/**
 * Export flowchart to PNG image (Free tier)
 */
export async function exportToPNG(
  nodeElement: HTMLElement,
  nodes: Node[],
  options: ExportOptions = {}
): Promise<void> {
  const {
    filename = 'logigo-flowchart.png',
    backgroundColor = '#0f172a',
    quality = 2
  } = options;

  try {
    // Get the bounds of all nodes
    const nodesBounds = getNodesBounds(nodes);
    
    // Calculate the transform to center the flowchart
    const imageWidth = Math.max(1024, nodesBounds.width * quality);
    const imageHeight = Math.max(768, nodesBounds.height * quality);
    
    const viewport = getViewportForBounds(
      nodesBounds,
      imageWidth,
      imageHeight,
      0.5,
      2,
      0.1
    );

    // Generate PNG with high quality
    // Note: We need to handle CORS issues by preventing external stylesheet access
    const dataUrl = await toPng(nodeElement, {
      backgroundColor,
      width: imageWidth,
      height: imageHeight,
      style: {
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
      pixelRatio: quality,
      skipFonts: true, // Skip external fonts
      cacheBust: false, // Don't fetch external resources
      filter: (node: Element) => {
        // Exclude controls and minimap from export
        // Handle both HTML and SVG elements (SVG className is an object)
        const className = typeof node.className === 'string' 
          ? node.className 
          : (node.className as any)?.baseVal || '';
        
        if (
          className.includes('react-flow__controls') ||
          className.includes('react-flow__minimap') ||
          className.includes('react-flow__background')
        ) {
          return false;
        }
        return true;
      },
      // Defensive handling of cross-origin stylesheets
      onclone: (clonedDoc: Document) => {
        // Remove cross-origin stylesheets to prevent SecurityError
        const styleSheets = Array.from(clonedDoc.styleSheets);
        styleSheets.forEach((sheet) => {
          try {
            // Try to access cssRules - this will throw on cross-origin sheets
            const _ = sheet.cssRules;
          } catch (e) {
            // This is a cross-origin stylesheet, remove its link element
            if (sheet.ownerNode && sheet.ownerNode.parentNode) {
              sheet.ownerNode.parentNode.removeChild(sheet.ownerNode);
            }
          }
        });
      },
    });

    // Trigger download
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to export PNG:', error);
    throw new Error('PNG export failed. Please try again.');
  }
}

/**
 * Export flowchart to PDF with professional formatting (Premium tier)
 */
export async function exportToPDF(
  nodeElement: HTMLElement,
  nodes: Node[],
  code: string,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    filename = 'logigo-flowchart.pdf',
    backgroundColor = '#0f172a',
    quality = 2,
    includeCode = true,
    includeMetadata = true,
    title = 'LogiGo Code Flowchart',
    author = 'LogiGo'
  } = options;

  try {
    // First, generate the PNG image
    const nodesBounds = getNodesBounds(nodes);
    const imageWidth = Math.max(1024, nodesBounds.width * quality);
    const imageHeight = Math.max(768, nodesBounds.height * quality);
    
    const viewport = getViewportForBounds(
      nodesBounds,
      imageWidth,
      imageHeight,
      0.5,
      2,
      0.1
    );

    const imageDataUrl = await toPng(nodeElement, {
      backgroundColor,
      width: imageWidth,
      height: imageHeight,
      style: {
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
      pixelRatio: quality,
      skipFonts: true, // Skip external fonts
      cacheBust: false, // Don't fetch external resources
      filter: (node: Element) => {
        // Exclude controls and minimap from export
        // Handle both HTML and SVG elements (SVG className is an object)
        const className = typeof node.className === 'string' 
          ? node.className 
          : (node.className as any)?.baseVal || '';
        
        if (
          className.includes('react-flow__controls') ||
          className.includes('react-flow__minimap') ||
          className.includes('react-flow__background')
        ) {
          return false;
        }
        return true;
      },
      // Defensive handling of cross-origin stylesheets
      onclone: (clonedDoc: Document) => {
        // Remove cross-origin stylesheets to prevent SecurityError
        const styleSheets = Array.from(clonedDoc.styleSheets);
        styleSheets.forEach((sheet) => {
          try {
            // Try to access cssRules - this will throw on cross-origin sheets
            const _ = sheet.cssRules;
          } catch (e) {
            // This is a cross-origin stylesheet, remove its link element
            if (sheet.ownerNode && sheet.ownerNode.parentNode) {
              sheet.ownerNode.parentNode.removeChild(sheet.ownerNode);
            }
          }
        });
      },
    });

    // Create PDF document (A4 landscape for better flowchart display)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Set document properties
    if (includeMetadata) {
      pdf.setProperties({
        title,
        author,
        subject: 'Code Flowchart Visualization',
        keywords: 'flowchart, code visualization, debugging',
        creator: 'LogiGo - Code Visualization Tool',
      });
    }

    // Page 1: Cover page with metadata
    if (includeMetadata) {
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, 148, 40, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated by LogiGo`, 148, 55, { align: 'center' });
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 148, 65, { align: 'center' });
      pdf.text(`Nodes: ${nodes.length}`, 148, 75, { align: 'center' });

      // Add premium badge
      pdf.setFontSize(10);
      pdf.setTextColor(147, 51, 234); // Purple
      pdf.text('Premium Export', 148, 90, { align: 'center' });
      pdf.setTextColor(0, 0, 0); // Reset to black

      pdf.addPage();
    }

    // Page 2: Flowchart visualization
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const availableWidth = pageWidth - (2 * margin);
    const availableHeight = pageHeight - (2 * margin);

    // Calculate image dimensions maintaining aspect ratio
    const imgAspectRatio = nodesBounds.width / nodesBounds.height;
    let imgWidth = availableWidth;
    let imgHeight = imgWidth / imgAspectRatio;

    if (imgHeight > availableHeight) {
      imgHeight = availableHeight;
      imgWidth = imgHeight * imgAspectRatio;
    }

    // Center the image
    const xOffset = (pageWidth - imgWidth) / 2;
    const yOffset = (pageHeight - imgHeight) / 2;

    pdf.addImage(imageDataUrl, 'PNG', xOffset, yOffset, imgWidth, imgHeight);

    // Page 3: Source code (if enabled)
    if (includeCode && code.trim()) {
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Source Code', 148, 20, { align: 'center' });

      pdf.setFontSize(9);
      pdf.setFont('courier', 'normal');
      
      // Split code into lines and add to PDF
      const codeLines = code.split('\n');
      const lineHeight = 4;
      const maxLinesPerPage = Math.floor((pageHeight - 40) / lineHeight);
      
      let currentLine = 0;
      let yPosition = 30;

      for (const line of codeLines) {
        // Add new page if needed
        if (currentLine > 0 && currentLine % maxLinesPerPage === 0) {
          pdf.addPage();
          yPosition = 20;
        }

        // Truncate long lines
        const truncatedLine = line.length > 120 ? line.substring(0, 120) + '...' : line;
        pdf.text(truncatedLine, 10, yPosition);
        yPosition += lineHeight;
        currentLine++;
      }
    }

    // Page 4: Node details (Premium feature)
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Node Details', 148, 20, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    let nodeYPosition = 35;

    for (const node of nodes.slice(0, 20)) { // Limit to first 20 nodes
      if (nodeYPosition > pageHeight - 20) {
        pdf.addPage();
        nodeYPosition = 20;
      }

      const nodeType = node.type || 'default';
      const nodeLabel = node.data?.label || 'Unlabeled';
      
      pdf.setFont('helvetica', 'bold');
      pdf.text(`• ${nodeLabel}`, 15, nodeYPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Type: ${nodeType}`, 25, nodeYPosition + 5);
      
      nodeYPosition += 12;
    }

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Failed to export PDF:', error);
    throw new Error('PDF export failed. Please try again.');
  }
}

/**
 * Download code as text file (utility function)
 */
export function downloadCode(code: string, filename: string = 'code.js'): void {
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
