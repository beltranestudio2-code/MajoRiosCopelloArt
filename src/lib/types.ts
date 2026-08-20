// precio y precio_venta están en USD. costo está en ARS.
export interface Obra {
  id: string;
  nombre: string;
  descripcion: string | null;
  tecnica: string | null;
  medidas: string | null;
  enmarcado: string | null;
  serie: string | null;
  precio: number;
  costo: number;
  foto_url: string | null;
  stock: number;
  disponible: boolean;
  mostrar_precio: boolean;
  created_at: string;
}

export interface Configuracion {
  id: number;
  tipo_cambio: number;
  updated_at: string;
}

export interface Venta {
  id: string;
  obra_id: string;
  fecha_venta: string;
  comprador_nombre: string;
  comprador_contacto: string | null;
  precio_venta: number;
  created_at: string;
  obra?: Obra;
}
