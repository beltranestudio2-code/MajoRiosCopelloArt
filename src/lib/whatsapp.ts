export const MAJO_WHATSAPP_NUMBER = "5491163783293";

export function whatsappConsultaLink(nombreObra: string, urlObra: string) {
  const mensaje = `Hola, estoy interesado/a en esta obra "${nombreObra}". Podrían enviarme mas información y precios.\n${urlObra}`;
  return `https://wa.me/${MAJO_WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
}
