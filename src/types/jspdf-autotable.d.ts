// This file provides type definitions for the jspdf-autotable plugin.
// It declares the autoTable function that can be imported and used with a jsPDF instance.

import { jsPDF } from 'jspdf';

// This overrides the module declaration for 'jspdf-autotable'
// to provide types for its default export function.
declare module 'jspdf-autotable' {
  export default function autoTable(doc: jsPDF, options: Record<string, unknown>): void;
}
