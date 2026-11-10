let runtime;
self.onmessage = async ({ data }) => {
  try {
    if (!runtime) {
      self.postMessage({ type: 'status', message: 'Loading Python… The first run needs a download.' });
      importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');
      runtime = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/' });
    }
    self.postMessage({ type: 'ready' });
    if (data.action === 'syntax') {
      runtime.globals.set('_quest_candidate_sources', JSON.stringify(data.sources));
      const checked = await runtime.runPythonAsync(`
import json
_checks = []
for _candidate in json.loads(_quest_candidate_sources):
    try:
        compile(_candidate, '<mission>', 'exec')
        _checks.append({'valid': True})
    except SyntaxError as _error:
        _checks.append({'valid': False, 'line': _error.lineno, 'message': str(_error)})
json.dumps(_checks)
`);
      self.postMessage({ type: 'syntax', checks: JSON.parse(checked) });
      return;
    }
    runtime.globals.set('_quest_source', data.source);
    runtime.globals.set('_quest_cases', JSON.stringify(data.cases));
    runtime.globals.set('_quest_wants_trace', data.trace === true);
    const result = await runtime.runPythonAsync(`
import json, sys, io, contextlib, copy, math
class _QuestOutput(io.TextIOBase):
    def __init__(self): self.text = ''
    def write(self, text):
        self.text = (self.text + str(text))[:4096]
        return len(text)
    def flush(self): pass
def _quest_safe(value, depth=0):
    if value is None or isinstance(value, (bool, int, str)):
        return value[:180] if isinstance(value, str) else value
    if isinstance(value, float): return value if math.isfinite(value) else str(value)
    if depth < 2 and isinstance(value, (list, tuple)):
        return [_quest_safe(v, depth+1) for v in value[:24]]
    if depth < 2 and isinstance(value, dict):
        return {str(k)[:40]: _quest_safe(v, depth+1) for k,v in list(value.items())[:12]}
    return '<' + type(value).__name__ + '>'
_out = _QuestOutput()
_rows = []
_steps = 0
_frames = []
def _quest_trace(frame, event, arg):
    global _steps
    if frame.f_code.co_filename != '<mission>': return _quest_trace
    _steps += 1
    if _steps > 150000:
        raise RuntimeError('Too many steps. Check that your loop makes progress and stops.')
    if _quest_wants_trace and frame.f_code.co_name != '<module>' and len(_frames) < 180 and event in ('line', 'return', 'exception'):
        _locals = {k: _quest_safe(v) for k,v in frame.f_locals.items() if not k.startswith('_') and not callable(v) and type(v).__name__ != 'module'}
        _entry = {'line': frame.f_lineno, 'event': event, 'locals': _locals}
        if event == 'return': _entry['returned'] = _quest_safe(arg)
        if event == 'exception': _entry['exception'] = type(arg[1]).__name__ + ': ' + str(arg[1])[:200]
        _frames.append(_entry)
    return _quest_trace
for _args in json.loads(_quest_cases):
    _namespace = {}
    _steps = 0
    _frames = []
    try:
        with contextlib.redirect_stdout(_out), contextlib.redirect_stderr(_out):
            _program = compile(_quest_source, '<mission>', 'exec')
            sys.settrace(_quest_trace)
            exec(_program, _namespace)
            if 'solve' not in _namespace: raise NameError('Keep a function named solve so the tests can call it.')
            _answer = _namespace['solve'](*copy.deepcopy(_args))
            sys.settrace(None)
            json.dumps(_answer)
            _rows.append({'actual': _answer, 'trace': _frames})
    except Exception as _error:
        sys.settrace(None)
        _line = getattr(_error, 'lineno', None)
        _tb = _error.__traceback__
        while _tb is not None:
            if _tb.tb_frame.f_code.co_filename == '<mission>': _line = _tb.tb_lineno
            _tb = _tb.tb_next
        _rows.append({'error': type(_error).__name__ + ': ' + str(_error)[:1200], 'line': _line, 'trace': _frames})
json.dumps({'results': _rows, 'stdout': _out.text})
`);
    self.postMessage({ type: 'result', ...JSON.parse(result) });
  } catch (error) { self.postMessage({ type: 'error', message: String(error?.message || error).slice(0, 2000) }); }
};
