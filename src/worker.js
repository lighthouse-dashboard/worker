import connectDatabase from '../../core/src/db/connect-database';
import { clearReports, removeOldReports } from '../../core/src/db/models/reports';
import { setWorkerIsRunning, setWorkerLastRunDate } from '../../core/src/db/models/system';
import logger from '../../core/src/logger';
import { consumeQueue } from './handler';

/**
 * Start app with auto restart functionality
 * @param {string} mongoUri
 * @param {number | boolean} maxReportsAge
 * @param {number | boolean} maxRawReports
 * @return {Promise<void>}
 */
export default async function worker({ mongoUri, maxReportsAge, maxRawReports }) {
    const { database, client } = await connectDatabase(mongoUri);
    await setWorkerIsRunning(database, true);

    if (!isNaN(maxReportsAge)) {
        await removeOldReports(database, maxReportsAge);
    }

    if (!isNaN(maxRawReports)) {
        await clearReports(database, maxRawReports);
    }

    logger.info(`Start audit worker`);
    await consumeQueue(database);
    await setWorkerLastRunDate(database, new Date());
    await setWorkerIsRunning(database, false);
    logger.debug(`Worker complete`);
    await client.close();
}
