import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { useI18n } from '../i18n/I18nContext';
import { Leaderboard } from '../components/Leaderboard';
import { RoundEntry } from '../components/RoundEntry';
import { UndoRedoBar } from '../components/UndoRedoBar';
import { SignatureModal } from '../components/SignatureModal';
import { Player } from '../domain/models/Player';

export function GamePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const { meta, state, loading, loadGame, saveLoserSignature } = useGame();
  const [signatureDismissed, setSignatureDismissed] = useState(false);

  useEffect(() => {
    if (id) void loadGame(id);
  }, [id, loadGame]);

  if (loading || !meta || !state) {
    return <p className="text-center text-slate-500">{t('common.loading')}</p>;
  }

  // Names are baked in at game creation, so this stays correct even if the
  // Player is later removed (completed games are preserved as history).
  const players: Player[] = meta.playerIds.map(
    (pid) => new Player(pid, meta.playerNames[pid] ?? t('common.unknownPlayer')),
  );

  const showSignature =
    state.status === 'completed' && !!state.loserId && !meta.loserSignature && !signatureDismissed;

  return (
    <div className="space-y-6">
      <Leaderboard players={players} state={state} />
      <UndoRedoBar />
      <RoundEntry players={players} />

      {meta.loserSignature && (
        <img
          src={meta.loserSignature}
          alt="Loser signature"
          className="mx-auto h-32 rounded-xl border border-slate-300 bg-white dark:border-slate-700"
        />
      )}

      {showSignature && state.loserId && (
        <SignatureModal
          loserName={players.find((p) => p.id === state.loserId)?.name ?? state.loserId}
          onSave={(dataUrl) => {
            void saveLoserSignature(dataUrl);
            setSignatureDismissed(true);
          }}
          onSkip={() => setSignatureDismissed(true)}
        />
      )}
    </div>
  );
}
