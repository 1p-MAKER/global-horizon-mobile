import { useTranslation } from 'react-i18next';
import './App.css'

function App() {
  const { t } = useTranslation();

  return (
    <>
      <h1>{t('app.title')}</h1>
      <div className="card">
        <button>
          {t('start')}
        </button>
      </div>
      <p className="read-the-docs">
        {t('loading')}
      </p>
    </>
  )
}

export default App
