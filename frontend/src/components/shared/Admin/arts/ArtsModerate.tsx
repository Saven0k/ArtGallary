// import { useState, useEffect } from 'react';
// import { useConfirm } from '../../../../hooks/useConfirm';
// import '../AdminPage.scss';
// import { getUnmoderatedArts, moderateArt, type Art } from '../../../../api/arts/main.api';
// import { AdminTable } from '../components/AdminTable';
// import { AdminModal } from '../components/AdminModal';
// import { useAuth } from '../../../../hooks/useAuth';
// import { useNotification } from '../../../../hooks/useNotification';

// export const ArtsModerate = () => {
//     const { showNotification } = useNotification();
//     const { confirm } = useConfirm();
//     const [data, setData] = useState<Art[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [selectedArt, setSelectedArt] = useState<Art | null>(null);
//     const { user } = useAuth();
//     const [viewModalOpen, setViewModalOpen] = useState(false);

//     const [rejectModalOpen, setRejectModalOpen] = useState(false);
//     const [artToReject, setArtToReject] = useState<Art | null>(null);
//     const [rejectErrors, setRejectErrors] = useState<{ field: string; message: string }[]>([]);
//     const [rejectComment, setRejectComment] = useState('');

//     useEffect(() => { loadData(); }, []);

//     const parseModerate = (moderate: any): boolean => {
//         if (!moderate) return false;
//         if (typeof moderate === 'string') {
//             try {
//                 const parsed = JSON.parse(moderate);
//                 return parsed.moderate === true;
//             } catch { return false; }
//         }
//         if (typeof moderate === 'object') return moderate.moderate === true;
//         return false;
//     };

//     const loadData = async () => {
//         setLoading(true);
//         try {
//             const response = await getUnmoderatedArts();
//             setData(response?.arts || []);
//         } catch (error) {
//             showNotification("Ошибка при загрузке артов", "error");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleApprove = async (id: number, name: string) => {
//         const confirmed = await confirm({ title: "Одобрить картину", message: `Вы уверены, что хотите одобрить "${name}"?`, confirmText: "Одобрить", cancelText: "Отмена", type: "info" });
//         if (confirmed) {
//             try {
//                 // Server Art.moderate = string (JSON). Send object.
//                 await moderateArt(id, {
//                     moderate: true,
//                     moderator_id: Number(user?.id),
//                     comment: '',
//                     errors: {}
//                 });
//                 showNotification("Картина одобрена", "success");
//                 loadData();
//             } catch (error) {
//                 showNotification("Ошибка при модерации", "error");
//             }
//         }
//     };

//     const openRejectModal = (art: Art) => {
//         setArtToReject(art);
//         setRejectErrors([]);
//         setRejectComment('');
//         setRejectModalOpen(true);
//     };

//     const addRejectError = (field: string) => setRejectErrors([...rejectErrors, { field, message: '' }]);
//     const removeRejectError = (index: number) => setRejectErrors(rejectErrors.filter((_, i) => i !== index));
//     const updateRejectError = (index: number, message: string) => {
//         const newErrors = [...rejectErrors];
//         newErrors[index].message = message;
//         setRejectErrors(newErrors);
//     };

//     const handleRejectConfirm = async () => {
//         const errorsObject: Record<string, string> = {};
//         rejectErrors.forEach(error => { if (error.message.trim()) errorsObject[error.field] = error.message; });

//         try {
//             await moderateArt(artToReject!.id, {
//                 moderate: false,
//                 moderator_id: Number(user?.id),
//                 comment: rejectComment || '',
//                 errors: errorsObject
//             });
//             showNotification("Картина отклонена", "success");
//             setRejectModalOpen(false);
//             setArtToReject(null);
//             loadData();
//         } catch (error) {
//             showNotification("Ошибка при модерации", "error");
//         }
//     };

//     const columns = [
//         { key: 'id', header: 'ID', className: 'admin-table__col-id' },
//         { key: 'title', header: 'Название', className: 'admin-table__col-name', render: (item: Art) => item.title },
//         { key: 'description', header: 'Описание', className: 'admin-table__col-description', render: (item: Art) => item.description?.substring(0, 100) },
//         { key: 'artistName', header: 'Автор', className: 'admin-table__col-artist', render: (item: Art) => item.artist?.user?.name || 'Неизвестно' },
//         { key: 'date_published', header: 'Дата', className: 'admin-table__col-date', render: (item: Art) => new Date(item.date_published).toLocaleDateString() },
//         { key: 'likes', header: 'Лайки', className: 'admin-table__col-likes', render: (item: Art) => item.likes || 0 },
//         { key: 'views', header: 'Просмотры', className: 'admin-table__col-views', render: (item: Art) => item.views || 0 },
//     ];

//     const actions = (item: Art) => (
//         <>
//             <button className="admin-table__view" onClick={() => { setSelectedArt(item); setViewModalOpen(true); }}>👁️</button>
//             <button className="admin-table__approve" onClick={() => handleApprove(item.id, item.title)}>✅ Одобрить</button>
//             <button className="admin-table__reject" onClick={() => openRejectModal(item)}>❌ Отклонить</button>
//         </>
//     );

//     if (loading) return <div className="admin-loading">Загрузка...</div>;

//     return (
//         <div className="admin-page">
//             <div className="admin-page__header">
//                 <h1>🎨 Модерация картин</h1>
//                 <span className="admin-page__count">На модерации: {data.length}</span>
//             </div>

//             {data.length === 0 ? (
//                 <div className="admin-empty">
//                     <div className="admin-empty__icon">✅</div>
//                     <h3>Нет картин на модерации</h3>
//                     <p>Все картины уже проверены</p>
//                 </div>
//             ) : (
//                 <AdminTable data={data} columns={columns as any} actions={actions} emptyMessage="Нет картин на модерации" />
//             )}

//             <AdminModal isOpen={viewModalOpen} onClose={() => { setViewModalOpen(false); setSelectedArt(null); }} title={selectedArt?.title}>
//                 {selectedArt && (
//                     <div className="admin-view">
//                         <div className="admin-view__section">
//                             <h4>📋 Информация</h4>
//                             <div className="admin-view__grid">
//                                 <div className="admin-view__item"><span className="admin-view__label">🆔 ID</span><span className="admin-view__value">{selectedArt.id}</span></div>
//                                 <div className="admin-view__item"><span className="admin-view__label">📝 Название</span><span className="admin-view__value">{selectedArt.title}</span></div>
//                                 <div className="admin-view__item"><span className="admin-view__label">📄 Описание</span><span className="admin-view__value">{selectedArt.description}</span></div>
//                                 <div className="admin-view__item"><span className="admin-view__label">🖼️ Автор</span><span className="admin-view__value">{selectedArt.artist?.user?.surname} {selectedArt.artist?.user?.name}</span></div>
//                                 <div className="admin-view__item"><span className="admin-view__label">📅 Дата публикации</span><span className="admin-view__value">{new Date(selectedArt.date_published).toLocaleDateString()}</span></div>
//                                 <div className="admin-view__item"><span className="admin-view__label">❤️ Лайки</span><span className="admin-view__value">{selectedArt.likes || 0}</span></div>
//                                 <div className="admin-view__item"><span className="admin-view__label">👁️ Просмотры</span><span className="admin-view__value">{selectedArt.views || 0}</span></div>
//                                 <div className="admin-view__item"><span className="admin-view__label">💰 Цена</span><span className="admin-view__value">{selectedArt.cost ? `${selectedArt.cost} ${selectedArt.currency}` : 'Бесплатно'}</span></div>
//                             </div>
//                         </div>
//                         {selectedArt.image_path && (
//                             <div className="admin-view__section">
//                                 <h4>🖼️ Изображение</h4>
//                                 <img src={selectedArt.image_path} alt={selectedArt.title} className="admin-view__image" />
//                             </div>
//                         )}
//                         {selectedArt.specifications && (
//                             <div className="admin-view__section">
//                                 <h4>📄 Спецификации</h4>
//                                 <pre>{JSON.stringify(JSON.parse(selectedArt.specifications), null, 2)}</pre>
//                             </div>
//                         )}
//                         <div className="admin-view__section">
//                             <h4>⚖️ Статус модерации</h4>
//                             <div className="admin-view__status">
//                                 {(() => {
//                                     const moderate = selectedArt.moderate;
//                                     let isModerated = false;
//                                     let moderatorComment = null;
//                                     let moderatedAt = null;

//                                     if (typeof moderate === 'string') {
//                                         try {
//                                             const parsed = JSON.parse(moderate);
//                                             isModerated = parsed.moderate;
//                                             moderatorComment = parsed.comment;
//                                             moderatedAt = parsed.moderated_at;
//                                         } catch { }
//                                     } else if (typeof moderate === 'object' && moderate) {
//                                         isModerated = moderate.moderate;
//                                         moderatorComment = moderate.comment;
//                                         moderatedAt = moderate.moderated_at;
//                                     }

//                                     return (
//                                         <>
//                                             <div className="admin-view__status-badge">
//                                                 <span className={`admin-view__status-icon ${isModerated ? 'approved' : 'pending'}`}>{isModerated ? '✅' : '⏳'}</span>
//                                                 <span className="admin-view__status-text">{isModerated ? 'Одобрен' : 'На модерации'}</span>
//                                             </div>
//                                             {moderatorComment && (<div className="admin-view__status-comment"><strong>💬 Комментарий модератора:</strong><p>{moderatorComment}</p></div>)}
//                                             {moderatedAt && (<div className="admin-view__status-date">📅 Дата модерации: {new Date(moderatedAt).toLocaleDateString('ru-RU')}</div>)}
//                                         </>
//                                     );
//                                 })()}
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </AdminModal>

//             <AdminModal isOpen={rejectModalOpen} onClose={() => { setRejectModalOpen(false); setArtToReject(null); }} title={`Отклонить: ${artToReject?.title}`} onSave={handleRejectConfirm} saveText="Отклонить">
//                 {artToReject && (
//                     <div className="admin-reject">
//                         <p className="admin-reject__warning">⚠️ Укажите причины отклонения.</p>
                        
//                         <div className="admin-reject__fields">
//                             <div className="admin-reject__field">
//                                 <div className="admin-reject__field-header"><span className="admin-reject__field-label">Название</span><button className="admin-reject__add-error" onClick={() => addRejectError('title')}>✏️ Добавить замечание</button></div>
//                                 <div className="admin-reject__field-value">{artToReject.title}</div>
//                             </div>
//                             <div className="admin-reject__field">
//                                 <div className="admin-reject__field-header"><span className="admin-reject__field-label">Автор</span><button className="admin-reject__add-error" onClick={() => addRejectError('author')}>✏️ Добавить замечание</button></div>
//                                 <div className="admin-reject__field-value">{artToReject.artist?.user?.surname} {artToReject.artist?.user?.name}</div>
//                             </div>
//                             <div className="admin-reject__field">
//                                 <div className="admin-reject__field-header"><span className="admin-reject__field-label">Описание</span><button className="admin-reject__add-error" onClick={() => addRejectError('description')}>✏️ Добавить замечание</button></div>
//                                 <div className="admin-reject__field-value">{artToReject.description}</div>
//                             </div>
//                             <div className="admin-reject__field">
//                                 <div className="admin-reject__field-header"><span className="admin-reject__field-label">Цена</span><button className="admin-reject__add-error" onClick={() => addRejectError('price')}>✏️ Добавить замечание</button></div>
//                                 <div className="admin-reject__field-value">{artToReject.cost ? `${artToReject.cost} ${artToReject.currency}` : 'Бесплатно'}</div>
//                             </div>
//                         </div>

//                         {rejectErrors.length > 0 && (
//                             <div className="admin-reject__errors">
//                                 <h4>📝 Замечания:</h4>
//                                 {rejectErrors.map((error, index) => (
//                                     <div key={index} className="admin-reject__error-item">
//                                         <div className="admin-reject__error-header">
//                                             <span className="admin-reject__error-field">
//                                                 {error.field === 'title' ? 'Название' : error.field === 'author' ? 'Автор' : error.field === 'description' ? 'Описание' : error.field === 'price' ? 'Цена' : error.field}
//                                             </span>
//                                             <button className="admin-reject__error-remove" onClick={() => removeRejectError(index)}>🗑️</button>
//                                         </div>
//                                         <textarea className="admin-reject__error-input" value={error.message} onChange={(e) => updateRejectError(index, e.target.value)} placeholder="Введите замечание..." rows={2} />
//                                     </div>
//                                 ))}
//                             </div>
//                         )}

//                         <div className="admin-reject__global">
//                             <label className="admin-reject__global-label">Общий комментарий</label>
//                             <textarea className="admin-reject__global-input" value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} placeholder="Добавьте общий комментарий к отклонению..." rows={3} />
//                         </div>
//                     </div>
//                 )}
//             </AdminModal>
//         </div>
//     );
// };
