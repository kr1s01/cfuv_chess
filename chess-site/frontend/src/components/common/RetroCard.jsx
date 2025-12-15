import React from 'react';

const RetroCard = ({ title, children, className = '', style = {}, titleStyle = {} }) => {
    return (
        <div className={`retro-card ${className}`} style={style}>
            {title && (
                <div className="retro-title-bar" style={titleStyle}>
                    {title}
                </div>
            )}
            {children}
        </div>
    );
};

export default RetroCard;
