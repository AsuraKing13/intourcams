
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  titleIcon?: React.ReactNode;
  actions?: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ children, className = '', title, titleIcon, actions }, ref) => {
  return (
    <section 
      ref={ref} 
      className={`p-5 rounded-lg shadow-lg bg-card-bg-light dark:bg-card-bg border border-neutral-300-light dark:border-neutral-700-dark ${className}`} 
      aria-labelledby={title ? `card-title-${title.replace(/\s+/g, '-').toLowerCase()}` : undefined}
    >
      {(title || actions) && (
        <header className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-200-light dark:border-neutral-600-dark">
          {title && (
            <h3 
              id={`card-title-${title.replace(/\s+/g, '-').toLowerCase()}`} 
              className="text-lg font-semibold text-brand-green-text dark:text-brand-dark-green-text flex items-center"
            >
              {titleIcon && <span className="mr-2" aria-hidden="true">{titleIcon}</span>}
              {title}
            </h3>
          )}
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </header>
      )}
      <div className="card-content">
        {children}
      </div>
    </section>
  );
});

Card.displayName = 'Card';

export default Card;
