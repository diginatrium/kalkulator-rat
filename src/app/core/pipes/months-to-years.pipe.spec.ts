import { MonthsToYearsPipe } from './months-to-years.pipe';

describe('MonthsToYearsPipe', () => {
  const pipe = new MonthsToYearsPipe();

  it('zwraca pusty string poniżej 12 miesięcy', () => {
    expect(pipe.transform(0)).toBe('');
    expect(pipe.transform(11)).toBe('');
  });

  it('1 rok dla 12 miesięcy', () => {
    expect(pipe.transform(12)).toBe('1 rok');
  });

  it('1 rok 1 mc dla 13 miesięcy', () => {
    expect(pipe.transform(13)).toBe('1 rok 1 mc');
  });

  it('2 lata dla 24 miesięcy', () => {
    expect(pipe.transform(24)).toBe('2 lata');
  });

  it('5 lat dla 60 miesięcy', () => {
    expect(pipe.transform(60)).toBe('5 lat');
  });

  it('6 lat 2 mc dla 74 miesięcy', () => {
    expect(pipe.transform(74)).toBe('6 lat 2 mc');
  });

  it('12 lat (nie "lata") dla 144 miesięcy', () => {
    expect(pipe.transform(144)).toBe('12 lat');
  });

  it('22 lata (nie "lat") dla 264 miesięcy', () => {
    expect(pipe.transform(264)).toBe('22 lata');
  });

  it('30 lat dla 360 miesięcy', () => {
    expect(pipe.transform(360)).toBe('30 lat');
  });

  it('null/undefined → pusty string', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
