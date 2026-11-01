# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |
| `S`       | Cambiar skin de la nave |

## Puntuación

| Asteroide      | Puntos |
| -------------- | ------ |
| Grande         | 20     |
| Mediano        | 50     |
| Pequeño        | 100    |
| Estrella fugaz | 1000   |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- **Power-ups**: al destruir un asteroide se hace una tirada independiente por cada tipo, así que pueden soltarse varios a la vez: velocidad (cian, 12 s), **triple shot** (magenta, 5 s; dispara 3 balas en abanico de ±12°), **rapid-fire** (rojo, 8 s; triplica la cadencia de disparo, de 0.2 s a ~0.067 s, y permite disparar manteniendo pulsado Espacio) y **escudo** (verde, hasta 20 s o 2 impactos). Rapid-fire y triple shot se combinan, acelerando también el abanico.
- **Estrella fugaz**: 50% de probabilidad por mapa; si aparece, lo hace entre los segundos 10 y 20 entrando desde un borde aleatorio. Recorre una trayectoria elíptica con envolvimiento de bordes, deja una estela de partículas inofensiva que dura 2 segundos y se destruye con un solo disparo (1000 puntos)
- **Escudo**: cada asteroide que choque contra el escudo se destruye sin otorgar puntos ni dividirse; la nave no recibe daño.
- **Skins de nave**: 4 estilos (Clásica, Neón, Espectro y Fénix) que se cambian con `S`; la elección se guarda en el navegador
