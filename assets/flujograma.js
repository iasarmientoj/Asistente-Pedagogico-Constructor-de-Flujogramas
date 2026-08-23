/*!
 * Asistente Pedagogico - Constructor de Flujogramas
 * Semillero de Investigacion SIEPSI - Version 1.0.0
 *
 * REGLAS DE PORTABILIDAD (las mismas del constructor de mentefactos)
 *  1. Todo el codigo vive dentro de esta funcion anonima. Cero variables globales.
 *  2. Toda la interfaz se dibuja dentro de #flujograma-app. No se toca nada de fuera.
 *  3. Ningun recurso externo: sin CDN, sin fuentes remotas, sin peticiones de red.
 *  4. track() tiene guarda: si gtag no existe (GitHub Pages) no hace nada y no falla.
 */
(function () {
  'use strict';

  /* ==========================================================================
     1. CONFIGURACION
     ========================================================================== */

  var VERSION = '1.0.0';
  var RAIZ_ID = 'flujograma-app';
  var LS_KEY = 'siepsi_flujograma_v1';
  var URL_BLOG = 'https://siepsi.com.co/herramientas-academicas/diagrama-de-flujo-o-flujograma/';
  var CREDITO = 'Creado con el Asistente Pedagógico de Flujogramas · Semillero de Investigación SIEPSI · siepsi.com.co';

  var MAX_PASOS = 40;      /* tope total de simbolos, por legibilidad */
  var MAX_PROF = 3;        /* niveles de decision anidada */

  /* Simbolos de la Tabla 1 de la guia del semillero. La forma es la que carga
     el significado; el color solo distingue los extremos del proceso. */
  var TIPOS = {
    proceso: {
      nom: 'Proceso', forma: 'rect',
      ayuda: 'Una operación, actividad o tarea que produce un cambio dentro del proceso.'
    },
    decision: {
      nom: 'Decisión', forma: 'rombo',
      ayuda: 'Una pregunta que abre dos caminos. Dentro del rombo se escribe la pregunta.'
    },
    entrada: {
      nom: 'Entrada', forma: 'parale',
      ayuda: 'Entrada de información adicional necesaria para realizar las actividades.'
    },
    salida: {
      nom: 'Salida', forma: 'onda',
      ayuda: 'Salida de información de cualquier actividad del proceso.'
    },
    conector: {
      nom: 'Conector', forma: 'circulo',
      ayuda: 'Conexión con otro proceso, otra actividad o incluso otra página.'
    },
    fin: {
      nom: 'Fin alternativo', forma: 'ovalo',
      ayuda: 'Cierra esta rama sin volver al camino principal. Un proceso puede tener varios fines.'
    }
  };

  var TEMAS = {
    siepsi: {
      nom: 'SIEPSI', fondo: '#ffffff',
      relleno: '#09364d', texto: '#ffffff', borde: '#09364d',
      term: '#7ac142', termTxt: '#09364d', termBorde: '#5c9a2e',
      rombo: '#17546b', romboTxt: '#ffffff', romboBorde: '#17546b',
      linea: '#09364d', etiqueta: '#5c9a2e', titulo: '#09364d', pie: '#8fa3ac'
    },
    verde: {
      nom: 'Verde guía', fondo: '#ffffff',
      relleno: '#22a05a', texto: '#ffffff', borde: '#1b7f47',
      term: '#22a05a', termTxt: '#ffffff', termBorde: '#1b7f47',
      rombo: '#22a05a', romboTxt: '#ffffff', romboBorde: '#1b7f47',
      linea: '#1b7f47', etiqueta: '#1b7f47', titulo: '#155c34', pie: '#9ec3ad'
    },
    contraste: {
      nom: 'Alto contraste', fondo: '#ffffff',
      relleno: '#ffffff', texto: '#000000', borde: '#000000',
      term: '#ffffff', termTxt: '#000000', termBorde: '#000000',
      rombo: '#ffffff', romboTxt: '#000000', romboBorde: '#000000',
      linea: '#000000', etiqueta: '#000000', titulo: '#000000', pie: '#555555'
    }
  };

  /* Terminaciones de infinitivo: un paso de proceso describe una accion. */
  var VERBO = /(ar|er|ir|arse|erse|irse)$/i;

  var PASOS = [
    {
      id: 'proceso', nom: 'El proceso', tit: 'Qué proceso vas a representar', tipo: 'proceso',
      ayuda: 'Un flujograma representa <b>un proceso</b>: una secuencia con un principio y un final claros. Antes de listar los pasos, define de qué proceso se trata y dónde empieza y dónde termina.'
    },
    {
      id: 'pasos', nom: 'Los pasos', tit: 'Actividades y decisiones', tipo: 'pasos',
      ayuda: 'Enlista las actividades en orden. Cuando el proceso se bifurque, marca ese paso como <b>Decisión</b> y escribe la pregunta: se abrirán las dos ramas. Las flechas y la posición de cada símbolo las calcula la herramienta.'
    },
    { id: 'rev', nom: 'Revisión', tit: 'Revisión y descarga', tipo: 'revision' }
  ];

  var EJEMPLOS = {
    guia: {
      nom: 'Elaborar un diagrama de flujo',
      desc: 'El ejemplo publicado en la guía del semillero.',
      /* Transcrito de la figura de la guía. Cada verificación deja la rama «Sí»
         vacía —es decir, sigue por el eje— y manda la corrección por «No». */
      datos: {
        titulo: 'Elaborar un diagrama de flujo', autor: '',
        inicio: 'Elaborar un diagrama de flujo', fin: 'Diagrama de flujo completado',
        pasos: [
          { t: 'decision', x: '¿Se cuenta con toda la información necesaria para hacer el diagrama?',
            si: [], no: [{ t: 'proceso', x: 'Listar la información que se tiene y la que falta' }] },
          { t: 'proceso', x: 'Organizar la información sobre el proceso según sus fases' },
          { t: 'decision', x: '¿Se tienen establecidos los símbolos que se usarán?',
            si: [], no: [{ t: 'proceso', x: 'Remitirse a la tabla de símbolos' }] },
          { t: 'proceso', x: 'Organizar la información resumida en los diferentes símbolos' },
          { t: 'decision', x: '¿Se ubicaron el inicio y el fin en óvalos?',
            si: [], no: [{ t: 'proceso', x: 'Utilizar óvalos para el inicio y el fin' }] },
          { t: 'decision', x: '¿Se plantearon las fases en forma de cuadro?',
            si: [], no: [{ t: 'proceso', x: 'Organizar los pasos del proceso en cuadros' }] },
          { t: 'decision', x: '¿Se plantearon las decisiones en forma de rombo?',
            si: [], no: [{ t: 'proceso', x: 'Utilizar rombos para las decisiones' }] },
          { t: 'decision', x: '¿Se utilizaron flechas para representar la dirección?',
            si: [], no: [{ t: 'proceso', x: 'Unir las formas con flechas' }] },
          { t: 'decision', x: '¿La información dentro de las formas es concisa pero suficiente?',
            si: [], no: [{ t: 'proceso', x: 'Añadir información corta pero suficiente' }] },
          { t: 'decision', x: '¿Se revisó que no quedaran formas desconectadas?',
            si: [], no: [{ t: 'proceso', x: 'Unir las formas que quedaron sueltas' }] }
        ]
      }
    },
    prueba: {
      nom: 'Aplicación de una prueba psicométrica',
      desc: 'Un caso corto con dos decisiones y un fin alternativo.',
      datos: {
        titulo: 'Aplicación de una prueba psicométrica', autor: '',
        inicio: 'Inicio', fin: 'Fin',
        pasos: [
          { t: 'proceso', x: 'Revisar el motivo de consulta' },
          { t: 'entrada', x: 'Historia clínica' },
          { t: 'decision', x: '¿El consultante firma el consentimiento?',
            si: [{ t: 'proceso', x: 'Aplicar la prueba' }],
            no: [{ t: 'fin', x: 'Cierre sin evaluación' }] },
          { t: 'proceso', x: 'Calificar los protocolos' },
          { t: 'decision', x: '¿Los resultados son válidos?',
            si: [{ t: 'proceso', x: 'Interpretar los puntajes' }],
            no: [{ t: 'proceso', x: 'Repetir la aplicación' }] },
          { t: 'salida', x: 'Informe psicológico' }
        ]
      }
    },
    afe: {
      nom: 'Ejercicio práctico: Análisis Factorial Exploratorio',
      desc: 'El ejercicio de la guía. Se carga vacío para que lo resuelvas tú.',
      lectura: true,
      datos: {
        titulo: 'Análisis Factorial Exploratorio', autor: '',
        inicio: 'Inicio', fin: 'Fin',
        pasos: [{ t: 'proceso', x: '' }, { t: 'proceso', x: '' }, { t: 'decision', x: '', si: [], no: [] }]
      }
    }
  };

  /* ==========================================================================
     2. UTILIDADES
     ========================================================================== */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function palabras(t) {
    return String(t == null ? '' : t).trim().split(/\s+/).filter(Boolean);
  }

  function norm(t) {
    var s = String(t == null ? '' : t).toLowerCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.replace(/\s+/g, ' ').trim();
  }

  function slug(t) {
    var s = norm(t).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return s || 'flujograma';
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var a = arguments, c = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(c, a); }, ms);
    };
  }

  function track(evento, params) {
    try {
      if (typeof window.gtag === 'function') window.gtag('event', evento, params || {});
    } catch (e) { /* nunca romper la herramienta por analitica */ }
  }

  /* ==========================================================================
     3. ESTADO
     ========================================================================== */

  function nodo(t, x) {
    var n = { t: t || 'proceso', x: x || '' };
    if (n.t === 'decision') { n.si = []; n.no = []; }
    return n;
  }

  function estadoVacio() {
    return {
      v: VERSION, titulo: '', autor: '',
      inicio: 'Inicio', fin: 'Fin',
      pasos: [nodo('proceso', ''), nodo('proceso', '')],
      tema: 'siepsi'
    };
  }

  var S = estadoVacio();
  var pasoActual = 0;
  var vista = 'bienvenida';
  var avisoPendiente = null;
  var yaContado = {};
  var raiz = null;
  var ultimoSVG = { W: 600, H: 400 };

  /* Rutas: '0', '2.si.1', '2.no.0.si.0'. Impares = rama, pares = indice. */
  function listaEn(ruta) {
    if (!ruta) return S.pasos;
    var partes = ruta.split('.'), arr = S.pasos;
    for (var i = 0; i < partes.length; i += 2) {
      var n = arr[parseInt(partes[i], 10)];
      if (!n) return [];
      arr = n[partes[i + 1]] || [];
    }
    return arr;
  }

  function resolver(ruta) {
    var partes = ruta.split('.'), arr = S.pasos;
    for (var i = 0; i < partes.length - 1; i += 2) {
      var n = arr[parseInt(partes[i], 10)];
      if (!n) return null;
      arr = n[partes[i + 1]] || [];
    }
    return { arr: arr, idx: parseInt(partes[partes.length - 1], 10) };
  }

  function nodoEn(ruta) {
    var r = resolver(ruta);
    return r && r.arr ? r.arr[r.idx] : null;
  }

  function profundidadDe(ruta) {
    return ruta ? Math.floor(ruta.split('.').length / 2) : 0;
  }

  function recorrer(lista, fn, ruta, prof) {
    lista = lista || [];
    ruta = ruta || '';
    prof = prof || 0;
    lista.forEach(function (n, i) {
      var r = ruta ? ruta + '.' + i : String(i);
      fn(n, r, prof);
      if (n.t === 'decision') {
        recorrer(n.si, fn, r + '.si', prof + 1);
        recorrer(n.no, fn, r + '.no', prof + 1);
      }
    });
  }

  function contarPasos() {
    var n = 0;
    recorrer(S.pasos, function () { n++; });
    return n;
  }

  function guardar() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {}
  }

  function recuperar() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function limpiarArbol(lista, prof) {
    if (!Array.isArray(lista)) return [];
    prof = prof || 0;
    return lista.slice(0, MAX_PASOS).map(function (n) {
      if (!n || typeof n !== 'object') return nodo('proceso', '');
      var t = TIPOS[n.t] ? n.t : 'proceso';
      var m = { t: t, x: String(n.x || '') };
      if (t === 'decision') {
        m.si = prof < MAX_PROF ? limpiarArbol(n.si, prof + 1) : [];
        m.no = prof < MAX_PROF ? limpiarArbol(n.no, prof + 1) : [];
      }
      return m;
    });
  }

  function aplicar(datos) {
    var base = estadoVacio();
    ['titulo', 'autor', 'inicio', 'fin', 'tema'].forEach(function (k) {
      if (typeof datos[k] === 'string' && datos[k]) base[k] = datos[k];
    });
    if (Array.isArray(datos.pasos)) base.pasos = limpiarArbol(datos.pasos);
    if (!base.pasos.length) base.pasos = [nodo('proceso', '')];
    if (!TEMAS[base.tema]) base.tema = 'siepsi';
    S = base;
  }

  function hayContenido() {
    if (S.titulo.trim()) return true;
    var hay = false;
    recorrer(S.pasos, function (n) { if (n.x.trim()) hay = true; });
    return hay;
  }

  function estaCompleto() {
    var llenos = 0, vacios = 0;
    recorrer(S.pasos, function (n) { if (n.x.trim()) llenos++; else vacios++; });
    return llenos >= 3 && vacios === 0;
  }

  /* ==========================================================================
     4. VALIDADOR PEDAGOGICO
     ========================================================================== */

  function esPregunta(t) {
    var s = t.trim();
    return /\?$/.test(s) || /^¿/.test(s);
  }

  function empiezaConVerbo(t) {
    var p = palabras(t);
    if (!p.length) return true;
    var w = p[0];
    return w.length > 3 && VERBO.test(w);
  }

  function avisosNodo(n) {
    var a = [], p = palabras(n.x);

    if (!p.length) {
      a.push('Escribe el texto de este símbolo.');
      return a;
    }
    if (p.length > (n.t === 'decision' ? 12 : 8)) {
      a.push('No escribas párrafos: el texto debe ser corto y suficiente.');
    }
    if (n.t === 'decision') {
      if (!esPregunta(n.x)) a.push('Dentro del rombo va una pregunta. Ciérrala con «?».');
      if (!(n.si || []).length && !(n.no || []).length) {
        a.push('Define qué ocurre al menos en una de las dos respuestas.');
      }
    } else if (n.t === 'proceso') {
      if (!empiezaConVerbo(n.x)) {
        a.push('Empieza con un verbo en infinitivo: aplicar, registrar, verificar…');
      }
      if (esPregunta(n.x)) {
        a.push('Esto es una pregunta: cámbialo al símbolo Decisión.');
      }
    }
    return a;
  }

  /* Rubrica del semillero: Secuencia lógica / Uso de símbolos / Suficiencia. */
  function evaluar() {
    var sug = [];
    var total = 0, vacios = 0, decisiones = 0, ramasVacias = 0, largos = 0,
      cortos = 0, sinVerbo = 0, decSinPregunta = 0, tipos = {}, palabrasTot = 0,
      finesAlternativos = 0;

    recorrer(S.pasos, function (n) {
      total++;
      tipos[n.t] = (tipos[n.t] || 0) + 1;
      var p = palabras(n.x);
      palabrasTot += p.length;
      if (!p.length) { vacios++; return; }
      if (p.length > (n.t === 'decision' ? 12 : 8)) largos++;
      if (p.length < 2 && n.t !== 'conector' && n.t !== 'fin') cortos++;
      if (n.t === 'fin') finesAlternativos++;
      if (n.t === 'decision') {
        decisiones++;
        if (!esPregunta(n.x)) decSinPregunta++;
        if (!(n.si || []).length && !(n.no || []).length) ramasVacias++;
      } else if (n.t === 'proceso' && !empiezaConVerbo(n.x)) {
        sinVerbo++;
      }
    });

    /* --- Criterio 1: secuencia lógica de pasos, actividades y decisiones --- */
    var sec = 0;
    sec += 20;                                   /* inicio y fin: por construcción */
    if (total >= 4) sec += 25;
    else if (total >= 2) { sec += 14; sug.push(['secuencia', 'El proceso tiene ' + total + ' símbolo(s). Un flujograma útil suele tener al menos cuatro.']); }
    else sug.push(['secuencia', 'Añade más pasos: con uno solo no hay proceso que representar.']);

    if (decisiones >= 1) sec += 30;
    else sug.push(['secuencia', 'No hay ninguna decisión. Un flujograma se usa justamente para mostrar los puntos donde el proceso se bifurca; si el tuyo no tiene ninguno, revisa si de verdad necesitas un diagrama.']);

    if (!ramasVacias) sec += 15;
    else sug.push(['secuencia', ramasVacias + ' decisión(es) no llevan a ninguna parte: sus dos respuestas están vacías. Define al menos una.']);

    if (!vacios) sec += 10;
    else sug.push(['secuencia', 'Hay ' + vacios + ' símbolo(s) sin texto. Un símbolo vacío rompe la lectura del proceso.']);

    /* --- Criterio 2: uso adecuado de los símbolos ------------------------- */
    var sim = 100;
    if (decSinPregunta) {
      sim -= decSinPregunta * 15;
      sug.push(['simbolos', decSinPregunta + ' rombo(s) no están redactados como pregunta. Según la guía, dentro del rombo se escribe la pregunta que permite tomar la decisión.']);
    }
    if (sinVerbo) {
      sim -= sinVerbo * 8;
      sug.push(['simbolos', sinVerbo + ' rectángulo(s) no empiezan con un verbo. Un proceso describe una acción: «aplicar», «registrar», «verificar».']);
    }
    if (total >= 4 && !decisiones) {
      sim -= 20;
      sug.push(['simbolos', 'Solo usaste símbolos de un tipo. Revisa la Tabla 1: entradas, salidas y decisiones enriquecen la representación.']);
    }
    sim = Math.max(0, Math.min(100, sim));

    /* --- Criterio 3: información suficiente para comprender el proceso ---- */
    var inf = 100;
    var prom = total ? palabrasTot / total : 0;
    if (vacios) inf -= vacios * 12;
    if (largos) {
      inf -= largos * 8;
      sug.push(['informacion', largos + ' símbolo(s) tienen texto demasiado largo. Debe ser corto, conciso y suficiente.']);
    }
    if (cortos) {
      inf -= cortos * 8;
      sug.push(['informacion', cortos + ' símbolo(s) tienen una sola palabra. Suele quedarse corto para entender qué ocurre ahí.']);
    }
    if (total && prom < 2) {
      inf -= 10;
      sug.push(['informacion', 'El promedio es de ' + prom.toFixed(1) + ' palabras por símbolo. Con tan poco texto el diagrama no se entiende sin explicación oral.']);
    }
    if (total > 25) {
      inf -= 10;
      sug.push(['informacion', 'Hay ' + total + ' símbolos. Por encima de 25 conviene partir el proceso y usar conectores.']);
    }
    inf = Math.max(0, Math.min(100, inf));

    if (sec < 60) { sim = Math.round(sim * sec / 100); inf = Math.round(inf * sec / 100); }

    var tot = Math.round((sec + sim + inf) / 3);
    var nivel = tot >= 90 ? 'Excelente' : tot >= 75 ? 'Bueno' : tot >= 50 ? 'Aceptable' : 'En construcción';
    return { secuencia: sec, simbolos: sim, informacion: inf, total: tot, nivel: nivel, sugerencias: sug };
  }

  /* ==========================================================================
     5. MOTOR DE DIBUJO (SVG)
     ==========================================================================
     La disposicion es recursiva. Cada bloque se mide antes de dibujarse y
     devuelve cuanto ocupa a izquierda y a derecha de su eje vertical; asi las
     ramas de una decision nunca se solapan con lo que tienen al lado. */

  var FUENTE = 'Arial, \'Helvetica Neue\', Helvetica, sans-serif';
  var _medidor = null;

  function medir(txt, size, peso) {
    if (!_medidor) _medidor = document.createElement('canvas').getContext('2d');
    _medidor.font = (peso || 400) + ' ' + size + 'px ' + FUENTE;
    return _medidor.measureText(String(txt)).width;
  }

  function envolver(txt, maxW, size, peso, maxLineas) {
    maxLineas = maxLineas || 4;
    var ps = palabras(txt), lineas = [], actual = '';
    for (var i = 0; i < ps.length; i++) {
      var w = ps[i];
      if (medir(w, size, peso) > maxW) {
        if (actual) { lineas.push(actual); actual = ''; }
        var trozo = '';
        for (var j = 0; j < w.length; j++) {
          if (medir(trozo + w[j], size, peso) > maxW && trozo) { lineas.push(trozo); trozo = ''; }
          trozo += w[j];
        }
        actual = trozo;
        continue;
      }
      var prueba = actual ? actual + ' ' + w : w;
      if (medir(prueba, size, peso) <= maxW || !actual) actual = prueba;
      else { lineas.push(actual); actual = w; }
    }
    if (actual) lineas.push(actual);
    if (lineas.length > maxLineas) {
      lineas = lineas.slice(0, maxLineas);
      lineas[maxLineas - 1] = lineas[maxLineas - 1].replace(/.{3}$/, '…');
    }
    return lineas.length ? lineas : [''];
  }

  /* --- Medidas base --------------------------------------------------------- */
  var W_CAJA = 196, W_ROMBO = 236, W_TERM = 150;
  var PAD_Y = 12, FS = 13, LH = 1.3;
  var GAP_V = 44;        /* espacio vertical entre simbolos (cabe la flecha) */
  var GAP_RAMA = 34;     /* holgura horizontal entre el rombo y sus ramas */
  var GAP_UNION = 34;    /* tramo final donde las ramas vuelven al eje */

  function anchoDe(t) {
    if (t === 'decision') return W_ROMBO;
    if (t === 'fin' || t === 'inicio') return W_TERM;
    if (t === 'conector') return 74;
    return W_CAJA;
  }

  function medirNodo(n) {
    var w = anchoDe(n.t);
    var interior = n.t === 'decision' ? w - 76 : n.t === 'conector' ? w - 18 : w - 26;
    var ln = envolver(n.x || TIPOS[n.t].nom, interior, FS, 600, n.t === 'conector' ? 2 : 4);
    var alto = ln.length * FS * LH + PAD_Y * 2;
    if (n.t === 'decision') alto += 26;
    if (n.t === 'conector') alto = Math.max(alto, 60);
    alto = Math.max(alto, 50);
    return { w: w, h: alto, ln: ln };
  }

  /* Devuelve {alto, izq, der} de una secuencia completa. */
  function medirSec(lista) {
    if (!lista || !lista.length) return { alto: 0, izq: 0, der: 0, bloques: [] };
    var alto = 0, izq = 0, der = 0, bloques = [];
    lista.forEach(function (n, i) {
      var b = medirBloque(n);
      bloques.push(b);
      alto += b.alto;
      if (i < lista.length - 1) alto += GAP_V;
      izq = Math.max(izq, b.izq);
      der = Math.max(der, b.der);
    });
    return { alto: alto, izq: izq, der: der, bloques: bloques };
  }

  function medirBloque(n) {
    var m = medirNodo(n);
    if (n.t !== 'decision') {
      return { tipo: 'simple', n: n, m: m, alto: m.h, izq: m.w / 2, der: m.w / 2 };
    }
    var mSi = medirSec(n.si), mNo = medirSec(n.no);
    var vacSi = !(n.si || []).length, vacNo = !(n.no || []).length;

    /* Convencion del ejemplo de la guia: la respuesta que continua el proceso
       baja por el eje y la que se desvia sale a un lado. Si una rama esta
       vacia significa justamente «sigue derecho», asi que no se desvia. */
    var ambasVacias = vacSi && vacNo;
    var rectoSi = ambasVacias || (vacSi && !vacNo);
    var rectoNo = !ambasVacias && vacNo && !vacSi;

    var sepIzq = (rectoSi || ambasVacias) ? 0 : m.w / 2 + GAP_RAMA + (mSi.der || 30);
    var sepDer = (rectoNo || ambasVacias) ? 0 : m.w / 2 + GAP_RAMA + (mNo.izq || 30);
    var altoRamas = Math.max(mSi.alto, mNo.alto);
    return {
      tipo: 'decision', n: n, m: m,
      mSi: mSi, mNo: mNo, sepIzq: sepIzq, sepDer: sepDer, altoRamas: altoRamas,
      rectoSi: rectoSi, rectoNo: rectoNo, ambasVacias: ambasVacias,
      alto: ambasVacias ? m.h : m.h + GAP_V + altoRamas + GAP_UNION,
      izq: (rectoSi || ambasVacias) ? m.w / 2 : Math.max(m.w / 2, sepIzq + (mSi.izq || 20)),
      der: (rectoNo || ambasVacias) ? m.w / 2 : Math.max(m.w / 2, sepDer + (mNo.der || 20))
    };
  }

  /* --- Formas --------------------------------------------------------------- */

  function texto(cx, cy, ln, T, color, size) {
    size = size || FS;
    var lh = size * LH;
    var y0 = cy - (ln.length - 1) * lh / 2 + size * 0.35;
    var s = '';
    for (var i = 0; i < ln.length; i++) {
      s += '<text x="' + cx.toFixed(1) + '" y="' + (y0 + i * lh).toFixed(1) +
        '" text-anchor="middle" font-family="' + FUENTE + '" font-size="' + size +
        '" font-weight="600" fill="' + color + '">' + esc(ln[i]) + '</text>';
    }
    return s;
  }

  function forma(t, x, y, w, h, T) {
    var relleno = T.relleno, borde = T.borde;
    if (t === 'decision') { relleno = T.rombo; borde = T.romboBorde; }
    if (t === 'fin' || t === 'inicio') { relleno = T.term; borde = T.termBorde; }
    var a = ' fill="' + relleno + '" stroke="' + borde + '" stroke-width="1.8"';
    var cx = x + w / 2, cy = y + h / 2;

    switch (t) {
      case 'inicio':
      case 'fin':
        return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (w / 2) + '" ry="' + (h / 2) + '"' + a + '/>';
      case 'decision':
        return '<path d="M' + cx + ' ' + y + ' L' + (x + w) + ' ' + cy + ' L' + cx + ' ' + (y + h) + ' L' + x + ' ' + cy + ' Z"' + a + '/>';
      case 'entrada':
        var sesgo = 18;
        return '<path d="M' + (x + sesgo) + ' ' + y + ' H' + (x + w) + ' L' + (x + w - sesgo) + ' ' + (y + h) + ' H' + x + ' Z"' + a + '/>';
      case 'salida':
        var o = 9;
        return '<path d="M' + x + ' ' + y + ' H' + (x + w) + ' V' + (y + h - o) +
          ' C' + (x + w * 0.75) + ' ' + (y + h + o) + ' ' + (x + w * 0.25) + ' ' + (y + h - o * 2.2) + ' ' + x + ' ' + (y + h) + ' Z"' + a + '/>';
      case 'conector':
        return '<circle cx="' + cx + '" cy="' + cy + '" r="' + Math.min(w, h) / 2 + '"' + a + '/>';
      default:
        return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + a + '/>';
    }
  }

  function colorTexto(t, T) {
    if (t === 'decision') return T.romboTxt;
    if (t === 'fin' || t === 'inicio') return T.termTxt;
    return T.texto;
  }

  function linea(x1, y1, x2, y2, T, flecha) {
    return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) +
      '" y2="' + y2.toFixed(1) + '" stroke="' + T.linea + '" stroke-width="1.8" stroke-linecap="square"' +
      (flecha ? ' marker-end="url(#fjPunta)"' : '') + '/>';
  }

  function etiqueta(x, y, txt, T) {
    return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="middle" font-family="' + FUENTE +
      '" font-size="11" font-weight="700" fill="' + T.etiqueta + '">' + esc(txt) + '</text>';
  }

  /* --- Emision -------------------------------------------------------------- */

  var _g = '', _minX = 0, _maxX = 0, _T = null;

  function marcaX(x) {
    if (x < _minX) _minX = x;
    if (x > _maxX) _maxX = x;
  }

  /* Dibuja una secuencia con su eje en cx empezando en y.
     Devuelve {yFin, cortado} — cortado = la rama acaba en un fin alternativo. */
  function emitirSec(lista, med, cx, y) {
    if (!lista || !lista.length) return { yFin: y, cortado: false };
    var yy = y, cortado = false;
    for (var i = 0; i < lista.length; i++) {
      var b = med.bloques[i];
      var res = emitirBloque(b, cx, yy);
      yy = res.yFin;
      if (res.cortado) { cortado = true; break; }
      if (i < lista.length - 1) {
        _g += linea(cx, yy, cx, yy + GAP_V, _T, true);
        yy += GAP_V;
      }
    }
    return { yFin: yy, cortado: cortado };
  }

  function emitirBloque(b, cx, y) {
    var m = b.m;

    if (b.tipo === 'simple') {
      _g += forma(b.n.t, cx - m.w / 2, y, m.w, m.h, _T);
      _g += texto(cx, y + m.h / 2, m.ln, _T, colorTexto(b.n.t, _T));
      marcaX(cx - m.w / 2); marcaX(cx + m.w / 2);
      return { yFin: y + m.h, cortado: b.n.t === 'fin' };
    }

    /* Decisión */
    _g += forma('decision', cx - m.w / 2, y, m.w, m.h, _T);
    _g += texto(cx, y + m.h / 2, m.ln, _T, _T.romboTxt);
    marcaX(cx - m.w / 2); marcaX(cx + m.w / 2);

    var cyR = y + m.h / 2;
    var yRamas = y + m.h + GAP_V;
    var yUnion = y + b.alto;
    var xSi = b.rectoSi ? cx : cx - b.sepIzq;
    var xNo = b.rectoNo ? cx : cx + b.sepDer;

    /* Sin ninguna rama definida, el rombo se comporta como un simbolo mas de
       la secuencia: la flecha normal al siguiente paso ya lo conecta. */
    if (b.ambasVacias) return { yFin: y + m.h, cortado: false };

    {
      if (b.rectoSi) {
        _g += linea(cx, y + m.h, cx, yRamas, _T, false);
        _g += etiqueta(cx + 16, y + m.h + 18, 'Sí', _T);
      } else {
        _g += linea(cx - m.w / 2, cyR, xSi, cyR, _T, false);
        _g += linea(xSi, cyR, xSi, yRamas, _T, true);
        _g += etiqueta((cx - m.w / 2 + xSi) / 2, cyR - 8, 'Sí', _T);
      }
      if (b.rectoNo) {
        _g += linea(cx, y + m.h, cx, yRamas, _T, false);
        _g += etiqueta(cx + 16, y + m.h + 18, 'No', _T);
      } else {
        _g += linea(cx + m.w / 2, cyR, xNo, cyR, _T, false);
        _g += linea(xNo, cyR, xNo, yRamas, _T, true);
        _g += etiqueta((cx + m.w / 2 + xNo) / 2, cyR - 8, 'No', _T);
      }
    }

    marcaX(xSi); marcaX(xNo);

    var rSi = emitirSec(b.n.si, b.mSi, xSi, yRamas);
    var rNo = emitirSec(b.n.no, b.mNo, xNo, yRamas);

    /* vuelta al eje: solo las ramas que no terminaron en un fin alternativo.
       El tramo horizontal se omite cuando la rama ya baja por el propio eje,
       porque seria una linea de longitud cero. */
    if (!rSi.cortado) {
      _g += linea(xSi, rSi.yFin, xSi, yUnion, _T, false);
      if (Math.abs(xSi - cx) > 0.5) _g += linea(xSi, yUnion, cx, yUnion, _T, false);
    }
    if (!rNo.cortado) {
      _g += linea(xNo, rNo.yFin, xNo, yUnion, _T, false);
      if (Math.abs(xNo - cx) > 0.5) _g += linea(xNo, yUnion, cx, yUnion, _T, false);
    }

    return { yFin: yUnion, cortado: rSi.cortado && rNo.cortado };
  }

  function construirSVG() {
    var T = TEMAS[S.tema] || TEMAS.siepsi;
    _T = T; _g = ''; _minX = 0; _maxX = 0;

    var nIni = { t: 'inicio', x: S.inicio.trim() || 'Inicio' };
    var nFin = { t: 'fin', x: S.fin.trim() || 'Fin' };
    var mIni = medirNodo(nIni), mFin = medirNodo(nFin);
    var med = medirSec(S.pasos);

    var cx = 0;   /* eje provisional; se recentra al final */
    var y = 0;

    _g += forma('inicio', cx - mIni.w / 2, y, mIni.w, mIni.h, T);
    _g += texto(cx, y + mIni.h / 2, mIni.ln, T, T.termTxt);
    marcaX(cx - mIni.w / 2); marcaX(cx + mIni.w / 2);
    y += mIni.h;

    var cerrado = false;
    if (S.pasos.length) {
      _g += linea(cx, y, cx, y + GAP_V, T, true);
      y += GAP_V;
      var r = emitirSec(S.pasos, med, cx, y);
      y = r.yFin;
      cerrado = r.cortado;
    }

    if (!cerrado) {
      _g += linea(cx, y, cx, y + GAP_V, T, true);
      y += GAP_V;
      _g += forma('fin', cx - mFin.w / 2, y, mFin.w, mFin.h, T);
      _g += texto(cx, y + mFin.h / 2, mFin.ln, T, T.termTxt);
      marcaX(cx - mFin.w / 2); marcaX(cx + mFin.w / 2);
      y += mFin.h;
    }

    /* --- Encuadre ------------------------------------------------------- */
    var M = 44;
    var tit = S.titulo.trim(), aut = S.autor.trim();
    var arriba = 26;
    if (tit) arriba += 34;
    if (aut) arriba += 22;

    var despX = M - _minX;
    var W = Math.round((_maxX - _minX) + M * 2);
    var H = Math.round(y + arriba + M + 22);
    var cabX = W / 2;

    var cab = '';
    var yc = 26;
    if (tit) {
      cab += '<text x="' + cabX + '" y="' + (yc + 18) + '" text-anchor="middle" font-family="' + FUENTE +
        '" font-size="22" font-weight="700" fill="' + T.titulo + '">' + esc(tit) + '</text>';
      yc += 34;
    }
    if (aut) {
      cab += '<text x="' + cabX + '" y="' + (yc + 12) + '" text-anchor="middle" font-family="' + FUENTE +
        '" font-size="12" fill="' + T.pie + '">' + esc(aut) + '</text>';
    }

    var pie = '<text x="' + cabX + '" y="' + (H - 12) + '" text-anchor="middle" font-family="' + FUENTE +
      '" font-size="10" fill="' + T.pie + '">' + esc(CREDITO) + '</text>';

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H +
      '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Diagrama de flujo' +
      (tit ? ' de ' + esc(tit) : '') + '">' +
      '<defs><marker id="fjPunta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto">' +
      '<path d="M0,1 L9,5 L0,9 z" fill="' + T.linea + '"/></marker></defs>' +
      '<rect width="100%" height="100%" fill="' + T.fondo + '"/>' + cab +
      '<g transform="translate(' + despX.toFixed(1) + ',' + arriba + ')">' + _g + '</g>' + pie + '</svg>';

    ultimoSVG = { W: W, H: H };
    return svg;
  }

  /* ==========================================================================
     6. EXPORTACION
     ========================================================================== */

  function nombreArchivo() { return 'flujograma-' + slug(S.titulo || 'sin-titulo'); }

  function descargarBlob(blob, nombre) {
    var u = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = u; a.download = nombre;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(u); a.parentNode && a.parentNode.removeChild(a); }, 1000);
  }

  function exportarPNG(escala) {
    escala = escala || 2;
    var svg = construirSVG();
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas');
      c.width = Math.round(ultimoSVG.W * escala);
      c.height = Math.round(ultimoSVG.H * escala);
      var x = c.getContext('2d');
      x.fillStyle = (TEMAS[S.tema] || TEMAS.siepsi).fondo;
      x.fillRect(0, 0, c.width, c.height);
      x.drawImage(img, 0, 0, c.width, c.height);
      if (c.toBlob) c.toBlob(function (b) { descargarBlob(b, nombreArchivo() + '.png'); }, 'image/png');
      else { var a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = nombreArchivo() + '.png'; a.click(); }
      track('fj_exportar', { formato: 'png', escala: escala });
    };
    img.onerror = function () { aviso('No se pudo generar el PNG en este navegador. Prueba con la descarga en SVG.', true); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function exportarSVG() {
    descargarBlob(new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + construirSVG()],
      { type: 'image/svg+xml;charset=utf-8' }), nombreArchivo() + '.svg');
    track('fj_exportar', { formato: 'svg' });
  }

  function exportarJSON() {
    var datos = JSON.parse(JSON.stringify(S));
    datos.guardado = new Date().toISOString();
    descargarBlob(new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' }),
      nombreArchivo() + '.flujograma.json');
    track('fj_exportar', { formato: 'json' });
  }

  /* El flujograma crece hacia abajo: la hoja va vertical, al contrario que el
     mentefacto, que es apaisado. */
  function exportarPDF() {
    var svg = construirSVG();
    var f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
    document.body.appendChild(f);
    var apaisado = ultimoSVG.W > ultimoSVG.H;
    var doc = f.contentWindow.document;
    doc.open();
    doc.write('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>' + esc(nombreArchivo()) +
      '</title><style>@page{size:A4 ' + (apaisado ? 'landscape' : 'portrait') + ';margin:10mm}' +
      'html,body{margin:0;padding:0;background:#fff}' +
      'svg{width:100%;height:auto;display:block}</style></head><body>' + svg + '</body></html>');
    doc.close();
    var limpio = false;
    function quitar() { if (limpio) return; limpio = true; setTimeout(function () { f.parentNode && f.parentNode.removeChild(f); }, 300); }
    setTimeout(function () {
      try { f.contentWindow.onafterprint = quitar; f.contentWindow.focus(); f.contentWindow.print(); }
      catch (e) { aviso('Tu navegador bloqueó la impresión. Descarga el PNG: ese archivo sí lo puedes insertar en Word.', true); }
      setTimeout(quitar, 60000);
    }, 400);
    track('fj_exportar', { formato: 'pdf' });
  }

  /* ==========================================================================
     7. INTERFAZ
     ========================================================================== */

  function plantillaBienvenida() {
    var hayBorrador = hayContenido();
    return '' +
      '<div class="fj-bienvenida">' +
      '  <div class="fj-bv-rejilla" aria-hidden="true"></div>' +
      '  <div class="fj-bv-cont">' +
      '    <p class="fj-bv-et">Recursos educativos</p>' +
      '    <h2 class="fj-bv-titulo">Flujograma</h2>' +
      '    <div class="fj-bv-texto">' +
      '      <p class="fj-bv-l1">Asistente pedagógico para construir diagramas de flujo.</p>' +
      '      <p class="fj-bv-l2">Escribe los pasos del proceso y marca dónde se toma una decisión. La herramienta elige la forma de cada símbolo, los ordena y traza las flechas, de modo que nunca queda un símbolo suelto ni una flecha sin conectar.</p>' +
      '      <p class="fj-bv-nota">Herramienta de aprendizaje: cubre la estructura esencial del diagrama de flujo, para que entiendas cómo funciona y lo construyas bien. Para procesos muy grandes o diagramas de otro tipo, usa un editor gráfico.</p>' +
      '      <p class="fj-bv-l3">Semillero de Investigación SIEPSI</p>' +
      '    </div>' +
      '    <div class="fj-bv-pie">' +
      '      <button type="button" class="fj-entrar" data-act="iniciar">' +
      '        <span>' + (hayBorrador ? 'Continuar mi flujograma' : 'Iniciar flujograma') + '</span>' +
      '        <svg class="fj-flecha" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '          <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"/>' +
      '        </svg>' +
      '      </button>' +
      '    </div>' +
      '  </div>' +
      '</div>';
  }

  function plantillaApp() {
    return '' +
      '<div class="fj-shell">' +
      '  <div class="fj-avisos" id="fj-avisos"></div>' +
      '  <header class="fj-tope">' +
      '    <div class="fj-tope-rejilla" aria-hidden="true"></div>' +
      '    <div class="fj-tope-fila">' +
      '      <div>' +
      '        <h2 class="fj-h-tit">Asistente pedagógico</h2>' +
      '        <p class="fj-h-nom">Constructor de Flujogramas</p>' +
      '      </div>' +
      '      <div class="fj-h-acc">' +
      '        <button type="button" class="fj-btn fj-btn-linea" data-act="ejemplos">Ver un ejemplo</button>' +
      '        <button type="button" class="fj-btn fj-btn-linea" data-act="abrir">Abrir archivo</button>' +
      '        <button type="button" class="fj-btn fj-btn-linea" data-act="nuevo">Empezar de cero</button>' +
      '      </div>' +
      '    </div>' +
      '    <ol class="fj-rail" id="fj-rail"></ol>' +
      '  </header>' +
      '  <div class="fj-grid">' +
      '    <section class="fj-col-edit">' +
      '      <div class="fj-panel" id="fj-panel"></div>' +
      '      <div class="fj-nav">' +
      '        <button type="button" class="fj-btn fj-btn-sec" data-act="atras">← Atrás</button>' +
      '        <span class="fj-nav-pos" id="fj-pos"></span>' +
      '        <button type="button" class="fj-btn fj-btn-sig" data-act="siguiente">Siguiente →</button>' +
      '      </div>' +
      '    </section>' +
      '    <section class="fj-col-prev">' +
      '      <div class="fj-prev-sticky">' +
      '      <div class="fj-prev-barra">' +
      '        <span class="fj-prev-tit">Vista previa</span>' +
      '        <button type="button" class="fj-btn fj-btn-linea fj-btn-sm" data-act="ampliar">Ampliar</button>' +
      '        <label class="fj-tema-lbl">Color' +
      '          <select class="fj-select" id="fj-tema">' +
      Object.keys(TEMAS).map(function (k) {
        return '<option value="' + k + '">' + esc(TEMAS[k].nom) + '</option>';
      }).join('') +
      '          </select>' +
      '        </label>' +
      '      </div>' +
      '      <div class="fj-lienzo" id="fj-lienzo"></div>' +
      '      <div class="fj-exp">' +
      '        <button type="button" class="fj-btn fj-btn-pri fj-btn-ancho" data-act="png">Descargar imagen (PNG)</button>' +
      '        <div class="fj-exp-fila">' +
      '          <button type="button" class="fj-btn fj-btn-sec" data-act="pdf">PDF / Imprimir</button>' +
      '          <button type="button" class="fj-btn fj-btn-sec" data-act="svg">SVG</button>' +
      '          <button type="button" class="fj-btn fj-btn-sec" data-act="json">Guardar avance</button>' +
      '        </div>' +
      '        <p class="fj-exp-nota">El archivo <b>Guardar avance</b> te permite retomar el flujograma más adelante con «Abrir archivo».</p>' +
      '      </div>' +
      '      </div>' +
      '    </section>' +
      '  </div>' +
      '  <input type="file" id="fj-file" accept=".json,application/json" class="fj-oculto">' +
      '  <div class="fj-lupa fj-oculto" id="fj-lupa">' +
      '    <div class="fj-lupa-barra">' +
      '      <span class="fj-lupa-tit">Vista ampliada</span>' +
      '      <div class="fj-lupa-acc">' +
      '        <button type="button" class="fj-zbtn" data-act="zoom-menos" aria-label="Alejar">−</button>' +
      '        <span class="fj-zpct" id="fj-zpct">100%</span>' +
      '        <button type="button" class="fj-zbtn" data-act="zoom-mas" aria-label="Acercar">+</button>' +
      '        <button type="button" class="fj-btn fj-btn-sec fj-btn-sm" data-act="zoom-ajustar">Ajustar</button>' +
      '        <button type="button" class="fj-x" data-act="cerrar-lupa" aria-label="Cerrar">×</button>' +
      '      </div>' +
      '    </div>' +
      '    <div class="fj-lupa-cuerpo" id="fj-lupa-cuerpo"></div>' +
      '  </div>' +
      '  <div class="fj-modal fj-oculto" id="fj-modal"><div class="fj-modal-caja" role="dialog" aria-modal="true">' +
      '    <div class="fj-modal-cab"><h3 id="fj-modal-tit">Título</h3>' +
      '      <button type="button" class="fj-x" data-act="cerrar-modal" aria-label="Cerrar">×</button></div>' +
      '    <div class="fj-modal-cuerpo" id="fj-modal-cuerpo"></div>' +
      '  </div></div>' +
      '</div>';
  }

  function aviso(txt, esError) {
    var cont = $('#fj-avisos', raiz);
    if (!cont) return;
    var d = document.createElement('div');
    d.className = 'fj-flash' + (esError ? ' fj-flash-err' : '');
    d.innerHTML = '<span class="fj-flash-txt">' + txt + '</span>' +
      '<button type="button" class="fj-flash-x" data-act="cerrar-aviso" aria-label="Cerrar aviso">×</button>';
    cont.appendChild(d);
  }

  /* --- Riel de pasos -------------------------------------------------------- */

  function pasoCompleto(i) {
    var p = PASOS[i];
    if (p.tipo === 'proceso') return !!S.titulo.trim();
    if (p.tipo === 'pasos') {
      var ok = false;
      recorrer(S.pasos, function (n) { if (n.x.trim()) ok = true; });
      return ok;
    }
    return estaCompleto();
  }

  function renderRail() {
    var rail = $('#fj-rail', raiz);
    if (!rail) return;
    rail.innerHTML = PASOS.map(function (p, i) {
      var cls = 'fj-rail-i';
      if (i === pasoActual) cls += ' fj-rail-act';
      else if (pasoCompleto(i)) cls += ' fj-rail-ok';
      return '<li class="' + cls + '"><button type="button" data-ir="' + i + '">' +
        '<span class="fj-rail-n">' + (pasoCompleto(i) && i !== pasoActual ? '✓' : ('0' + (i + 1))) + '</span>' +
        '<span class="fj-rail-t">' + esc(p.nom) + '</span></button></li>';
    }).join('');
    var pos = $('#fj-pos', raiz);
    if (pos) pos.textContent = 'Paso ' + (pasoActual + 1) + ' de ' + PASOS.length;
    var bA = $('[data-act="atras"]', raiz);
    if (bA) bA.disabled = pasoActual === 0;
    var bS = $('[data-act="siguiente"]', raiz);
    if (bS) bS.style.visibility = pasoActual === PASOS.length - 1 ? 'hidden' : 'visible';
  }

  /* --- Editor de esquema ---------------------------------------------------- */

  function iconoTipo(t) {
    var c = 'currentColor';
    var d = {
      proceso: '<rect x="2" y="5" width="16" height="10" fill="none" stroke="' + c + '" stroke-width="1.6"/>',
      decision: '<path d="M10 3 L18 10 L10 17 L2 10 Z" fill="none" stroke="' + c + '" stroke-width="1.6"/>',
      entrada: '<path d="M5 5 H18 L15 15 H2 Z" fill="none" stroke="' + c + '" stroke-width="1.6"/>',
      salida: '<path d="M2 5 H18 V14 C13 18 7 11 2 15 Z" fill="none" stroke="' + c + '" stroke-width="1.6"/>',
      conector: '<circle cx="10" cy="10" r="6.5" fill="none" stroke="' + c + '" stroke-width="1.6"/>',
      fin: '<ellipse cx="10" cy="10" rx="8" ry="5.5" fill="none" stroke="' + c + '" stroke-width="1.6"/>'
    };
    return '<svg class="fj-ico" viewBox="0 0 20 20" aria-hidden="true">' + (d[t] || d.proceso) + '</svg>';
  }

  function htmlFila(n, ruta, prof) {
    var av = avisosNodo(n);
    var opciones = Object.keys(TIPOS).map(function (k) {
      var bloqueado = k === 'decision' && prof >= MAX_PROF;
      return '<option value="' + k + '"' + (n.t === k ? ' selected' : '') +
        (bloqueado ? ' disabled' : '') + '>' + esc(TIPOS[k].nom) + '</option>';
    }).join('');

    var s = '<div class="fj-fila fj-fila-' + n.t + '">' +
      '  <span class="fj-fila-ico">' + iconoTipo(n.t) + '</span>' +
      '  <div class="fj-fila-c">' +
      '    <div class="fj-fila-top">' +
      '      <select class="fj-select fj-tipo" data-tipo="' + ruta + '" aria-label="Tipo de símbolo">' + opciones + '</select>' +
      '      <input type="text" class="fj-input fj-texto" data-txt="' + ruta + '" value="' + esc(n.x) +
      '" placeholder="' + (n.t === 'decision' ? '¿Pregunta que abre dos caminos?' : 'Describe el paso') + '" autocomplete="off">' +
      '    </div>' +
      '    <div class="fj-fila-av">' + av.map(function (a) { return '<span class="fj-av">' + esc(a) + '</span>'; }).join('') + '</div>' +
      '  </div>' +
      '  <div class="fj-fila-acc">' +
      '    <button type="button" class="fj-mini" data-sube="' + ruta + '" aria-label="Subir">↑</button>' +
      '    <button type="button" class="fj-mini" data-baja="' + ruta + '" aria-label="Bajar">↓</button>' +
      '    <button type="button" class="fj-mini fj-mini-del" data-quita="' + ruta + '" aria-label="Quitar">×</button>' +
      '  </div>' +
      '</div>';

    if (n.t === 'decision') {
      s += '<div class="fj-ramas">' +
        htmlRama('Sí', n.si, ruta + '.si', prof + 1) +
        htmlRama('No', n.no, ruta + '.no', prof + 1) +
        '</div>';
    }
    return s;
  }

  function htmlRama(et, lista, ruta, prof) {
    var cuerpo = (lista || []).map(function (n, i) { return htmlFila(n, ruta + '.' + i, prof); }).join('');
    if (!cuerpo) cuerpo = '<p class="fj-rama-vacia">Sin pasos: esta respuesta vuelve directamente al camino principal.</p>';
    return '<div class="fj-rama">' +
      '  <div class="fj-rama-cab"><span class="fj-rama-et">' + et + '</span></div>' +
      '  <div class="fj-rama-cuerpo">' + cuerpo +
      '    <button type="button" class="fj-btn fj-btn-sec fj-btn-sm" data-add="' + ruta + '">+ Añadir paso</button>' +
      '  </div>' +
      '</div>';
  }

  function htmlEditor() {
    var filas = S.pasos.map(function (n, i) { return htmlFila(n, String(i), 0); }).join('');
    var n = contarPasos();
    return '<div class="fj-term">' + iconoTipo('fin') + '<b>' + esc(S.inicio.trim() || 'Inicio') + '</b></div>' +
      '<div class="fj-esquema">' + filas + '</div>' +
      '<div class="fj-esquema-pie">' +
      (n < MAX_PASOS
        ? '<button type="button" class="fj-btn fj-btn-sec fj-btn-sm" data-add="">+ Añadir paso</button>'
        : '<span class="fj-cont">Máximo ' + MAX_PASOS + ' símbolos</span>') +
      '<span class="fj-cont fj-estado">' + n + ' símbolo(s)</span>' +
      '</div>' +
      '<div class="fj-term">' + iconoTipo('fin') + '<b>' + esc(S.fin.trim() || 'Fin') + '</b></div>';
  }

  function htmlProceso() {
    return '<div class="fj-campo">' +
      '  <label class="fj-lbl">Nombre del proceso' +
      '    <input type="text" class="fj-input fj-input-gr" data-campo="titulo" value="' + esc(S.titulo) +
      '" placeholder="Ej.: Aplicación de una prueba psicométrica" autocomplete="off"></label>' +
      '</div>' +
      '<div class="fj-dos">' +
      '  <label class="fj-lbl">Texto del óvalo inicial' +
      '    <input type="text" class="fj-input" data-campo="inicio" value="' + esc(S.inicio) + '" placeholder="Inicio" autocomplete="off"></label>' +
      '  <label class="fj-lbl">Texto del óvalo final' +
      '    <input type="text" class="fj-input" data-campo="fin" value="' + esc(S.fin) + '" placeholder="Fin" autocomplete="off"></label>' +
      '</div>' +
      '<div class="fj-record"><span class="fj-record-et">Regla de la guía</span>' +
      '<p>Todo diagrama de flujo <b>empieza y termina con un óvalo</b>. Estos dos ya están puestos; tú solo añades lo del medio.</p></div>';
  }

  function htmlRevision() {
    var r = evaluar();
    var barra = function (nom, val) {
      var clase = val >= 75 ? 'fj-b-ok' : val >= 50 ? 'fj-b-med' : 'fj-b-baja';
      return '<div class="fj-rub-fila"><div class="fj-rub-cab"><span>' + nom + '</span><b>' + val + '</b></div>' +
        '<div class="fj-barra"><i class="' + clase + '" style="width:' + val + '%"></i></div></div>';
    };
    var grupos = { secuencia: [], simbolos: [], informacion: [] };
    r.sugerencias.forEach(function (s) { grupos[s[0]].push(s[1]); });
    var nombres = { secuencia: 'secuencia lógica', simbolos: 'uso de símbolos', informacion: 'información' };
    var lista = '';
    ['secuencia', 'simbolos', 'informacion'].forEach(function (g) {
      if (!grupos[g].length) return;
      lista += '<li class="fj-sug-g"><span class="fj-sug-et fj-et-' + g + '">' + nombres[g] + '</span><ul>' +
        grupos[g].map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></li>';
    });
    var nivelClase = r.total >= 90 ? 'fj-niv-exc' : r.total >= 75 ? 'fj-niv-bue' : r.total >= 50 ? 'fj-niv-ace' : 'fj-niv-con';

    return '<div class="fj-rub">' +
      '  <div class="fj-rub-total ' + nivelClase + '"><b>' + r.total + '</b><span>' + r.nivel + '</span></div>' +
      '  <div class="fj-rub-barras">' + barra('Secuencia lógica', r.secuencia) + barra('Uso de símbolos', r.simbolos) + barra('Información', r.informacion) + '</div>' +
      '</div>' +
      '<p class="fj-rub-nota">Puntuación orientativa según la rúbrica del semillero. No reemplaza la valoración de tu docente.</p>' +
      (lista
        ? '<div class="fj-sug"><h4>Qué puedes mejorar</h4><ul class="fj-sug-l">' + lista + '</ul></div>'
        : '<div class="fj-sug fj-sug-ok"><h4>Sin observaciones</h4><p>Tu diagrama cumple con los tres criterios de la rúbrica. Ya lo puedes descargar.</p></div>') +
      '<div class="fj-meta">' +
      '  <h4>Datos para la entrega <span class="fj-opc">opcional</span></h4>' +
      '  <label class="fj-lbl">Autor o curso' +
      '    <input type="text" class="fj-input" data-campo="autor" value="' + esc(S.autor) + '" placeholder="Ej.: Ana Pérez · Psicología VI" autocomplete="off"></label>' +
      '</div>' +
      '<div class="fj-cta">' +
      '  <h4>¿Quieres la guía completa?</h4>' +
      '  <p>Recibe la Guía Explicativa y la plantilla editable del Semillero SIEPSI, con la tabla de símbolos y la rúbrica de evaluación.</p>' +
      '  <a class="fj-btn fj-btn-pri" href="' + URL_BLOG + '" target="_blank" rel="noopener" data-act="lead">Quiero la guía</a>' +
      '</div>';
  }

  function renderPanel() {
    var p = PASOS[pasoActual];
    var panel = $('#fj-panel', raiz);
    if (!panel) return;
    var cuerpo = p.tipo === 'proceso' ? htmlProceso() : p.tipo === 'pasos' ? htmlEditor() : htmlRevision();
    panel.innerHTML =
      '<div class="fj-paso-cab"><span class="fj-paso-et">' + esc(p.nom) + '</span><h3>' + esc(p.tit) + '</h3></div>' +
      (p.ayuda ? '<details class="fj-ayuda"><summary>Cómo se responde</summary><div>' + p.ayuda + '</div></details>' : '') +
      cuerpo;
    var primer = $('.fj-input', panel);
    if (primer && p.tipo === 'proceso') { try { primer.focus({ preventScroll: true }); } catch (e) {} }
    renderRail();
  }

  function renderPreview() {
    var l = $('#fj-lienzo', raiz);
    if (!l) return;
    if (!hayContenido()) {
      l.innerHTML = '<div class="fj-vacio"><p><b>Tu diagrama aparecerá aquí.</b></p>' +
        '<p>Empieza por el nombre del proceso. Cada paso que agregues se dibuja al instante, con su símbolo y sus flechas.</p></div>';
      return;
    }
    l.innerHTML = '<div class="fj-svg-caja" data-act="ampliar" role="button" tabindex="0" ' +
      'title="Pulsa para ver el diagrama en grande">' + construirSVG() + '</div>';
  }

  function refrescarAvisos() {
    var panel = $('#fj-panel', raiz);
    if (!panel || PASOS[pasoActual].tipo !== 'pasos') return;
    $$('.fj-fila', panel).forEach(function (fila) {
      var inp = $('.fj-texto', fila);
      if (!inp) return;
      var n = nodoEn(inp.getAttribute('data-txt'));
      var cont = $('.fj-fila-av', fila);
      if (!n || !cont) return;
      cont.innerHTML = avisosNodo(n).map(function (a) { return '<span class="fj-av">' + esc(a) + '</span>'; }).join('');
    });
    var e = $('.fj-estado', panel);
    if (e) e.textContent = contarPasos() + ' símbolo(s)';
  }

  var guardarLento = debounce(guardar, 500);
  var dibujarLento = debounce(renderPreview, 140);

  function alCambiar() {
    guardarLento();
    dibujarLento();
    refrescarAvisos();
    renderRail();
    if (!yaContado.inicio && S.titulo.trim().length >= 3) {
      yaContado.inicio = true;
      track('fj_inicio', {});
    }
    if (!yaContado.completo && estaCompleto()) {
      yaContado.completo = true;
      track('fj_completo', { simbolos: contarPasos() });
    }
  }

  function irAPaso(i) {
    if (i < 0 || i >= PASOS.length) return;
    var previo = PASOS[pasoActual];
    if (i > pasoActual && previo.tipo !== 'revision' && !yaContado['p_' + previo.id]) {
      yaContado['p_' + previo.id] = true;
      track('fj_paso', { paso: pasoActual + 1, etapa: previo.id, simbolos: contarPasos() });
    }
    pasoActual = i;
    renderPanel();
    var sh = $('.fj-shell', raiz);
    if (sh && sh.getBoundingClientRect().top < -20) sh.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* --- Lupa ----------------------------------------------------------------- */

  var lupaZoom = 1, LUPA_MIN = 0.4, LUPA_MAX = 4;

  function pintarLupa() {
    var cuerpo = $('#fj-lupa-cuerpo', raiz);
    if (!cuerpo) return;
    cuerpo.innerHTML = '<div class="fj-lupa-marco" style="width:' + (lupaZoom * 100).toFixed(2) + '%">' + construirSVG() + '</div>';
    var pct = $('#fj-zpct', raiz);
    if (pct) pct.textContent = Math.round(lupaZoom * 100) + '%';
  }

  function zoom(paso) {
    var z = paso === 0 ? 1 : lupaZoom * (paso > 0 ? 1.25 : 0.8);
    lupaZoom = Math.min(LUPA_MAX, Math.max(LUPA_MIN, z));
    var cuerpo = $('#fj-lupa-cuerpo', raiz);
    var antesX = cuerpo ? cuerpo.scrollLeft + cuerpo.clientWidth / 2 : 0;
    var antesW = cuerpo ? cuerpo.scrollWidth : 1;
    pintarLupa();
    if (cuerpo && antesW) cuerpo.scrollLeft = antesX * (cuerpo.scrollWidth / antesW) - cuerpo.clientWidth / 2;
  }

  function abrirLupa() {
    if (!hayContenido()) return;
    lupaZoom = 1;
    pintarLupa();
    $('#fj-lupa', raiz).classList.remove('fj-oculto');
    var x = $('[data-act="cerrar-lupa"]', raiz);
    if (x) x.focus();
    track('fj_ampliar', {});
  }
  function cerrarLupa() { var l = $('#fj-lupa', raiz); if (l) l.classList.add('fj-oculto'); }

  function conectarArrastre() {
    var cuerpo = $('#fj-lupa-cuerpo', raiz);
    if (!cuerpo) return;
    var activo = false, x0 = 0, y0 = 0, sx = 0, sy = 0;
    cuerpo.addEventListener('mousedown', function (ev) {
      if (ev.button !== 0) return;
      activo = true; x0 = ev.clientX; y0 = ev.clientY;
      sx = cuerpo.scrollLeft; sy = cuerpo.scrollTop;
      cuerpo.classList.add('fj-arrastrando');
      ev.preventDefault();
    });
    document.addEventListener('mousemove', function (ev) {
      if (!activo) return;
      cuerpo.scrollLeft = sx - (ev.clientX - x0);
      cuerpo.scrollTop = sy - (ev.clientY - y0);
    });
    document.addEventListener('mouseup', function () {
      activo = false; cuerpo.classList.remove('fj-arrastrando');
    });
  }

  /* --- Modal de ejemplos ---------------------------------------------------- */

  function abrirModal(titulo, html) {
    $('#fj-modal-tit', raiz).textContent = titulo;
    $('#fj-modal-cuerpo', raiz).innerHTML = html;
    $('#fj-modal', raiz).classList.remove('fj-oculto');
  }
  function cerrarModal() { $('#fj-modal', raiz).classList.add('fj-oculto'); }

  function modalEjemplos() {
    var html = '<p class="fj-modal-int">Se reemplazará lo que tengas escrito. Si quieres conservarlo, guarda tu avance primero.</p>' +
      Object.keys(EJEMPLOS).map(function (k) {
        var e = EJEMPLOS[k];
        return '<button type="button" class="fj-ej" data-ejemplo="' + k + '">' +
          '<b>' + esc(e.nom) + '</b><span>' + esc(e.desc) + '</span></button>';
      }).join('');
    abrirModal('Ejemplos y ejercicio', html);
  }

  function cargarEjemplo(k) {
    var e = EJEMPLOS[k];
    if (!e) return;
    var tema = S.tema;
    aplicar(e.datos);
    S.tema = tema;
    pasoActual = 1;
    yaContado = {};
    guardar();
    renderPanel();
    renderPreview();
    cerrarModal();
    track('fj_ejemplo', { tipo: k });
    aviso(e.lectura
      ? 'Ejercicio cargado. Lee el documento de Análisis Factorial que indica la guía y representa el proceso paso a paso.'
      : 'Ejemplo cargado. Recorre los pasos para ver cómo se estructura el proceso.');
  }

  /* --- Eventos -------------------------------------------------------------- */

  function conectar() {
    raiz.addEventListener('input', function (ev) {
      var el = ev.target;
      if (!el.classList) return;
      if (el.classList.contains('fj-texto')) {
        var n = nodoEn(el.getAttribute('data-txt'));
        if (n) { n.x = el.value; alCambiar(); }
        return;
      }
      if (el.classList.contains('fj-input') && el.getAttribute('data-campo')) {
        S[el.getAttribute('data-campo')] = el.value;
        alCambiar();
        if (PASOS[pasoActual].tipo === 'pasos') {
          var t = $('.fj-term b', raiz);
          if (t) t.textContent = S.inicio.trim() || 'Inicio';
        }
      }
    });

    raiz.addEventListener('change', function (ev) {
      var el = ev.target;
      if (el.id === 'fj-tema') {
        S.tema = el.value; guardar(); renderPreview();
        track('fj_tema', { tema: S.tema });
        return;
      }
      if (el.classList && el.classList.contains('fj-tipo')) {
        var ruta = el.getAttribute('data-tipo');
        var n = nodoEn(ruta);
        if (!n) return;
        n.t = el.value;
        if (n.t === 'decision') { n.si = n.si || []; n.no = n.no || []; }
        else { delete n.si; delete n.no; }
        guardar(); renderPanel(); renderPreview();
        return;
      }
      if (el.id === 'fj-file' && el.files && el.files[0]) {
        var fr = new FileReader();
        fr.onload = function () {
          try {
            aplicar(JSON.parse(fr.result));
            pasoActual = 1; yaContado = {};
            guardar(); renderPanel(); renderPreview();
            $('#fj-tema', raiz).value = S.tema;
            aviso('Flujograma cargado correctamente.');
            track('fj_abrir', {});
          } catch (e) { aviso('Ese archivo no es un flujograma válido.', true); }
        };
        fr.readAsText(el.files[0]);
        el.value = '';
      }
    });

    raiz.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { cerrarModal(); cerrarLupa(); }
      if (ev.target.closest && ev.target.closest('.fj-lupa')) {
        if (ev.key === '+' || ev.key === '=') { ev.preventDefault(); zoom(1); }
        if (ev.key === '-') { ev.preventDefault(); zoom(-1); }
        if (ev.key === '0') { ev.preventDefault(); zoom(0); }
      }
      if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList &&
        ev.target.classList.contains('fj-svg-caja')) {
        ev.preventDefault(); abrirLupa(); return;
      }
      if (ev.key === 'Enter' && ev.target.classList && ev.target.classList.contains('fj-texto')) {
        ev.preventDefault();
        var ruta = ev.target.getAttribute('data-txt');
        var partes = ruta.split('.');
        var idx = parseInt(partes.pop(), 10);
        var lista = listaEn(partes.join('.'));
        if (contarPasos() < MAX_PASOS) {
          lista.splice(idx + 1, 0, nodo('proceso', ''));
          guardar(); renderPanel(); renderPreview();
          var nueva = partes.concat([idx + 1]).join('.');
          var campo = $('[data-txt="' + nueva + '"]', raiz);
          if (campo) campo.focus();
        }
      }
    });

    raiz.addEventListener('click', function (ev) {
      var b = ev.target.closest
        ? ev.target.closest('[data-act],[data-ir],[data-add],[data-quita],[data-sube],[data-baja],[data-ejemplo]')
        : null;
      if (!b) {
        if (ev.target.id === 'fj-modal') cerrarModal();
        if (ev.target.id === 'fj-lupa') cerrarLupa();
        return;
      }

      var ir = b.getAttribute('data-ir');
      if (ir !== null) { irAPaso(parseInt(ir, 10)); return; }

      var add = b.getAttribute('data-add');
      if (add !== null) {
        if (contarPasos() >= MAX_PASOS) { aviso('Llegaste al máximo de ' + MAX_PASOS + ' símbolos.', true); return; }
        listaEn(add).push(nodo('proceso', ''));
        guardar(); renderPanel(); renderPreview();
        var ins = $$('.fj-texto', $('#fj-panel', raiz));
        if (ins.length) ins[ins.length - 1].focus();
        return;
      }

      var quita = b.getAttribute('data-quita');
      if (quita) {
        var r = resolver(quita);
        if (r && r.arr) {
          if (r.arr === S.pasos && S.pasos.length <= 1) { aviso('El proceso necesita al menos un paso.', true); return; }
          r.arr.splice(r.idx, 1);
          guardar(); renderPanel(); renderPreview();
        }
        return;
      }

      var sube = b.getAttribute('data-sube'), baja = b.getAttribute('data-baja');
      if (sube || baja) {
        var rr = resolver(sube || baja);
        if (rr && rr.arr) {
          var j = rr.idx + (sube ? -1 : 1);
          if (j >= 0 && j < rr.arr.length) {
            var tmp = rr.arr[rr.idx]; rr.arr[rr.idx] = rr.arr[j]; rr.arr[j] = tmp;
            guardar(); renderPanel(); renderPreview();
          }
        }
        return;
      }

      var ej = b.getAttribute('data-ejemplo');
      if (ej) { cargarEjemplo(ej); return; }

      switch (b.getAttribute('data-act')) {
        case 'iniciar':
          var conBorrador = hayContenido();
          vista = 'app'; render();
          track('fj_iniciar', { borrador: conBorrador ? 1 : 0 });
          break;
        case 'atras': irAPaso(pasoActual - 1); break;
        case 'siguiente': irAPaso(pasoActual + 1); break;
        case 'ejemplos': modalEjemplos(); break;
        case 'abrir': $('#fj-file', raiz).click(); break;
        case 'nuevo':
          if (!hayContenido() || window.confirm('Se borrará el flujograma actual. ¿Continuar?')) {
            var tema = S.tema;
            S = estadoVacio(); S.tema = tema;
            pasoActual = 0; yaContado = {};
            guardar(); renderPanel(); renderPreview();
          }
          break;
        case 'png': exportarPNG(2); break;
        case 'pdf': exportarPDF(); break;
        case 'svg': exportarSVG(); break;
        case 'json': exportarJSON(); break;
        case 'ampliar': abrirLupa(); break;
        case 'zoom-mas': zoom(1); break;
        case 'zoom-menos': zoom(-1); break;
        case 'zoom-ajustar': zoom(0); break;
        case 'cerrar-lupa': cerrarLupa(); break;
        case 'cerrar-modal': cerrarModal(); break;
        case 'lead': track('fj_lead', { origen: 'revision' }); break;
        case 'cerrar-aviso':
          var caja = b.parentNode;
          if (caja && caja.parentNode) caja.parentNode.removeChild(caja);
          break;
      }
    });
  }

  /* ==========================================================================
     8. ARRANQUE
     ========================================================================== */

  function render() {
    if (vista === 'bienvenida') { raiz.innerHTML = plantillaBienvenida(); return; }
    raiz.innerHTML = plantillaApp();
    conectarArrastre();
    $('#fj-tema', raiz).value = S.tema;
    renderPanel();
    renderPreview();
    if (avisoPendiente) { aviso(avisoPendiente); avisoPendiente = null; }
  }

  function iniciar() {
    raiz = document.getElementById(RAIZ_ID);
    if (!raiz) return;
    if (raiz.getAttribute('data-fj-listo')) return;
    raiz.setAttribute('data-fj-listo', '1');

    var temaAttr = raiz.getAttribute('data-tema');
    var previo = recuperar();
    var recuperado = false;
    if (previo) { aplicar(previo); recuperado = hayContenido(); }
    if (temaAttr && TEMAS[temaAttr] && !recuperado) S.tema = temaAttr;
    if (recuperado) {
      avisoPendiente = 'Recuperamos el borrador que tenías guardado en este navegador. Usa «Empezar de cero» si prefieres uno nuevo.';
    }

    conectar();
    vista = 'bienvenida';
    render();
    track('fj_cargado', { version: VERSION });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
