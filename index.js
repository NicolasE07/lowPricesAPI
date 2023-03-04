import { chromium } from 'playwright';
import ProgressBar from 'progress';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

let vendorProducts = {}
const supermarkets = [
	{
		vendor: 'd1',
		categories: [
			// {
			// 	categorie: 'Despensa',
			// 	url: 'https://domicilios.tiendasd1.com/c/alimentos-y-despensa-205687',
			// },
			// {
			// 	categorie: 'Bebidas',
			// 	url: 'https://domicilios.tiendasd1.com/c/bebidas-205690',
			// },
			{
				categorie: 'Congelados',
				url: 'https://domicilios.tiendasd1.com/c/congelados-205692',
			},
			{
				categorie: 'Otros',
				url: 'https://domicilios.tiendasd1.com/c/lo-nuevo-205694',
			},
		],
		selectors: {
			pagination: '.ant-pagination-item',
			conainerProducts: '.products',
			cardProducts: '.fojSYA > .fRAese',
			nameProduct: '.prod__name',
			priceProduct: '.base__price',
			imgProduct: '.prod__figure__img',
			nextPage: 'li[title="Next Page"]',
		},
	},
];

const getProducts = async (url, categorie, selectors) => {
	const { pagination, conainerProducts, cardProducts, nameProduct, priceProduct, imgProduct } =
		selectors;
	console.log('Getting Data');
	const browser = await chromium.launch(); // se abre el chromium
	const page = await browser.newPage(); // se abre una nueva pagina en el navegador
	await page.goto(url); // este va a ir a el siguiente link
	await page.waitForLoadState('load'); // espera a que la pagina este en estado cargadoi
	await page.waitForLoadState('networkidle'); // espera a que la pagina cargue lo recursos
	await page.waitForSelector(conainerProducts); // espera a que el selector aparezca en el dom
	await page.waitForSelector(cardProducts);
	const elementPages = await page.$$('.ant-pagination-item'); // se obtiene los elementos de la pagination
	const maxPag = await getMaxPages(elementPages);
	console.log(`esta pagina tiene ${maxPag} paginations`);
	let allProducts = [];
	for (let i = 1; i <= maxPag; i++) {
		// este va hacer un bucle por cada pagina y se detendra cuando llegue al maximo de la pagination
		console.log(`page number -> ${i} \n`);
		const products = await page.$$(cardProducts); // obtenemos todos los productos de la pagina actual
		const progressBar = new ProgressBar(':percent :bar', { total: products.length });
		for (const product of products) {
			// se itera por cada producto para sacar el nombre el precio y la imagen
			progressBar.tick();
			await product.scrollIntoViewIfNeeded(); // se hace scroll por cxada producto ya que cada imagen carga dependiendo del scroll
			await page.waitForTimeout(1500); // tiempo de espera para que se renderice la img
			await page.waitForSelector(imgProduct); // se espera a que la etiqueda de imagen exista
			const name = await product.$(nameProduct); // se obtiene el elemento que tiene el nombre
			const price = await product.$(priceProduct); // se obtiene el elemento que tiene el price
			const image = await product.$(imgProduct); // se obtiene el elemento que tiene el price
			const src = !image ? '' : await image.getAttribute('src'); // primer caso la imagen no existe por lo tanto src sera un '' de lo contrario sera el src de la img
			allProducts.push({ name: await name.innerText(), price: await price.innerText(), image: src }); // se alimenta el array de los datos
		}
		const buttonNext = await page.waitForSelector('li[title="Next Page"]'); // obtencion del elemento de siguiente pagina
		await page.waitForTimeout(3000); // se espera 3 segundos
		await buttonNext.click(); // hace click al elemento
		await page.waitForTimeout(3000); // se espera otros 3 segundo a que este se muestre
		await page.waitForLoadState('networkidle'); // espera a que cargue total
		await page.waitForSelector('.general__content'); // espera esta etiqueta
	}

	await browser.close();
	return allProducts;
};

const getMaxPages = async (elements) => {
	const numPages = []; // aqui estaran todas las pagination que tiene la pagina
	// if (!elements) return 1; // ! Probar si esto funciona
	for (const element of elements) {
		// este  for sirve para obtener el atributo de la pagination en este caso es el numero
		// const number = await element.getAttribute('title');
		const number = await element.innerText();
		numPages.push(parseInt(number));
	}
	return Math.max(...numPages);
};


const iteratorCategories = async (vendor, categories, selectors) => {
	for (let i = 0; i < categories.length; i++) {
		const { categorie, url } = categories[i];
		console.log(`vamos en la categoria ${categorie} ${i + 1} of ${categories.length}`);
		const data = await getProducts(url, categorie, selectors);
		const {vendor, products}= vendorProducts;
		products.push({categorie, products: data})
	}

	console.log(vendorProducts)
	const filePath = path.join(process.cwd(), './db/products.json');
	await writeFile(filePath, JSON.stringify(vendorProducts, null, 2), 'utf-8');
	
};
supermarkets.forEach((shop) => {
	const { vendor, categories, selectors } = shop;
	vendorProducts = {vendor, products:[]}
	iteratorCategories(vendor, categories, selectors);
});

