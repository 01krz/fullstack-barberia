import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-acerca-de',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './acerca-de.component.html',
  styleUrl: './acerca-de.component.css'
})
export class AcercaDeComponent {
  historia = {
    titulo: 'Nuestra Historia',
    contenido: `Lucas Polla Barbería nació de una pasión por el arte del corte de cabello y la tradición barbera. 
    Fundada en 2015, nuestra barbería ha sido un lugar donde la excelencia, el estilo y la atención personalizada 
    se encuentran para crear experiencias únicas.
    
    Desde nuestros inicios, nos hemos comprometido a ofrecer servicios de la más alta calidad, combinando técnicas 
    tradicionales con las últimas tendencias en moda y estilo. Cada uno de nuestros barberos es un artista dedicado 
    a su oficio, con años de experiencia y una pasión genuina por hacer que cada cliente se sienta y se vea mejor.
    
    Nuestra misión es simple: proporcionar un servicio excepcional en un ambiente acogedor donde cada cliente se 
    sienta valorado y cuidado. Creemos que un buen corte de cabello no es solo un servicio, es una experiencia 
    que puede transformar la confianza y el bienestar de una persona.
    
    A lo largo de los años, hemos construido una comunidad de clientes leales que confían en nosotros para su 
    cuidado personal. Cada cita es una oportunidad para crear algo especial, y cada cliente es parte de nuestra 
    familia.`,
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
    descripcion: 'Conoce a los profesionales que hacen posible la magia en Lucas Polla Barbería.'
  };
}
