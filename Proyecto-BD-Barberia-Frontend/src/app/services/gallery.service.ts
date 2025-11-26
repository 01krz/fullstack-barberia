import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GalleryImage } from '../models/gallery-image.model';

@Injectable({
  providedIn: 'root'
})
export class GalleryService {
  private imagesSubject = new BehaviorSubject<GalleryImage[]>([]);
  public images$ = this.imagesSubject.asObservable();
  private readonly STORAGE_KEY = 'gallery_images';
  private nextId = 1;

  constructor() {
    this.loadImages();
  }

  private loadImages(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          const images = JSON.parse(stored);
          // Convertir las fechas de string a Date
          images.forEach((img: GalleryImage) => {
            img.uploadDate = new Date(img.uploadDate);
          });
          this.imagesSubject.next(images);
          // Actualizar el siguiente ID
          if (images.length > 0) {
            this.nextId = Math.max(...images.map((img: GalleryImage) => img.id)) + 1;
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar imágenes de la galería:', error);
    }
  }

  private saveImages(images: GalleryImage[]): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(images));
        this.imagesSubject.next(images);
      }
    } catch (error) {
      console.error('Error al guardar imágenes de la galería:', error);
    }
  }

  getImages(): Observable<GalleryImage[]> {
    return this.images$;
  }

  getAllImages(): GalleryImage[] {
    return this.imagesSubject.value;
  }

  addImage(file: File, title?: string, description?: string, uploadedBy?: string): Promise<GalleryImage> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const imageUrl = e.target?.result as string;
        const newImage: GalleryImage = {
          id: this.nextId++,
          url: imageUrl,
          title: title || file.name,
          description: description || '',
          uploadDate: new Date(),
          uploadedBy: uploadedBy || 'admin'
        };

        const currentImages = this.imagesSubject.value;
        const updatedImages = [...currentImages, newImage];
        this.saveImages(updatedImages);
        resolve(newImage);
      };

      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };

      reader.readAsDataURL(file);
    });
  }

  deleteImage(id: number): void {
    const currentImages = this.imagesSubject.value;
    const updatedImages = currentImages.filter(img => img.id !== id);
    this.saveImages(updatedImages);
  }

  updateImage(id: number, title?: string, description?: string): void {
    const currentImages = this.imagesSubject.value;
    const updatedImages = currentImages.map(img => {
      if (img.id === id) {
        return {
          ...img,
          title: title !== undefined ? title : img.title,
          description: description !== undefined ? description : img.description
        };
      }
      return img;
    });
    this.saveImages(updatedImages);
  }
}

