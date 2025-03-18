describe('Jest Configuration', () => {
  test('basic test functionality works', () => {
    expect(1 + 2).toBe(3);
  });

  test('mocks are working', () => {
    const mockFn = jest.fn().mockReturnValue(42);
    expect(mockFn()).toBe(42);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('async testing works', async () => {
    const asyncFunction = () => Promise.resolve('success');
    await expect(asyncFunction()).resolves.toBe('success');
  });
});