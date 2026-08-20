export const MAJO_WHATSAPP_NUMBER = "5491163783293";

export function whatsappConsultaLink(nombreObra: string, urlObra: string) {
  const mensaje = `Hola, estoy interesado/a en la obra "${nombreObra}", queria saber mas informacion. ${urlObra}`;
  return `https://wa.me/${MAJO_WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
}
