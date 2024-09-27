# Web Scraping Project: Family Offices and Wealth Management

This project contains two web scraping scripts designed to extract information about family offices and wealth management firms in France.

## Scripts

1. `scraper_familyoffice.js`: Scrapes data from www.familyoffice-france.fr
2. `scraper_cabinetpatrimoine.js`: Scrapes data from www.cabinet-gestion-patrimoine.fr

## Features

- Extracts listings of family offices and wealth management firms
- Scrapes detailed information for each listing
- Saves data in both JSON and CSV formats

## Requirements

- Node.js
- npm packages:
  - axios
  - cheerio
  - fs
  - path
  - csv-writer

## Usage

1. Install dependencies:
   ```
   npm install axios cheerio csv-writer
   ```

2. Run the scripts:
   ```
   node scraper_familyoffice.js
   node scraper_cabinetpatrimoine.js
   ```

3. Output:
   - JSON files: `listings.json` and `scraped_listings.json`
   - CSV file: `scraped_listings.csv`

## Data Structure

The scraped data is stored in the following structure:

### JSON Output (`scraped_listings.json`):

```json
[
  {
    "@type": "LocalBusiness",
    "name": "Company Name",
    "description": "Company description...",
    "telephone": "+33 1 23 45 67 89",
    "address": {
      "streetAddress": "123 Street Name",
      "addressLocality": "City",
      "addressRegion": "Region",
      "postalCode": "12345",
      "addressCountry": "France"
    },
    "image": "https://example.com/image.jpg",
    "url": "https://www.company-website.com"
  },
  // More entries...
]
```

### CSV Output (`scraped_listings.csv`):

The CSV file contains the following columns:

1. Type
2. Name
3. Description
4. Telephone
5. Address (combined from JSON address object)
6. Image
7. URL

Example row:
```
LocalBusiness,Company Name,Company description...,+33 1 23 45 67 89,123 Street Name City Region 12345 France,https://example.com/image.jpg,https://www.company-website.com
```
