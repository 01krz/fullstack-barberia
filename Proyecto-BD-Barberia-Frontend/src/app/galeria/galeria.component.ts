import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { GalleryService } from '../services/gallery.service';
import { GalleryImage } from '../models/gallery-image.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-galeria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './galeria.component.html',
  styleUrl: './galeria.component.css'
})
export class GaleriaComponent implements OnInit, OnDestroy {
  images: GalleryImage[] = [];
  isAdmin: boolean = false;
  showUploadForm: boolean = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  imageTitle: string = '';
  imageDescription: string = '';
  uploadError: string = '';
  uploadSuccess: boolean = false;
  private userSubscription?: Subscription;

  constructor(
    public authService: AuthService,
    private galleryService: GalleryService
  ) {}

  ngOnInit(): void {
    // Suscribirse a los cambios del usuario para actualizar isAdmin
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.isAdmin = this.authService.isAdmin();
    });
    
    // También verificar inmediatamente
    this.isAdmin = this.authService.isAdmin();
    
    this.galleryService.getImages().subscribe(images => {
      this.images = images;
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        this.uploadError = 'Por favor, selecciona un archivo de imagen válido';
        this.selectedFile = null;
        this.imagePreview = null;
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.uploadError = 'La imagen no puede ser mayor a 5MB';
        this.selectedFile = null;
        this.imagePreview = null;
        return;
      }

      this.selectedFile = file;
      this.uploadError = '';
      
      // Crear vista previa
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async uploadImage(): Promise<void> {
    if (!this.selectedFile) {
      this.uploadError = 'Por favor, selecciona una imagen';
      return;
    }

    this.uploadError = '';
    this.uploadSuccess = false;

    try {
      const currentUser = this.authService.getCurrentUser();
      const uploadedBy = currentUser?.email || 'admin';
      
      await this.galleryService.addImage(
        this.selectedFile,
        this.imageTitle || undefined,
        this.imageDescription || undefined,
        uploadedBy
      );

      this.uploadSuccess = true;
      this.selectedFile = null;
      this.imagePreview = null;
      this.imageTitle = '';
      this.imageDescription = '';
      
      // Resetear el input file
      const fileInput = document.getElementById('imageInput') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Ocultar el mensaje de éxito después de 3 segundos
      setTimeout(() => {
        this.uploadSuccess = false;
        this.showUploadForm = false;
      }, 3000);
    } catch (error) {
      this.uploadError = 'Error al subir la imagen. Por favor, intenta de nuevo.';
      console.error('Error al subir imagen:', error);
    }
  }

  deleteImage(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
      this.galleryService.deleteImage(id);
    }
  }

  removePreview(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  toggleUploadForm(): void {
    this.showUploadForm = !this.showUploadForm;
    if (!this.showUploadForm) {
      this.selectedFile = null;
      this.imagePreview = null;
      this.imageTitle = '';
      this.imageDescription = '';
      this.uploadError = '';
      this.uploadSuccess = false;
      
      // Resetear el input file
      const fileInput = document.getElementById('imageInput') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }

  // Getter para verificar admin en el template
  get isUserAdmin(): boolean {
    return this.authService.isAdmin();
  }
}
