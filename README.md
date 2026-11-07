# Portafolio de Juan José Holguín

Portafolio 3D interactivo que se recorre deslizando, con personajes, monedas, dado, bolas de habilidades con física y cuatro estilos visuales (3D, Pixel, Toon y Wireframe). Los proyectos llegan solos desde Behance.

## Empezar

```bash
npm install
npm run dev
```

## Editar el contenido

```bash
npm run editar
```

Abre un editor en el navegador para cambiar tu presentación, premios, experiencia, habilidades, enlaces y correo, y para ocultar proyectos. Al guardar se actualiza `public/data/profile.json`; después sube el cambio a GitHub para publicarlo.

## Proyectos de Behance

El usuario se define en `behanceUsername`. `npm run sync` trae los proyectos más recientes desde el perfil público y el feed RSS, sin claves, y conserva los anteriores en `public/data/projects.json`.

El flujo `.github/workflows/sync.yml` lo ejecuta una vez al día y guarda los cambios; cada cambio en `main` se publica en Vercel. Para ocultar un proyecto, desmárcalo en el editor. `featuredCount` y `featuredIds` en `profile.json` eligen cuáles salen en la pista 3D; todos aparecen en la cuadrícula.

## Atajos

Las teclas 1 a 4 cambian el estilo y R lanza el dado.
