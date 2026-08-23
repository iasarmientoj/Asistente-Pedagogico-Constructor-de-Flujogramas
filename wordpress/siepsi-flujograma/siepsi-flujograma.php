<?php
/**
 * Plugin Name:       Asistente Pedagógico SIEPSI - Constructor de Flujogramas
 * Plugin URI:        https://siepsi.com.co/
 * Description:       Asistente pedagógico para construir diagramas de flujo paso a paso, con revisión según rúbrica y descarga en PNG, PDF y SVG. Se inserta en cualquier página con el shortcode [flujograma_siepsi].
 * Version:           1.0.0
 * Requires at least: 5.0
 * Requires PHP:      5.6
 * Author:            Semillero de Investigación SIEPSI
 * Author URI:        https://siepsi.com.co/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       siepsi-flujograma
 *
 * -----------------------------------------------------------------------------
 * ESTE ARCHIVO ES TODO EL TRABAJO DE MIGRACION.
 *
 * La herramienta (assets/flujograma.css y assets/flujograma.js) es byte por byte
 * la misma que se publica en GitHub Pages. Lo unico que cambia entre las dos
 * versiones es quien carga esos dos archivos y quien imprime el <div>:
 *
 *   - En GitHub Pages : index.html, con sus etiquetas <link> y <script>.
 *   - En WordPress    : este archivo, con wp_enqueue_* y un shortcode.
 *
 * Por eso no hay nada que reescribir el dia que el equipo apruebe la herramienta.
 * -----------------------------------------------------------------------------
 */

// Sin acceso directo.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'SIEPSI_FJ_VERSION', '1.0.0' );
define( 'SIEPSI_FJ_RUTA', plugin_dir_path( __FILE__ ) );
define( 'SIEPSI_FJ_URL', plugin_dir_url( __FILE__ ) );

/**
 * Devuelve la version a usar para romper la cache del navegador.
 *
 * Usa la fecha de modificacion del archivo: asi, cuando subas una version nueva
 * del plugin, los visitantes reciben el CSS y el JS nuevos de inmediato en vez
 * de quedarse con la copia vieja en cache.
 *
 * @param string $archivo Ruta relativa dentro de la carpeta assets/.
 * @return string
 */
function siepsi_fj_version( $archivo ) {
	$ruta = SIEPSI_FJ_RUTA . 'assets/' . $archivo;
	if ( file_exists( $ruta ) ) {
		return SIEPSI_FJ_VERSION . '.' . filemtime( $ruta );
	}
	return SIEPSI_FJ_VERSION;
}

/**
 * Registra (que no es lo mismo que encolar) el CSS y el JS.
 *
 * Se registran siempre, pero solo se encolan dentro del shortcode. Asi la
 * herramienta no anade ni un kilobyte al resto del sitio, que ya carga
 * WooCommerce, Revolution Slider y Essential Grid.
 */
function siepsi_fj_registrar_assets() {
	wp_register_style(
		'siepsi-flujograma',
		SIEPSI_FJ_URL . 'assets/flujograma.css',
		array(),
		siepsi_fj_version( 'flujograma.css' )
	);

	wp_register_script(
		'siepsi-flujograma',
		SIEPSI_FJ_URL . 'assets/flujograma.js',
		array(),          // sin dependencias: no necesita jQuery ni nada mas
		siepsi_fj_version( 'flujograma.js' ),
		true              // en el pie, para no bloquear el pintado de la pagina
	);
}
add_action( 'wp_enqueue_scripts', 'siepsi_fj_registrar_assets' );

/**
 * Shortcode [flujograma_siepsi]
 *
 * Atributos:
 *   tema = siepsi | verde | contraste   (color inicial del diagrama)
 *
 * Ejemplo: [flujograma_siepsi tema="verde"]
 *
 * La herramienta trae su propia pantalla de bienvenida con el titulo, asi que
 * la pagina de WordPress NO debe llevar otro titular encima: se duplicaria.
 *
 * @param array $atts Atributos del shortcode.
 * @return string HTML del contenedor.
 */
function siepsi_fj_shortcode( $atts ) {
	// La herramienta usa un id unico. Si alguien pone el shortcode dos veces en
	// la misma pagina, se ignora la segunda: dos elementos con el mismo id
	// romperian el HTML y el JavaScript.
	static $ya_renderizado = false;

	$atts = shortcode_atts(
		array( 'tema' => 'siepsi' ),
		$atts,
		'flujograma_siepsi'
	);

	$tema = in_array( $atts['tema'], array( 'siepsi', 'verde', 'contraste' ), true )
		? $atts['tema']
		: 'siepsi';

	if ( $ya_renderizado ) {
		return current_user_can( 'edit_posts' )
			? '<p style="padding:12px;border:1px solid #f0d79a;background:#fff6e0;color:#8a6116">'
				. esc_html__( 'El shortcode [flujograma_siepsi] ya está insertado en esta página. Solo puede aparecer una vez. (Este aviso únicamente lo ven los editores del sitio.)', 'siepsi-flujograma' )
				. '</p>'
			: '';
	}
	$ya_renderizado = true;

	wp_enqueue_style( 'siepsi-flujograma' );
	wp_enqueue_script( 'siepsi-flujograma' );

	return '<div id="flujograma-app" data-tema="' . esc_attr( $tema ) . '"></div>';
}
add_shortcode( 'flujograma_siepsi', 'siepsi_fj_shortcode' );

/**
 * Enlace de ayuda en la lista de plugins, para que el equipo no tenga que
 * buscar en la documentacion cual era el shortcode.
 *
 * @param array $enlaces Enlaces existentes.
 * @return array
 */
function siepsi_fj_enlace_ayuda( $enlaces ) {
	array_unshift(
		$enlaces,
		'<span style="color:#2271b1">' . esc_html__( 'Shortcode:', 'siepsi-flujograma' ) . ' <code>[flujograma_siepsi]</code></span>'
	);
	return $enlaces;
}
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'siepsi_fj_enlace_ayuda' );
