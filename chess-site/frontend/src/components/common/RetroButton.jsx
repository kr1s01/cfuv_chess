import React from 'react';

const RetroButton = ({ children, variant = 'default', className = '', onClick, type = 'button', disabled = false, style = {} }) => {
    const variantClass = variant === 'primary' ? 'primary' : '';

    return (
        <button
            type={type}
            className={`retro-btn ${variantClass} ${className}`}
            onClick={onClick}
            disabled={disabled}
            style={style}
        >
            {children}
        </button>
    );
};

export default RetroButton;
