export const MAJO_WHATSAPP_NUMBER = "5491163783293";

export function whatsappConsultaLink(nombreObra: string) {
  const mensaje = `Hola, estoy interesada en ${nombreObra} y queria saber el precio`;
  return `https://wa.me/${MAJO_WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
}
