# 🚀 Cómo Iniciar el Proyecto DinkyFlow

## Requisitos Previos

- Node.js (versión recomendada según el proyecto)
- npm o yarn

## Instalación Inicial

Si es la primera vez que clonas el proyecto, ejecuta:

```bash
npm install
```

O si prefieres usar yarn:

```bash
yarn install
```

## Configuración (Opcional)

Para configurar completamente el proyecto y construir todos los paquetes:

```bash
npm run setup
```

## Iniciar en Modo Desarrollo

### Opción 1: Desarrollo Completo (Recomendado)

Inicia tanto la aplicación web (React) como Electron simultáneamente:

```bash
npm run dev
```

### Opción 2: Desarrollo con Hot Reload

Inicia el entorno de desarrollo con recarga automática:

```bash
npm run dev:watch
```

o

```bash
npm run watch
```

### Opción 3: Por Separado

Si prefieres ejecutar los componentes por separado:

**Terminal 1 - Aplicación Web (React):**
```bash
npm run dev:web
```

**Terminal 2 - Aplicación Electron:**
```bash
npm run dev:electron
```

## Comandos Útiles

- `npm run build:web` - Construir la aplicación web
- `npm run build:electron:win` - Construir para Windows
- `npm run build:electron:mac` - Construir para macOS
- `npm run build:electron:linux` - Construir para Linux
- `npm run lint` - Ejecutar el linter
- `npm run lint:fix` - Corregir errores de linting automáticamente

## Notas

- El proyecto utiliza workspaces de npm, por lo que las dependencias se gestionan desde la raíz
- La aplicación web se ejecuta en un servidor de desarrollo (normalmente en `http://localhost:3000` o similar)
- Electron se abrirá automáticamente cuando esté listo

