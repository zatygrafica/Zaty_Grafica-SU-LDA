import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, ZoomIn, ZoomOut, Move, Printer, X, Check, Edit, Trash2, Download } from 'lucide-react';

interface Photo {
  id: string;
  file: File;
  preview: string;
  edited?: {
    zoom: number;
    offsetX: number;
    offsetY: number;
  };
  copyCount?: number; // 1 a 5 cópias
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
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        drawPhoto(canvas, photo, width, height, zoom, offset);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('Falha ao gerar dataURL, usando preview original', err);
        resolve(photo.preview);
      }
    };
    img.onerror = () => resolve(photo.preview);
    img.src = photo.preview;
  });

const ZatyPasse: React.FC = () => {
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
      setError('Limite de 6 fotos atingido.');
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
          reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
          reader.readAsDataURL(file);
        });

        await new Promise<void>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve();
          image.onerror = () => reject(new Error('Falha ao carregar imagem'));
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
        setError('Não foi possível carregar a foto. Tente novamente.');
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
    if (!isPrinting || printImages.length === 0) return;
    if (printLoaded < printImages.length) return;
    const timer = setTimeout(() => {
      window.focus();
      window.print();
      setIsPrinting(false);
      setPrintImages([]);
      setPrintLoaded(0);
    }, 100);
    return () => clearTimeout(timer);
  }, [isPrinting, printImages, printLoaded]);

  const handlePrint = () => {
    const selected = photos.filter((p) => selectedForPrint.has(p.id));
    if (selected.length === 0) {
      setError('Selecione pelo menos 1 foto para imprimir.');
      return;
    }

    const expanded = selected
      .flatMap((photo) => {
        const copies = clamp(photo.copyCount ?? 1, 1, 5);
        return Array.from({ length: copies }, () => photo);
      })
      .slice(0, 30);

    const photoWidthPx = 120;
    const photoHeightPx = 160;

    Promise.all(expanded.map((photo) => renderPhotoDataUrl(photo, photoWidthPx, photoHeightPx))).then((images) => {
      setPrintLoaded(0);
      setPrintImages(images);
      setIsPrinting(true);
    });
  };

  const handleDownloadPdf = async () => {
    const selected = photos.filter((p) => selectedForPrint.has(p.id));
    if (selected.length === 0) {
      setError('Selecione pelo menos 1 foto para baixar.');
      return;
    }

    try {
      // Simulação de geração de PDF - implementação real dependeria de jsPDF/html2canvas
      console.log('Iniciando geração de PDF para', selected.length, 'fotos selecionadas');
      
      // Para uma implementação real, você instalaria jsPDF e html2canvas:
      // import jsPDF from 'jspdf';
      // import html2canvas from 'html2canvas';
      
      // Por enquanto, mostraremos um alerta informativo
      alert('Funcionalidade de download PDF em desenvolvimento. Para uma implementação completa, instale: npm install jspdf html2canvas @types/jspdf');
      
      // Exemplo de implementação futura:
      /*
      const pdf = new jsPDF('p', 'mm', 'a4');
      const photoWidthMm = 30;
      const photoHeightMm = 40;
      
      for (let i = 0; i < selected.length; i++) {
        const photo = selected[i];
        const dataUrl = await renderPhotoDataUrl(photo, 300, 400);
        
        // Calcular posição na página A4
        const x = (i % 5) * photoWidthMm + 10;
        const y = Math.floor(i / 5) * photoHeightMm + 10;
        
        pdf.addImage(dataUrl, 'PNG', x, y, photoWidthMm, photoHeightMm);
        
        // Adicionar nova página se necessário
        if ((i + 1) % 15 === 0 && i < selected.length - 1) {
          pdf.addPage();
        }
      }
      
      pdf.save('fotos-3x4.pdf');
      */
      
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setError('Erro ao gerar PDF. Tente novamente.');
    }
  };

  // Funções de manipulação de mouse/touch para edição
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setEditOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
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
    setEditOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
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
          <h1 className="text-4xl font-bold text-indigo-900 dark:text-white mb-2">ZatyPasse</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Editor profissional de fotos 3x4</p>
        </div>
        
        {/* Estilos para garantir exibição no print */}
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
                Carregar Fotos
              </button>
              <p className="text-gray-600 dark:text-gray-300">
                Formatos aceitos: <span className="font-semibold">PNG, JPG, JPEG, WEBP</span>
              </p>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="max-w-md mx-auto mt-10">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Upload className="w-6 h-6 text-indigo-600 animate-pulse" />
                <span className="text-lg font-semibold text-gray-800 dark:text-white">Carregando fotos...</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-4 overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="text-center mt-2 text-sm text-gray-600 dark:text-gray-300">{Math.round(uploadProgress)}%</p>
            </div>
          </div>
        )}

        {ready && !editingPhoto && (
          <div className="space-y-8 no-print">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Suas Fotos</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedForPrint.size > 0 && `${selectedForPrint.size} selecionada${selectedForPrint.size > 1 ? 's' : ''} para impressão`}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={triggerFilePick}
                  className="bg-white dark:bg-neutral-800 text-indigo-600 px-4 py-2 rounded-lg font-semibold shadow hover:shadow-md transition-all flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Adicionar Mais
                </button>
                {selectedForPrint.size > 0 && (
                  <>
                    <button
                      onClick={handlePrint}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Baixar PDF
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
                      Editar
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
                      <span className="text-gray-600 dark:text-gray-400">Cópias</span>
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
                            {n}x
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
                        Excluir foto
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Pré-visualização A4 (clones inclusos)</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Primeiras 5 fotos ficam no topo; cópias extras seguem logo abaixo.</p>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-inner p-4">
                {previewSelection.length === 0 ? (
                  <div className="text-sm text-gray-600 dark:text-gray-400 text-center py-10">Selecione fotos para ver a distribuição na folha A4.</div>
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
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Editor de Foto</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ajuste livre com corte 3x4</p>
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
                      <span>Arraste para reposicionar</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-white mb-2 flex items-center gap-2">
                        <ZoomIn className="w-4 h-4" />
                        Zoom: {editZoom.toFixed(2)}x
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
                        Recentralizar
                      </button>
                      <button
                        onClick={() => {
                          setEditZoom(editingPhoto.edited?.zoom || 1);
                          setEditOffset({ x: editingPhoto.edited?.offsetX || 0, y: editingPhoto.edited?.offsetY || 0 });
                        }}
                        className="w-full bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 px-4 py-2 rounded font-semibold text-sm"
                      >
                        Resetar
                      </button>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-neutral-800">
                      <button
                        onClick={saveEdit}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Salvar Edição
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Área de impressão inline (fora da tela, visível só no print) */}
      {printImages.length > 0 && (
        <div
          id="zaty-print-area"
          style={{
            position: 'absolute',
            top: '-10000px',
            left: '-10000px',
            opacity: 0,
            visibility: 'hidden',
            pointerEvents: 'none',
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
                  alt="foto para impressão"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onLoad={() => setPrintLoaded((c) => c + 1)}
                  onError={() => setPrintLoaded((c) => c + 1)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Único input file */}
      <input 
        ref={fileInputRef} 
        type="file" 
        accept=".png,.jpg,.jpeg,.webp" 
        multiple 
        onChange={handleFileChange} 
        className="hidden" 
      />
    </div>
  );
};

export default ZatyPasse;