import { DateTimePipe } from './date-time.pipe';

describe('DateTimeDisplayPipe', () => {
  it('create an instance', () => {
    const pipe = new DateTimePipe();
    expect(pipe).toBeTruthy();
  });
});
