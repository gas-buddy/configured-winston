import tap from 'tap';
import LogConfig from '../src/index';

const configured = new LogConfig({ name: 'test' }, { console: process.env.NODE_ENV !== 'test' });
const Logger = configured.start();

tap.test('test_metadata', async (t) => {
  const defaults = { foo: true };
  const defaultsLogger = Logger.loggerWithDefaults(defaults);
  const noDefaultsLogger = Logger.loggerWithDefaults();

  const testMetadata = {
    response: 'response',
    func: () => {},
    deeper: {
      deeper: {
        deeper: {
          deeper: {
            deeper: {
              deeper: {
                tooDeep: 'tooDeep',
              },
            },
          },
        },
      },
    },
  };

  const trimmedMetadata = defaultsLogger.applyAdditionalMetadata(testMetadata);
  t.ok(trimmedMetadata.foo, 'Default data should be inserted into metadata.');
  t.strictEquals(trimmedMetadata.func, '[Function]', 'Functions should be replaced.');
  t.strictEquals(trimmedMetadata.deeper.deeper.deeper.deeper.deeper.deeper, '[Too Deep]', 'Fields more than 5 levels deep should be removed.');
  t.deepEquals(defaultsLogger.applyAdditionalMetadata(), defaults, 'Null metadata gets only defaults');

  t.deepEquals(noDefaultsLogger.applyAdditionalMetadata(new Buffer('a')), '[Buffer]', 'Buffer gets replaced with [Buffer]');
  t.deepEquals(noDefaultsLogger.applyAdditionalMetadata({ buffer: new Buffer('a') }), { buffer: '[Buffer]' }, 'Buffer gets replaced with [Buffer] deeply');
});

tap.test('test duplicates', async (t) => {
  const logger = Logger.loggerWithDefaults();

  const dupeObject = {
    field: 'field',
  };
  const dupeString = 'dupe';
  const dupeNumber = 1.0;
  const dupeArray = [1, 2];

  const testMetadata = {
    dupeObject,
    dupeString,
    dupeNumber,
    dupeArray,
    dupes: {
      dupeObject,
      dupeString,
      dupeNumber,
      dupeArray,
    },
  };

  const trimmedMetadata = logger.applyAdditionalMetadata(testMetadata);
  t.notStrictEquals(trimmedMetadata.dupeObject, trimmedMetadata.dupes.dupeObject, 'Duplicate objects should be replaced');
  t.strictEquals(trimmedMetadata.dupeString, trimmedMetadata.dupes.dupeString, 'Duplicate strings should not be replaced');
  t.strictEquals(trimmedMetadata.dupeNumber, trimmedMetadata.dupes.dupeNumber, 'Duplicate strings should not be replaced');
  t.strictEquals(trimmedMetadata.dupeArray, trimmedMetadata.dupes.dupeArray, 'Duplicate arrays should not be replaced');
});
