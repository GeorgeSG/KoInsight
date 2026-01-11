import { KoReaderAnnotation } from '@koinsight/common/types';
import { faker } from '@faker-js/faker';

export function fakeKoReaderAnnotation(
  overrides: Partial<KoReaderAnnotation> = {}
): KoReaderAnnotation {
  const page = faker.number.int({ min: 1, max: 500 });

  const annotation: KoReaderAnnotation = {
    datetime: faker.date.past().toISOString(),
    drawer: faker.helpers.arrayElement(['lighten', 'underscore', 'invert']),
    color: faker.helpers.arrayElement(['yellow', 'red', 'blue', 'green']),
    text: faker.lorem.paragraph(),
    chapter: faker.lorem.words(3),
    pageno: page,
    page,
    pos0: {
      x: faker.number.int({ min: 0, max: 800 }),
      y: faker.number.int({ min: 0, max: 600 }),
      page,
    },
    pos1: {
      x: faker.number.int({ min: 0, max: 800 }),
      y: faker.number.int({ min: 0, max: 600 }),
      page,
    },
    ...overrides,
  };

  return annotation;
}
