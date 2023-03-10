import { Bar } from "cli-progress";

const supermarkets = [
	{
		vendor: 'd1',
		categories: [
			{
				categorie: 'Despensa',
				url: 'https://domicilios.tiendasd1.com/c/alimentos-y-despensa-205687',
			},
			{
				categorie: 'Bebidas',
				url: 'https://domicilios.tiendasd1.com/c/bebidas-205690',
			},
			{
				categorie: 'Congelados',
				url: 'https://domicilios.tiendasd1.com/c/congelados-205692',
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
		gettingData: async ({ url, selectors, page }) => {
			const {
				pagination,
				conainerProducts,
				cardProducts,
				nameProduct,
				priceProduct,
				imgProduct,
				nextPage,
			} = selectors;
			await page.goto(url);
			await page.waitForLoadState('load');
			await page.waitForLoadState('networkidle');
			await page.waitForSelector(conainerProducts); // espera a que el selector aparezca en el dom
			await page.waitForSelector(cardProducts);

			const elementPages = await page.$$(pagination);
			const maxPag = elementPages.length != 0 ? elementPages.length : 1;
			console.log(`this page has ${maxPag} paginations`);
			let allProducts = [];
			const bar = new Bar({
				format: '{bar} {percentage}% | ETA: {eta}s | {value}/{total}',
				barCompleteChar: '\u2588',
				barIncompleteChar: '\u2591',
				hideCursor: true,
				  clearOnComplete: false,
			});
			bar.start(maxPag, 0)
			for (let i = 1; i <= maxPag; i++) {
				const products = await page.$$(cardProducts); // obtenemos todos los productos de la pagina actual
				
				allProducts.push(await getProducts({
					page,
					products,
					imgProduct,
					nameProduct,
					priceProduct,
				}));
				bar.increment()
				if (i !== maxPag) {
					await page.waitForSelector(nextPage);
					const buttonNext = await page.$(nextPage); // obtencion del elemento de siguiente pagina
					await page.waitForTimeout(3000); // se espera 3 segundos
					await buttonNext.click(); // hace click al elemento
					await page.waitForTimeout(3000); // se espera otros 3 segundo a que este se muestre
					await page.waitForSelector(conainerProducts); // espera esta etiqueta
					await page.waitForSelector(cardProducts); // espera esta etiqueta
				}
			}
			bar.stop()
			return allProducts;
		},
	},
	{
		vendor: 'jumbo',
		categories: [
			{
				categorie: 'Despensa',
				url: 'https://www.tiendasjumbo.co/supermercado/despensa',
			},
			{
				categorie: 'Lacteos',
				url: 'https://www.tiendasjumbo.co/supermercado/lacteos-huevos-y-refrigerados',
			},
		],
		selectors: {
			pagination: '.vtex-slider-0-x-sliderFrame li',
			conainerProducts: '#gallery-layout-container',
			cardProducts: '.vtex-search-result-3-x-galleryItem',
			nameProduct: '.vtex-product-summary-2-x-productBrand',
			priceProduct: '.tiendasjumboqaio-jumbo-minicart-2-x-price',
			imgProduct: '.vtex-product-summary-2-x-imageContainer img',
			nextPage: null,
		},
		gettingData: async ({ url, selectors, page }) => {
			const {
				pagination,
				conainerProducts,
				cardProducts,
				nameProduct,
				priceProduct,
				imgProduct,
				nextPage,
			} = selectors;
			await page.goto(url);
			await page.waitForLoadState('load');
			await page.waitForLoadState('networkidle');
			await page.waitForSelector(conainerProducts); // espera a que el selector aparezca en el dom
			await page.waitForSelector(cardProducts);
			const elementPages = await page.$$(pagination);
			const maxPag = elementPages.length;
			console.log(`this page has ${maxPag} paginations`);
			const allProducts = [];
			const bar = new Bar({
				format: '{bar} {percentage}% | ETA: {eta}s | {value}/{total}',
				barCompleteChar: '\u2588',
				barIncompleteChar: '\u2591',
				hideCursor: true,
				  clearOnComplete: false,
			});
			bar.start(maxPag, 0)
			for (let i = 1; i <= maxPag; i++) {
				await page.evaluate(() => {
					window.scrollTo({
						top: document.body.scrollHeight,
						behavior: 'smooth',
					});
				});

				await page.waitForTimeout(3000);
				const products = await page.$$(cardProducts);
				allProducts.push(await getProducts({
					page,
					products,
					imgProduct,
					nameProduct,
					priceProduct,
				})) 
				bar.increment()
				if (i !== maxPag) {
					await page.waitForTimeout(3000);
					await elementPages[i].click();
					await page.waitForTimeout(5000);
					await page.waitForSelector(conainerProducts);
				}
			}
			bar.stop()
			return allProducts;
		},
	},
];

const getProducts = async ({ page, products, imgProduct, nameProduct, priceProduct }) => {
	
	const allProducts = products.map(async(product)=>{
		await page.waitForTimeout(500); // se espera a que la etiqueda de imagen exista
		await product.scrollIntoViewIfNeeded(); // se hace scroll por cxada producto ya que cada imagen carga dependiendo del scroll
		await page.waitForTimeout(500); // tiempo de espera para que se renderice la img
		await page.waitForSelector(imgProduct); // se espera a que la etiqueda de imagen exista
		const name = await product.$(nameProduct); // se obtiene el elemento que tiene el nombre
		const price = await product.$(priceProduct); // se obtiene el elemento que tiene el price
		const image = await product.$(imgProduct); // se obtiene el elemento que tiene el price
		const src = !image ? '' : await image.getAttribute('src'); // primer caso la imagen no existe por lo tanto src sera un '' de lo contrario sera el src de la img
		return { name: await name.innerText(), price: await price.innerText(), image: src }
	})
	
	return await Promise.all(allProducts)
};

export { supermarkets };
