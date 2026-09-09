export function requestStatusLabel(status: string) {
  return ({ pending: 'Ждёт решения', accepted: 'Принято', declined: 'Отклонено', cancelled: 'Отменено' } as Record<string,string>)[status] || status;
}
export function eventStatusLabel(status: string) {
  return ({ draft:'Черновик', published:'Опубликовано', hidden:'Скрыто', cancelled:'Отменено' } as Record<string,string>)[status] || status;
}
