import puppeteer from 'puppeteer';
import { load as loadCheerio } from 'cheerio';
import { PrismaClient } from '@prisma/client';

class ScrapingService {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.prisma = new PrismaClient();
  }

  async scrapeAndSave(url) {
    const scraped = await this.scrapeHyperplanning(url);
    if (!scraped.success) {
      return scraped;
    }

    const save = await this.saveSessionsToDatabase(scraped.sessions, scraped.date);
    return { ...scraped, save };
  }

  async scrapeHyperplanning(url, options = {}) {
    try {
      const pageData = await this.scrapeWithPuppeteer(url, {
        waitForSelector: 'table, .objetPanneauInfo, [id*="donnees"]',
        waitFor: 8000,
        timeout: 45000,
        blockResources: ['image', 'stylesheet', 'font', 'media'],
        ...options
      });

      if (!pageData.success) {
        return pageData;
      }

      const sessions = this.extractSessionsFromHTML(pageData.data);
      const date = this.extractDate(pageData.data);

      return {
        success: true,
        url,
        date,
        sessions,
        summary: {
          totalSessions: sessions.length,
          uniqueSubjects: [...new Set(sessions.map(s => s.subject))].length,
          uniqueTeachers: [...new Set(sessions.map(s => s.teacher))].length,
          uniqueRooms: [...new Set(sessions.map(s => s.room))].length,
          promotions: [...new Set(sessions.map(s => s.promotion))].length
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { success: false, url, error: error.message };
    }
  }

  async scrapeWithPuppeteer(url, options = {}) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: options.headless !== false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      await page.setUserAgent(this.userAgent);
      await page.setViewport({ width: 1366, height: 900 });

      if (options.blockResources) {
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          if (options.blockResources.includes(req.resourceType())) req.abort();
          else req.continue();
        });
      }

      await page.goto(url, { waitUntil: options.waitUntil || 'networkidle2', timeout: options.timeout || 30000 });

      if (options.waitForSelector) {
        try { await page.waitForSelector(options.waitForSelector, { timeout: 10000 }); } catch {}
      }
      if (options.waitFor) {
        await new Promise(r => setTimeout(r, options.waitFor));
      }

      const data = await page.evaluate(() => ({
        title: document.title,
        url: location.href,
        html: document.documentElement.outerHTML,
        content: document.body.innerHTML
      }));

      return { success: true, url, data };
    } catch (error) {
      return { success: false, url, error: error.message };
    } finally {
      if (browser) await browser.close();
    }
  }

  extractSessionsFromHTML(data) {
    const html = data.html || data.content || '';
    const $ = loadCheerio(html);

    let dataTable = $('table[id*="donnees"]');
    if (dataTable.length === 0) dataTable = $('table').has('tr.objetPanneauInfoLigne');
    if (dataTable.length === 0) dataTable = $('table');

    const sessions = [];

    dataTable.find('tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      const rowText = $row.text();
      const hasTime = /\d{1,2}h\d{2}/.test(rowText);

      if (cells.length >= 3 && hasTime) {
        const timeCell = this.cleanText(cells.eq(0).text());
        const session = {
          time: timeCell,
          startTime: this.extractStartTime(timeCell),
          endTime: this.extractEndTime(timeCell),
          room: this.cleanText(cells.eq(1).text()),
          subject: this.cleanText(cells.eq(2).text()),
          teacher: this.cleanText(cells.eq(3).text() || ''),
          promotion: this.cleanText(cells.eq(4).text() || '')
        };
        if (session.subject) sessions.push(session);
      }
    });

    return sessions;
  }

  extractDate(data) {
    const html = data.html || data.content || '';
    const $ = loadCheerio(html);
    const dateElement = $('td[id*="heure"]');
    if (dateElement.length > 0) {
      const text = dateElement.text().trim();
      const m = text.match(/(\w+ \d+ \w+ \d+)/);
      if (m) return m[1];
    }
    return new Date().toLocaleDateString('fr-FR');
  }

  cleanText(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
  }

  extractStartTime(t) {
    const m = (t || '').match(/(\d{1,2}h\d{2})/);
    return m ? m[1] : null;
  }

  extractEndTime(t) {
    const ms = (t || '').match(/(\d{1,2}h\d{2})/g);
    return ms && ms.length > 1 ? ms[1] : null;
  }

  async saveSessionsToDatabase(sessions, date) {
    const isoDate = this.normalizeDateToISO(date);
    let created = 0;

    for (const s of sessions) {
      try {
        await this.prisma.session.create({
          data: {
            subject: s.subject,
            teacher: s.teacher || '',
            promotion: s.promotion || '',
            classroom: s.room || '',
            date: isoDate,
            startTime: s.startTime || '',
            endTime: s.endTime || ''
          }
        });
        created += 1;
      } catch (e) {
        // continuer si une ligne échoue
      }
    }

    return { success: true, created, total: sessions.length };
  }

  normalizeDateToISO(dateFr) {
    try {
      const months = {
        janvier: '01', fevrier: '02', février: '02', mars: '03', avril: '04', mai: '05', juin: '06',
        juillet: '07', aout: '08', août: '08', septembre: '09', octobre: '10', novembre: '11', decembre: '12', décembre: '12'
      };
      const m = (dateFr || '').toLowerCase().match(/(\d{1,2})\s+(\p{L}+)+\s+(\d{4})/u);
      if (!m) return new Date().toISOString().slice(0, 10);
      const dd = String(parseInt(m[1], 10)).padStart(2, '0');
      const mm = months[m[2]] || '01';
      const yyyy = m[3];
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }

  async cleanup() {
    await this.prisma.$disconnect();
  }
}

export default ScrapingService;
