import React, { useEffect, useRef } from 'react';
import RetroCard from './common/RetroCard';

const MoveHistory = ({ game }) => {
    const history = game.history();
    const scrollRef = useRef(null);

    // Auto-scroll to bottom when history updates
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    // Group moves into pairs
    const movePairs = [];
    for (let i = 0; i < history.length; i += 2) {
        movePairs.push({
            moveNumber: Math.floor(i / 2) + 1,
            white: history[i],
            black: history[i + 1] || '',
        });
    }

    return (
        <RetroCard title="MOVE_LOG.TXT" className="h-full flex flex-col" style={{ minHeight: '300px', maxHeight: '500px' }}>
            <div
                ref={scrollRef}
                style={{
                    overflowY: 'auto',
                    flex: 1,
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: '0.9rem'
                }}
            >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid black', textAlign: 'left' }}>
                            <th style={{ padding: '4px' }}>#</th>
                            <th style={{ padding: '4px' }}>WHITE</th>
                            <th style={{ padding: '4px' }}>BLACK</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movePairs.map((pair) => (
                            <tr key={pair.moveNumber} style={{ borderBottom: '1px dotted #ccc' }}>
                                <td style={{ padding: '4px', width: '30px', color: '#888' }}>{pair.moveNumber}.</td>
                                <td style={{ padding: '4px' }}>{pair.white}</td>
                                <td style={{ padding: '4px' }}>{pair.black}</td>
                            </tr>
                        ))}
                        {movePairs.length === 0 && (
                            <tr>
                                <td colSpan="3" style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>
                                    NO_MOVES_YET...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </RetroCard>
    );
};

export default MoveHistory;
