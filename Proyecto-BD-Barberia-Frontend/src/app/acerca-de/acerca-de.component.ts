import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BarberoService } from '../services/barbero.service';
import { Barbero } from '../models/barbero.model';

@Component({
  selector: 'app-acerca-de',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './acerca-de.component.html',
  styleUrl: './acerca-de.component.css'
})
export class AcercaDeComponent implements OnInit {
  barberos: Barbero[] = [];

  constructor(private barberoService: BarberoService) { }

  ngOnInit(): void {
    this.cargarBarberos();
  }

  cargarBarberos(): void {
    console.log('DEBUG: Cargando barberos...');
    this.barberoService.obtenerBarberos().subscribe({
      next: (barberos) => {
        console.log('DEBUG: Barberos recibidos:', barberos);
        this.barberos = barberos.filter(b => b.activo);
        console.log('DEBUG: Barberos activos filtrados:', this.barberos);
      },
      error: (err) => {
        console.error('Error al cargar barberos:', err);
      }
    });
  }

  historia = {
    titulo: 'Nuestra Historia',
    contenido: `Ukid's Barber Shop nació en 2023, casi como un juego entre amigos y una curiosidad personal por el mundo de los cortes y los estilos. Lo que comenzó como una forma de probar peinados por diversión, pronto se convirtió en algo más serio al ver que cada corte quedaba mejor que el anterior y que quienes confiaban en nosotros salían felices, renovados y con ganas de volver.

Con ese impulso, decidimos llevar el proyecto al siguiente nivel y crear algo especial: una barbería que mezclara lo moderno con la tradición de siempre. Desde entonces, Ukid's Barber Shop se ha transformado en un espacio donde el detalle importa, donde cada corte se trabaja con dedicación y donde la experiencia del cliente es tan importante como el resultado final.

Nuestros barberos no solo cortan, sino que crean. Cada uno aporta su estilo, su técnica y su toque personal para ofrecer un servicio que va más allá de un simple arreglo: es un momento para verse bien, sentirse mejor y salir con más confianza.

Nuestra misión es clara: brindar un servicio excepcional en un ambiente cercano, relajado y con buena vibra. Creemos que un buen corte puede cambiar el día —e incluso el ánimo—, y por eso tratamos cada cita como una oportunidad de hacer sentir especial a quien se sienta en nuestra silla.

Hoy, Ukid's Barber Shop sigue creciendo gracias a una comunidad que valora la dedicación, la cercanía y la autenticidad. Cada cliente que llega se convierte en parte de nuestra historia… y nosotros, en parte de su estilo.`,
    valores: [
      {
        titulo: 'Excelencia',
        descripcion: 'Nos esforzamos por la perfección en cada corte y servicio que ofrecemos.'
      },
      {
        titulo: 'Tradición',
        descripcion: 'Honramos las técnicas clásicas mientras abrazamos la innovación moderna.'
      },
      {
        titulo: 'Compromiso',
        descripcion: 'Cada cliente es importante para nosotros y merece nuestra atención completa.'
      },
      {
        titulo: 'Comunidad',
        descripcion: 'Construimos relaciones duraderas con nuestros clientes y la comunidad local.'
      }
    ]
  };

  equipo = {
    titulo: 'Nuestro Equipo',
    descripcion: 'Conoce a los profesionales que hacen posible la magia en Ukid\'s Barber Shop.'
  };
}
