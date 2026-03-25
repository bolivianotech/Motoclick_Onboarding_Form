# Guía de Migración y Despliegue (Deploy) - Motoclick Onboarding Form

Este documento explica de forma detallada cómo tomar la solución actual (basada en Frontend estático + Supabase) y migrarla a **cualquier otro motor de base de datos** (como MySQL, PostgreSQL local, SQL Server, MongoDB, etc.) y cómo desplegar la solución final.

---

## 1. Entendiendo la Arquitectura Actual
Actualmente, el proyecto utiliza un modelo **BaaS (Backend as a Service)** con Supabase. 
- **Frontend** (HTML/CSS/JS) funciona en el navegador del usuario.
- El cliente de Supabase (`supabase.js`) se conecta directamente desde el navegador a la base de datos de Supabase a través de su API segura incorporada.

## 2. Lo que necesitas para migrar a tu propia base de datos
Si decides **NO** usar Supabase y alojar tu propio motor de base de datos, **no puedes conectarte de forma segura y directa a la base de datos desde el navegador** (JavaScript en el frontend). Las credenciales quedarían expuestas.

Para migrar, debes adoptar una **arquitectura en 3 capas**:
1. **El Frontend (Vistas):** Tu código actual (`index.html`, `style.css`, `main.js`).
2. **El Servidor Backend (API):** Un punto intermedio. Un pequeño servidor programado en Node.js (Express), Python (FastAPI/Flask), PHP, o Java.
3. **El Motor de Base de Datos:** Tu servidor MySQL, PostgreSQL, o SQL Server local o en la nube.

---

## 3. Pasos Detallados para la Migración

### Paso A: Crear tu Base de Datos Local
Debes ejecutar un script SQL en tu nuevo motor para replicar la estructura que teníamos en Supabase. Si fuera **MySQL / MariaDB**, el script sería algo así:

```sql
CREATE TABLE merchants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    agent_id VARCHAR(255),
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    contact_name VARCHAR(255),
    title_role VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    city VARCHAR(100),
    zip_code VARCHAR(50),
    locations INT DEFAULT 1,
    address TEXT,
    business_type VARCHAR(100),
    operating_hours TEXT,
    avg_orders INT,
    avg_ticket DECIMAL(10,2),
    peak_hours VARCHAR(255),
    own_drivers VARCHAR(50),
    self_delivering VARCHAR(50),
    using_3pl VARCHAR(50),
    pain_points JSON, -- Para guardar el Array de checkboxes
    delivery_platforms JSON,
    pos_system JSON,
    own_website VARCHAR(10),
    own_app VARCHAR(10),
    service_type VARCHAR(100),
    main_problem TEXT,
    contract_name VARCHAR(255),
    ein_tax_id VARCHAR(100),
    billing_address TEXT,
    authorized_signatory VARCHAR(255),
    comm_channel VARCHAR(50),
    weekly_call VARCHAR(10),
    wa_group VARCHAR(10),
    notes TEXT,
    cred_doordash_user VARCHAR(255), cred_doordash_pass VARCHAR(255), cred_doordash_notes TEXT,
    cred_uber_user VARCHAR(255), cred_uber_pass VARCHAR(255), cred_uber_notes TEXT,
    cred_delivery_user VARCHAR(255), cred_delivery_pass VARCHAR(255), cred_delivery_notes TEXT,
    cred_own_user VARCHAR(255), cred_own_pass VARCHAR(255), cred_own_notes TEXT
);
```

### Paso B: Desarrollar una API Intermedia (Backend)
Debes crear un servidor. Por ejemplo, usando **Node.js + Express**:

Este servidor recibirá los datos del formulario (JSON) a través de una petición HTTP `POST` y los insertará de forma segura en la base de datos local (usando credenciales que sólo el servidor conoce).

Para ello, crearás un endpoint que reciba peticiones, por ejemplo: `POST http://localhost:3000/api/merchants`

### Paso C: Modificar el Frontend (`main.js`)
En tu proyecto frontend actual, eliminarás las referencias a `supabase`. Tienes que ir al archivo `main.js` y modificar el momento en que se envía el formulario.

**Borrarías o cambiarías esto:**
```javascript
// ELIMINAR O REEMPLAZAR
import { supabase } from './supabase.js';

const { error } = await supabase.from('merchants').insert([payload]);
```

**Y lo reemplazarías por la función nativa `fetch` hacia tu nuevo backend:**
```javascript
// NUEVO CÓDIGO PARA LLAMAR A TU BACKEND
const response = await fetch('http://localhost:3000/api/merchants', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
});

if (!response.ok) {
    throw new Error('Error guardando los datos en nuestro servidor');
}
```

Puedes prescindir por completo del archivo `supabase.js` en este punto.

***Nota: Si también eliminas Supabase Auth para los "Magic Links", deberás crear tu propio sistema de login en el backend para validar a los agentes (JWT, cookies de sesión, etc.)***

---

## 4. Cómo Compartir tu Código
Si tienes tu código en tu equipo y necesitas compartirlo para continuar el desarrollo o montar el entorno local, tienes estas opciones:

1. **Uso de GitHub / GitLab (Recomendado)**:
   - Inicializa el proyecto con Git (`git init`).
   - Sube todo el código a GitHub.
   - Comparte el enlace del repositorio.
2. **Transferencia directa**:
   - Comprime tus archivos a `.zip`.
   - **¡IMPORTANTE!** Elimina la carpeta `node_modules` (si existe) y el archivo `.env` antes de comprimirlo, para evitar que tu archivo pese cientos de megabytes innecesariamente o exponer tus claves.

## 5. Estrategia Final de Despliegue (Deploy Completo)

Si migraste a una arquitectura de base de datos propia + API, en lugar de usar páginas estáticas en un solo hosting (Render), ahora debes desplegar 3 elementos:

1. **Despliegue de la Base de Datos:**
   Levantar un servidor en la nube de MySQL/PostgreSQL mediante AWS RDS, DigitalOcean Managed Databases o PlanetScale.

2. **Despliegue del Backend (API):**
   Tu servidor Node.js (u otro) debe hospedarse en servicios como Render (Web Service), Heroku, o un VPS (Droplet en DigitalOcean). Configuras las variables de entorno de este servicio para que se comunique con la base de datos alojada en el punto anterior.

3. **Despliegue del Frontend:**
   Igual que con Supabase. Haces el `npm run build` o conectas el repositorio a **Render**, **Vercel** o **Netlify**. La única diferencia, es que tu entorno frontend ahora usará una variable (`API_URL`) para conocer la dirección de tu Backend en la nube (Ej. `https://mi-api-motoclick.onrender.com/api`).
