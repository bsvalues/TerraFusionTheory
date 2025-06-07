// Basic test to verify the test setup is working
describe('Test Environment', () => {
  it('should run tests correctly', () => {
    expect(true).toBe(true);
  });

  it('should have access to testing utilities', () => {
    expect(jest).toBeDefined();
    expect(typeof jest.fn).toBe('function');
  });

  it('should have correct environment variable', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});