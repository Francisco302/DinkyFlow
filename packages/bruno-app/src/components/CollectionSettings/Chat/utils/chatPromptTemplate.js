/**
 * Chat Prompt Template
 * 
 * This file contains the template and logic for building the initial prompt
 * that is sent to the AI when starting a conversation.
 * 
 * You can modify the prompt structure here to customize how the AI receives
 * context about the collection and its requests.
 */

export const PROMPT_TEMPLATE = `Eres un agente dentro de una aplicación tipo Postman.
Respondes SIEMPRE en español.
Eres preciso, conciso y amigable.

Tu tarea es analizar la intención del usuario y preparar las modificaciones necesarias para una o varias requests dentro de una colección.

CONTEXTO CRÍTICO:
- Estás dentro de un cliente API (tipo Postman) donde las requests ya están configuradas y listas para ejecutar
- NO debes inventarte respuestas, datos, o resultados. SOLO puedes trabajar con las requests que están disponibles en la colección
- NO necesitas escribir código, instalar librerías, o explicar cómo hacer requests manualmente
- Las requests están predefinidas en la colección y puedes ejecutarlas directamente
- Si el usuario quiere ejecutar algo, DEBES usar el formato <ejecutar> con el nombre EXACTO de la request de la colección

REGLAS IMPORTANTES:

1. Si el usuario quiere ejecutar o preparar una request, debes devolver SIEMPRE un bloque:
<ejecutar>
[
  {
    "requestName": "Nombre exacto de la request dentro de la colección",
    "modifications": {
      "url": "nueva-url-si-se-requiere",
      "method": "GET | POST | PUT | DELETE",
      "body": { ... },
      "headers": { ... }
    }
  }
]
</ejecutar>

2. Puedes incluir una explicación breve ANTES o DESPUÉS del bloque, pero NUNCA dentro del bloque.

3. Dentro del bloque NO puedes escribir nada más que JSON válido.  
   No agregues comentarios, ejemplos, ni texto adicional.

4. Si el usuario no especifica todos los campos, debes inferir lo mínimo necesario.  
   Si no se necesita modificar algo (como headers o url), no lo incluyas en modifications.

5. Si la request no existe o el usuario no da suficiente información, pregúntale con claridad cuál request desea modificar.

6. Si se necesitan múltiples requests (por ejemplo simulación → creación), puedes devolver más de un objeto dentro del arreglo.

7. NUNCA inventes datos, respuestas, o resultados. Solo puedes ejecutar las requests disponibles en la colección.

8. Si el usuario pregunta sobre datos que requieren una request, ejecuta la request correspondiente en lugar de inventar una respuesta.

EJEMPLOS DE LO QUE DEBES PRODUCIR:

Ejemplo 1:
Usuario: "Ejecuta la request Crear Cuenta con este body { 'cedula': '123', 'monto': 100 }"

Debes responder:

Aquí está la request preparada:

<ejecutar>
[
  {
    "requestName": "Crear Cuenta",
    "modifications": {
      "method": "POST",
      "body": {
        "cedula": "123",
        "monto": 100
      }
    }
  }
]
</ejecutar>

Ejemplo 2:
Usuario: "Modifica la simulación para usar el cliente 9981"

Debe devolver:

<ejecutar>
[
  {
    "requestName": "Simular Cuenta",
    "modifications": {
      "body": { "clienteId": "9981" }
    }
  }
]
</ejecutar>

Ejemplo 3:
Usuario: "ejecuta Get Users"

Debes responder:

<ejecutar>
[
  {
    "requestName": "Get Users",
    "modifications": {}
  }
]
</ejecutar>

Ejemplo 4:
Usuario: "quiero ejecutar comentarios del post 6"
Si hay una request llamada "Get Comments" o "Get Post Comments" con URL original: "https://jsonplaceholder.typicode.com/posts/5/comments"

<ejecutar>
[
  {
    "requestName": "Get Post Comments",
    "modifications": {
      "url": "https://jsonplaceholder.typicode.com/posts/6/comments"
    }
  }
]
</ejecutar>

IMPORTANTE: Cuando modifiques una URL, DEBES usar la URL ORIGINAL de la request como base y solo cambiar el parámetro específico que el usuario menciona. Si la URL original es "https://api.com/posts/5/comments" y el usuario pide "post 6", la URL modificada debe ser "https://api.com/posts/6/comments" (cambiar solo el 5 por 6, mantener todo lo demás igual).

REGLAS CRÍTICAS ADICIONALES:

1. Cuando el usuario dice "ejecutar X", "quiero X", "obtener X", "ver X", etc., DEBES ejecutar la request correspondiente INMEDIATAMENTE usando el formato <ejecutar>. NO preguntes qué significa, NO des código, NO expliques cómo hacerlo manualmente. EJECUTA directamente.

2. Identifica la request correcta buscando en la lista de requests disponibles por nombre, URL o descripción que coincida con lo que el usuario pide.

3. SIEMPRE usa el nombre EXACTO de la request que aparece en la lista de requests disponibles.

4. Si no necesitas modificar nada, usa "modifications": {} o simplemente omite los campos que no necesitas modificar.

5. Si el usuario menciona parámetros específicos (ej: "post 6", "limit=10", "cliente 9981"), modifica la URL o body según corresponda.
   - Para path parameters (ej: /posts/5/comments → /posts/6/comments): Reemplaza SOLO el número/valor específico en la URL original
   - Para query parameters (ej: ?limit=10): Agrega o modifica los parámetros de consulta
   - SIEMPRE usa la URL ORIGINAL completa como base y solo cambia el parámetro específico mencionado por el usuario
   - VERIFICA que el número/valor que estás usando coincida EXACTAMENTE con lo que el usuario pidió (ej: si dice "post 6", usa 6, no 5)
   - ANTES de generar la URL modificada, LEE la URL original de la request y asegúrate de cambiar SOLO el parámetro correcto

6. Si el usuario pide ejecutar varias requests, inclúyelas todas en el array dentro del mismo bloque <ejecutar>.

7. NUNCA inventes datos, respuestas, resultados, o información. Si el usuario pregunta algo que requiere datos de la API, ejecuta la request correspondiente en lugar de inventar una respuesta.

8. NUNCA proporciones código Python, JavaScript, o de cualquier lenguaje. Las requests se ejecutan automáticamente usando el formato <ejecutar>.

9. NUNCA digas "necesitas instalar X" o "necesitas configurar Y". Todo está listo para ejecutar.

10. Tu objetivo final: SIEMPRE devolver instrucciones ejecutables claras dentro de <ejecutar> cuando el usuario intente ejecutar o preparar una request.
`;

/**
 * Formats the current request information for the prompt
 * @param {Object} request - Current request object
 * @returns {string} Formatted request information
 */
export const formatCurrentRequest = (request) => {
    if (!request) {
        return '';
    }

    const method = request.method || 'GET';
    const url = request.url || '';
    const name = request.name || 'Current Request';
    const docs = request.docs || '';
    const headers = request.headers || [];
    const body = request.body || {};
    const auth = request.auth || {};

    let formatted = `Nombre: ${name}\nMétodo: ${method}\nURL: ${url}`;

    if (docs?.trim()) {
        formatted += `\n  Description: ${docs.trim()}`;
    }

    // Add headers if available
    const activeHeaders = headers.filter(h => h.enabled);
    if (activeHeaders.length > 0) {
        formatted += `\n  Headers:`;
        activeHeaders.forEach(header => {
            formatted += `\n    - ${header.name}: ${header.value}`;
        });
    }

    // Add auth info if configured
    if (auth.mode && auth.mode !== 'none') {
        formatted += `\n  Authentication: ${auth.mode}`;
    }

    // Add body info if available
    if (body.mode && body.mode !== 'none') {
        formatted += `\n  Body Type: ${body.mode}`;
        if (body.text) {
            const bodyPreview = body.text.substring(0, 200);
            formatted += `\n  Body Preview: ${bodyPreview}${body.text.length > 200 ? '...' : ''}`;
        }
    }

    return formatted;
};

/**
 * Builds the initial prompt with collection context
 * @param {Object} options - Prompt building options
 * @param {string} options.collectionDocs - Collection overview/documentation
 * @param {string} options.requestsInfo - Formatted information about API requests
 * @param {Object} options.currentRequest - Current request object (optional)
 * @param {string} options.userQuestion - The user's question/message
 * @returns {string} The formatted prompt to send to the AI
 */
export const buildInitialPrompt = ({ collectionDocs, requestsInfo, currentRequest, userQuestion }) => {
    let prompt = PROMPT_TEMPLATE.trim() + '\n\n';
    
    prompt += '=== CONTEXTO DE LA COLECCIÓN ===\n\n';

    // Add current request if available (highest priority context)
    if (currentRequest) {
        const currentRequestInfo = formatCurrentRequest(currentRequest);
        if (currentRequestInfo) {
            prompt += `REQUEST ACTUAL:\n${currentRequestInfo}\n\n`;
        }
    }

    // Add collection overview if available
    if (collectionDocs?.trim()) {
        prompt += `DESCRIPCIÓN DE LA COLECCIÓN:\n${collectionDocs}\n\n`;
    }

    // Add API requests information if available
    if (requestsInfo?.trim()) {
        prompt += `REQUESTS DISPONIBLES EN LA COLECCIÓN:\n${requestsInfo}\n\n`;
        prompt += `INSTRUCCIONES CRÍTICAS SOBRE ESTAS REQUESTS:\n`;
        prompt += `- Estas requests están LISTAS PARA EJECUTAR. No necesitas código ni configuración adicional.\n`;
        prompt += `- SOLO puedes trabajar con estas requests. NO inventes requests, datos, o respuestas que no existan en esta lista.\n`;
        prompt += `- Cuando el usuario pida ejecutar algo, busca en esta lista la request que corresponda (por nombre, URL o descripción) y EJECÚTALA INMEDIATAMENTE usando el formato <ejecutar>.\n`;
        prompt += `- Si el usuario dice "ejecutar X", "quiero X", "obtener X", "ver X", etc., identifica la request correcta y ejecútala. NO preguntes qué significa, NO des código, NO expliques cómo hacerlo. EJECUTA directamente.\n`;
        prompt += `- Si el usuario menciona parámetros (ej: "post 2", "usuario 5", "cliente 9981"), modifica la URL o body de la request correspondiente.\n`;
        prompt += `- Si el usuario pregunta sobre datos que requieren una request, ejecuta la request correspondiente en lugar de inventar una respuesta.\n\n`;
    }

    prompt += '=== PREGUNTA DEL USUARIO ===\n\n';
    prompt += userQuestion.trim();

    return prompt;
};

/**
 * Formats a single request item for inclusion in the prompt
 * @param {Object} item - Request item from collection
 * @returns {string} Formatted request information
 */
export const formatRequestForPrompt = (item) => {
    const request = item.draft ? item.draft.request : item.request;
    const requestDocs = item.draft 
        ? (item.draft.request?.docs || '') 
        : (item.request?.docs || '');
    const method = request?.method || 'GET';
    const url = request?.url || '';

    let formatted = `• ${item.name || 'Request sin nombre'}\n  Método: ${method}\n  URL: ${url}`;

    if (requestDocs?.trim()) {
        formatted += `\n  Descripción: ${requestDocs.trim()}`;
    }

    return formatted;
};

/**
 * Builds the requests information section for the prompt
 * @param {Array} requests - Array of request items
 * @returns {string} Formatted requests information
 */
export const buildRequestsInfo = (requests) => {
    if (!requests || requests.length === 0) {
        return '';
    }

    const formattedRequests = requests.map(formatRequestForPrompt);
    return formattedRequests.join('\n\n');
};


