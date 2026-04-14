# ECU-01: Editor de Polígonos
## Descripción
Permite al administrador definir gráficamente las áreas de los lotes sobre el plano del fraccionamiento.

## Actores
- Administrador

## Flujo Principal
1. Administrador ingresa al detalle del Fraccionamiento.
2. Da clic en el botón "📐 Editor de Polígonos".
3. Selecciona un lote de la lista lateral.
4. Da clic en el mapa para dibujar los vértices del polígono.
5. Da clic en el primer punto para cerrar el polígono.
6. Confirma guardar cambios.

## EIU-01: Interfaz de Edición
- **Mapa**: Canvas SVG interactivo.
- **Lista de Lotes**: Panel lateral con estado de cada lote (Sin Polígono / Con Polígono).
- **Controles**: Botón "Guardar", "Cancelar", "Borrar".
