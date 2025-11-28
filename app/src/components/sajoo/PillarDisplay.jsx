// app/src/components/sajoo/PillarDisplay.jsx
import React from 'react';
import { FIVE, ELEMENT_NAMES } from '../../utils/constants';

const STEM_KO_TO_HAN = {
  '갑':'甲','을':'乙','병':'丙','정':'丁','무':'戊','기':'己','경':'庚','신':'辛','임':'壬','계':'癸',
};
const BRANCH_KO_TO_HAN = {
  '자':'子','축':'丑','인':'寅','묘':'卯','진':'辰','사':'巳','오':'午','미':'未','신':'申','유':'酉','술':'戌','해':'亥',
};

function toHanStem(s){ if(!s) return ''; const x=String(s).trim(); return /^[甲乙丙丁戊己庚辛壬癸]$/.test(x)?x:(STEM_KO_TO_HAN[x]||x); }
function toHanBranch(s){ if(!s) return ''; const x=String(s).trim(); return /^[子丑寅卯辰巳午未申酉戌亥]$/.test(x)?x:(BRANCH_KO_TO_HAN[x]||x); }

function normalize(p){
  if(!p) return [];
  if (Array.isArray(p)) return p.map(v=>v||{stem:'',branch:''});
  return [p.year,p.month,p.day,p.hour].map(v=>v||{stem:'',branch:''});
}

function cls(sym){ return FIVE[sym] || ''; }
function elemLabelFromClass(c){ return ELEMENT_NAMES[c] || ''; }

const PillarDisplay = ({ pillars, idPrefix = '' }) => {
  const list = normalize(pillars);
  const titles = ['연','월','일','시'];
  const types  = ['year','month','day','hour'];

  return (
    <div className="pillars">
      {list.map((p, idx) => {
        const stem = toHanStem(p?.stem);
        const branch = toHanBranch(p?.branch);
        const stemCls = cls(stem) || cls(p?.stem);
        const brCls   = cls(branch) || cls(p?.branch);
        const type = types[idx];
        const elemId = idPrefix ? `${idPrefix}-${type}` : undefined;

        const tenGodStem = p?.tenGodStem || '';
        const tenGodBranch = p?.tenGodBranch || '';
        const hidden = (p?.hiddenStems || []).map(s => toHanStem(s)).filter(Boolean).join(', ');
        const life = p?.lifeStage || '';
        const shinsal = p?.shinsal || '';

        return (
          <div
            className="pillar"
            key={idx}
            data-type={type}
            id={elemId}
          >
            <h3>{titles[idx]}</h3>

            <div className="pill">
              <span className={stemCls}>{stem || '—'}</span>
              <span>·</span>
              <span className={brCls}>{branch || '—'}</span>
            </div>

            <div className="gx">
              {[elemLabelFromClass(stemCls), elemLabelFromClass(brCls)].filter(Boolean).join(' · ')}
            </div>

            <div className="pillar-meta" style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-soft)' }}>
              <div><strong>천간/십성:</strong> {stem || '—'}  /  {tenGodStem || '—'}</div>
              <div><strong>지지/십성:</strong> {branch || '—'}  /  {tenGodBranch || '—'}</div>
              <div><strong>지장간:</strong> {hidden || '—'}</div>
              <div><strong>12운성:</strong> {life || '—'}</div>
              <div><strong>12신살:</strong> {shinsal || '—'}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PillarDisplay;
