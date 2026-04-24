import { DragEvent, useMemo, useState } from 'react';
import {
  useKanbanStore,
  type KanbanCard,
  
} from '../../stores/kanbanStore';
import './KanbanWorkspace.css';

type DragPayload =
  | { type: 'entry'; entryId: string }
  | { type: 'subtask'; entryId: string; subtaskId: string }
  | { type: 'card'; cardId: string };

function setDragPayload(event: DragEvent<HTMLElement>, payload: DragPayload) {
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('application/deep-canvas-feature', JSON.stringify(payload));
}

function getDragPayload(event: DragEvent<HTMLElement>): DragPayload | null {
  const raw = event.dataTransfer.getData('application/deep-canvas-feature');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DragPayload;
  } catch {
    return null;
  }
}

function formatCountLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function KanbanWorkspace({ onExit }: { onExit: () => void }) {
  const entries = useKanbanStore((state) => state.entries);
  const columns = useKanbanStore((state) => state.columns);
  const cards = useKanbanStore((state) => state.cards);
  
  const addEntry = useKanbanStore((state) => state.addEntry);
  const addColumn = useKanbanStore((state) => state.addColumn);
  const updateColumn = useKanbanStore((state) => state.updateColumn);
  
  const moveCard = useKanbanStore((state) => state.moveCard);
  const addCardFromEntry = useKanbanStore((state) => state.addCardFromEntry);
  const addCardFromSubtask = useKanbanStore((state) => state.addCardFromSubtask);

  const [composerOpen, setComposerOpen] = useState(false);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryNotes, setEntryNotes] = useState('');
  const [draftSubtasks, setDraftSubtasks] = useState<string[]>([]);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [columnDraft, setColumnDraft] = useState('');
  const [dropColumnId, setDropColumnId] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<{type: 'entry', id: string} | {type: 'card', id: string} | null>(null);

  const columnCards = useMemo(() => {
    const result: Record<string, KanbanCard[]> = {};
    for (const card of cards) {
      if (!result[card.columnId]) result[card.columnId] = [];
      result[card.columnId].push(card);
    }
    return result;
  }, [cards]);

  const intakeCount = entries.length;
  const totalSubentryCount = entries.reduce((acc, current) => acc + current.subtasks.length, 0);
  const boardCardCount = cards.length;

  const handleAddDraftSubtask = () => {
    if (!subtaskDraft.trim()) return;
    setDraftSubtasks((current) => [...current, subtaskDraft.trim()]);
    setSubtaskDraft('');
  };

  const handleCreateEntry = () => {
    if (!entryTitle.trim() && !entryNotes.trim() && draftSubtasks.length === 0) {
      setComposerOpen(false);
      return;
    }
    addEntry({ title: entryTitle.trim(), notes: entryNotes.trim(), subtasks: draftSubtasks });
    setEntryTitle('');
    setEntryNotes('');
    setDraftSubtasks([]);
    setComposerOpen(false);
  };

  const handleColumnDrop = (columnId: string, event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDropColumnId(null);

    const payload = getDragPayload(event);
    if (!payload) return;

    if (payload.type === 'entry') {
      addCardFromEntry(payload.entryId, columnId);
    } else if (payload.type === 'subtask') {
      addCardFromSubtask(payload.entryId, payload.subtaskId, columnId);
    } else if (payload.type === 'card') {
      moveCard(payload.cardId, columnId);
    }
  };

  return (
    <div className="feature-kanban animate-rise">
      <section className="feature-kanban__intake">
        <div className="feature-kanban__panel">
          <div className="feature-kanban__panel-header">
            <div>
              <div className="feature-kanban__eyebrow">Task Intake</div>
              <h2 className="feature-kanban__panel-title">Build Tasks</h2>
            </div>
            <div className="feature-kanban__stat-pill">{formatCountLabel(intakeCount, 'entry', 'entries')}</div>
          </div>

          <div className="feature-kanban__composer-shell">
            <button
              type="button"
              className="feature-kanban__primary-button feature-kanban__primary-button--full"
              onClick={() => setComposerOpen((current) => !current)}
            >
              {composerOpen ? 'Hide task form' : 'Create task'}
            </button>

            {composerOpen && (
              <div className="feature-kanban__composer">
                <input
                  value={entryTitle}
                  onChange={(event) => setEntryTitle(event.target.value)}
                  className="feature-kanban__input feature-kanban__input--title"
                  placeholder="Main task title"
                />
                <textarea
                  value={entryNotes}
                  onChange={(event) => setEntryNotes(event.target.value)}
                  className="feature-kanban__textarea"
                  placeholder="Notes, context, or acceptance details"
                  rows={3}
                />

                <div className="feature-kanban__subtask-composer">
                  <input
                    value={subtaskDraft}
                    onChange={(event) => setSubtaskDraft(event.target.value)}
                    className="feature-kanban__input"
                    placeholder="Sub-task"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAddDraftSubtask();
                      }
                    }}
                  />
                  <button type="button" className="feature-kanban__ghost-button" onClick={handleAddDraftSubtask}>
                    Add sub-task
                  </button>
                </div>

                {draftSubtasks.length > 0 && (
                  <div className="feature-kanban__chip-row">
                    {draftSubtasks.map((item, index) => (
                      <button
                        key={`${item}-${index}`}
                        type="button"
                        className="feature-kanban__chip"
                        onClick={() => setDraftSubtasks((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                        title="Remove sub-task"
                      >
                        <span>{item}</span>
                        <span aria-hidden="true">×</span>
                      </button>
                    ))}
                  </div>
                )}

                <button type="button" className="feature-kanban__primary-button feature-kanban__primary-button--full" onClick={handleCreateEntry}>
                  Save task
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="feature-kanban__panel feature-kanban__panel--scrollable">
          <div className="feature-kanban__panel-header">
            <div>
              <div className="feature-kanban__eyebrow">Queue</div>
              <h3 className="feature-kanban__panel-title">Ready for Board</h3>
            </div>
            <div className="feature-kanban__stat-pill">{formatCountLabel(totalSubentryCount, 'sub-entry', 'sub-entries')}</div>
          </div>

          <div className="feature-kanban__entry-list">
            {entries.length === 0 ? (
              <div className="feature-kanban__empty-state">Create a task on the left, then drag it or add it to the board.</div>
            ) : (
              entries.map((entry) => (
                <article
                  key={entry.id}
                  className="feature-kanban__entry-card-minimal"
                  draggable
                  onDragStart={(event) => setDragPayload(event, { type: 'entry', entryId: entry.id })}
                  onClick={() => setEditingItem({ type: 'entry', id: entry.id })}
                >
                  <div className="feature-kanban__minimal-title">{entry.title || 'Untitled Task'}</div>
                  {entry.subtasks.map(subtask => (
                    <div key={subtask.id} className="feature-kanban__minimal-subtask">• {subtask.title}</div>
                  ))}
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="feature-kanban__board-shell">
        <div className="feature-kanban__board-toolbar">
          <div className="feature-kanban__board-heading">
            <div className="feature-kanban__eyebrow">Production</div>
            <h2 className="feature-kanban__panel-title feature-kanban__panel-title--board">Active Board</h2>
          </div>
          <div className="feature-kanban__board-stats">
            <div className="feature-kanban__stat-pill">{formatCountLabel(boardCardCount, 'card', 'cards')}</div>
            <input
              value={columnDraft}
              onChange={(event) => setColumnDraft(event.target.value)}
              className="feature-kanban__input feature-kanban__input--compact feature-kanban__input--toolbar"
              placeholder="New column"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addColumn(columnDraft);
                  setColumnDraft('');
                }
              }}
            />
            <button
              type="button"
              className="feature-kanban__primary-button feature-kanban__primary-button--toolbar"
              onClick={() => {
                addColumn(columnDraft);
                setColumnDraft('');
              }}
            >
              Add column
            </button>
            <button
              type="button"
              className="feature-workspace__back feature-workspace__back--inline"
              onClick={onExit}
            >
              Back to chat
            </button>
          </div>
        </div>

        <div className="feature-kanban__board-grid">
          {columns.map((column) => (
            <section
              key={column.id}
              className={`feature-kanban__column ${dropColumnId === column.id ? 'is-drop-target' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDropColumnId(column.id);
              }}
              onDragLeave={() => {
                setDropColumnId((current) => (current === column.id ? null : current));
              }}
              onDrop={(event) => handleColumnDrop(column.id, event)}
            >
              <div className="feature-kanban__column-header">
                <input
                  value={column.title}
                  onChange={(event) => updateColumn(column.id, event.target.value)}
                  className="feature-kanban__column-title"
                  aria-label="Column title"
                  title="Column title"
                  placeholder="Column title"
                />
                <div className="feature-kanban__column-actions">
                  <span className="feature-kanban__column-count">{columnCards[column.id]?.length ?? 0}</span>
                </div>
              </div>

              <div className="feature-kanban__card-list">
                {(columnCards[column.id] ?? []).map((card) => (
                  <article
                    key={card.id}
                    className="feature-kanban__board-card-minimal"
                    draggable
                    onDragStart={(event) => setDragPayload(event, { type: 'card', cardId: card.id })}
                    onClick={() => setEditingItem({ type: 'card', id: card.id })}
                  >
                    <div className="feature-kanban__minimal-title">{card.title || 'Untitled Card'}</div>
                    {card.parentTitle && <div className="feature-kanban__minimal-parent">From: {card.parentTitle}</div>}
                    {card.subtasks.map(subtask => (
                      <div key={subtask.id} className="feature-kanban__minimal-subtask">• {subtask.title}</div>
                    ))}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      {editingItem && editingItem.type === 'entry' && (
        <EditEntryModal entryId={editingItem.id} onClose={() => setEditingItem(null)} />
      )}
      {editingItem && editingItem.type === 'card' && (
        <EditCardModal cardId={editingItem.id} onClose={() => setEditingItem(null)} />
      )}
    </div>
  );
}

function EditEntryModal({ entryId, onClose }: { entryId: string, onClose: () => void }) {
  const entries = useKanbanStore(state => state.entries);
  const entry = entries.find(e => e.id === entryId);
  const updateEntry = useKanbanStore(state => state.updateEntry);
  const deleteEntry = useKanbanStore(state => state.deleteEntry);
  const addEntrySubtask = useKanbanStore(state => state.addEntrySubtask);
  const updateEntrySubtask = useKanbanStore(state => state.updateEntrySubtask);
  const deleteEntrySubtask = useKanbanStore(state => state.deleteEntrySubtask);
  const addCardFromEntry = useKanbanStore(state => state.addCardFromEntry);

  const [subDraft, setSubDraft] = useState('');

  if (!entry) return null;

  return (
    <div className="feature-kanban__modal-overlay" onClick={onClose}>
      <div className="feature-kanban__modal-content" onClick={e => e.stopPropagation()}>
        <div className="feature-kanban__modal-header">
          <h2>Edit Task</h2>
          <button className="feature-kanban__close-button" onClick={onClose}>×</button>
        </div>
        
        <input 
          className="feature-kanban__input feature-kanban__input--title" 
          value={entry.title} 
          onChange={e => updateEntry(entry.id, { title: e.target.value })} 
          placeholder="Task title"
        />
        <textarea 
          className="feature-kanban__textarea" 
          value={entry.notes} 
          onChange={e => updateEntry(entry.id, { notes: e.target.value })} 
          placeholder="Task notes"
          rows={4}
        />
        
        <div className="feature-kanban__eyebrow">Sub-tasks</div>
        <div className="feature-kanban__subentry-list">
          {entry.subtasks.map(subtask => (
            <div key={subtask.id} className="feature-kanban__subentry-row">
              <input 
                className="feature-kanban__subentry-input"
                value={subtask.title}
                onChange={e => updateEntrySubtask(entry.id, subtask.id, e.target.value)}
              />
              <button 
                className="feature-kanban__mini-button feature-kanban__mini-button--danger"
                onClick={() => deleteEntrySubtask(entry.id, subtask.id)}
              >×</button>
            </div>
          ))}
          <div className="feature-kanban__subtask-composer feature-kanban__subtask-composer--compact">
            <input 
              className="feature-kanban__input" 
              placeholder="New sub-task" 
              value={subDraft} 
              onChange={e => setSubDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && subDraft.trim()) {
                  e.preventDefault();
                  addEntrySubtask(entry.id, subDraft.trim());
                  setSubDraft('');
                }
              }}
            />
            <button 
              className="feature-kanban__ghost-button"
              onClick={() => {
                if (subDraft.trim()) {
                  addEntrySubtask(entry.id, subDraft.trim());
                  setSubDraft('');
                }
              }}
            >Add</button>
          </div>
        </div>

        <div className="feature-kanban__board-toolbar" style={{ marginTop: '1rem' }}>
          <button 
            className="feature-kanban__primary-button" 
            onClick={() => {
              addCardFromEntry(entry.id);
              onClose();
            }}
          >Send to Board</button>
          
          <button 
            className="feature-kanban__danger-button" 
            onClick={() => {
              deleteEntry(entry.id);
              onClose();
            }}
          >Delete Task</button>
        </div>
      </div>
    </div>
  );
}

function EditCardModal({ cardId, onClose }: { cardId: string, onClose: () => void }) {
  const cards = useKanbanStore(state => state.cards);
  const card = cards.find(c => c.id === cardId);
  const updateCard = useKanbanStore(state => state.updateCard);
  const deleteCard = useKanbanStore(state => state.deleteCard);
  const addCardSubtask = useKanbanStore(state => state.addCardSubtask);
  const updateCardSubtask = useKanbanStore(state => state.updateCardSubtask);
  const deleteCardSubtask = useKanbanStore(state => state.deleteCardSubtask);

  const [subDraft, setSubDraft] = useState('');

  if (!card) return null;

  return (
    <div className="feature-kanban__modal-overlay" onClick={onClose}>
      <div className="feature-kanban__modal-content" onClick={e => e.stopPropagation()}>
        <div className="feature-kanban__modal-header">
          <h2>Edit Board Card</h2>
          <button className="feature-kanban__close-button" onClick={onClose}>×</button>
        </div>
        
        {card.parentTitle && <div className="feature-kanban__minimal-parent">From: {card.parentTitle}</div>}
        
        <input 
          className="feature-kanban__input feature-kanban__input--title" 
          value={card.title} 
          onChange={e => updateCard(card.id, { title: e.target.value })} 
          placeholder="Card title"
        />
        <textarea 
          className="feature-kanban__textarea" 
          value={card.notes} 
          onChange={e => updateCard(card.id, { notes: e.target.value })} 
          placeholder="Card notes"
          rows={4}
        />
        
        <div className="feature-kanban__eyebrow">Sub-tasks</div>
        <div className="feature-kanban__subentry-list">
          {card.subtasks.map(subtask => (
            <div key={subtask.id} className="feature-kanban__subentry-row">
              <input 
                className="feature-kanban__subentry-input"
                value={subtask.title}
                onChange={e => updateCardSubtask(card.id, subtask.id, e.target.value)}
              />
              <button 
                className="feature-kanban__mini-button feature-kanban__mini-button--danger"
                onClick={() => deleteCardSubtask(card.id, subtask.id)}
              >×</button>
            </div>
          ))}
          <div className="feature-kanban__subtask-composer feature-kanban__subtask-composer--compact">
            <input 
              className="feature-kanban__input" 
              placeholder="New sub-task" 
              value={subDraft} 
              onChange={e => setSubDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && subDraft.trim()) {
                  e.preventDefault();
                  addCardSubtask(card.id, subDraft.trim());
                  setSubDraft('');
                }
              }}
            />
            <button 
              className="feature-kanban__ghost-button"
              onClick={() => {
                if (subDraft.trim()) {
                  addCardSubtask(card.id, subDraft.trim());
                  setSubDraft('');
                }
              }}
            >Add</button>
          </div>
        </div>

        <div className="feature-kanban__board-toolbar" style={{ marginTop: '1rem', justifyContent: 'flex-end' }}>
          <button 
            className="feature-kanban__danger-button" 
            onClick={() => {
              deleteCard(card.id);
              onClose();
            }}
          >Delete Card</button>
        </div>
      </div>
    </div>
  );
}
