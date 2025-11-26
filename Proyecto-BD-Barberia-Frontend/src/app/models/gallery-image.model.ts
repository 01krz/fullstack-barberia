export interface GalleryImage {
  id: number;
  url: string; // Base64 o URL de la imagen
  title?: string;
  description?: string;
  uploadDate: Date;
  uploadedBy: string; // Email del admin que subió la imagen
}

