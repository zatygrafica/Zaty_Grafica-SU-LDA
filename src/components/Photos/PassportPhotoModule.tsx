import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, ZoomIn, ZoomOut, Move, Printer, X, Check, Edit, Trash2, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Photo {
  id: string;
  file: File;
  preview: string;
  edited?: {
    zoom: number;
    offsetX: number;
    offsetY: number;
  };
  copyCount?: number; // 1 a 5 copias
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const drawPhoto = (
  canvas: HTMLCanvasElement,
  photo: Photo,
  width = 300,
  height = 400,
  overrideZoom?: number,
  overrideOffset?: { x: number; y: number }
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = new Image();
  img.onload = () => {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);

    const baseScale = Math.max(width / img.width, height / img.height);
    const zoom = (overrideZoom ?? photo.edited?.zoom ?? 1) * baseScale;
    const offsetX = overrideOffset?.x ?? photo.edited?.offsetX ?? 0;
    const offsetY = overrideOffset?.y ?? photo.edited?.offsetY ?? 0;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-img.width / 2 + offsetX, -img.height / 2 + offsetY);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  };
  img.src = photo.preview;
};

const renderPhotoDataUrl = (
  photo: Photo,
  width = 300,
  height = 400,
  zoom?: number,
  offset?: { x: number; y: number }
) =>
  new Promise<string>((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(photo.preview);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, width, height);

      const baseScale = Math.max(width / img.width, height / img.height);
      const finalZoom = (zoom ?? photo.edited?.zoom ?? 1) * baseScale;
      const offsetX = offset?.x ?? photo.edited?.offsetX ?? 0;
      const offsetY = offset?.y ?? photo.edited?.offsetY ?? 0;

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(finalZoom, finalZoom);
      ctx.translate(-img.width / 2 + offsetX, -img.height / 2 + offsetY);
      ctx.drawImage(img, 0, 0);
      ctx.restore();

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(photo.preview);
    img.src = photo.preview;
  });

const ZatyPasse: React.FC = () => {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [selectedForPrint, setSelectedForPrint] = useState<Set<string>>(new Set());
  const [editZoom, setEditZoom] = useState(1);
  const [editOffset, setEditOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);

  const [printImages, setPrintImages] = useState<string[]>([]);
  const [printLoaded, setPrintLoaded] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editCanvasRef = useRef<HTMLCanvasElement>(null);

  const triggerFilePick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const maxPhotos = 6;
    const remaining = maxPhotos - photos.length;
    const limitedFiles = files.slice(0, Math.max(0, remaining));
    if (!limitedFiles.length) {
      setError(t('passport_photos.errors.limit_reached'));
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    const newPhotos: Photo[] = [];

    for (let i = 0; i < limitedFiles.length; i++) {
      const file = limitedFiles[i];
      setUploadProgress(((i + 0.3) / limitedFiles.length) * 100);

      try {
        const preview = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.onerror = () => reject(new Error(t('passport_photos.errors.file_read_error')));
          reader.readAsDataURL(file);
        });

        await new Promise<void>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve();
          image.onerror = () => reject(new Error(t('passport_photos.errors.image_load_error')));
          image.src = preview;
        });

        newPhotos.push({
          id: `${Date.now()}-${i}`,
          file,
          preview,
          copyCount: 1,
          edited: { zoom: 1, offsetX: 0, offsetY: 0 },
        });
      } catch (err) {
        console.error(err);
        setError(t('passport_photos.errors.photo_load_failed'));
      } finally {
        setUploadProgress(((i + 1) / limitedFiles.length) * 100);
      }

      await new Promise((resolve) => setTimeout(resolve, 60));
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
    setUploadProgress(100);
    setTimeout(() => setIsUploading(false), 150);
    setTimeout(() => setUploadProgress(0), 200);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openEditor = (photo: Photo) => {
    setEditingPhoto(photo);
    setEditZoom(photo.edited?.zoom || 1);
    setEditOffset({ x: photo.edited?.offsetX || 0, y: photo.edited?.offsetY || 0 });
  };

  const saveEdit = () => {
    if (!editingPhoto) return;
    setPhotos((prev) =>
      prev.map((p) => (p.id === editingPhoto.id ? { ...p, edited: { zoom: editZoom, offsetX: editOffset.x, offsetY: editOffset.y } } : p))
    );
    setEditingPhoto(null);
  };

  useEffect(() => {
    if (!editingPhoto || !editCanvasRef.current) return;
    drawPhoto(editCanvasRef.current, editingPhoto, 300, 400, editZoom, editOffset);
  }, [editingPhoto, editZoom, editOffset]);

  const toggleSelection = (id: string) => {
    setSelectedForPrint((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandedSelection = useMemo(() => {
    const selected = photos.filter((p) => selectedForPrint.has(p.id));
    return selected.flatMap((p) => {
      const copies = clamp(p.copyCount ?? 1, 1, 5);
      return Array.from({ length: copies }, () => p);
    });
  }, [photos, selectedForPrint]);

  const previewSelection = useMemo(() => expandedSelection.slice(0, 30), [expandedSelection]);

  useEffect(() => {
    return () => {
      setIsPrinting(false);
      setPrintImages([]);
      setPrintLoaded(0);
    };
  }, []);

  const handlePrint = () => {
    const selected = photos.filter((p) => selectedForPrint.has(p.id));
    if (selected.length === 0) {
      setError(t('passport_photos.errors.no_photos_selected_print'));
      return;
    }

    const expanded = selected
      .flatMap((photo) => {
        const copies = clamp(photo.copyCount ?? 1, 1, 5);
        return Array.from({ length: copies }, () => photo);
      })
      .slice(0, 30);

    // Para impressao em alta qualidade (600 DPI): 30x40mm => ~708x944 px
    const photoWidthPx = 120;
    const photoHeightPx = 160;
    const hiResWidthPx = Math.round((30 / 25.4) * 600);
    const hiResHeightPx = Math.round((40 / 25.4) * 600);

    Promise.all(expanded.map((photo) => renderPhotoDataUrl(photo, hiResWidthPx, hiResHeightPx))).then((images) => {
      // Impressão direta em um iframe oculto para evitar páginas em branco
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const columns = 5;
      const photoWidthMm = 30;
      const photoHeightMm = 40;
      const paddingMm = 5;
      const colGapMm = 5;
      const rowGapMm = 2; // espaçamento vertical reduzido para empacotar as linhas no topo

      const doc = iframe.contentDocument;
      if (!doc) return;

      const buildHTML = () => {
        const items = images
          .map(
            (src, i) =>
              `<div class="item"><img src="${src}" alt="foto-${i}" loading="eager" decoding="sync" /></div>`
          )
          .join('');

        return `
          <html>
            <head>
              <style>
                @page { size: A4; margin: 0; }
                * { box-sizing: border-box; }
                html, body { width: 210mm; height: 297mm; }
                body { margin: 0; padding: ${paddingMm}mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .sheet {
                  display: grid;
                  grid-template-columns: repeat(${columns}, ${photoWidthMm}mm);
                  column-gap: ${colGapMm}mm;
                  row-gap: ${rowGapMm}mm;
                  justify-content: center;
                  align-items: start;
                  align-content: start;
                  width: calc(210mm - ${paddingMm * 2}mm);
                  height: calc(297mm - ${paddingMm * 2}mm);
                }
                .item {
                  width: ${photoWidthMm}mm;
                  height: ${photoHeightMm}mm;
                  overflow: hidden;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                .item img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                  image-rendering: optimizeQuality;
                }
              </style>
            </head>
            <body>
              <div class="sheet">
                ${items}
              </div>
              <script>
                window.onload = () => { window.focus(); window.print(); };
              </script>
            </body>
          </html>
        `;
      };

      doc.open();
      doc.write(buildHTML());
      doc.close();

      const cleanup = () => {
        setIsPrinting(false);
        setPrintImages([]);
        setPrintLoaded(0);
        setTimeout(() => iframe.remove(), 500);
      };

      iframe.contentWindow?.addEventListener('afterprint', cleanup);
      iframe.onload = () => {
        // Se por algum motivo não disparar print, força fallback de limpeza
        setTimeout(cleanup, 3000);
      };
    });
  };

  const handleDownloadPdf = async () => {
    const selected = photos.filter((p) => selectedForPrint.has(p.id));
    if (selected.length === 0) {
      setError(t('passport_photos.errors.no_photos_selected_download'));
      return;
    }

    try {
      // Respeita copias e limite de 30 (6 linhas x 5 colunas)
      const expanded = selected
        .flatMap((photo) => {
          const copies = clamp(photo.copyCount ?? 1, 1, 5);
          return Array.from({ length: copies }, () => photo);
        })
        .slice(0, 30);

      // Gera dataURLs já com corte/zoom em alta resolução (600 DPI, 30x40mm)
      const photoWidthPx = 120;
      const photoHeightPx = 160;
      const hiResWidthPx = Math.round((30 / 25.4) * 600);
      const hiResHeightPx = Math.round((40 / 25.4) * 600);
      const dataUrls = await Promise.all(expanded.map((photo) => renderPhotoDataUrl(photo, hiResWidthPx, hiResHeightPx)));

      // Tenta gerar PDF via jsPDF (opcional). Se falhar, cai no download em PNG.
      try {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const photoWidthMm = 30; // proporcao 3x4 -> 30x40 mm
        const photoHeightMm = 40;
        const columns = 5;
        const paddingMm = 5;
        const colGapMm = 5;
        const rowGapMm = 2; // mesmo gap da impressão via iframe
        const rowsPerPage = 6;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < dataUrls.length; i++) {
          const pageNumber = Math.floor(i / (columns * rowsPerPage));
          const indexInPage = i % (columns * rowsPerPage);
          const col = indexInPage % columns;
          const row = Math.floor(indexInPage / columns);

          if (indexInPage === 0 && i !== 0) {
            pdf.addPage();
          }

          const remaining = dataUrls.length - pageNumber * columns * rowsPerPage;
          const rowsThisPage = Math.ceil(Math.min(remaining, columns * rowsPerPage) / columns);

          const gridWidthMm = columns * photoWidthMm + (columns - 1) * colGapMm;
          const gridHeightMm = rowsThisPage * photoHeightMm + (rowsThisPage - 1) * rowGapMm;
          const startX = (pageWidth - gridWidthMm) / 2;
          // alinhar no topo com a mesma margem utilizada no iframe (paddingMm)
          const startY = paddingMm;

          const x = startX + col * (photoWidthMm + colGapMm);
          const y = startY + row * (photoHeightMm + rowGapMm);

          pdf.addImage(dataUrls[i], 'PNG', x, y, photoWidthMm, photoHeightMm, undefined, 'FAST');
        }

        pdf.save('zaty-passe.pdf');
        return;
      } catch (pdfErr) {
        console.warn('jsPDF nao disponivel; baixando PNG:', pdfErr);
      }

      // Fallback: download PNG com todas as fotos em grade
      const columns = 5;
      const colGap = 12;
      const rowGap = 2;
      const rows = Math.ceil(dataUrls.length / columns);
      const gridWidthPx = columns * photoWidthPx + (columns - 1) * colGap;
      const gridHeightPx = rows * photoHeightPx + (rows - 1) * rowGap;
      const marginPx = 20;
      const canvas = document.createElement('canvas');
      const width = gridWidthPx + marginPx * 2;
      const height = gridHeightPx + marginPx * 2;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error(t('passport_photos.errors.canvas_unavailable'));
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);

      await Promise.all(
        dataUrls.map(
          (src, index) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => {
                const col = index % columns;
                const row = Math.floor(index / columns);
                const x = marginPx + col * (photoWidthPx + colGap);
                const y = marginPx + row * (photoHeightPx + rowGap);
                ctx.drawImage(img, x, y, photoWidthPx, photoHeightPx);
                resolve();
              };
              img.onerror = () => resolve();
              img.src = src;
            })
        )
      );

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'zaty-passe.png';
      link.click();
    } catch (err) {
      console.error('Erro ao gerar arquivo:', err);
      setError(t('passport_photos.errors.generate_file_error'));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setEditOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;
    setEditOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const ready = photos.length > 0;
  const photoWidthPx = 120;
  const photoHeightPx = 160;
  const colGapPx = 12;
  const rowGapPx = 2;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50 to-indigo-100 dark:from-neutral-900 dark:via-neutral-900/90 dark:to-neutral-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-indigo-900 dark:text-white mb-2">{t('passport_photos.title')}</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">{t('passport_photos.subtitle')}</p>
        </div>

        <style>
          {`
            @media print {
              body { 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
                margin: 0;
                padding: 0;
              }
              #zaty-print-area {
                position: static !important;
                opacity: 1 !important;
                visibility: visible !important;
                pointer-events: auto !important;
                top: 0 !important;
                left: 0 !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}
        </style>

        {!ready && !isUploading && (
          <div className="flex items-center justify-center min-h-[420px]">
            <div className="text-center space-y-4">
              <button
                type="button"
                onClick={triggerFilePick}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
              >
                <Upload className="w-6 h-6" />
                {t('passport_photos.upload.button')}
              </button>
              <p className="text-gray-600 dark:text-gray-300">
                {t('passport_photos.upload.accepted_formats')} <span className="font-semibold">{t('passport_photos.upload.formats_list')}</span>
              </p>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="max-w-md mx-auto mt-10">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Upload className="w-6 h-6 text-indigo-600 animate-pulse" />
                <span className="text-lg font-semibold text-gray-800 dark:text-white">{t('passport_photos.upload.loading')}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-4 overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="text-center mt-2 text-sm text-gray-600 dark:text-gray-300">{t('passport_photos.upload.progress_percent', { percent: Math.round(uploadProgress) })}</p>
            </div>
          </div>
        )}

        {ready && !editingPhoto && (
          <div className="space-y-8 no-print">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('passport_photos.photos.title')}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedForPrint.size > 0 && t(selectedForPrint.size > 1 ? 'passport_photos.photos.selected_plural' : 'passport_photos.photos.selected_singular', { count: selectedForPrint.size })}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={triggerFilePick}
                  className="bg-white dark:bg-neutral-800 text-indigo-600 px-4 py-2 rounded-lg font-semibold shadow hover:shadow-md transition-all flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {t('passport_photos.upload.add_more')}
                </button>
                {selectedForPrint.size > 0 && (
                  <>
                    <button
                      onClick={handlePrint}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      {t('passport_photos.actions.print')}
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {t('passport_photos.actions.download_pdf')}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {photos.map((photo) => (
                <div key={photo.id} className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg overflow-hidden relative group">
                  <div className="aspect-[3/4] bg-gray-100 dark:bg-neutral-800 relative overflow-hidden">
                    <canvas
                      className="w-full h-full"
                      ref={(canvas) => {
                        if (!canvas) return;
                        drawPhoto(canvas, photo);
                      }}
                    />
                  </div>

                  <div className="p-3 flex justify-between items-center">
                    <button onClick={() => openEditor(photo)} className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm flex items-center gap-1">
                      <Edit className="w-4 h-4" />
                      {t('passport_photos.photos.edit')}
                    </button>

                    <button
                      onClick={() => toggleSelection(photo.id)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                        selectedForPrint.has(photo.id) ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 hover:border-green-600'
                      }`}
                    >
                      {selectedForPrint.has(photo.id) && <Check className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="px-3 pb-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-600 dark:text-gray-400">{t('passport_photos.photos.copies')}</span>
                      <select
                        value={photo.copyCount ?? 1}
                        onChange={(e) =>
                          setPhotos((prev) =>
                            prev.map((p) => (p.id === photo.id ? { ...p, copyCount: clamp(parseInt(e.target.value, 10), 1, 5) } : p))
                          )
                        }
                        className="border rounded px-2 py-1 text-gray-800 dark:text-white dark:bg-neutral-800"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {t('passport_photos.photos.copies_count', { count: n })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={() => {
                          setSelectedForPrint((prev) => {
                            const next = new Set(prev);
                            next.delete(photo.id);
                            return next;
                          });
                          setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
                        }}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('passport_photos.photos.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('passport_photos.preview.title')}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{t('passport_photos.preview.description')}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-inner p-4">
                {previewSelection.length === 0 ? (
                  <div className="text-sm text-gray-600 dark:text-gray-400 text-center py-10">{t('passport_photos.preview.no_selection')}</div>
                ) : (
                  <div className="aspect-[210/297] bg-white rounded-lg p-4 overflow-auto border border-gray-200 mx-auto" style={{ maxWidth: '820px' }}>
                    <div
                      className="grid h-full items-start"
                      style={{
                        gridTemplateColumns: `repeat(${Math.min(Math.max(previewSelection.length, 1), 5)}, ${photoWidthPx}px)`,
                        columnGap: `${colGapPx}px`,
                        rowGap: `${rowGapPx}px`,
                        justifyContent: 'center',
                        alignContent: 'start',
                      }}
                    >
                      {previewSelection.map((photo, index) => (
                        <div
                          key={`${photo.id}-clone-${index}`}
                          className="bg-white shadow flex items-center justify-center overflow-hidden"
                          style={{ width: `${photoWidthPx}px`, height: `${photoHeightPx}px` }}
                        >
                          <canvas
                            className="w-full h-full"
                            ref={(canvas) => {
                              if (!canvas) return;
                              drawPhoto(canvas, photo, photoWidthPx, photoHeightPx);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>
        )}

        {editingPhoto && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 no-print">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('passport_photos.editor.title')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('passport_photos.editor.subtitle')}</p>
                  </div>
                  <button onClick={() => setEditingPhoto(null)} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-4 flex justify-center items-center">
                      <canvas
                        ref={editCanvasRef}
                        className="border-2 border-gray-300 dark:border-neutral-700 rounded cursor-move shadow-lg"
                        style={{ touchAction: 'none' }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleMouseUp}
                      />
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Move className="w-4 h-4" />
                      <span>{t('passport_photos.editor.drag_instruction')}</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2 flex items-center gap-2">
                        <ZoomIn className="w-4 h-4" />
                        {t('passport_photos.editor.zoom_label', { value: editZoom.toFixed(2) })}
                      </label>
                      <input type="range" min="0.5" max="3" step="0.01" value={editZoom} onChange={(e) => setEditZoom(parseFloat(e.target.value))} className="w-full" />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setEditZoom(Math.max(0.5, editZoom - 0.1))} className="flex-1 bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 px-3 py-2 rounded font-semibold text-sm">
                          <ZoomOut className="w-4 h-4 mx-auto" />
                        </button>
                        <button onClick={() => setEditZoom(Math.min(3, editZoom + 0.1))} className="flex-1 bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 px-3 py-2 rounded font-semibold text-sm">
                          <ZoomIn className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button onClick={() => setEditOffset({ x: 0, y: 0 })} className="w-full bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 px-4 py-2 rounded font-semibold text-sm">
                        {t('passport_photos.editor.recenter')}
                      </button>
                      <button
                        onClick={() => {
                          setEditZoom(editingPhoto.edited?.zoom || 1);
                          setEditOffset({ x: editingPhoto.edited?.offsetX || 0, y: editingPhoto.edited?.offsetY || 0 });
                        }}
                        className="w-full bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 px-4 py-2 rounded font-semibold text-sm"
                      >
                        {t('passport_photos.editor.reset')}
                      </button>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-neutral-800">
                      <button
                        onClick={saveEdit}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        {t('passport_photos.editor.save')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Area de impressao inline (fora da tela, visivel apenas no print) */}
      {printImages.length > 0 && (
        <div
          id="zaty-print-area"
          style={{
            position: isPrinting ? 'static' : 'absolute',
            top: isPrinting ? '0' : '-10000px',
            left: isPrinting ? '0' : '-10000px',
            opacity: isPrinting ? 1 : 0,
            visibility: isPrinting ? 'visible' : 'hidden',
            pointerEvents: isPrinting ? 'auto' : 'none',
            width: '210mm',
            minHeight: '297mm',
            margin: '0 auto',
          }}
        >
          <div
            className="sheet-preview"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(5, Math.max(printImages.length, 1))}, ${photoWidthPx}px)`,
              columnGap: `${colGapPx}px`,
              rowGap: `${rowGapPx}px`,
              justifyContent: 'center',
              alignContent: 'start',
              padding: '10mm',
            }}
          >
            {printImages.map((src, idx) => (
              <div
                key={`print-${idx}`}
                className="photo"
                style={{
                  width: `${photoWidthPx}px`,
                  height: `${photoHeightPx}px`,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={src}
                  alt={t('passport_photos.print.alt_text')}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onLoad={() => setPrintLoaded((c) => c + 1)}
                  onError={() => setPrintLoaded((c) => c + 1)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unico input file */}
      <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" multiple onChange={handleFileChange} className="hidden" />
    </div>
  );
};

export default ZatyPasse;
