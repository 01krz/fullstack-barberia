# Configuración de Google Calendar API

## Funcionalidad Implementada

La aplicación ahora integra Google Calendar para:
- Agregar automáticamente citas al calendario del cliente cuando hace una reserva
- Agregar automáticamente citas al calendario del barbero asignado
- Los eventos incluyen el nombre del servicio reservado

## Método Actual (Enlaces de Google Calendar)

Actualmente se usa el método de **enlaces de Google Calendar** que:
- Genera enlaces que abren Google Calendar con la información de la cita prellenada
- No requiere autenticación OAuth2
- El usuario/cliente debe hacer clic para confirmar y agregar al calendario
- Funciona inmediatamente sin configuración adicional

## Configuración para API Completa (Opcional)

Si deseas usar la API completa de Google Calendar (creación automática de eventos):

### 1. Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Calendar:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Calendar API"
   - Haz clic en "Enable"

### 2. Crear Credenciales OAuth2

1. Ve a "APIs & Services" > "Credentials"
2. Haz clic en "Create Credentials" > "OAuth client ID"
3. Configura la pantalla de consentimiento OAuth si es necesario
4. Selecciona "Web application"
5. Agrega las URLs de redirección autorizadas:
   - `http://localhost:4200/oauth2callback` (desarrollo)
   - `https://tu-dominio.com/oauth2callback` (producción)
6. Copia el **Client ID** y **Client Secret**

### 3. Actualizar el Servicio

Edita `src/app/services/google-calendar.service.ts` y reemplaza:

```typescript
private readonly CLIENT_ID = 'TU_CLIENT_ID_AQUI';
private readonly API_KEY = 'TU_API_KEY_AQUI';
```

### 4. Implementar Callback OAuth2

Crea un componente para manejar el callback de OAuth2 en `/oauth2callback`

## Uso Actual

### Para Clientes:
1. Al confirmar una reserva, se muestra un diálogo preguntando si desean agregar a Google Calendar
2. Si aceptan, se abre Google Calendar con la información de la cita
3. El cliente solo necesita confirmar para agregar al calendario

### Para Barberos:
1. En el panel de barbero, pueden hacer clic en "📅 Agregar a Google Calendar" en cualquier reserva
2. Se abre Google Calendar con la información de la cita
3. El barbero puede confirmar para agregar al calendario

### Configuración de Email de Google Calendar para Barberos:
1. En el panel de administración, al agregar/editar un barbero
2. Hay un campo opcional "Email de Google Calendar"
3. Si se completa, se usará ese email para generar los eventos
4. Si no se completa, se usa el email regular del barbero

## Notas Importantes

- Los enlaces de Google Calendar funcionan sin configuración adicional
- Para usar la API completa, necesitas configurar OAuth2
- Los eventos se guardan en localStorage para referencia posterior
- El método actual es más simple y no requiere autenticación

