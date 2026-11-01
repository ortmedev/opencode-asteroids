---
description: Crea un worktree en .worktrees/<nombre> a partir del argumento
---

Crea un git worktree. No hagas nada más.

1. Toma el argumento recibido: $ARGUMENTS
2. Normalízalo a un nombre válido de carpeta y rama (slug):
   - minúsculas y sin tildes/acentos
   - espacios y caracteres inválidos en ramas (`~ ^ : ? * [ \ /`) → `-`
   - colapsa guiones repetidos y recorta guiones al inicio/fin
   - si queda vacío, no ejecutes nada y pide un nombre
3. Ejecuta exactamente este comando, desde el directorio actual, sin cambiar de directorio:

   git worktree add .worktrees/<nombre>

4. Devuelve la salida de git tal cual.

Prohibido: mover la sesión o el directorio, abrir/dirigirte al worktree creado, editar archivos, hacer commits, fetches, push ni cualquier otro comando.
