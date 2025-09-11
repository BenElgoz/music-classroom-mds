import cron from 'node-cron';
import ScrapingService from '../services/scraping.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

class ScraperJob {
  constructor() {
    this.scrapingService = new ScrapingService();
    this.hyperplanningURL = 'https://paris-02-2.hyperplanning.fr/hp/panneauinformations.html?id=PA3';
    this.cronJob = null;
    this.isRunning = false;
    this.lastRun = null;
  }

  start() {
    console.log('🚀 Démarrage du job: tous les jours à 8h45 (Europe/Paris)');

    this.cronJob = cron.schedule(
      '45 8 * * *',
      async () => {
        await this.run();
      },
      { scheduled: true, timezone: 'Europe/Paris' }
    );

    // Exécution immédiate au démarrage
    this.run();
  }

  stop() {
    if (this.cronJob) this.cronJob.stop();
  }

  async run() {
    if (this.isRunning) {
      console.log('⚠️ Déjà en cours, on skip.');
      return;
    }
    this.isRunning = true;
    this.lastRun = new Date();

    console.log(`\n🎓 SCRAP ${this.lastRun.toLocaleString('fr-FR')}`);
    console.log(`URL: ${this.hyperplanningURL}`);

    try {
      const result = await this.scrapingService.scrapeAndSave(this.hyperplanningURL);
      if (result.success) {
        console.log(`✅ Scraping OK: ${result.summary.totalSessions} sessions`);
        console.log(`💾 Enregistrées: ${result.save.created}/${result.save.total}`);
      } else {
        console.log('❌ Scraping KO:', result.error);
      }
    } catch (e) {
      console.error('❌ Erreur job:', e.message);
    } finally {
      this.isRunning = false;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      isScheduled: !!this.cronJob,
    };
  }
}

// Détection robuste du "lancement direct" (cross‑platform)
const isDirectRun = (() => {
  try {
    const modulePath = fileURLToPath(import.meta.url);      // chemin absolu du module courant
    const argvPath = path.resolve(process.argv[1] ?? '');   // chemin absolu de l'entrée Node
    return modulePath === argvPath;
  } catch {
    return false;
  }
})();

// Lancement direct (ESM)
if (isDirectRun) {
  const job = new ScraperJob();
  job.start();

  process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt');
    job.stop();
    if (job.scrapingService?.cleanup) {
      try {
        await job.scrapingService.cleanup();
      } catch (e) {
        console.error('Erreur cleanup:', e?.message || e);
      }
    }
    process.exit(0);
  });
}

export default ScraperJob;
