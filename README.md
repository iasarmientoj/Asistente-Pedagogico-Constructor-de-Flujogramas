# Asistente Pedagógico — Constructor de Flujogramas

Semillero de Investigación SIEPSI

Herramienta web para construir diagramas de flujo escribiendo el proceso como
una lista de pasos. La herramienta elige la forma de cada símbolo, los coloca y
traza las flechas.

Sin dependencias, sin servidor, sin build. Hermana del Constructor de
Mentefactos: comparte diseño, exportación y envoltorio de WordPress.

---

## Por qué no es un editor de diagramas

Un editor libre (arrastrar cajas y conectarlas) permite cometer justo los
errores que la guía del semillero advierte:

> «Las flechas deben unir **todos** los símbolos… **no deben quedar símbolos sin
> conectar ni flechas sin conexión**.»
> «Deben poder leerse **de arriba abajo y de izquierda a derecha**.»

Aquí esos dos errores **son imposibles por construcción**: el usuario nunca
dibuja ni conecta nada. Escribe el proceso; el motor calcula la posición de cada
símbolo y el trazado de las flechas.

| | |
|---|---|
| **Editor de esquema** | Una lista de pasos. Cada uno tiene su símbolo (Tabla 1 de la guía) y su texto. Se reordena, se inserta y se borra. |
| **Decisiones con ramas** | Al marcar un paso como *Decisión* se abren las ramas **Sí** y **No**, que son a su vez listas de pasos. Hasta 3 niveles de anidamiento. |
| **Fines alternativos** | El símbolo *Fin alternativo* cierra una rama sin volver al camino principal — «un mismo proceso puede tener varios fines», dice la guía. |
| **Dibujo automático** | Recursivo: cada bloque se mide antes de dibujarse, así las ramas nunca se solapan con lo que tienen al lado. |
| **Validador** | Avisa de rombos que no son preguntas, pasos que no empiezan por verbo, ramas vacías, símbolos sin texto y textos demasiado largos. |
| **Rúbrica automática** | Los tres criterios del semillero: secuencia lógica, uso de símbolos e información suficiente. |
| **Exportación** | PNG a doble resolución, PDF (elige hoja vertical u horizontal según la forma del diagrama), SVG y `.json` para retomar. |

---

## Los símbolos (Tabla 1 de la guía)

| Símbolo | Forma | Para qué |
|---|---|---|
| Inicio y fin | Óvalo | Puestos automáticamente. Todo diagrama empieza y termina con uno. |
| Proceso | Rectángulo | Una operación, actividad o tarea que produce un cambio. |
| Decisión | Rombo | Una pregunta que abre dos caminos. Dentro va la pregunta. |
| Entrada | Paralelogramo | Entrada de información necesaria para las actividades. |
| Salida | Rectángulo de base ondulada | Salida de información de una actividad. |
| Conector | Círculo | Conexión con otro proceso, actividad o página. |
| Fin alternativo | Óvalo | Cierra una rama sin volver al camino principal. |

Las flechas las traza siempre la herramienta.

---

## Estructura del proyecto

```
26.08.02 web flujograma/
├── index.html                      Cáscara para GitHub Pages (solo demo)
├── assets/
│   ├── flujograma.css              La herramienta (estilos)
│   ├── flujograma.js               La herramienta (lógica + motor SVG)
│   └── SIEPSI_LOGO_...webp         Logo, solo para la cabecera de la demo
├── wordpress/siepsi-flujograma/
│   └── siepsi-flujograma.php       Envoltorio de WordPress (shortcode)
├── construir-plugin.ps1            Empaqueta el plugin en un ZIP instalable
├── dist/                           ZIP generado (no se versiona)
└── README.md
```

Probar en local:

```bash
python -m http.server 8778
```

---

## Migrar a WordPress

Igual que el constructor de mentefactos:

```powershell
.\construir-plugin.ps1
```

**Plugins → Añadir nuevo → Subir plugin** → activar → crear la página y pegar:

```
[flujograma_siepsi]
```

Atributo `tema`: `siepsi` (azul de marca), `verde` (el verde de la Tabla 1) o
`contraste` (para imprimir en blanco y negro).

**No pongas un titular encima del shortcode.** La herramienta arranca con su
propia pantalla de bienvenida, que ya lleva el título y la descripción.

> Las dos herramientas pueden convivir en el mismo sitio: usan prefijos, ids y
> claves de almacenamiento distintos (`fj-` / `mf-`, `flujograma-app` /
> `mentefacto-app`). Lo que **no** deben compartir es la misma página: cada una
> ocupa el ancho completo.

---

## Google Analytics 4

Mismos principios que en mentefactos: `gtag` ya está en el sitio y `track()`
lleva guarda, así que en GitHub Pages no hace nada y en WordPress reporta solo.

| Evento | Cuándo | Parámetros |
|---|---|---|
| `fj_cargado` | La herramienta se monta (bienvenida) | `version` |
| `fj_iniciar` | Pulsa el botón de la bienvenida | `borrador` |
| `fj_inicio` | Escribe el nombre del proceso | — |
| `fj_paso` | Al salir de cada etapa | `paso`, `etapa`, `simbolos` |
| `fj_completo` | Tres o más símbolos, ninguno vacío | `simbolos` |
| `fj_exportar` | Cualquier descarga | `formato` |
| `fj_ejemplo` | Carga un ejemplo o el ejercicio | `tipo` |
| `fj_ampliar` | Abre la vista ampliada | — |
| `fj_abrir`, `fj_tema`, `fj_lead` | — | — |

Recuerda crear las **dimensiones personalizadas** para `formato`, `etapa` y
`simbolos`, o los parámetros no aparecerán en los informes.

---

## Decisiones técnicas

- **Disposición recursiva.** `medirBloque()` calcula cuánto ocupa cada bloque a
  izquierda y a derecha de su eje antes de dibujar nada. Una decisión separa sus
  ramas lo justo para que el borde de una no toque el rombo ni la otra rama.
  Por eso no hay solapes ni con tres niveles de anidamiento.
- **El PDF elige la orientación** según la forma del diagrama: los procesos
  lineales salen verticales y los muy ramificados, apaisados. El mentefacto es
  siempre apaisado.
- **Fuente Arial/Helvetica en el SVG**, para que el archivo exportado se vea
  igual en cualquier computador. La interfaz sí usa Lato y Raleway.
- **Todo con esquinas rectas**, como el resto del sitio.

---

## Límites conocidos

1. **Sin retornos.** El flujo siempre avanza hacia abajo; no se puede volver a
   un paso anterior. La guía del semillero **no describe retornos** y sus
   figuras tampoco los usan, así que no es una carencia frente al material.
   Si algún día hicieran falta, el símbolo *Conector* sirve de salida.
2. **Decisiones de dos salidas.** No hay ramas triples.
3. **Máximo 40 símbolos y 3 niveles** de decisión anidada, por legibilidad.
4. **Sin carriles por responsable.** La guía menciona «agentes y sus
   responsabilidades»; hoy se representan con símbolos de *Entrada*, no con
   carriles.
5. **El validador no entiende el contenido.** Comprueba la forma (pregunta,
   verbo, longitud, ramas), no si el proceso descrito tiene sentido.

---

## Pendiente de material del semillero

- Ya está puesta la URL real del blog:
  `/herramientas-academicas/diagrama-de-flujo-o-flujograma/`.
- La **solución del ejercicio** está hoy en un enlace de Miro que exige cuenta y
  puede caducar. Si se pasa el contenido, se carga como ejemplo dentro de la
  herramienta y el ejercicio deja de depender de un servicio externo.

---

Semillero de Investigación SIEPSI · <https://siepsi.com.co>
