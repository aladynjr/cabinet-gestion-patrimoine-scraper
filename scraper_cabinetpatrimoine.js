const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

const resultFolder = 'result_cabinetpatrimoine';

const ensureResultFolder = async () => {
  try {
    await fs.mkdir(resultFolder, { recursive: true });
    console.log(`Folder '${resultFolder}' created or already exists.`);
  } catch (error) {
    console.error(`Error creating folder '${resultFolder}':`, error);
  }
};

const scrapeWebsite = async () => {
  const baseUrl = 'https://www.cabinet-gestion-patrimoine.fr/gestion-patrimoine/villes/ile-de-france?92cf8bd7_page=';
  let totalListings = 0;
  const allListings = [];
  
  for (let page = 1; page <= 7; page++) {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: baseUrl + page,
      headers: { 
        'accept': '*/*', 
        'accept-language': 'en-US,en;q=0.9,be;q=0.8,ar;q=0.7', 
        'cache-control': 'no-cache', 
        'dnt': '1', 
        'pragma': 'no-cache', 
        'priority': 'u=1, i', 
        'referer': 'https://www.cabinet-gestion-patrimoine.fr/gestion-patrimoine/villes/ile-de-france?92cf8bd7_page=5', 
        'sec-ch-ua': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"', 
        'sec-ch-ua-mobile': '?0', 
        'sec-ch-ua-platform': '"Windows"', 
        'sec-fetch-dest': 'empty', 
        'sec-fetch-mode': 'cors', 
        'sec-fetch-site': 'same-origin', 
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
      }
    };
    try {
      const response = await axios.request(config);
      const $ = cheerio.load(response.data);

      const pageListings = [];
      $('a.experts_link.w-inline-block').each((index, element) => {
        const listingLink = $(element).attr('href');

        pageListings.push({
          link: listingLink,
        });
      });

      allListings.push(...pageListings);
      totalListings += pageListings.length;
      console.log(`Page ${page}: Found ${pageListings.length} items`);
    } catch (error) {
      console.error(`Error fetching data for page ${page}:`, error);
    }
  }

  console.log(`Total listings found: ${totalListings}`);

  // Save consolidated data as JSON
  try {
    await fs.writeFile(path.join(resultFolder, 'listings.json'), JSON.stringify(allListings, null, 2));
    console.log(`Data saved to ${path.join(resultFolder, 'listings.json')}`);
  } catch (err) {
    console.error('Error writing to file:', err);
  }

  return allListings;
};

const scrapeListings = async (listings) => {
  const baseUrl = 'https://www.cabinet-gestion-patrimoine.fr';
  const scrapedData = [];

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: baseUrl + listing.link,
      headers: { 
        'accept': '*/*', 
        'accept-language': 'en-US,en;q=0.9,be;q=0.8,ar;q=0.7', 
        'cache-control': 'no-cache', 
        'dnt': '1', 
        'pragma': 'no-cache', 
        'priority': 'u=1, i', 
        'sec-ch-ua': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"', 
        'sec-ch-ua-mobile': '?0', 
        'sec-ch-ua-platform': '"Windows"', 
        'sec-fetch-dest': 'empty', 
        'sec-fetch-mode': 'cors', 
        'sec-fetch-site': 'same-origin', 
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
      }
    };

    try {
      const response = await axios.request(config);
      const $ = cheerio.load(response.data);

      const jsonLdScript = $('script[type="application/ld+json"]').filter((_, el) => {
        const content = $(el).html();
        return content && content.includes('"telephone"');
      }).html();

      if (jsonLdScript) {
        const jsonData = JSON.parse(jsonLdScript);
        scrapedData.push(jsonData);
        console.log(`Scraped data for ${jsonData.name} (${i + 1}/${listings.length})`);
      } else {
        console.log(`No matching data found for listing ${i + 1}/${listings.length}`);
      }
    } catch (error) {
      console.error(`Error scraping data for listing ${i + 1}/${listings.length}:`, error.message);
    }
  }

  // Save scraped data as JSON
  try {
    await fs.writeFile(path.join(resultFolder, 'scraped_listings.json'), JSON.stringify(scrapedData, null, 2));
    console.log(`Scraped data saved to ${path.join(resultFolder, 'scraped_listings.json')}`);
  } catch (err) {
    console.error('Error writing scraped data to file:', err);
  }
};

const convertToCSV = async (scrapedListings) => {
  const csv = require('csv-writer').createObjectCsvWriter({
    path: path.join(resultFolder, 'scraped_listings.csv'),
    header: [
      {id: 'type', title: 'Type'},
      {id: 'name', title: 'Name'},
      {id: 'description', title: 'Description'},
      {id: 'telephone', title: 'Telephone'},
      {id: 'address', title: 'Address'},
      {id: 'image', title: 'Image'},
      {id: 'url', title: 'URL'}
    ]
  });

  const csvData = scrapedListings.map(listing => ({
    type: listing['@type'],
    name: listing.name,
    description: listing.description,
    telephone: listing.telephone,
    address: `${listing.address.streetAddress} ${listing.address.addressLocality} ${listing.address.addressRegion} ${listing.address.postalCode} ${listing.address.addressCountry}`,
    image: listing.image,
    url: listing.url
  }));

  await csv.writeRecords(csvData);
  console.log(`Scraped data saved to ${path.join(resultFolder, 'scraped_listings.csv')}`);
};

const main = async () => {
  try {
    await ensureResultFolder();
    const scrapedListingsPath = path.join(resultFolder, 'scraped_listings.json');
    let scrapedListings = [];

    try {
      const scrapedListingsData = await fs.readFile(scrapedListingsPath, 'utf8');
      scrapedListings = JSON.parse(scrapedListingsData);
    } catch (error) {
      console.log('No existing scraped_listings.json found or error reading it. Will scrape new data.');
    }

    if (scrapedListings.length < 42) {
      const listings = await scrapeWebsite();
      await scrapeListings(listings);
      const newScrapedListingsData = await fs.readFile(scrapedListingsPath, 'utf8');
      scrapedListings = JSON.parse(newScrapedListingsData);
    } else {
      console.log('scraped_listings.json already contains more than 42 items. Skipping scraping.');
    }

    await convertToCSV(scrapedListings);
  } catch (error) {
    console.error('Error processing data:', error);
  }
};

main();