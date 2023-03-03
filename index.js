const { chromium } = require('playwright');
const ProgressBar = require('progress');

(async function () {
	console.log('Getting Data');
	const browser = await chromium.launch(); // se abre el chromium
	const page = await browser.newPage(); // se abre una nueva pagina en el navegador
	await page.goto('https://domicilios.tiendasd1.com/c/congelados-205692'); // este va a ir a el siguiente link
	await page.waitForLoadState('load'); // espera a que la pagina este en estado cargadoi
	await page.waitForLoadState('networkidle'); // espera a que la pagina cargue lo recursos
	await page.waitForSelector('.products'); // espera a que el selector aparezca en el dom
	await page.waitForSelector('.fojSYA');

	const pagination = await page.$$('.ant-pagination-item'); // se obtiene los elementos de la pagination
	const numPages = []; // aqui estaran todas las pagination que tiene la pagina
	for (const element of pagination) {
		// este  for sirve para obtener el atributo de la pagination en este caso es el numero
		const number = await element.getAttribute('title');
		numPages.push(parseInt(number));
	}
	const maxPag = Math.max(...numPages); // se hace para obtener la ultima pagination de la pagina
	console.log(`Numer the pages ${maxPag}`);
	let allProducts = []; // aqui se van a insertar todos los datos de los productos que se van a encontrar
	for (let i = 1; i <= maxPag; i++) {
		// este va hacer un bucle por cada pagina y se detendra cuando llegue al maximo de la pagination
		console.log(`page number -> ${i} \n`);
		const products = await page.$$('.fojSYA > .fRAese'); // obtenemos todos los productos de la pagina actual
		const progressBar = new ProgressBar(':percent :bar', { total: products.length });
		for (const product of products) {
			// se itera por cada producto para sacar el nombre el precio y la imagen
			await product.scrollIntoViewIfNeeded(); // se hace scroll por cxada producto ya que cada imagen carga dependiendo del scroll
			await page.waitForTimeout(1500); // tiempo de espera para que se renderice la img
			await page.waitForSelector('.prod__figure__img'); // se espera a que la etiqueda de imagen exista
			const name = await product.$('.prod__name'); // se obtiene el elemento que tiene el nombre
			const price = await product.$('.base__price'); // se obtiene el elemento que tiene el price
			const image = await product.$('.prod__figure__img'); // se obtiene el elemento que tiene el price
			const src = !image ? '' : await image.getAttribute('src'); // primer caso la imagen no existe por lo tanto src sera un '' de lo contrario sera el src de la img
			allProducts.push({ name: await name.innerText(), price: await price.innerText(), image: src }); // se alimenta el array de los datos
			progressBar.tick();
		}
		const buttonNext = await page.waitForSelector('li[title="Next Page"]');// obtencion del elemento de siguiente pagina
		await page.waitForTimeout(3000);// se espera 3 segundos
		await buttonNext.click(); // hace click al elemento
		await page.waitForTimeout(3000); // se espera otros 3 segundo a que este se muestre
		await page.waitForLoadState('networkidle'); // espera a que cargue total
		await page.waitForSelector('.general__content'); // espera esta etiqueta
	}

	console.log(allProducts);

	await browser.close();
})();
