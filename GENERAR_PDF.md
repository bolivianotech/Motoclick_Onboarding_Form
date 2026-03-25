# Guía: Generación Automática de PDF

Para recrear el documento en formato PDF con la hoja continua, el método más rápido, nativo y eficiente (sin usar librerías de terceros engorrosas como `jspdf` o `pdfmake`) es utilizar la **generación de HTML e impresión nativa del navegador** (`window.print()`). 

Cuando la ventana de impresión nativa del navegador (Chrome, Safari, etc.) se abre, le da al usuario la opción de **Guardar como PDF** (`Save as PDF`). Esta opción genera un documento de alta calidad, seleccionable, con texto nítido en el que los datos fluyen perfectamente.

A continuación te guío paso a paso sobre cómo implementarlo en tu código.

## Paso 1: Agregar el Botón "Generar PDF" en `index.html`

Abre tu archivo `index.html` y ubica el lugar donde está tu botón principal de "Submit Application" (cerca de la línea 310 en la clase `form-footer`). Agrega allí tu botón para el PDF:

```html
<div class="form-footer">
    <p class="footer-note">Once submitted, your Motoclick agent will contact you...</p>
    
    <!-- Botón para ver/generar PDF antes de enviar o usar en lugar de enviar -->
    <button type="button" id="btn-generate-pdf" class="ios-button" style="background-color: var(--ios-blue); margin-bottom: 10px;">
        Generar / Ver PDF
    </button>
    
    <button type="submit" class="ios-button">Submit Application</button>
    <div id="form-msg" class="form-message"></div>
</div>
```

## Paso 2: Crear el Archivo Generador de Plantilla `pdf-generator.js`

Crea un nuevo archivo en tu proyecto llamado `pdf-generator.js`. Esta función tomará los datos (payload) y construirá temporalmente una hoja HTML que replica el diseño exacto de tus capturas (blanco y negro, cuadrículas de credenciales).

Agrega esto dentro de **`pdf-generator.js`**:

```javascript
export function openPdfPreview(data) {
    // Definimos el diseño HTML estricto basándonos en tu imagen.
    // Incluirá estilos en línea o etiquetas <style> de impresión.
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <title>Onboarding Form PDF</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; line-height: 1.5; color: black; padding: 40px; margin: 0; background: white; }
        h1 { text-align: left; font-size: 18px; margin-bottom: 30px; }
        h2 { font-size: 16px; margin-top: 30px; margin-bottom: 10px; }
        .field { margin-bottom: 6px; }
        .label { font-weight: normal; }
        .value { border-bottom: 1px solid black; padding: 0 5px; display: inline-block; min-width: 250px; font-weight: 500; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid black; padding: 8px; text-align: left; font-size: 13px; }
        th { background-color: #f2f2f2; text-align: center; }
        
        .checkbox-item { margin-bottom: 5px; }
        .checkbox-box { display: inline-block; width: 12px; height: 12px; border: 1px solid black; margin-right: 5px; position: relative; top: 2px; }
        .checked { background-color: black; }
        
        /* Ocultar elementos si simplemente estamos visualizando pero forzarlos al imprimir */
        @media print {
            body { padding: 0; }
            @page { margin: 2cm; }
        }
    </style>
    </head>
    <body>
        <h1>■ ONBOARDING FORM – DELIVERY CHANNEL INTEGRATION</h1>
        
        <h2>■ General Business Information</h2>
        <div class="field"><span class="label">Business name:</span> <span class="value">${data.trade_name || data.legal_name || ''}</span></div>
        <div class="field"><span class="label">City / State:</span> <span class="value">${data.city || ''}</span></div>
        <div class="field"><span class="label">Exact address:</span> <span class="value">${data.address || ''}</span></div>
        <div class="field"><span class="label">GPS location (Google Maps link):</span> <span class="value" style="font-size: 11px;">(Link/Placeholder)</span></div>

        <h2>■ Contact Information</h2>
        <div class="field"><span class="label">Owner's verified email:</span> <span class="value">${data.email || ''}</span></div>
        <div class="field"><span class="label">Manager's phone number:</span> <span class="value">${data.phone || ''}</span></div>
        <div class="field"><span class="label">Manager's name:</span> <span class="value">${data.contact_name || ''}</span></div>
        <div class="field"><span class="label">Additional contact number (WhatsApp):</span> <span class="value"></span></div>

        <h2>■ Access Credentials</h2>
        <p style="font-size: 13px; margin-bottom: 5px;">Username and password for each platform (DoorDash, Uber, etc.)</p>
        <table>
            <tr>
                <th style="width: 20%;">Platform</th>
                <th style="width: 30%;">User / Email</th>
                <th style="width: 25%;">Password</th>
                <th style="width: 25%;">Notes</th>
            </tr>
            <tr>
                <td>DoorDash</td>
                <td>${data.cred_doordash_user || ''}</td>
                <td>${data.cred_doordash_pass || ''}</td>
                <td>${data.cred_doordash_notes || ''}</td>
            </tr>
            <tr>
                <td>Uber Eats</td>
                <td>${data.cred_uber_user || ''}</td>
                <td>${data.cred_uber_pass || ''}</td>
                <td>${data.cred_uber_notes || ''}</td>
            </tr>
            <tr>
                <td>Delivery.com</td>
                <td>${data.cred_delivery_user || ''}</td>
                <td>${data.cred_delivery_pass || ''}</td>
                <td>${data.cred_delivery_notes || ''}</td>
            </tr>
            <tr>
                <td>Own Website/App</td>
                <td>${data.cred_own_user || ''}</td>
                <td>${data.cred_own_pass || ''}</td>
                <td>${data.cred_own_notes || ''}</td>
            </tr>
        </table>

        <h2>■ Operational Information</h2>
        <div class="field">
            <span class="label">1. Does the business currently use "Self Delivery" (own drivers)?</span><br>
            <div style="margin-top: 5px; margin-left: 10px;">
                <span style="border: ${data.self_delivering === 'Yes' ? '1px solid blue; border-radius: 5px; padding: 2px' : 'none'}">
                    <span class="checkbox-box ${data.self_delivering === 'Yes' ? 'checked' : ''}"></span> Yes
                </span>
                <span style="margin-left: 10px; border: ${data.self_delivering === 'No' ? '1px solid blue; border-radius: 5px; padding: 2px' : 'none'}">
                    <span class="checkbox-box ${data.self_delivering === 'No' ? 'checked' : ''}"></span> No
                </span>
            </div>
        </div>
        
        <div class="field" style="margin-top: 15px;">
            <span class="label">2. If yes, in which platforms?</span><br>
            <span class="value" style="min-width: 400px; margin-top: 5px;"></span>
        </div>

        <div class="field" style="margin-top: 15px;">
            <span class="label">3. How many in-house drivers are currently active?</span><br>
            <span class="value" style="min-width: 400px; margin-top: 5px;"></span>
        </div>

        <div class="field" style="margin-top: 15px;">
            <span class="label">4. What are the delivery operating hours?</span><br>
            <span class="value" style="min-width: 400px; margin-top: 5px;">${data.operating_hours || ''}</span>
        </div>

        <h2 style="margin-top: 30px;">■ Additional Notes</h2>
        <div style="border-bottom: 1px solid black; width: 100%; height: 20px;">${data.notes || ''}</div>
        <div style="border-bottom: 1px solid black; width: 100%; height: 20px;"></div>
        <div style="border-bottom: 1px solid black; width: 100%; height: 20px;"></div>

        <script>
            // Forzar carga e imprimir automáticamente al abrir la ventana temporal
            window.onload = function() {
                setTimeout(function() {
                    window.print();
                    // Descomentar si quieres que la ventana se cierre sola después del diálogo:
                    // window.close();
                }, 500);
            };
        </script>
    </body>
    </html>
    `;

    // Abrimos una nueva ventana en blanco e insertamos todo el HTML estructurado
    const printWindow = window.open('', '_blank');
    printWindow.document.open();
    printWindow.document.write(htmlTemplate);
    printWindow.document.close();
}
```

## Paso 3: Conectar la Lógica en tu `main.js`

Por último, ve a tu archivo actual `main.js` y conecta el botón que agregamos en el paso 1 con la función que genera el documento:

1. Importa la función al inicio de `main.js`:
   ```javascript
   import { supabase } from './supabase.js';
   import { openPdfPreview } from './pdf-generator.js'; // <-- AGREGAR ESTO
   ```

2. Añade un "Event Listener" para el botón justo antes de tu lógica de cierre (donde dice `// Simulate successful api call for demonstration` o fuera del evento submit de preferenecia). La mejor forma es capturar la Data sin enviar el formulario todavía:

   ```javascript
   // Cerca de la línea 85 (Fuera del 'form.addEventListener('submit', ... )')
   const form = document.getElementById('onboarding-form');
   const btnGeneratePdf = document.getElementById('btn-generate-pdf');

   btnGeneratePdf.addEventListener('click', () => {
       // Recolectar datos actuales del formulario sin enviarlos al backend
       const formData = new FormData(form);
       const data = Object.fromEntries(formData.entries());
       
       // Convertir selectores múltiples u opciones explícitamente (igual que en Submit)
       data.self_delivering = formData.get('self_delivering') || null; 

       // Puedes agregar todas las capturas (painPoints, deliveryPlatforms) aquí si las necesitas para el PDF.
       
       // Producir y abrir el documento:
       openPdfPreview(data);
   });
   ```

### ¿Por qué esta es la mejor opción?
1. Queda **idéntico al documento clásico (Word/PDF)** de los negocios locales (con la fuente Arial/Helvetica y estructuración técnica).
2. Genera el **diálogo nativo del Sistema Operativo** para `Guardar como PDF` (Save to PDF).
3. Resulta en un **PDF liviano (kilobytes vs. megabytes)** porque exporta texto de verdad, y no inyecta librerías pesadas en tu proyecto.
4. Puedes modificar el diseño HTML estático en la variable `htmlTemplate` tantas veces como necesites y se reflejará al instante.
