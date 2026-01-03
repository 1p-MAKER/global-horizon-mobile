import './Settings.css';

interface SettingsProps {
    onClose: () => void;
}

export const Settings = ({ onClose }: SettingsProps) => {
    const version = '1.0.0';

    const openLink = (url: string) => {
        window.open(url, '_blank');
    };

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-card" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>設定</h2>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                <div className="settings-content">
                    <div className="settings-section">
                        <h3>リンク</h3>
                        <button
                            className="link-button"
                            onClick={() => openLink('https://scented-zinc-a47.notion.site/2db768aba03f801f9374ce83fdd34af3')}
                        >
                            📖 説明書
                        </button>
                        <button
                            className="link-button"
                            onClick={() => openLink('https://scented-zinc-a47.notion.site/Shatter-Rush-ASMR-2db768aba03f80dd80d8f3a490d26000')}
                        >
                            📄 プライバシーポリシー / 利用規約 / お問い合わせ
                        </button>
                        <button
                            className="link-button"
                            onClick={() => openLink('https://scented-zinc-a47.notion.site/2d2768aba03f8041bb12dc5e71a7ceb8?pvs=74')}
                        >
                            📱 その他のアプリ
                        </button>
                    </div>

                    <div className="settings-section">
                        <h3>バージョン情報</h3>
                        <div className="version-info">
                            <span className="version-label">Developer</span>
                            <span className="version-number">Dev Cat</span>
                        </div>
                        <div className="version-info">
                            <span className="version-label">Version</span>
                            <span className="version-number">{version}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
