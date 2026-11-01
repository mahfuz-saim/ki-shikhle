import { logger } from '../utils/logger';

export interface EmailProvider { send(to: string, subject: string, html: string): Promise<void>; }

class ConsoleEmail implements EmailProvider {
  async send(to: string, subject: string, html: string) {
    logger.info({ to, subject }, '📧 Email (console mock)');
    if (process.env.NODE_ENV !== 'production') console.log(`\n--- EMAIL to ${to} ---\nSubject: ${subject}\n${html}\n--- END EMAIL ---\n`);
  }
}

export const emailService: EmailProvider = new ConsoleEmail();
