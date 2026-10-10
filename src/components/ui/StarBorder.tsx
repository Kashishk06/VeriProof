'use client';

import React from 'react';
import './StarBorder.css';

export interface StarBorderProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  className?: string;
  innerClassName?: string;
  color?: string;
  speed?: string;
  thickness?: number;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  children?: React.ReactNode;
}

const StarBorder: React.FC<StarBorderProps> = ({
  as: Component = 'button',
  className = '',
  innerClassName = '',
  color = 'white',
  speed = '6s',
  thickness = 1,
  backgroundColor = '#000000',
  textColor = '#ffffff',
  borderColor = '#222222',
  children,
  style,
  ...rest
}) => {
  return (
    <Component
      className={`star-border-container ${className}`}
      style={{
        padding: `${thickness}px 0`,
        ...style
      }}
      {...rest}
    >
      <div
        className="border-gradient-bottom"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      />
      <div
        className="border-gradient-top"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      />
      <div
        className={`inner-content ${innerClassName}`}
        style={{
          background: backgroundColor,
          color: textColor,
          borderColor
        }}
      >
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
