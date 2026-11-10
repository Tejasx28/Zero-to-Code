import { describe,expect,it } from 'vitest';
import { buildTest } from './TestDesigner';
describe('plain input test designer',()=>{
  it('turns readable array and target fields into actual function arguments',()=>{expect(buildTest('array','4, -2, 7','').args).toEqual([[4,-2,7]]);expect(buildTest('target','[0, 3, 0]','0').args).toEqual([[0,3,0],0]);expect(buildTest('array','','').args).toEqual([[]]);});
  it('keeps single and pair inputs separate and rejects incomplete input',()=>{expect(buildTest('single','-4','').args).toEqual([-4]);expect(buildTest('pair','3','8').args).toEqual([3,8]);expect(buildTest('pair','3','').error).toContain('second input');expect(buildTest('single','1.5','').error).toContain('whole number');});
  it('preserves runtime integer and array limits without exposing a raw JSON form',()=>{expect(buildTest('array','true, 4','').error).toContain('whole numbers');expect(buildTest('array',Array(61).fill(1).join(','),'').error).toContain('60');expect(buildTest('single','1000001','').error).toBeTruthy();});
});
