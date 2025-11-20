import React, { useRef } from 'react';
import { UploadFile, UploadStatus } from '../types';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../utils/cn';

interface UploadAreaProps {
  files: UploadFile[];
  onFilesUploaded: (files: UploadFile[]) => void;
  onProcessFiles: () => void;
  onDeleteFile: (fileId: number) => void;
}

const UploadArea: React.FC<UploadAreaProps> = ({ files, onFilesUploaded, onProcessFiles, onDeleteFile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles: UploadFile[] = Array.from(event.target.files).map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        content: '', // Will be filled by FileReader
        status: UploadStatus.Pending,
        uploadDate: new Date().toISOString(),
        type: 'XML',
        progress: 100,
        size: file.size
      }));

      // Read files
      let readCount = 0;
      newFiles.forEach((_, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newFiles[index].content = e.target?.result as string;
          readCount++;
          if (readCount === newFiles.length) {
            onFilesUploaded(newFiles);
          }
        };
        // Find the original file object to read
        const originalFile = event.target.files![index];
        reader.readAsText(originalFile);
      });

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const pendingCount = files.filter(f => f.status === UploadStatus.Pending).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle>Upload de Notas Fiscais (XML)</CardTitle>
          <CardDescription>
            Selecione os arquivos XML das notas fiscais para processamento. O sistema identificará automaticamente os produtos monofásicos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-10 text-center hover:bg-muted/20 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              multiple
              accept=".xml"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full text-primary">
                <Upload className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium">Clique para selecionar arquivos</p>
                <p className="text-sm text-muted-foreground">Suporta múltiplos arquivos XML de NFe</p>
              </div>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Arquivos Carregados ({files.length})</h3>
                <div className="flex gap-2">
                </div>
              </div>

              <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
                {files.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-card border rounded-md shadow-sm group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={cn("p-2 rounded-full",
                        file.status === UploadStatus.Processed ? "bg-green-100 text-green-600" :
                          file.status === UploadStatus.Failed ? "bg-red-100 text-red-600" :
                            "bg-blue-100 text-blue-600"
                      )}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(file.uploadDate).toLocaleTimeString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {file.status === UploadStatus.Processed && <Badge variant="success" className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200">Processado</Badge>}
                      {file.status === UploadStatus.Failed && <Badge variant="destructive">Erro</Badge>}
                      {file.status === UploadStatus.Pending && <Badge variant="secondary">Pendente</Badge>}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja excluir este arquivo?')) {
                            onDeleteFile(file.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={onProcessFiles} disabled={pendingCount === 0} size="lg">
                  {pendingCount > 0 ? `Processar ${pendingCount} Arquivos` : 'Todos Arquivos Processados'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadArea;