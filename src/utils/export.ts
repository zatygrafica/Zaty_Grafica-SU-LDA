/**
 * Converts an array of objects to a CSV string.
 * @param data - The array of objects.
 * @param headers - Optional array of headers. If not provided, keys of the first object are used.
 * @returns The CSV string.
 */
type CsvRow = Record<string, unknown>;

function convertToCSV(data: CsvRow[], headers?: string[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  const columnHeaders = headers || Object.keys(data[0]);
  const csvRows = [columnHeaders.join(',')];

  for (const row of data) {
    const values = columnHeaders.map(header => {
      const cell = row[header];
      
      // Handle values that might contain commas or quotes
      if (typeof cell === 'string') {
        const escaped = cell.replace(/"/g, '""');
        if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
          return `"${escaped}"`;
        }
        return escaped;
      }

      if (cell === null || cell === undefined) {
        return '';
      }

      return String(cell);
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Triggers a download of a CSV file.
 * @param filename - The name of the file to download.
 * @param data - The array of objects to convert to CSV.
 * @param headers - Optional array of headers for the CSV columns.
 */
export function exportToCsv(filename: string, data: CsvRow[], headers?: string[]): void {
  const csvString = convertToCSV(data, headers);
  const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Triggers a download of a TXT file.
 * @param filename - The name of the file to download.
 * @param content - The string content of the file.
 */
export function exportToTxt(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
