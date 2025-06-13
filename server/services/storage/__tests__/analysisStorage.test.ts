import { analysisStorage } from '../analysisStorage';

describe('AnalysisStorage', () => {
  it('should create, fetch, and update analysis', async () => {
    // Create
    const newAnalysis = { projectId: 1, summary: 'Initial analysis' };
    const created = await analysisStorage.saveAnalysis(newAnalysis as any);
    expect(created.summary).toBe('Initial analysis');

    // Fetch
    const fetched = await analysisStorage.getAnalysis(created.id);
    expect(fetched).toBeDefined();
    expect(fetched?.projectId).toBe(1);

    // Update
    const updated = await analysisStorage.updateAnalysis({ ...created, summary: 'Updated analysis' });
    expect(updated.summary).toBe('Updated analysis');
  });
});
