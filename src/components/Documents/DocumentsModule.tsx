import { memo } from 'react';
import DocumentGenerator from './DocumentGenerator';

const DocumentsModule = () => (
  <main className="h-full w-full overflow-hidden px-6 py-4">
    <DocumentGenerator />
  </main>
);

export default memo(DocumentsModule);
