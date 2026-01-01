import { useEffect, useState } from 'react';
import './Ranking.css';

interface RankingProps {
    onClose: () => void;
}

interface ScoreEntry {
    score: number;
    date: number; // timestamp
}

export const Ranking = ({ onClose }: RankingProps) => {
    const [scores, setScores] = useState<ScoreEntry[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('highScores');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setScores(parsed);
            } catch (e) {
                console.error("Failed to parse scores", e);
            }
        }
    }, []);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <div className="ranking-overlay" onClick={onClose}>
            <div className="ranking-card" onClick={(e) => e.stopPropagation()}>
                <div className="ranking-header">
                    <h2>🏆 RANKING</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="ranking-content">
                    {scores.length === 0 ? (
                        <div className="no-data">
                            NO DATA YET... <br />
                            PLAY TO SET A RECORD
                        </div>
                    ) : (
                        <ul className="ranking-list">
                            {scores.map((entry, index) => (
                                <li key={`${entry.date}-${index}`} className={`ranking-item top-${index + 1}`}>
                                    <span className="rank-position">{index + 1}</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        <span className="rank-score">{entry.score.toLocaleString()}</span>
                                        <span className="rank-date">{formatDate(entry.date)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};
