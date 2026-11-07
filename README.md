# Portafolio de Juan José Holguín

Portafolio 3D que se recorre deslizando. Los proyectos llegan solos desde Behance.

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

El usuario de Behance se define en `behanceUsername`. `npm run sync` descarga títulos, descripciones, estadísticas y portadas desde el perfil público y el feed RSS, sin claves ni inicio de sesión.

En GitHub, el flujo `.github/workflows/deploy.yml` sincroniza y publica con cada cambio y una vez al día, así que un proyecto nuevo en Behance aparece en el sitio al día siguiente. También se puede lanzar a mano desde la pestaña Actions.

## Publicar

En el repositorio, entra en Settings, Pages, y elige GitHub Actions como fuente.
