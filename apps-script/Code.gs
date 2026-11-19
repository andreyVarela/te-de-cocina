/** @OnlyCurrentDoc */
// GENERADO por scripts/build.mjs: no editar a mano. Se edita apps-script/Logica.js,
// apps-script/Servidor.js o catalogo.json y se corre: node scripts/build.mjs
// Cómo se usa: copiar TODO este archivo y pegarlo en Extensiones → Apps Script → Código.gs (README).
// Artículos: 55. Huella: de2f6dbce98c

// ===================================================================== catálogo (desde catalogo.json)
const CATALOGO = [
  {"id":"olla-tapa-20","cat":"Cocina","que":"Olla con tapa","producto":"Olla antiadherente con tapa aluminio 20cm","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/olla-antiadherente-con-tapa-aluminio-20cm.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/3c186017741d7bb6e2c3b99906cb1a60/0/7/07110195_03_3.jpg","precio_crc":4800,"cantidad":1,"aviso":""},
  {"id":"hervidor","cat":"Cocina","que":"Hervidor eléctrico","producto":"Tetera eléctrica 1.8lt 1200w","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/tetera-electrica-1-8lt-400w.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/3c186017741d7bb6e2c3b99906cb1a60/1/0/10030290_02.jpg","precio_crc":4800,"cantidad":1,"aviso":""},
  {"id":"hermeticos","cat":"Cocina","que":"Recipientes herméticos","producto":"Recipiente hermético cuadrado vidrio 0.32-0.8lt 2pcs","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/recipiente-hermetico-cuadrado-vidrio-0-32-0-8lt-2pcs.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/3c186017741d7bb6e2c3b99906cb1a60/0/7/07190234_01.jpg","precio_crc":2100,"cantidad":1,"aviso":""},
  {"id":"refractario","cat":"Cocina","que":"Refractario de vidrio","producto":"Refractario rectangular vidrio borosilicato 1.6lt-3lt 2pcs","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/refractario-rectangular-vidrio-borosilicato-1-6lt-3lt-2pcs.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/3c186017741d7bb6e2c3b99906cb1a60/0/7/07190259.jpg","precio_crc":4800,"cantidad":1,"aviso":""},
  {"id":"escurridor","cat":"Cocina","que":"Escurridor de platos","producto":"Escurridor para platos metalico negro","tienda":"Novex","url":"https://novex.cr/producto/144372/escurridor-para-platos-metalico-negro.html","imagen":"https://ferreteriavidri.com/images/items/large/144372.jpg","precio_crc":12000,"cantidad":1,"aviso":""},
  {"id":"basurero-cocina","cat":"Cocina","que":"Basurero de cocina con pedal","producto":"Basurero manual y pedal plástico 10lt","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/basurero-manual-y-pedal-plastico-10lt.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/3c186017741d7bb6e2c3b99906cb1a60/0/7/07180384_20.jpg","precio_crc":3200,"cantidad":1,"aviso":""},
  {"id":"panos","cat":"Cocina","que":"Paños de cocina","producto":"Paño microfibra 40x40cm 15unds","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/panos-microfibra-40x40cm-15-unds.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/3c186017741d7bb6e2c3b99906cb1a60/1/0/10060109_01.jpg","precio_crc":2600,"cantidad":1,"aviso":""},
  {"id":"organizador-cubiertos","cat":"Cocina","que":"Organizador de cubiertos de bambú","producto":"Organizador para cubiertos de bambú 40x30x4.5 cm","tienda":"Novex","url":"https://novex.cr/producto/464323/organizador-para-cubiertos-de-bambu-40x30x45-cm.html","imagen":"https://ferreteriavidri.com/images/items/large/464323.jpg","precio_crc":4300,"cantidad":1,"aviso":""},
  {"id":"porta-papel","cat":"Cocina","que":"Porta-rollos de papel de cocina","producto":"Porta pepel toalla de cocina de bambu 13.5x32cm","tienda":"Novex","url":"https://novex.cr/producto/490634/porta-pepel-toalla-de-cocina-de-bambu-135x32cm.html","imagen":"https://ferreteriavidri.com/images/items/large/490634.jpg","precio_crc":2150,"cantidad":1,"aviso":""},
  {"id":"jabon-cocina","cat":"Cocina","que":"Dispensador de jabón para lavaplatos","producto":"Dispensador de jabon con mascon 15.5x11.5cm negro","tienda":"Novex","url":"https://novex.cr/producto/439556/dispensador-de-jabon-con-mascon-155x115cm-negro.html","imagen":"https://ferreteriavidri.com/images/items/large/439556.jpg","precio_crc":4990,"cantidad":1,"aviso":""},
  {"id":"utensilios-nylon-negros","cat":"Cocina","que":"Utensilios de cocina negros (5)","producto":"Juego De Utensilios De Cocina 5Pcs","tienda":"Aliss","url":"https://aliss.cr/juego-de-utensilios-de-cocina-5pcs-3059419","imagen":"https://aliss.cr/media/catalog/product/b/e/bebffce8978f3693149eb530191323b4db0768ee_file_1.jpg","precio_crc":2750,"cantidad":1,"aviso":""},
  {"id":"aceitera","cat":"Cocina","que":"Aceitera con pico","producto":"Aceitera/vinagrera vidrio/metal","tienda":"Novex","url":"https://novex.cr/producto/423420/aceitera-vinagrera-vidrio-metal.html","imagen":"https://ferreteriavidri.com/images/items/large/423420.jpg","precio_crc":3990,"cantidad":1,"aviso":""},
  {"id":"recipientes-vidrio-set","cat":"Cocina","que":"Set de recipientes de vidrio con tapa","producto":"Recipientes herméticos vidrio borosilicato 10pcs","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/recipientes-hermeticos-10pcs.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/1182dc89e4e827a7707b1d59d9a99abf/0/7/07190418_02_1.jpg","precio_crc":8600,"cantidad":1,"aviso":""},
  {"id":"especiero","cat":"Cocina","que":"Especiero giratorio con frascos","producto":"Organizador de acero/bambu con especieros 22.9x17cm 13 pzas","tienda":"Novex","url":"https://novex.cr/producto/439747/organizador-de-acero-bambu-con-especieros-229x17cm-13-pzas.html","imagen":"https://ferreteriavidri.com/images/items/large/439747.jpg","precio_crc":12900,"cantidad":1,"aviso":""},
  {"id":"colador","cat":"Cocina","que":"Colador de acero","producto":"Colador acero inoxidable 18 cm","tienda":"Novex","url":"https://novex.cr/producto/142321/colador-acero-inoxidable-18-cm.html","imagen":"https://ferreteriavidri.com/images/items/large/142321.jpg","precio_crc":3200,"cantidad":1,"aviso":""},
  {"id":"rallador","cat":"Cocina","que":"Rallador de acero","producto":"Rallador para verduras de acero inoxidable","tienda":"Novex","url":"https://novex.cr/producto/147468/rallador-para-verduras-de-acero-inoxidable.html","imagen":"https://ferreteriavidri.com/images/items/large/147468.jpg","precio_crc":4400,"cantidad":1,"aviso":""},
  {"id":"pelador","cat":"Cocina","que":"Pelador de verduras","producto":"Pelador de verduras de acero inoxi 8.1 pulg plateado","tienda":"Novex","url":"https://novex.cr/producto/429008/pelador-de-verduras-de-acero-inoxi-81-pulg-plateado.html","imagen":"https://ferreteriavidri.com/images/items/large/429008.jpg","precio_crc":3450,"cantidad":1,"aviso":""},
  {"id":"abrelatas","cat":"Cocina","que":"Abrelatas","producto":"Abrelatas de acero inoxi 8.5 pulg plateado","tienda":"Novex","url":"https://novex.cr/producto/429005/abrelatas-de-acero-inoxi-85-pulg-plateado.html","imagen":"https://ferreteriavidri.com/images/items/large/429005.jpg","precio_crc":4500,"cantidad":1,"aviso":""},
  {"id":"tijeras-cocina","cat":"Cocina","que":"Tijeras de cocina","producto":"Tijera de cocina acero inoxidable","tienda":"Novex","url":"https://novex.cr/producto/411564/tijera-de-cocina-acero-inoxidable.html","imagen":"https://ferreteriavidri.com/images/items/large/411564.jpg","precio_crc":2500,"cantidad":1,"aviso":""},
  {"id":"tazas-medidoras","cat":"Cocina","que":"Tazas medidoras","producto":"Juego De Tazas Medidoras Acero Inoxidable 4Pzs","tienda":"Aliss","url":"https://aliss.cr/juego-de-tazas-medidoras-acero-inoxidable-4pzs-3060371","imagen":"https://aliss.cr/media/catalog/product/0/c/0c49922e3b74379859553e8e03e18e4035a3e36c_file_1.jpg","precio_crc":2325,"cantidad":1,"aviso":""},
  {"id":"bandeja-horno","cat":"Cocina","que":"Bandejas de horno (3)","producto":"Bandeja antiadherente rectangular 3 piezas","tienda":"Novex","url":"https://novex.cr/producto/450643/bandeja-antiadherente-rectangular-3-piezas.html","imagen":"https://ferreteriavidri.com/images/items/large/450643.jpg","precio_crc":3900,"cantidad":1,"aviso":""},
  {"id":"vajilla","cat":"Mesa","que":"Platos negros (4)","producto":"Plato De Cenar De Color Negro 28Cm","tienda":"Aliss","url":"https://aliss.cr/plato-de-cenar-de-color-negro-28cm-3058693","imagen":"https://aliss.cr/media/catalog/product/0/e/0e35a9780e02318879b8cdc6610715b3ef852696_file.jpg","precio_crc":2100,"cantidad":4,"aviso":""},
  {"id":"platos-pequenos","cat":"Mesa","que":"Platos pequeños negros (4)","producto":"Plato De Ensalada Redondo De Color Negro 21Cm","tienda":"Aliss","url":"https://aliss.cr/plato-de-ensalada-redondo-de-color-negro-21cm-3058694","imagen":"https://aliss.cr/media/catalog/product/8/5/8510d282e768c9b57585068a958e6ed0bca60433_file.jpg","precio_crc":1100,"cantidad":4,"aviso":""},
  {"id":"bowls","cat":"Mesa","que":"Bowls para ramen o sopa (2)","producto":"Cuenco Negro De Cerámica 840Ml","tienda":"Aliss","url":"https://aliss.cr/cuenco-negro-de-ceramica-840ml-3055340","imagen":"https://aliss.cr/media/catalog/product/9/9/99e5b892d872bd424481052e906f1e64fa397cf2_file.jpg","precio_crc":1450,"cantidad":2,"aviso":""},
  {"id":"cubiertos","cat":"Mesa","que":"Cubiertos negros para 4","producto":"Set de cubiertos de acero inoxidable negro matte16 piezas","tienda":"Novex","url":"https://novex.cr/producto/464449/set-de-cubiertos-de-acero-inoxidable-negro-matte16-piezas.html","imagen":"https://ferreteriavidri.com/images/items/large/464449.jpg","precio_crc":8300,"cantidad":1,"aviso":""},
  {"id":"vasos","cat":"Mesa","que":"Vasos","producto":"Vaso liso vidrio 14oz 3unds","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/vaso-3pcs-14oz.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/3c186017741d7bb6e2c3b99906cb1a60/0/7/07190010_10.jpg","precio_crc":1200,"cantidad":1,"aviso":""},
  {"id":"tazas","cat":"Mesa","que":"Tazas negras (4)","producto":"Taza De Cerámica Color Negro 444Ml","tienda":"Aliss","url":"https://aliss.cr/taza-de-ceramica-color-negro-444ml-3040157","imagen":"https://aliss.cr/media/catalog/product/5/3/5381cb3f5a35aa70c10ef02d6600e0846ba331ae_file.jpg","precio_crc":1100,"cantidad":4,"aviso":""},
  {"id":"individuales","cat":"Mesa","que":"Individuales de yute negros (4)","producto":"Individual de yute 45x30cm negro","tienda":"Novex","url":"https://novex.cr/producto/423468/individual-de-yute-45x30cm-negro.html","imagen":"https://ferreteriavidri.com/images/items/large/423468.jpg","precio_crc":1990,"cantidad":4,"aviso":""},
  {"id":"jarra-agua","cat":"Mesa","que":"Jarra de agua de vidrio con vaso","producto":"Jarra para agua con vaso de vidrio","tienda":"Novex","url":"https://novex.cr/producto/459618/jarra-para-agua-con-vaso-de-vidrio.html","imagen":"https://ferreteriavidri.com/images/items/large/459618.jpg","precio_crc":5400,"cantidad":1,"aviso":""},
  {"id":"copas-vino","cat":"Mesa","que":"Copas de vino (4)","producto":"Ms Set De 4 Copas Para Vino Tinto 430ml","tienda":"Walmart","url":"https://www.walmart.co.cr/ms-set-de-4-copas-para-vino-tinto-430ml-8/p","imagen":"https://walmartcr.vteximg.com.br/arquivos/ids/949882/91067_01.jpg","precio_crc":3200,"cantidad":1,"aviso":""},
  {"id":"tabla-carne","cat":"Asado","que":"Tabla grande de madera para carne","producto":"Tabla para picar de madera 18 pulg x 12 pulg","tienda":"Novex","url":"https://novex.cr/producto/472112/tabla-para-picar-de-madera-18-pulg-x-12-pulg.html","imagen":"https://ferreteriavidri.com/images/items/large/472112.jpg","precio_crc":10900,"cantidad":1,"aviso":""},
  {"id":"termometro-carne","cat":"Asado","que":"Termómetro digital para carne","producto":"Termomentro digital para carne 12.9cm","tienda":"Novex","url":"https://novex.cr/producto/434907/termomentro-digital-para-carne-129cm.html","imagen":"https://ferreteriavidri.com/images/items/large/434907.jpg","precio_crc":4150,"cantidad":1,"aviso":""},
  {"id":"cepillo-parrilla","cat":"Asado","que":"Cepillo para limpiar la parrilla","producto":"Cepillo para parrilla cerdas de acero inoxidable","tienda":"Novex","url":"https://novex.cr/producto/420734/cepillo-para-parrilla-cerdas-de-acero-inoxidable.html","imagen":"https://ferreteriavidri.com/images/items/large/420734.jpg","precio_crc":4500,"cantidad":1,"aviso":""},
  {"id":"escoba","cat":"Limpieza","que":"Escoba","producto":"Escoba angular de plastico para cocina 145cm","tienda":"Novex","url":"https://novex.cr/producto/424282/escoba-angular-de-plastico-para-cocina-145cm.html","imagen":"https://ferreteriavidri.com/images/items/large/424282.jpg","precio_crc":3800,"cantidad":1,"aviso":""},
  {"id":"pala","cat":"Limpieza","que":"Pala para basura","producto":"Pala basura plástica 27.5x21x80cm","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/pala-basura-plastica-75cm.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/3c186017741d7bb6e2c3b99906cb1a60/0/7/07170016_03.jpg","precio_crc":700,"cantidad":1,"aviso":""},
  {"id":"mopa","cat":"Limpieza","que":"Mopa de microfibra (que no suelte pelusa)","producto":"Mopa limpieza plana poliéster 43x14x5cm","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/mopa-limpieza-plana-poliester-43x14x5cm.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/3c186017741d7bb6e2c3b99906cb1a60/0/7/07170029_03.jpg","precio_crc":3000,"cantidad":1,"aviso":""},
  {"id":"balde","cat":"Limpieza","que":"Balde","producto":"Balde 18 litros con agarradera","tienda":"EPA","url":"https://cr.epaenlinea.com/es-cr/products/balde-18-litros-con-agarradera","imagen":"https://cr.epaenlinea.com/cdn/shop/files/100013866.jpg?v=1790725378","precio_crc":3375,"cantidad":1,"aviso":""},
  {"id":"toallas","cat":"Baño","que":"Toallas de baño (2)","producto":"Toalla baño blanca Algodón 68x135cm","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/toalla-para-ba-o-blanca-68x135cm.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/3c186017741d7bb6e2c3b99906cb1a60/0/7/07030264_01.jpg","precio_crc":2450,"cantidad":2,"aviso":""},
  {"id":"cortina-bano","cat":"Baño","que":"Cortina de baño","producto":"Cortina baño tela poliéster 180x180cm","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/cortina-ba-o-180x180cm.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/3c186017741d7bb6e2c3b99906cb1a60/0/7/07030351_01.jpg","precio_crc":2500,"cantidad":1,"aviso":""},
  {"id":"accesorios-bano","cat":"Baño","que":"Set de accesorios de baño","producto":"Dispensador jabón con base vidrio 3pcs","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/dispensador-jabon-con-base.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/3c186017741d7bb6e2c3b99906cb1a60/0/7/07030420_02.jpg","precio_crc":3800,"cantidad":1,"aviso":""},
  {"id":"basurero-bano","cat":"Baño","que":"Basurero de baño","producto":"Basurero redondo tapa vaivén plástico 9lt","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/basurero-redondo-tapa-vaiven-9-lt.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/3c186017741d7bb6e2c3b99906cb1a60/0/7/07180417_02_1.jpg","precio_crc":2800,"cantidad":1,"aviso":""},
  {"id":"cepillo-inodoro","cat":"Baño","que":"Cepillo para inodoro","producto":"Cepillo inodoro plástico 12x12x37cm 2pcs","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/cepillo-para-inodoro-con-base.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/3c186017741d7bb6e2c3b99906cb1a60/0/7/07170098_03.jpg","precio_crc":900,"cantidad":1,"aviso":""},
  {"id":"toallas-mano","cat":"Baño","que":"Toallas de mano (2)","producto":"Toalla De Mano Principal Gris Oscuro","tienda":"Walmart","url":"https://www.walmart.co.cr/toalla-de-mano-principal-gris-oscuro-7/p","imagen":"https://walmartcr.vteximg.com.br/arquivos/ids/878697/88171_01.jpg","precio_crc":1400,"cantidad":2,"aviso":""},
  {"id":"tapete","cat":"Casa","que":"Tapete de entrada","producto":"Alfombra entrada fibra coco y caucho 40x60cm","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/alfombra-entrada-40x60cm.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/3c186017741d7bb6e2c3b99906cb1a60/0/7/07080199_04.jpg","precio_crc":1800,"cantidad":1,"aviso":""},
  {"id":"cortinas","cat":"Casa","que":"Cortinas para ventana (2)","producto":"Cortina Blanca 140x240cm","tienda":"Aliss","url":"https://aliss.cr/cortina-blanca-140x240cm-3073246","imagen":"https://aliss.cr/media/catalog/product/7/f/7f5290b8926aa8eb44b0219d498bc02a76876a04_file.jpg","precio_crc":8990,"cantidad":2,"aviso":""},
  {"id":"bambu-suerte","cat":"Casa","que":"Bambú de la suerte","producto":"Lucky bambú 10 cm","tienda":"EPA","url":"https://cr.epaenlinea.com/es-cr/products/lucky-bambu-10-cm-unicamente-para-retiro-en-tienda","imagen":"https://cr.epaenlinea.com/cdn/shop/files/100013732.jpg?v=1790725319","precio_crc":895,"cantidad":1,"aviso":"Únicamente para retiro en tienda"},
  {"id":"incienso","cat":"Casa","que":"Incienso","producto":"Incienso","tienda":"EPA","url":"https://cr.epaenlinea.com/es-cr/products/incienso-unicamente-para-retiro-en-tienda","imagen":"https://cr.epaenlinea.com/cdn/shop/files/100013668.jpg?v=1790725365","precio_crc":995,"cantidad":1,"aviso":"Únicamente para retiro en tienda"},
  {"id":"almohadas","cat":"Casa","que":"Almohadas (2)","producto":"2 Pack Almohada Jumbo Hotel Blanca","tienda":"Walmart","url":"https://www.walmart.co.cr/2-pack-almohada-jumbo-hotel-blanca/p","imagen":"https://walmartcr.vteximg.com.br/arquivos/ids/771480/3241_01.jpg","precio_crc":3500,"cantidad":1,"aviso":""},
  {"id":"ganchos-ropa","cat":"Casa","que":"Ganchos de ropa de madera (10)","producto":"Gancho ropa madera 44x24cm 5unds","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/gancho-ropa-madera-44x24cm-5unds.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/1182dc89e4e827a7707b1d59d9a99abf/0/7/07170013.jpg","precio_crc":1900,"cantidad":2,"aviso":""},
  {"id":"cesto-ropa","cat":"Casa","que":"Cesto para ropa sucia","producto":"Cesta para ropa bambú 45x43.5x62.5cm","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/cesta-para-ropa-45x43-5x62-5cm.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/1182dc89e4e827a7707b1d59d9a99abf/0/7/07170119_04.jpg","precio_crc":11000,"cantidad":1,"aviso":""},
  {"id":"regleta","cat":"Casa","que":"Regleta con protector","producto":"Regleta Protecto 6 Salidas 90cm Negra Ea","tienda":"Walmart","url":"https://www.walmart.co.cr/regleta-protecto-6-salidas-90cm-negra-ea/p","imagen":"https://walmartcr.vteximg.com.br/arquivos/ids/612891/Regleta-Protecto-6-Salidas-90cm-Negra-Ea-1-101488.jpg","precio_crc":6500,"cantidad":1,"aviso":""},
  {"id":"botiquin","cat":"Casa","que":"Botiquín de primeros auxilios","producto":"Kit de primeros auxilios surtido 17 piezas","tienda":"Novex","url":"https://novex.cr/producto/435782/kit-de-primeros-auxilios-surtido-17-piezas.html","imagen":"https://ferreteriavidri.com/images/items/large/435782.jpg","precio_crc":3500,"cantidad":1,"aviso":""},
  {"id":"extintor","cat":"Casa","que":"Extintor pequeño para la cocina","producto":"Extintor abc recargable 1kg","tienda":"Pequeño Mundo","url":"https://tienda.pequenomundo.com/extintor-recargable-1-kg.html","imagen":"https://tienda.pequenomundo.com/media/catalog/product/cache/1182dc89e4e827a7707b1d59d9a99abf/1/0/10040016-1.jpg","precio_crc":5200,"cantidad":1,"aviso":""},
  {"id":"despensa","cat":"Despensa","que":"Arroz japonés para sushi","producto":"Arroz para Sushi Nishiki (907g)","tienda":"Ancyfer Market","url":"https://ancyfermarket.com/products/arroz-para-sushi-nishiki-907g","imagen":"https://ancyfermarket.com/cdn/shop/files/ArrozparaSushiNishiki907gShopi_1200x1200.png?v=1728499695","precio_crc":3300,"cantidad":1,"aviso":""},
  {"id":"frascos-bambu","cat":"Despensa","que":"Frascos de vidrio con tapa de bambú (3)","producto":"Conservador Con Tapa De Bambú De 34Oz","tienda":"Aliss","url":"https://aliss.cr/conservador-con-tapa-de-bambu-de-34oz-3059452","imagen":"https://aliss.cr/media/catalog/product/4/d/4de2db7df9b15faa53f0250d7106bb23d94f89df_file.jpg","precio_crc":2700,"cantidad":3,"aviso":""}
];

// ============================================================================================
// Logica.js · reglas de negocio PURAS del Té de cocina (contrato §5 y §6).
// Sin APIs de Google: se prueba en Node (tests/logica.test.mjs) y el build la concatena en
// apps-script/Code.gs. Servidor.js solo lee la hoja, llama a estas funciones y escribe lo que digan.
// Regla de oro: aquí no se lee la hoja, ni la caché, ni el reloj (la hora entra por parámetro).
// ============================================================================================

var LIMITES = Object.freeze({
  TOPE_APARTADOS_POR_DISPOSITIVO: 5,
  MAX_ESCRITURAS_POR_MINUTO_DISPOSITIVO: 6,
  MAX_ESCRITURAS_POR_MINUTO_GLOBAL: 15,
  MAX_FILAS_REGISTROS: 2000,
  CACHE_VER_SEGUNDOS: 5,
  LOCK_MS: 10000,
  VENTANA_FRECUENCIA_S: 60,
  MAX_CUERPO_CARACTERES: 4000,
});

var TIPOS = ['apartado', 'parecido'];
var RE_TOKEN = /^[0-9a-f]{64}$/;
var RE_CONTROL = /[\u0000-\u001F\u007F]/;
var RE_LETRA = /\p{L}/u;

// Mensajes sugeridos (el copy final vive en site/app.js). `codigo` y `datos` son contrato; esto no.
var MENSAJES = Object.freeze({
  accion_invalida: 'Esa acción no existe. Recarga la página e intenta de nuevo.',
  entrada_invalida: 'Faltan datos en la solicitud. Recarga la página e intenta de nuevo.',
  articulo_invalido: 'Ese artículo ya no está en la lista.',
  nombre_invalido: 'Escribe tu nombre (2 a 40 letras).',
  tipo_invalido: 'Opción no válida. Recarga la página e intenta de nuevo.',
  token_invalido: 'Recarga la página e intenta de nuevo.',
  ya_apartado: 'Alguien acaba de apartar este. Puedes elegir otro o marcar "Llevo algo parecido".',
  ya_registrado_distinto: 'Ya marcaste este artículo de otra forma. Suéltalo primero.',
  tope_dispositivo: 'Ya apartaste 5. Suelta uno para apartar otro.',
  demasiadas_solicitudes: 'Espera un momento e intenta de nuevo.',
  lista_cerrada: 'La lista está cerrada por ahora. Avísale a Andrey.',
  error_interno: 'Algo falló. Intenta de nuevo o avísale a Andrey.',
});

/** Sobre de error del contrato §6: { ok:false, codigo, mensaje, datos }. */
function fallo(codigo, datos, mensaje) {
  return {
    ok: false,
    codigo: codigo,
    mensaje: mensaje || MENSAJES[codigo] || MENSAJES.error_interno,
    datos: datos || {},
  };
}

// ------------------------------------------------------------------ normalización de la hoja

function texto_(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function clave_(v) {
  return texto_(v).toLowerCase();
}

// Topes de texto del catálogo que Andrey escribe en la hoja (lo que pase se corta).
var TOPES_ARTICULO = Object.freeze({ cat: 30, que: 80, producto: 120, tienda: 40, aviso: 160, url: 600 });
var CAT_POR_DEFECTO = 'Otros';

/** Texto de una celda del catálogo: sin controles, sin espacios dobles y con tope de largo. */
function textoCatalogo_(v, tope) {
  return texto_(v).replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').slice(0, tope);
}

/** Solo enlaces https; cualquier otra cosa (javascript:, http:, texto suelto) queda vacía. */
function urlSegura_(v) {
  var u = texto_(v);
  return /^https:\/\/[^\s"'<>]+$/i.test(u) && u.length <= TOPES_ARTICULO.url ? u : '';
}

/** Entero ≥ 0 a partir de «2800», «₡2 800» o «2.800»; null si no hay número. */
function enteroCelda_(v) {
  if (typeof v === 'number') return isFinite(v) && v >= 0 ? Math.round(v) : null;
  var digitos = texto_(v).replace(/[^0-9]/g, '');
  return digitos ? Number(digitos) : null;
}

/** Id estable a partir de un nombre: «Sartén 20 cm» → «sarten-20-cm». */
function idDesdeTexto(v) {
  return texto_(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
}

/**
 * Filas de la pestaña `articulos` (objetos por encabezado) → artículos en el ORDEN DE LA HOJA.
 * La hoja es el panel de Andrey: cada fila trae su catálogo (cat, que, producto, tienda, url, imagen,
 * precio_crc, cantidad, aviso). `activo` es falso solo si la celda dice «no» (o FALSE), y una fila
 * sin `id` o sin `que` no se muestra ni se puede apartar. Ids repetidos: gana la primera fila.
 */
function normalizarArticulos(filas) {
  var lista = [];
  var vistos = {};
  (filas || []).forEach(function (f) {
    var id = clave_(f.id);
    if (!id || vistos[id]) return;
    vistos[id] = true;
    var act = clave_(f.activo);
    var que = textoCatalogo_(f.que, TOPES_ARTICULO.que);
    var cantidad = enteroCelda_(f.cantidad);
    lista.push({
      id: id,
      cat: textoCatalogo_(f.cat, TOPES_ARTICULO.cat) || CAT_POR_DEFECTO,
      que: que,
      producto: textoCatalogo_(f.producto, TOPES_ARTICULO.producto),
      tienda: textoCatalogo_(f.tienda, TOPES_ARTICULO.tienda),
      url: urlSegura_(f.url),
      imagen: urlSegura_(f.imagen),
      precio_crc: enteroCelda_(f.precio_crc),
      cantidad: cantidad && cantidad <= 50 ? cantidad : 1,
      aviso: textoCatalogo_(f.aviso, TOPES_ARTICULO.aviso),
      activo: !(act === 'no' || act === 'false') && que !== '',
    });
  });
  return lista;
}

/**
 * Filas de la pestaña `registros` (objetos por encabezado + `fila` = número de fila en la hoja)
 * → registros normalizados. Hoja a prueba de Andrey: `estado` vacío = activo, mayúsculas y
 * espacios no importan, filas sin `id_articulo` se ignoran.
 */
function normalizarRegistros(filas) {
  var lista = [];
  (filas || []).forEach(function (f) {
    var id = clave_(f.id_articulo);
    if (!id) return;
    var estado = clave_(f.estado);
    lista.push({
      fila: f.fila,
      id_articulo: id,
      tipo: clave_(f.tipo),
      nombre: texto_(f.nombre),
      hash_token: clave_(f.hash_token),
      estado: estado === '' ? 'activo' : estado,
      origen: clave_(f.origen),
    });
  });
  return lista;
}

function esActivo_(r) {
  return r.estado === 'activo' && TIPOS.indexOf(r.tipo) !== -1;
}

// ------------------------------------------------------------------ validaciones (una sola fuente)

/**
 * Valida el token de dispositivo y devuelve su hash. `hashear(texto) → hex64` lo inyecta quien
 * llama (Servidor.js usa SHA-256 de Utilities; las pruebas, node:crypto). Nunca se guarda el token.
 */
function validarToken(token, hashear) {
  if (typeof token !== 'string' || !RE_TOKEN.test(token)) return fallo('token_invalido');
  return { ok: true, hash: String(hashear(token)).toLowerCase() };
}

/** Recorta, rechaza control, colapsa espacios internos y mide en caracteres reales (emoji = 1). */
function validarNombre(nombre) {
  if (typeof nombre !== 'string') return fallo('nombre_invalido', { motivo: 'corto' });
  var recortado = nombre.trim();
  var limpio = recortado.replace(/\s+/g, ' ');
  var largo = Array.from(limpio).length;
  if (largo < 2) return fallo('nombre_invalido', { motivo: 'corto' });
  if (largo > 40) return fallo('nombre_invalido', { motivo: 'largo' });
  if (RE_CONTROL.test(recortado) || !RE_LETRA.test(limpio)) {
    return fallo('nombre_invalido', { motivo: 'caracteres' });
  }
  return { ok: true, nombre: limpio };
}

/** Primera palabra del nombre. Si Andrey dejó el nombre vacío en la hoja, «Alguien». */
function nombrePila(nombre) {
  var t = texto_(nombre);
  if (!t) return 'Alguien';
  return t.split(/\s+/)[0];
}

function validarArticulo(id, articulos) {
  var buscado = clave_(id);
  for (var i = 0; i < articulos.length; i++) {
    if (articulos[i].id === buscado) {
      return articulos[i].activo ? { ok: true, id: buscado } : fallo('articulo_invalido');
    }
  }
  return fallo('articulo_invalido');
}

function esObjeto_(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function faltaCampo_(cuerpo, campos) {
  for (var i = 0; i < campos.length; i++) {
    var v = cuerpo[campos[i]];
    if (typeof v !== 'string') return fallo('entrada_invalida', { campo: campos[i] });
  }
  return null;
}

/**
 * Valida el cuerpo de `apartar` en el orden del contrato:
 * campos → tipo → artículo → nombre → token. Devuelve { ok, entrada:{articulo,nombre,tipo,hash} }.
 */
function prepararApartar(cuerpo, articulos, hashear) {
  if (!esObjeto_(cuerpo)) return fallo('entrada_invalida', { campo: 'cuerpo' });
  var falta = faltaCampo_(cuerpo, ['articulo_id', 'nombre', 'tipo', 'token']);
  if (falta) return falta;
  if (TIPOS.indexOf(cuerpo.tipo) === -1) return fallo('tipo_invalido');
  var art = validarArticulo(cuerpo.articulo_id, articulos);
  if (!art.ok) return art;
  var nom = validarNombre(cuerpo.nombre);
  if (!nom.ok) return nom;
  var tok = validarToken(cuerpo.token, hashear);
  if (!tok.ok) return tok;
  return { ok: true, entrada: { articulo: art.id, nombre: nom.nombre, tipo: cuerpo.tipo, hash: tok.hash } };
}

/** Valida el cuerpo de `soltar`: campos → artículo → token. */
function prepararSoltar(cuerpo, articulos, hashear) {
  if (!esObjeto_(cuerpo)) return fallo('entrada_invalida', { campo: 'cuerpo' });
  var falta = faltaCampo_(cuerpo, ['articulo_id', 'token']);
  if (falta) return falta;
  var art = validarArticulo(cuerpo.articulo_id, articulos);
  if (!art.ok) return art;
  var tok = validarToken(cuerpo.token, hashear);
  if (!tok.ok) return tok;
  return { ok: true, entrada: { articulo: art.id, hash: tok.hash } };
}

// ------------------------------------------------------------------ estado y proyección pública

/** Estado público de un artículo: solo nombres de pila. Gana el apartado de la fila más arriba. */
function estadoArticulo(registros, articuloId) {
  var apartadoPor = null;
  var parecidos = [];
  registros.forEach(function (r) {
    if (r.id_articulo !== articuloId || !esActivo_(r)) return;
    if (r.tipo === 'apartado') {
      if (apartadoPor === null) apartadoPor = nombrePila(r.nombre);
    } else {
      parecidos.push(nombrePila(r.nombre));
    }
  });
  return { apartado_por: apartadoPor, parecidos: parecidos };
}

/**
 * Respuesta de `ver` (§6): todos los artículos activos en el orden de la hoja, con nombre de pila del apartado,
 * pilas de parecidos y `mio`. Nunca nombre completo, hash_token, creado ni origen.
 * `hash` puede ser null (token ausente o inválido → mio = null). `ahora` (Date) lo pasa quien llama.
 */
function proyectarPublico(articulos, registros, hash, ahora) {
  var activos = registros.filter(esActivo_);
  var mios = {};
  if (hash) {
    activos.forEach(function (r) {
      if (r.hash_token !== hash) return;
      if (mios[r.id_articulo] !== 'apartado') mios[r.id_articulo] = r.tipo;
    });
  }
  var visibles = articulos.filter(function (a) { return a.activo; });
  var lista = visibles.map(function (a) {
    var e = estadoArticulo(activos, a.id);
    return { id: a.id, apartado_por: e.apartado_por, parecidos: e.parecidos, mio: mios[a.id] || null };
  });
  // El catálogo público sale de la hoja: la página lo dibuja con esto (lo que trae el HTML es respaldo).
  var catalogo = visibles.map(function (a) {
    return {
      id: a.id, cat: a.cat, que: a.que, producto: a.producto, tienda: a.tienda, url: a.url,
      imagen: a.imagen, precio_crc: a.precio_crc, cantidad: a.cantidad, aviso: a.aviso,
    };
  });
  return { ok: true, generado_en: ahora.toISOString(), articulos: lista, catalogo: catalogo };
}

// ------------------------------------------------------------------ decisiones de escritura

/**
 * Decide un `apartar` (siempre se llama DENTRO del lock, con `registros` recién leídos).
 * Orden: tope de filas → fila activa propia (repetido / ya_registrado_distinto) → ya_apartado →
 * tope_dispositivo → insertar. Devuelve { accion: 'insertar'|'repetido'|'error', fila?, respuesta }.
 * La fila no trae `creado`: lo pone Servidor.js con la hora real.
 */
function decidirApartar(registros, entrada, limites) {
  var lim = limites || LIMITES;
  if (registros.length >= lim.MAX_FILAS_REGISTROS) {
    return { accion: 'error', respuesta: fallo('lista_cerrada') };
  }
  var activos = registros.filter(esActivo_);
  var hash = entrada.hash;
  var articulo = entrada.articulo;

  var propia = null;
  for (var i = 0; i < activos.length; i++) {
    if (activos[i].id_articulo === articulo && activos[i].hash_token === hash) { propia = activos[i]; break; }
  }
  if (propia) {
    if (propia.tipo === entrada.tipo) {
      return {
        accion: 'repetido',
        respuesta: {
          ok: true, articulo_id: articulo, tipo: propia.tipo, nombre: propia.nombre,
          nombre_pila: nombrePila(propia.nombre), repetido: true, primero_en_dispositivo: false,
          estado: estadoArticulo(activos, articulo),
        },
      };
    }
    var msgDistinto = propia.tipo === 'parecido'
      ? 'Ya marcaste este como "Llevo algo parecido". Suéltalo primero.'
      : 'Ya apartaste este. Suéltalo primero si prefieres marcar "Llevo algo parecido".';
    return { accion: 'error', respuesta: fallo('ya_registrado_distinto', { tipo_actual: propia.tipo }, msgDistinto) };
  }

  if (entrada.tipo === 'apartado') {
    var estado = estadoArticulo(activos, articulo);
    if (estado.apartado_por !== null) {
      return {
        accion: 'error',
        respuesta: fallo('ya_apartado', { por: estado.apartado_por },
          estado.apartado_por + ' acaba de apartar este. Puedes elegir otro o marcar "Llevo algo parecido".'),
      };
    }
    var mios = activos.filter(function (r) { return r.hash_token === hash && r.tipo === 'apartado'; }).length;
    if (mios >= lim.TOPE_APARTADOS_POR_DISPOSITIVO) {
      var tope = lim.TOPE_APARTADOS_POR_DISPOSITIVO;
      return {
        accion: 'error',
        respuesta: fallo('tope_dispositivo', { tope: tope }, 'Ya apartaste ' + tope + '. Suelta uno para apartar otro.'),
      };
    }
  }

  var fila = {
    id_articulo: articulo, tipo: entrada.tipo, nombre: entrada.nombre, hash_token: hash,
    estado: 'activo', origen: 'invitado',
  };
  var primero = !registros.some(function (r) { return r.hash_token === hash; });
  return {
    accion: 'insertar',
    fila: fila,
    respuesta: {
      ok: true, articulo_id: articulo, tipo: entrada.tipo, nombre: entrada.nombre,
      nombre_pila: nombrePila(entrada.nombre), repetido: false, primero_en_dispositivo: primero,
      estado: estadoArticulo(activos.concat([fila]), articulo),
    },
  };
}

/**
 * Decide un `soltar` (dentro del lock). Solo toca filas activas de (artículo, MI hash): lo de otro
 * dispositivo o lo que Andrey apartó a mano (hash vacío) nunca se suelta desde aquí.
 * Idempotente: sin fila activa → liberado:false con el estado real.
 */
function decidirSoltar(registros, entrada) {
  var hash = entrada.hash;
  var filas = [];
  var quedan = [];
  registros.forEach(function (r) {
    if (esActivo_(r) && hash && r.id_articulo === entrada.articulo && r.hash_token === hash) filas.push(r.fila);
    else quedan.push(r);
  });
  return {
    filas: filas,
    respuesta: { ok: true, liberado: filas.length > 0, estado: estadoArticulo(quedan, entrada.articulo) },
  };
}

// ------------------------------------------------------------------ frecuencia (CacheService)

/**
 * Contador de ventana fija guardado como texto «n:expiraMs». Devuelve si se permite, el valor a
 * guardar y su expiración en segundos. Se usa dentro del lock (no necesita incremento atómico).
 */
function decidirFrecuencia(valor, ahoraMs, maximo, ventanaS) {
  var n = 0;
  var expira = 0;
  var m = /^(\d+):(\d+)$/.exec(texto_(valor));
  if (m) { n = Number(m[1]); expira = Number(m[2]); }
  if (!m || expira <= ahoraMs) { n = 0; expira = ahoraMs + ventanaS * 1000; }
  var ttl = Math.max(1, Math.ceil((expira - ahoraMs) / 1000));
  if (n + 1 > maximo) return { permitido: false, reintentar_en_s: ttl };
  return { permitido: true, valor: (n + 1) + ':' + expira, ttl_s: ttl };
}

/** Aplica el límite por dispositivo y el global a la vez. Si alguno niega, no cuenta ninguno. */
function controlFrecuencia(valorDispositivo, valorGlobal, ahoraMs, limites) {
  var lim = limites || LIMITES;
  var d = decidirFrecuencia(valorDispositivo, ahoraMs, lim.MAX_ESCRITURAS_POR_MINUTO_DISPOSITIVO, lim.VENTANA_FRECUENCIA_S);
  var g = decidirFrecuencia(valorGlobal, ahoraMs, lim.MAX_ESCRITURAS_POR_MINUTO_GLOBAL, lim.VENTANA_FRECUENCIA_S);
  if (!d.permitido || !g.permitido) {
    var espera = Math.max(d.permitido ? 0 : d.reintentar_en_s, g.permitido ? 0 : g.reintentar_en_s);
    return { ok: false, error: fallo('demasiadas_solicitudes', { motivo: 'frecuencia', reintentar_en_s: espera }) };
  }
  return { ok: true, dispositivo: d, global: g };
}

// ------------------------------------------------------------------ utilidades para la hoja

/**
 * Texto de un invitado listo para escribir en una celda sin que Sheets lo convierta en fórmula
 * («=IMPORTXML(...)», «+1», «-x», «@a»): se antepone un apóstrofo, que Sheets no muestra.
 */
function textoSeguroParaCelda(valor) {
  var t = valor === null || valor === undefined ? '' : String(valor);
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

/** Cambia el separador de argumentos de una fórmula (`;` ↔ `,`) sin tocar lo que va entre comillas. */
function formulaConSeparador(formula, separador) {
  var otro = separador === ',' ? ';' : ',';
  var dentro = false;
  var salida = '';
  for (var i = 0; i < formula.length; i++) {
    var c = formula.charAt(i);
    if (c === '"') dentro = !dentro;
    salida += !dentro && c === otro ? separador : c;
  }
  return salida;
}

/** Letra de columna (1 → A, 27 → AA). */
function letraColumna(n) {
  var s = '';
  while (n > 0) {
    var r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** @OnlyCurrentDoc */
// ↑ Limita el permiso a ESTA hoja (spreadsheets.currentonly). No quitar: sin él, Google pediría
//   acceso a todas las hojas de cálculo de Andrey.
// ============================================================================================
// Servidor.js · capa fina con APIs de Google (contrato §5, §6 y §8).
// doGet → `ver` · doPost → `apartar` / `soltar` · setup() → prepara la hoja (idempotente).
// onEdit (disparador simple) → en «articulos», pone el `id` de las filas nuevas que Andrey agrega.
// Toda la decisión de negocio vive en Logica.js. Aquí: leer la hoja, lock, caché, escribir.
// Solo usa SpreadsheetApp (la hoja ligada), LockService, CacheService, ContentService y Utilities.
// `CATALOGO` lo agrega el build al generar Code.gs.
// ============================================================================================

var ZONA_HORARIA = 'America/Costa_Rica';
var HOJA = Object.freeze({ ARTICULOS: 'articulos', REGISTROS: 'registros', RESUMEN: 'resumen' });
var ENCABEZADOS = Object.freeze({
  // «articulos» es el panel de Andrey: una fila por regalo, en el orden en que se ve en la página.
  articulos: ['id', 'cat', 'que', 'producto', 'tienda', 'url', 'imagen', 'precio_crc', 'cantidad', 'aviso', 'activo'],
  registros: ['id_articulo', 'tipo', 'nombre', 'hash_token', 'creado', 'estado', 'liberado', 'origen'],
});
var MARCA_PROTECCION = 'tdc: ';
// Celdas que setup() siembra desde CATALOGO solo si están vacías (nunca pisa lo que Andrey escribió).
var CAMPOS_SEMILLA = ['cat', 'que', 'producto', 'tienda', 'url', 'imagen', 'precio_crc', 'cantidad', 'aviso'];

// ------------------------------------------------------------------ entradas HTTP

function doGet(e) {
  return responder_(atender_(function () { return accionGet_(e); }));
}

function doPost(e) {
  return responder_(atender_(function () { return accionPost_(e); }));
}

function atender_(fn) {
  try {
    return fn();
  } catch (err) {
    // Nunca se registra el token ni el cuerpo: solo el error.
    console.error('error_interno: ' + (err && err.stack ? err.stack : err));
    return fallo('error_interno');
  }
}

/** Siempre HTTP 200 con JSON (Apps Script no deja fijar el status). Acepta objeto o JSON ya hecho. */
function responder_(respuesta) {
  var cuerpo = typeof respuesta === 'string' ? respuesta : JSON.stringify(respuesta);
  return ContentService.createTextOutput(cuerpo).setMimeType(ContentService.MimeType.JSON);
}

function accionGet_(e) {
  var p = (e && e.parameter) || {};
  if (p.accion !== 'ver') return fallo('accion_invalida');
  return ver_(p.token);
}

function accionPost_(e) {
  var contenido = e && e.postData && typeof e.postData.contents === 'string' ? e.postData.contents : '';
  if (!contenido || contenido.length > LIMITES.MAX_CUERPO_CARACTERES) return fallo('entrada_invalida', { campo: 'cuerpo' });
  var cuerpo;
  try {
    cuerpo = JSON.parse(contenido);
  } catch (err) {
    return fallo('entrada_invalida', { campo: 'cuerpo' });
  }
  if (cuerpo === null || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) return fallo('entrada_invalida', { campo: 'cuerpo' });
  if (cuerpo.accion === 'apartar') return apartar_(cuerpo);
  if (cuerpo.accion === 'soltar') return soltar_(cuerpo);
  return fallo('accion_invalida');
}

// ------------------------------------------------------------------ acciones

/** `ver`: sin lock; caché de 5 s por (generación, hash|anon). Token inválido = anónimo, no error. */
function ver_(token) {
  var hash = typeof token === 'string' && RE_TOKEN.test(token) ? sha256Hex_(token) : null;
  var cache = CacheService.getScriptCache();
  var clave = 'ver:' + (cache.get('ver:gen') || '0') + ':' + (hash || 'anon');
  var guardado = cache.get(clave);
  if (guardado) return guardado;

  var libro = libro_();
  var articulos = normalizarArticulos(leerTabla_(libro, HOJA.ARTICULOS).filas);
  var registros = normalizarRegistros(leerTabla_(libro, HOJA.REGISTROS).filas);
  var json = JSON.stringify(proyectarPublico(articulos, registros, hash, new Date()));
  try {
    cache.put(clave, json, LIMITES.CACHE_VER_SEGUNDOS);
  } catch (err) {
    console.warn('No se pudo guardar ver en caché: ' + err);
  }
  return json;
}

function apartar_(cuerpo) {
  var libro = libro_();
  var articulos = normalizarArticulos(leerTabla_(libro, HOJA.ARTICULOS).filas);
  var prep = prepararApartar(cuerpo, articulos, sha256Hex_);
  if (!prep.ok) return prep;
  var entrada = prep.entrada;

  return conLock_(function () {
    var limite = aplicarFrecuencia_(entrada.hash);
    if (limite) return limite;
    var tabla = leerTabla_(libro, HOJA.REGISTROS);
    var decision = decidirApartar(normalizarRegistros(tabla.filas), entrada, LIMITES);
    if (decision.accion === 'insertar') {
      var fila = decision.fila;
      var valores = {
        id_articulo: fila.id_articulo,
        tipo: fila.tipo,
        nombre: textoSeguroParaCelda(fila.nombre),
        hash_token: fila.hash_token,
        creado: new Date(),
        estado: fila.estado,
        liberado: '',
        origen: fila.origen,
      };
      var arreglo = [];
      for (var i = 0; i < tabla.ancho; i++) arreglo.push('');
      Object.keys(valores).forEach(function (k) { arreglo[tabla.indice[k]] = valores[k]; });
      tabla.hoja.appendRow(arreglo);
      SpreadsheetApp.flush();
      invalidarVer_();
    }
    return decision.respuesta;
  });
}

function soltar_(cuerpo) {
  var libro = libro_();
  var articulos = normalizarArticulos(leerTabla_(libro, HOJA.ARTICULOS).filas);
  var prep = prepararSoltar(cuerpo, articulos, sha256Hex_);
  if (!prep.ok) return prep;
  var entrada = prep.entrada;

  return conLock_(function () {
    var limite = aplicarFrecuencia_(entrada.hash);
    if (limite) return limite;
    var tabla = leerTabla_(libro, HOJA.REGISTROS);
    var decision = decidirSoltar(normalizarRegistros(tabla.filas), entrada);
    if (decision.filas.length) {
      var ahora = new Date();
      decision.filas.forEach(function (n) {
        // Comprobación: la fila sigue siendo de este artículo y este dispositivo (por si Andrey
        // borró filas mientras tanto). Si no, se aborta sin tocar nada.
        var actual = tabla.hoja.getRange(n, 1, 1, tabla.ancho).getValues()[0];
        var id = String(actual[tabla.indice.id_articulo]).trim().toLowerCase();
        var h = String(actual[tabla.indice.hash_token]).trim().toLowerCase();
        if (id !== entrada.articulo || h !== entrada.hash) throw new Error('La fila ' + n + ' cambió durante soltar');
        // Primero la fecha: si falla la segunda escritura, la fila sigue activa y reintentar la repara.
        tabla.hoja.getRange(n, tabla.indice.liberado + 1).setValue(ahora);
        tabla.hoja.getRange(n, tabla.indice.estado + 1).setValue('liberado');
      });
      SpreadsheetApp.flush();
      invalidarVer_();
    }
    return decision.respuesta;
  });
}

// ------------------------------------------------------------------ lock, frecuencia, caché, hash

function conLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LIMITES.LOCK_MS)) {
    return fallo('demasiadas_solicitudes', { motivo: 'ocupado', reintentar_en_s: 3 });
  }
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/** Devuelve el error de frecuencia o null. Se llama dentro del lock. */
function aplicarFrecuencia_(hash) {
  var cache = CacheService.getScriptCache();
  var kd = 'rl:d:' + hash;
  var kg = 'rl:g';
  var actuales = cache.getAll([kd, kg]) || {};
  var r = controlFrecuencia(actuales[kd], actuales[kg], Date.now(), LIMITES);
  if (!r.ok) return r.error;
  cache.put(kd, r.dispositivo.valor, r.dispositivo.ttl_s);
  cache.put(kg, r.global.valor, r.global.ttl_s);
  return null;
}

function invalidarVer_() {
  // La escritura ya quedó en la hoja: un fallo de caché no debe convertirla en error_interno.
  try {
    CacheService.getScriptCache().put('ver:gen', String(Date.now()), 21600);
  } catch (e) {
    console.warn('No se pudo invalidar la caché de ver: ' + e);
  }
}

function sha256Hex_(texto) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, texto, Utilities.Charset.UTF_8);
  var hex = '';
  for (var i = 0; i < bytes.length; i++) {
    var b = (bytes[i] + 256) % 256;
    hex += (b < 16 ? '0' : '') + b.toString(16);
  }
  return hex;
}

// ------------------------------------------------------------------ lectura de la hoja por encabezado

function libro_() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  if (!libro) throw new Error('El script no está ligado a una hoja (ábrelo desde Extensiones → Apps Script).');
  return libro;
}

/** Lee una pestaña completa y la devuelve como objetos por encabezado (+ `fila`). */
function leerTabla_(libro, nombre) {
  var hoja = libro.getSheetByName(nombre);
  if (!hoja) throw new Error('Falta la pestaña «' + nombre + '». Corre setup().');
  var valores = hoja.getDataRange().getValues();
  var encabezados = (valores[0] || []).map(function (h) { return String(h).trim(); });
  var indice = {};
  encabezados.forEach(function (h, i) { if (h && !(h in indice)) indice[h] = i; });
  ENCABEZADOS[nombre].forEach(function (h) {
    if (!(h in indice)) throw new Error('Falta el encabezado «' + h + '» en «' + nombre + '». Corre setup().');
  });
  var filas = [];
  for (var r = 1; r < valores.length; r++) {
    var obj = { fila: r + 1 };
    ENCABEZADOS[nombre].forEach(function (h) { obj[h] = valores[r][indice[h]]; });
    filas.push(obj);
  }
  return { hoja: hoja, indice: indice, ancho: Math.max(encabezados.length, 1), filas: filas };
}

// ------------------------------------------------------------------ setup() (idempotente)

/**
 * Prepara la hoja. Se puede correr las veces que haga falta (también después de cambiar el
 * catálogo). No borra ni reordena registros: solo agrega lo que falte y actualiza `articulos`.
 */
function setup() {
  var libro = libro_();
  try {
    libro.setSpreadsheetTimeZone(ZONA_HORARIA);
  } catch (err) {
    console.warn('No pude fijar la zona horaria; ponla a mano en Archivo → Configuración: ' + err);
  }

  var articulos = prepararArticulos_(libro);
  var registros = prepararRegistros_(libro);
  prepararResumen_(libro, registros);
  invalidarVer_();
  SpreadsheetApp.flush();

  var activos = articulos.filter(function (a) { return a.activo; }).length;
  var msg = 'Listo: ' + activos + ' artículos activos de ' + articulos.length + ' en «articulos». '
    + 'Pestañas «registros» y «resumen» listas. Zona horaria: ' + libro.getSpreadsheetTimeZone() + '.';
  console.log(msg);
  return msg;
}

function hojaO_(libro, nombre) {
  return libro.getSheetByName(nombre) || libro.insertSheet(nombre);
}

/** Asegura los encabezados en la fila 1 sin mover columnas existentes. Devuelve el índice (base 1). */
function asegurarEncabezados_(hoja, requeridos) {
  var ancho = Math.max(hoja.getLastColumn(), 1);
  var actuales = hoja.getRange(1, 1, 1, ancho).getValues()[0].map(function (h) { return String(h).trim(); });
  if (actuales.every(function (h) { return h === ''; })) actuales = [];
  var faltan = requeridos.filter(function (h) { return actuales.indexOf(h) === -1; });
  if (faltan.length) {
    hoja.getRange(1, actuales.length + 1, 1, faltan.length).setValues([faltan]);
    actuales = actuales.concat(faltan);
  }
  hoja.setFrozenRows(1);
  hoja.getRange(1, 1, 1, actuales.length).setFontWeight('bold');
  var col = {};
  actuales.forEach(function (h, i) { if (h && !(h in col)) col[h] = i + 1; });
  return col;
}

function proteger_(rangoOHoja, descripcion) {
  var p = rangoOHoja.protect();
  p.setDescription(MARCA_PROTECCION + descripcion);
  p.setWarningOnly(true);
}

function quitarProteccionesPropias_(libro) {
  [SpreadsheetApp.ProtectionType.SHEET, SpreadsheetApp.ProtectionType.RANGE].forEach(function (tipo) {
    libro.getProtections(tipo).forEach(function (p) {
      if (String(p.getDescription()).indexOf(MARCA_PROTECCION) === 0) p.remove();
    });
  });
}

/**
 * «articulos» es el panel de Andrey: la hoja manda. setup() solo siembra desde CATALOGO lo que falte
 * (filas de ids nuevos y celdas vacías) y nunca pisa textos ni cambia `activo` de una fila que ya existe.
 * Devuelve los artículos normalizados (Logica.normalizarArticulos), en el orden de la hoja.
 */
function prepararArticulos_(libro) {
  if (typeof CATALOGO === 'undefined') {
    throw new Error('Falta CATALOGO: pega apps-script/Code.gs completo (lo genera node scripts/build.mjs).');
  }
  quitarProteccionesPropias_(libro);
  var hoja = hojaO_(libro, HOJA.ARTICULOS);
  migrarColumnaOrden_(hoja);
  var col = asegurarEncabezados_(hoja, ENCABEZADOS.articulos);
  var ancho = hoja.getLastColumn();
  var ultima = hoja.getLastRow();
  var datos = ultima > 1 ? hoja.getRange(2, 1, ultima - 1, ancho).getValues() : [];

  var porId = {};
  datos.forEach(function (fila, i) {
    var id = clave_(fila[col.id - 1]);
    if (id && !(id in porId)) porId[id] = i;
  });
  CATALOGO.forEach(function (a) {
    var i = porId[a.id];
    if (i === undefined) {
      var nueva = [];
      for (var k = 0; k < ancho; k++) nueva.push('');
      nueva[col.id - 1] = a.id;
      nueva[col.activo - 1] = 'si';
      datos.push(nueva);
      i = datos.length - 1;
      porId[a.id] = i;
    }
    var f = datos[i];
    CAMPOS_SEMILLA.forEach(function (c) {
      var v = a[c];
      if (v === undefined || v === null || v === '' || texto_(f[col[c] - 1]) !== '') return;
      f[col[c] - 1] = typeof v === 'string' ? textoSeguroParaCelda(v) : v;
    });
  });
  if (datos.length) {
    ['id', 'url', 'imagen'].forEach(function (h) { hoja.getRange(2, col[h], datos.length, 1).setNumberFormat('@'); });
    hoja.getRange(2, 1, datos.length, ancho).setValues(datos);
  }
  var regla = SpreadsheetApp.newDataValidation().requireValueInList(['si', 'no'], true).setAllowInvalid(true)
    .setHelpText('si = se ve en la página · no = se esconde (no borres la fila)').build();
  hoja.getRange(2, col.activo, Math.max(hoja.getMaxRows() - 1, 1), 1).setDataValidation(regla);
  proteger_(hoja.getRange(1, 1, 1, hoja.getLastColumn()), 'encabezados: no los renombres (el script busca columnas por nombre)');

  return normalizarArticulos(datos.map(function (f) {
    var obj = {};
    ENCABEZADOS.articulos.forEach(function (h) { obj[h] = f[col[h] - 1]; });
    return obj;
  }));
}

/**
 * Migración única desde la versión con columna `orden`: ordena las filas por ella, la quita y deja las
 * columnas en el orden del panel (las columnas propias de Andrey quedan al final).
 */
function migrarColumnaOrden_(hoja) {
  var ancho = hoja.getLastColumn();
  if (ancho < 1) return;
  var valores = hoja.getRange(1, 1, Math.max(hoja.getLastRow(), 1), ancho).getValues();
  var enc = valores[0].map(function (h) { return String(h).trim(); });
  var iOrden = enc.indexOf('orden');
  if (iOrden === -1) return;
  var filas = valores.slice(1).map(function (f, i) {
    var n = Number(f[iOrden]);
    return { f: f, clave: texto_(f[iOrden]) !== '' && isFinite(n) ? n : 1e9 + i };
  }).sort(function (a, b) { return a.clave - b.clave; });
  var nuevos = ENCABEZADOS.articulos.concat(enc.filter(function (h) {
    return h && h !== 'orden' && ENCABEZADOS.articulos.indexOf(h) === -1;
  }));
  var salida = [nuevos].concat(filas.map(function (x) {
    return nuevos.map(function (h) { var k = enc.indexOf(h); return k === -1 ? '' : x.f[k]; });
  }));
  hoja.clear();
  hoja.getRange(1, 1, salida.length, nuevos.length).setValues(salida);
}

// ------------------------------------------------------------------ onEdit: ids de filas nuevas

/**
 * Disparador simple: cuando Andrey escribe el nombre (`que`) de una fila nueva en «articulos», le pone
 * un `id` fijo sacado del nombre (único) y `activo = si`. Así no tiene que inventarse ids; y como el id
 * queda escrito, cambiar el nombre después no desconecta lo que ya se apartó.
 */
function onEdit(e) {
  try {
    var rango = e && e.range;
    if (!rango || rango.getSheet().getName() !== HOJA.ARTICULOS || rango.getLastRow() < 2) return;
    completarIds_(rango.getSheet(), Math.max(rango.getRow(), 2), rango.getLastRow());
  } catch (err) {
    console.warn('onEdit: no pude completar ids: ' + err);
  }
}

function completarIds_(hoja, desde, hasta) {
  var ancho = hoja.getLastColumn();
  var ultima = hoja.getLastRow();
  if (ultima < 2 || ancho < 1) return;
  var valores = hoja.getRange(1, 1, ultima, ancho).getValues();
  var enc = valores[0].map(function (h) { return String(h).trim(); });
  var cId = enc.indexOf('id');
  var cQue = enc.indexOf('que');
  var cAct = enc.indexOf('activo');
  if (cId === -1 || cQue === -1) return;
  var usados = {};
  valores.slice(1).forEach(function (f) { var id = clave_(f[cId]); if (id) usados[id] = true; });
  for (var r = desde; r <= Math.min(hasta, ultima); r++) {
    var f = valores[r - 1];
    if (clave_(f[cId]) || !texto_(f[cQue])) continue;
    var base = idDesdeTexto(f[cQue]) || 'articulo';
    var id = base;
    for (var n = 2; usados[id]; n++) id = base + '-' + n;
    usados[id] = true;
    hoja.getRange(r, cId + 1).setNumberFormat('@').setValue(id);
    if (cAct !== -1 && !texto_(f[cAct])) hoja.getRange(r, cAct + 1).setValue('si');
  }
}

function prepararRegistros_(libro) {
  var hoja = hojaO_(libro, HOJA.REGISTROS);
  var col = asegurarEncabezados_(hoja, ENCABEZADOS.registros);
  var filasNecesarias = LIMITES.MAX_FILAS_REGISTROS + 1;
  if (hoja.getMaxRows() < filasNecesarias) hoja.insertRowsAfter(hoja.getMaxRows(), filasNecesarias - hoja.getMaxRows());
  var n = hoja.getMaxRows() - 1;

  function lista_(nombre, valores) {
    var regla = SpreadsheetApp.newDataValidation().requireValueInList(valores, true).setAllowInvalid(false)
      .setHelpText('Opciones: ' + valores.join(' / ')).build();
    hoja.getRange(2, col[nombre], n, 1).setDataValidation(regla);
  }
  lista_('tipo', ['apartado', 'parecido']);
  lista_('estado', ['activo', 'liberado']);
  lista_('origen', ['invitado', 'admin']);
  ['id_articulo', 'nombre', 'hash_token'].forEach(function (h) { hoja.getRange(2, col[h], n, 1).setNumberFormat('@'); });
  ['creado', 'liberado'].forEach(function (h) { hoja.getRange(2, col[h], n, 1).setNumberFormat('d/m/yyyy h:mm am/pm'); });
  proteger_(hoja.getRange(1, 1, 1, hoja.getLastColumn()), 'encabezados: no los renombres (el script busca columnas por nombre)');
  return col;
}

/**
 * Reescribe por completo la pestaña `resumen` (solo lectura, todo con fórmulas). La lista de artículos
 * sale de «articulos» con FILTER/MAP, así que se actualiza sola cuando Andrey agrega o esconde filas.
 * Columnas A-F: un artículo por fila. A la derecha (H en adelante): la bitácora.
 */
function prepararResumen_(libro, colReg) {
  var hoja = hojaO_(libro, HOJA.RESUMEN);
  hoja.clear();
  hoja.clearConditionalFormatRules();
  var colArt = asegurarColumnasArticulos_(libro);

  var R = function (h) { var l = letraColumna(colReg[h]); return 'registros!$' + l + '$2:$' + l; };
  var A = function (h) { var l = letraColumna(colArt[h]); return 'articulos!$' + l + '$2:$' + l; };
  var activoReg = '((' + R('estado') + '="activo")+(' + R('estado') + '=""))';
  // Visible en la página: tiene id y nombre, y `activo` no dice «no» (ni FALSE).
  var visible = '(' + A('id') + '<>"")*(' + A('que') + '<>"")*(LOWER(' + A('activo') + ')<>"no")*(LOWER(' + A('activo') + ')<>"false")';
  var primera = 5;

  // Separador: la hoja en español usa «;». Se prueba con la cabecera y, si da error de fórmula, «,».
  var cabecera = '="Apartados: "&COUNTIFS($D$' + primera + ':$D;"<>—";$A$' + primera + ':$A;"<>")&" de "&SUMPRODUCT('
    + visible + ')&" · Parecidos: "&(COUNTIFS(' + R('tipo') + ';"parecido";' + R('estado') + ';"activo")+COUNTIFS('
    + R('tipo') + ';"parecido";' + R('estado') + ';"";' + R('id_articulo') + ';"<>"))';
  var sep = elegirSeparador_(hoja.getRange('A1'), cabecera);
  var F = function (f) { return formulaConSeparador(f, sep); };

  hoja.getRange('A2').setValue('Solo lectura: se calcula sola. Para corregir apartados edita «registros»; para la lista, «articulos».');
  hoja.getRange('A3').setValue('Filas de «registros» con id_articulo que no existe:').setFontWeight('bold');
  hoja.getRange('D3').setFormula(F('=ARRAYFORMULA(IFERROR(TEXTJOIN(", ";TRUE;FILTER("fila "&ROW('
    + R('id_articulo') + ');' + R('id_articulo') + '<>"";ISNA(MATCH(' + R('id_articulo') + ';' + A('id') + ';0))));"Ninguna"))'));
  hoja.getRange(4, 1, 1, 6).setValues([['id', 'Artículo', 'Producto', 'Apartado por', 'Parecidos', 'Alerta']]).setFontWeight('bold');

  var col = function (letra) { return '$' + letra + '$' + primera + ':$' + letra; };
  hoja.getRange(primera, 1, 1, 6).setFormulas([[
    F('=IFERROR(FILTER(' + A('id') + ';' + visible + ');"")'),
    F('=IFERROR(FILTER(' + A('que') + ';' + visible + ');"")'),
    F('=IFERROR(FILTER(' + A('producto') + ';' + visible + ');"")'),
    F('=MAP(' + col('A') + ';LAMBDA(x;IF(x="";"";IFERROR(INDEX(FILTER(' + R('nombre') + ';' + R('id_articulo') + '=x;'
      + R('tipo') + '="apartado";' + activoReg + ');1);"—"))))'),
    F('=MAP(' + col('A') + ';LAMBDA(x;IF(x="";"";IFERROR(TEXTJOIN(", ";TRUE;FILTER(' + R('nombre') + ';' + R('id_articulo')
      + '=x;' + R('tipo') + '="parecido";' + activoReg + '));""))))'),
    F('=MAP(' + col('A') + ';LAMBDA(x;IF(x="";"";IF(COUNTIFS(' + R('id_articulo') + ';x;' + R('tipo') + ';"apartado";'
      + R('estado') + ';"activo")+COUNTIFS(' + R('id_articulo') + ';x;' + R('tipo') + ';"apartado";' + R('estado')
      + ';"")>1;"Duplicado: libera uno en registros";""))))'),
  ]]);

  // Bitácora: lo último primero, con fecha y hora de Costa Rica (columnas H a L).
  var ultimaCol = letraColumna(Math.max.apply(null, ENCABEZADOS.registros.map(function (h) { return colReg[h]; })));
  var q = function (h) { return letraColumna(colReg[h]); };
  hoja.getRange('H4').setValue('Bitácora (activos, lo último primero)').setFontWeight('bold');
  hoja.getRange('H5').setFormula(F('=QUERY(registros!A:' + ultimaCol + ';"select ' + [q('id_articulo'), q('tipo'),
    q('nombre'), q('creado'), q('origen')].join(', ') + ' where ' + q('id_articulo') + ' is not null and (' + q('estado')
    + ' = \'activo\' or ' + q('estado') + ' is null) order by ' + q('creado') + ' desc";1)'));
  // Una hoja nueva trae 1000 filas: hay que crecerla para que quepan la lista y la bitácora completas.
  var hasta = primera + 1 + LIMITES.MAX_FILAS_REGISTROS;
  if (hoja.getMaxRows() < hasta) hoja.insertRowsAfter(hoja.getMaxRows(), hasta - hoja.getMaxRows());
  hoja.getRange(primera + 1, 11, LIMITES.MAX_FILAS_REGISTROS, 1).setNumberFormat('d/m/yyyy h:mm am/pm');

  // Duplicado: texto + rojo (el color es solo refuerzo).
  var regla = SpreadsheetApp.newConditionalFormatRule().whenTextStartsWith('Duplicado')
    .setFontColor('#B8432C').setBold(true).setRanges([hoja.getRange(primera, 6, hoja.getMaxRows() - primera + 1, 1)]).build();
  hoja.setConditionalFormatRules([regla]);
  hoja.setFrozenRows(4);
  hoja.getRange('A1').setFontWeight('bold');
  [130, 220, 220, 170, 220, 120, 24, 130, 90, 170, 150, 80].forEach(function (w, i) { hoja.setColumnWidth(i + 1, w); });
  proteger_(hoja, 'resumen calculado; edita «registros» o «articulos»');
}

function asegurarColumnasArticulos_(libro) {
  return asegurarEncabezados_(libro.getSheetByName(HOJA.ARTICULOS), ENCABEZADOS.articulos);
}

/** Escribe la fórmula con «;»; si Sheets la rechaza (#ERROR!), usa «,». Devuelve el separador. */
function elegirSeparador_(celda, formulaPuntoYComa) {
  celda.setFormula(formulaPuntoYComa);
  SpreadsheetApp.flush();
  if (String(celda.getDisplayValue()).indexOf('#ERROR') !== 0) return ';';
  celda.setFormula(formulaConSeparador(formulaPuntoYComa, ','));
  SpreadsheetApp.flush();
  if (String(celda.getDisplayValue()).indexOf('#ERROR') === 0) {
    throw new Error('Sheets rechazó la fórmula del resumen con «;» y con «,». Revisa la configuración regional de la hoja.');
  }
  return ',';
}
