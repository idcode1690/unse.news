import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <div className="footer-wrap">
        <div>© {currentYear} 사주팔자 — 정확한 계산 기반 무료 서비스</div>
        <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
          <span className="oh-wood">목</span>
          <span className="oh-fire">화</span>
          <span className="oh-earth">토</span>
          <span className="oh-metal">금</span>
          <span className="oh-water">수</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;