import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReportesService } from '../services/reportes.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-metricas',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './metricas.component.html',
  styleUrl: './metricas.component.css'
})
export class MetricasComponent implements OnInit {
  isBrowser: boolean = false;
  // Datos crudos
  citasMes: any[] = [];
  ingresosBarbero: any[] = [];
  rankingBarberos: any[] = [];
  serviciosPopulares: any[] = [];
  clientesFrecuentes: any[] = [];
  productosVendidos: any[] = [];

  // Configuración de Gráficos

  // 1. Reservas por Mes (Bar Chart)
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Total Citas', backgroundColor: '#007bff' },
      { data: [], label: 'Completadas', backgroundColor: '#28a745' },
      { data: [], label: 'Canceladas', backgroundColor: '#dc3545' }
    ]
  };

  // 2. Ingresos por Barbero (Pie Chart)
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
    }
  };
  public pieChartType: ChartType = 'pie';
  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [{ data: [] }]
  };

  // 3. Ranking de Barberos (Bar Chart Horizontal)
  public rankingChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
    }
  };
  public rankingChartType: ChartType = 'bar';
  public rankingChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Citas Atendidas', backgroundColor: '#ffc107' }
    ]
  };

  // 4. Servicios Populares (Doughnut Chart)
  public serviciosChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
    }
  };
  public serviciosChartType: ChartType = 'doughnut';
  public serviciosChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{ data: [] }]
  };

  // 5. Clientes Frecuentes (Bar Chart)
  public clientesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    }
  };
  public clientesChartType: ChartType = 'bar';
  public clientesChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Reservas', backgroundColor: '#17a2b8' }
    ]
  };

  // 6. Productos Vendidos (Pie Chart)
  public productosChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
    }
  };
  public productosChartType: ChartType = 'pie';
  public productosChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{ data: [] }]
  };

  constructor(
    private reportesService: ReportesService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadMetrics();
    }
  }

  loadMetrics(): void {
    this.reportesService.getCitasPorMes().subscribe(data => {
      this.citasMes = data;
      this.updateBarChart();
    });

    this.reportesService.getIngresosPorBarbero().subscribe(data => {
      this.ingresosBarbero = data;
      this.updatePieChart();
    });

    this.reportesService.getRankingBarberos().subscribe(data => {
      this.rankingBarberos = data;
      this.updateRankingChart();
    });

    this.reportesService.getServiciosPopulares().subscribe(data => {
      this.serviciosPopulares = data;
      this.updateServiciosChart();
    });

    this.reportesService.getClientesFrecuentes().subscribe(data => {
      this.clientesFrecuentes = data;
      this.updateClientesChart();
    });

    this.reportesService.getProductosVendidos().subscribe(data => {
      this.productosVendidos = data;
      this.updateProductosChart();
    });
  }

  updateBarChart(): void {
    const labels = this.citasMes.map(item => item.MES);
    const total = this.citasMes.map(item => item.TOTAL_CITAS);
    const completadas = this.citasMes.map(item => item.CITAS_COMPLETADAS);
    const canceladas = this.citasMes.map(item => item.CITAS_CANCELADAS);

    this.barChartData = {
      labels: labels,
      datasets: [
        { data: total, label: 'Total Citas', backgroundColor: '#007bff' },
        { data: completadas, label: 'Completadas', backgroundColor: '#28a745' },
        { data: canceladas, label: 'Canceladas', backgroundColor: '#dc3545' }
      ]
    };
  }

  updatePieChart(): void {
    const labels = this.ingresosBarbero.map(item => item.BARBERO);
    const data = this.ingresosBarbero.map(item => item.TOTAL_INGRESOS);

    this.pieChartData = {
      labels: labels,
      datasets: [{ data: data }]
    };
  }

  updateRankingChart(): void {
    const labels = this.rankingBarberos.map(item => item.BARBERO);
    const data = this.rankingBarberos.map(item => item.TOTAL_CITAS);

    this.rankingChartData = {
      labels: labels,
      datasets: [
        { data: data, label: 'Citas Atendidas', backgroundColor: '#ffc107' }
      ]
    };
  }

  updateServiciosChart(): void {
    const labels = this.serviciosPopulares.map(item => item.NOMBRE);
    const data = this.serviciosPopulares.map(item => item.TOTAL);

    this.serviciosChartData = {
      labels: labels,
      datasets: [
        { data: data, backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8'] }
      ]
    };
  }

  updateClientesChart(): void {
    const labels = this.clientesFrecuentes.map(item => item.CLIENTE);
    const data = this.clientesFrecuentes.map(item => item.TOTAL);

    this.clientesChartData = {
      labels: labels,
      datasets: [
        { data: data, label: 'Reservas', backgroundColor: '#17a2b8' }
      ]
    };
  }

  updateProductosChart(): void {
    const labels = this.productosVendidos.map(item => item.NOMBRE);
    const data = this.productosVendidos.map(item => item.TOTAL);

    this.productosChartData = {
      labels: labels,
      datasets: [
        { data: data, backgroundColor: ['#6610f2', '#e83e8c', '#fd7e14', '#20c997', '#6c757d'] }
      ]
    };
  }
}
