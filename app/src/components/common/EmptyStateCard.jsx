// src/components/common/EmptyStateCard.js
import React from 'react';

/**
 * 재사용 가능한 빈 상태(안내) 카드
 * - props
 *   - icon: 상단 이모지/아이콘 문자 (기본 '🗂️')
 *   - title: 제목
 *   - paragraphs: 설명 문단 배열(문자열[])
 *   - primaryAction: { label, href?, onClick?, ariaLabel? }  // href 있으면 <a>, 아니면 <button>
 *   - secondaryAction: { label, onClick, ariaLabel? }        // 보조 버튼
 *   - children: 추가 content (선택)
 */
const EmptyStateCard = ({
  icon = '🗂️',
  title = '안내',
  paragraphs = [],
  primaryAction,
  secondaryAction,
  children,
}) => {
  return (
    <div className="card result" style={{ textAlign: 'center', paddingTop: 28, paddingBottom: 28 }}>
      <div style={{ fontSize: 42, lineHeight: 1 }}>{icon}</div>
      <h2 style={{ marginTop: 6 }}>{title}</h2>

      {paragraphs.map((text, idx) => (
        <p
          key={idx}
          style={{ color: 'var(--ink-soft)', margin: idx === 0 ? '4px 0 0' : '2px 0 14px' }}
        >
          {text}
        </p>
      ))}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {primaryAction &&
          (primaryAction.href ? (
            <a
              href={primaryAction.href}
              className="btn-primary"
              role="button"
              aria-label={primaryAction.ariaLabel || primaryAction.label}
            >
              {primaryAction.label}
            </a>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={primaryAction.onClick}
              aria-label={primaryAction.ariaLabel || primaryAction.label}
            >
              {primaryAction.label}
            </button>
          ))}

        {secondaryAction && (
          <button
            type="button"
            className="btn-text"
            onClick={secondaryAction.onClick}
            aria-label={secondaryAction.ariaLabel || secondaryAction.label}
          >
            {secondaryAction.label}
          </button>
        )}
      </div>

      {children}
    </div>
  );
};

export default EmptyStateCard;
