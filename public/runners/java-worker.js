let bridge;
self.onmessage = async ({ data }) => {
  try {
    if (!bridge) {
      self.postMessage({ type: 'status', message: 'Loading Java… The first run can take a minute.' });
      importScripts('https://cjrtnc.leaningtech.com/5.0/loader.js');
      await cheerpjInit({ version: 17, status: 'none', javaProperties: ['java.awt.headless=true'] });
      const library = await cheerpjRunLibrary('/app/runners/quest-runtime.jar');
      bridge = await library.QuestBridge;
    }
    self.postMessage({ type: 'ready' });
    const encoded = data.cases.map(args => args.map(arg => Array.isArray(arg) ? arg.join(',') : String(arg)).join(';')).join('\n');
    const result = await bridge.grade(data.source, data.kind, encoded);
    self.postMessage({ type: 'result', ...JSON.parse(result) });
  } catch (error) { self.postMessage({ type: 'error', message: String(error?.message || error).slice(0, 2000) }); }
};
