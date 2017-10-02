import tap from 'tap';
import LogConfig from '../src/index';

tap.test('test_multiple', async (t) => {
  const oldEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'test';
    const config = {
      console: false,
      transports: {
        file: {
          name: 'File',
          config: {
            filename: 'test_output.log',
          },
        },
      },
    };

    const configured = new LogConfig({ name: 'test' }, config);
    const logger = await configured.start();

    const configured2 = new LogConfig({ name: 'test2' }, config);
    const logger2 = await configured2.start();

    logger.info('INFO is enabled');
    logger2.info('INFO is enabled');
    t.ok(true, 'Should handle concurrent loggers in test mode');
  } finally {
    process.env.NODE_ENV = oldEnv;
  }
});
