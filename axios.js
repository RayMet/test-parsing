const axios = require('axios');
const { parse } = require('node-html-parser');
const { createObjectCsvWriter } = require('csv-writer');

class ParliamentMember {
  constructor(title, name, dateOfBirth, imageURL, startDateOfMandate) {
    this.title = title;
    this.name = name;
    this.dateOfBirth = dateOfBirth;
    this.imageURL = imageURL;
    this.startDateOfMandate = startDateOfMandate;
  }
}

class ParliamentScraper {
  constructor(url) {
    this.url = url;
  }

  async scrape() {
    try {
      const response = await axios.get(this.url);
      const root = parse(response.data);

      const title = this.extractTitle(root);
      const name = this.extractName(root);
      const dateOfBirth = this.extractDateOfBirth(root);
      const imageURL = this.extractImageURL(root);
      const startDateOfMandate = this.extractStartDateOfMandate(root);

      const member = new ParliamentMember(title, name, dateOfBirth, imageURL, startDateOfMandate);
      await this.writeToCSV([member]);
      console.log('The CSV file was written successfully');
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  extractTitle(root) {
    return root.querySelector('.pre-title-first').text.split('(')[0];
  }

  extractName(root) {
    const nameExt = root.querySelector('.sabor_data_entity h2');
    let name = "";
    nameExt.childNodes.forEach((element) => {
      if (element.nodeType === 3) {
        name = element.text;
      }
    });
    return name;
  }

  extractDateOfBirth(root) {
    const dateBorn = root.querySelector('.zivotopis p').text;
    return dateBorn.match(/\d{1,2}.*\d{4}/)[0].trim();
  }

  extractImageURL(root) {
    const image = root.querySelector('.image img');
    return 'https://www.sabor.hr' + image.rawAttrs.split('"')[1];
  }

  extractStartDateOfMandate(root) {
    return root.querySelector('.views-field-field-pocetak-mandata-1 div').text.trim();
  }

  async writeToCSV(data) {
    const csvWriter = createObjectCsvWriter({
      path: 'output.csv',
      header: [
        { id: 'title', title: 'Title' },
        { id: 'name', title: 'Name' },
        { id: 'dateOfBirth', title: 'Date of Birth' },
        { id: 'imageURL', title: 'Image URL' },
        { id: 'startDateOfMandate', title: 'Start Date of Mandate' }
      ]
    });
    await csvWriter.writeRecords(data);
  }
}


const url = 'https://www.sabor.hr/hr/zastupnici/buric-majda-10-saziv-hrvatskoga-sabora-2272020';
const parliamentScraper = new ParliamentScraper(url);
parliamentScraper.scrape();
