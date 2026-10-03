/** Дата и время по-русски (часовой пояс браузера админа); нет даты — «—». */
export const dateTime = (value: string | null) => (value ? new Date(value).toLocaleString("ru-RU") : "—");
