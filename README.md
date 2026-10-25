# LEAD Store

Tienda oficial de LEAD — frontend funcional en Next.js 16 (App Router), sin backend.
Bilingüe (EN/ES), tema claro/oscuro y responsive (escritorio y móvil).

## Ejecutar en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Otros comandos: `npm run build`, `npm run start`, `npm run lint`.

## Desplegar en Vercel

1. Sube el repositorio a GitHub.
2. En Vercel: **Add New → Project**, importa el repo. Framework: Next.js (detectado automáticamente).
3. En **Settings → Environment Variables** agrega `RESEND_API_KEY` (la misma clave de Resend que usa el sitio principal, lead-main). Opcionales: `ORDER_TO` y `ORDER_FROM` (ver `.env.example`).
4. Deploy.

## Correo de pedidos al proveedor

Al realizar un pedido, el checkout llama a `POST /api/order` ([app/api/order/route.ts](app/api/order/route.ts)), que envía un correo en español con el pedido a **angela.cortes@leadmindset.org** (configurable con `ORDER_TO`):

- Datos del cliente, entrega, artículos (color, talla, cantidad, texto y elemento de los personalizados), totales y notas.
- El arte subido en diseños personalizados va como **archivo adjunto** (`diseno-1.png`, …).
- Los precios se **recalculan en el servidor** con el catálogo; no se confía en los del navegador.
- Los datos de tarjeta **nunca** se envían.
- Responder al correo le escribe directamente al cliente (`reply-to`).
- Si el envío falla, el cliente ve un error y su carrito se conserva para reintentar.
- Sin `RESEND_API_KEY` (desarrollo local) el pedido funciona y el correo se imprime en la consola del servidor.
- El remitente `noreply@leadmindset.org` requiere que el dominio esté verificado en Resend (ya lo está si lead-main envía correos).

Para probar en local, copia `.env.example` a `.env.local` y pon la clave.

## Cómo funciona

| Tema | Detalle |
| --- | --- |
| Idioma | Cookie `lead-lang`; si no existe, se usa el `Accept-Language` del navegador. Textos en `lib/i18n.ts`. |
| Tema | `localStorage` `lead-theme`; si no existe, la preferencia del sistema. Script inline en `<head>` evita el parpadeo. Tokens en `app/globals.css`. |
| Datos | Catálogo estático en `lib/catalog.ts`. Carrito, diseños, pedidos, pedido grupal y perfil se guardan en `localStorage` (`lead-store-v1`) del navegador. |
| Precios | `lib/pricing.ts` y `lib/config.ts` (envío, impuestos, descuento grupal, cargo de preparación). Códigos promo de prueba: `LEAD10`, `CHAPTER10`. |

## Pendiente de confirmar (placeholders)

- `lib/config.ts`: valores marcados `TODO` — costos de envío, tasa de impuestos, plazos, cifras de impacto (`[XX]`, `[$XX]`).
- `lib/catalog.ts`: precios de **botella ($20)** y **stickers ($5)** son supuestos (el diseño decía `[PRICE]`).
- Enlaces externos (leadmindset.org, redes sociales) en `lib/config.ts`.

## Limitaciones de la demo (sin backend)

- **Pagos:** el checkout valida el formulario, crea el pedido localmente y envía el correo al proveedor; no se cobra nada.
- **Pedido grupal:** el enlace para compartir funciona como copia, pero los miembros no se sincronizan entre dispositivos.
- **Formularios** (contacto, newsletter): el envío es simulado.
- **Cuenta:** vive en el navegador; "Borrar mis datos" la reinicia.

Para producción haría falta: pasarela de pago (p. ej. Stripe) y base de datos para pedidos y pedidos grupales. Mientras no haya pago real, `/api/order` limita a 5 pedidos por IP cada 10 minutos para evitar spam.
