// Augment jsPDF types so TypeScript recognizes the autoTable plugin
// Note: You still need to install and import the runtime plugin (npm i jspdf-autotable)
// and import it in client code before calling doc.autoTable(...):
// import { jsPDF } from 'jspdf';
// import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    // Minimal typing for the common usage of autoTable.
    // Use more specific types if desired or replace "any" with a proper interface.
    autoTable(columns?: any[] | object, data?: any[] | object, options?: any): jsPDF;
    autoTable(options?: any): jsPDF;
  }
}
