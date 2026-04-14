import { useState, useRef } from 'react';
import { Camera, Link as LinkIcon, Upload, X, Loader } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface AvatarUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatar?: string;
  onAvatarChange: (avatarUrl: string) => void;
  fallback?: string;
}

/**
 * Comprime uma imagem para um tamanho máximo (em pixels) e qualidade JPEG.
 * Retorna uma data URL comprimida.
 */
function compressImage(dataUrl: string, maxSize: number = 200, quality: number = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Redimensionar mantendo proporção
      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível criar contexto do canvas'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    img.src = dataUrl;
  });
}

export function AvatarUploadDialog({
  open,
  onOpenChange,
  currentAvatar,
  onAvatarChange,
  fallback = 'U',
}: AvatarUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentAvatar || '');
  const [urlInput, setUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem (PNG, JPG, GIF, etc.)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB');
        return;
      }

      setSelectedFile(file);

      // Criar preview e comprimir
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawDataUrl = reader.result as string;
        try {
          // Comprimir para 200x200 JPEG para caber no Firestore
          const compressed = await compressImage(rawDataUrl, 200, 0.7);
          setPreviewUrl(compressed);
        } catch {
          setPreviewUrl(rawDataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      alert('Por favor, insira uma URL válida');
      return;
    }
    try {
      new URL(urlInput);
      setPreviewUrl(urlInput);
    } catch {
      alert('URL inválida. Por favor, insira uma URL completa (ex: https://...)');
    }
  };

  const handleSave = async () => {
    if (!previewUrl) {
      alert('Por favor, selecione uma imagem primeiro');
      return;
    }

    setIsSaving(true);
    try {
      let finalUrl = previewUrl;

      // Se for data URL de upload, comprimir antes de salvar
      if (finalUrl.startsWith('data:')) {
        finalUrl = await compressImage(finalUrl, 200, 0.6);
      }

      onAvatarChange(finalUrl);
      onOpenChange(false);
      setSelectedFile(null);
      setUrlInput('');
    } catch (error) {
      console.error('Erro ao salvar foto:', error);
      alert('Erro ao salvar foto. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(currentAvatar || '');
    setSelectedFile(null);
    setUrlInput('');
    onOpenChange(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];

    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawDataUrl = reader.result as string;
        try {
          const compressed = await compressImage(rawDataUrl, 200, 0.7);
          setPreviewUrl(compressed);
        } catch {
          setPreviewUrl(rawDataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Alterar Foto de Perfil</DialogTitle>
          <DialogDescription>
            Faça upload de uma imagem do seu computador ou cole a URL de uma imagem online.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'url')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" /> Upload
            </TabsTrigger>
            <TabsTrigger value="url">
              <LinkIcon className="w-4 h-4 mr-2" /> URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--theme-border)] rounded-lg p-8 text-center cursor-pointer hover:border-[var(--theme-accent)] transition-colors"
            >
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              <Camera className="w-12 h-12 mx-auto mb-4 text-[var(--theme-muted-foreground)]" />
              <p className="text-sm text-[var(--theme-foreground)] font-medium mb-1">
                Clique para selecionar ou arraste uma imagem
              </p>
              <p className="text-xs text-[var(--theme-muted-foreground)]">PNG, JPG, GIF até 5MB</p>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--theme-muted)]/50">
                <Camera className="w-5 h-5 text-[var(--theme-accent)]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--theme-foreground)] truncate">{selectedFile.name}</p>
                  <p className="text-xs text-[var(--theme-muted-foreground)]">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreviewUrl(currentAvatar || ''); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL da Imagem</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://exemplo.com/imagem.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUrlSubmit(); } }}
              />
              <p className="text-xs text-[var(--theme-muted-foreground)]">
                Cole a URL completa de uma imagem (começando com https://)
              </p>
            </div>
            <Button type="button" variant="outline" onClick={handleUrlSubmit} className="w-full">
              <LinkIcon className="w-4 h-4 mr-2" /> Carregar da URL
            </Button>
          </TabsContent>
        </Tabs>

        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="flex justify-center p-6 rounded-lg bg-[var(--theme-muted)]/30">
            <Avatar className="w-32 h-32">
              <AvatarImage src={previewUrl} alt="Preview" />
              <AvatarFallback className="text-3xl">{fallback}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>Cancelar</Button>
          <Button type="button" variant="theme" onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving && <Loader className="w-4 h-4 animate-spin" />}
            {isSaving ? 'Salvando...' : 'Salvar Foto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
