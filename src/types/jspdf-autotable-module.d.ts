// Allow importing the runtime plugin without TypeScript complaining about missing module
// This file works together with src/types/jspdf-autotable.d.ts which augments the jsPDF type

declare module 'jspdf-autotable';
