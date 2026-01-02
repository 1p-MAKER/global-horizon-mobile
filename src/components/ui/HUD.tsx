import { useEffect, useState } from 'react';
import { gameStore, subscribeToStore } from '../../core/store/GameStore';
import { useTranslation } from 'react-i18next';

export const HUD = () => {
    const [score, setScore] = useState(gameStore.score);
    const [combo, setCombo] = useState(gameStore.combo);
    const [isFever, setIsFever] = useState(gameStore.isFever);
    const { t } = useTranslation();

    useEffect(() => {
        return subscribeToStore(() => {
            setScore(gameStore.score);
            setCombo(gameStore.combo);
            setIsFever(gameStore.isFever);
        });
    }, []);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 'max(60px, env(safe-area-inset-top) + 20px) 20px 20px 20px',
            boxSizing: 'border-box',
            fontFamily: '"Outfit", sans-serif',
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}>
            {/* Top Bar: Score */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
            }}>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase' }}>{t('score')}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800 }}>{score.toLocaleString()}</div>
                </div>

                {isFever && (
                    <div className="fever-indicator">
                        FEVER MODE
                    </div>
                )}

                {combo > 1 && (
                    <div key={combo} style={{
                        textAlign: 'right',
                        animation: 'pop 0.3s ease-out'
                    }}>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase' }}>Combo</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: isFever ? '#ff00ff' : '#00dcb4' }}>x{combo}</div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pop {
                    0% { transform: scale(1.5); color: #fff; }
                    100% { transform: scale(1); color: ${isFever ? '#ff00ff' : '#00dcb4'}; }
                }
                .fever-indicator {
                    position: absolute;
                    top: 80px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #ff00ff;
                    color: white;
                    padding: 5px 20px;
                    border-radius: 20px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    animation: pulse 0.5s infinite alternate;
                }
                @keyframes pulse {
                    from { transform: translateX(-50%) scale(1); opacity: 0.8; }
                    to { transform: translateX(-50%) scale(1.1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};
