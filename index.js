import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
let vendorProducts = {}
import { supermarkets } from './supermarkets.js';
import { log } from 'node:console';


const iteratorCategories = async (categories, selectors, gettingData, vendorData) => {
	const browser = await chromium.launch();
	const page = await browser.newPage();
	for (const category of categories) {
		const { categorie, url } = category;
		console.log('Categorie: ' + categorie);
		const data = await gettingData({ url, selectors, page });
		vendorData.products.push({ categorie, products: data });
	}

	await browser.close();
};

(async function () {
	
	for (const supermarket of supermarkets) {
		const { vendor, categories, selectors, gettingData } = supermarket;
		console.log('getting Data the ' + vendor)
		const vendorData = { products: [] };
		await iteratorCategories(categories, selectors, gettingData, vendorData);
		vendorProducts[vendor] = vendorData;
	}

	const filePath = path.join(process.cwd(), './db/vendorsProducts.json');
	await writeFile(filePath, JSON.stringify(vendorProducts, null, 2), 'utf-8');
})();

