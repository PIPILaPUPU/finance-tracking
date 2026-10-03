import type { ReactElement, SVGProps } from 'react'
import { DEFAULT_CATEGORY_ICON } from '../utils/categoryStyle'

type IconProps = SVGProps<SVGSVGElement>

function Outline({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  )
}

export interface CategoryIconOption {
  key: string
  label: string
  render: (props: IconProps) => ReactElement
}

export const CATEGORY_ICONS: CategoryIconOption[] = [
  {
    key: 'food',
    label: 'Питание',
    render: (props) => (
      <Outline {...props}>
        <path d="M7 3v5.5a2.5 2.5 0 0 0 5 0V3" />
        <path d="M9.5 9v12" />
        <path d="M17.5 12v9" />
        <path d="M17.5 12c2.5-2 2.5-7 0-9-2.5 2-2.5 7 0 9Z" />
      </Outline>
    ),
  },
  {
    key: 'cart',
    label: 'Покупки',
    render: (props) => (
      <Outline {...props}>
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="17.5" cy="20" r="1.4" />
        <path d="M3 4h2l2.4 10.6a1.8 1.8 0 0 0 1.75 1.4h8.1a1.8 1.8 0 0 0 1.75-1.35L21 7.5H6" />
      </Outline>
    ),
  },
  {
    key: 'coffee',
    label: 'Кафе',
    render: (props) => (
      <Outline {...props}>
        <path d="M4 8h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z" />
        <path d="M16 9.5h1.5a2.5 2.5 0 0 1 0 5H16" />
        <path d="M7 3v2M11 3v2" />
      </Outline>
    ),
  },
  {
    key: 'home',
    label: 'Жильё',
    render: (props) => (
      <Outline {...props}>
        <path d="M3.5 10.5 12 3.5l8.5 7" />
        <path d="M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </Outline>
    ),
  },
  {
    key: 'bills',
    label: 'Счета',
    render: (props) => (
      <Outline {...props}>
        <path d="M14.5 3H7.5A1.5 1.5 0 0 0 6 4.5v15A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5V7.5L14.5 3Z" />
        <path d="M14.2 3.3v4.2h4.2" />
        <path d="M9 12.5h6M9 16.5h4" />
      </Outline>
    ),
  },
  {
    key: 'transport',
    label: 'Транспорт',
    render: (props) => (
      <Outline {...props}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5.5Z" />
        <path d="M4 10.5h16" />
        <circle cx="8" cy="14.3" r="1.1" />
        <circle cx="16" cy="14.3" r="1.1" />
        <path d="M7.5 18v2.5M16.5 18v2.5" />
      </Outline>
    ),
  },
  {
    key: 'taxi',
    label: 'Такси',
    render: (props) => (
      <Outline {...props}>
        <path d="M5 11.5 6.6 7a2 2 0 0 1 1.9-1.3h7a2 2 0 0 1 1.9 1.3L19 11.5" />
        <path d="M3.5 11.5h17V16a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-4.5Z" />
        <circle cx="7.5" cy="19" r="1.5" />
        <circle cx="16.5" cy="19" r="1.5" />
        <path d="M6.5 14h1.5M16 14h1.5" />
      </Outline>
    ),
  },
  {
    key: 'gas',
    label: 'Заправка',
    render: (props) => (
      <Outline {...props}>
        <path d="M4 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16" />
        <path d="M2.5 21h12" />
        <path d="M5.5 7h6v3.5h-6z" />
        <path d="M13 11h2.5a2 2 0 0 1 2 2v3a1.75 1.75 0 0 0 3.5 0V9l-2.5-3" />
      </Outline>
    ),
  },
  {
    key: 'travel',
    label: 'Путешествия',
    render: (props) => (
      <Outline {...props}>
        <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9Z" />
        <path d="M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6" />
        <path d="M4 12.5h16" />
        <path d="M8.5 20v1.5M15.5 20v1.5" />
      </Outline>
    ),
  },
  {
    key: 'vacation',
    label: 'Отпуск',
    render: (props) => (
      <Outline {...props}>
        <path d="M2.5 12a9.5 9.5 0 0 1 19 0Z" />
        <path d="M12 12v6.5a2.5 2.5 0 0 0 5 0" />
      </Outline>
    ),
  },
  {
    key: 'gym',
    label: 'Спорт',
    render: (props) => (
      <Outline {...props}>
        <path d="M6.5 5.5v13M3.5 8.5v7M17.5 5.5v13M20.5 8.5v7M6.5 12h11" />
      </Outline>
    ),
  },
  {
    key: 'health',
    label: 'Здоровье',
    render: (props) => (
      <Outline {...props}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l7.78 7.78 7.78-7.78a5.5 5.5 0 0 0 0-7.78Z" />
      </Outline>
    ),
  },
  {
    key: 'education',
    label: 'Образование',
    render: (props) => (
      <Outline {...props}>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3Z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3Z" />
      </Outline>
    ),
  },
  {
    key: 'entertainment',
    label: 'Развлечения',
    render: (props) => (
      <Outline {...props}>
        <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
        <path d="M7.5 4.5v15M16.5 4.5v15" />
        <path d="M2.5 9.5h5M2.5 14.5h5M16.5 9.5h5M16.5 14.5h5" />
      </Outline>
    ),
  },
  {
    key: 'internet',
    label: 'Связь',
    render: (props) => (
      <Outline {...props}>
        <path d="M1.5 9a16 16 0 0 1 21 0" />
        <path d="M5 12.6a11 11 0 0 1 14 0" />
        <path d="M8.5 16.1a6 6 0 0 1 7 0" />
        <circle cx="12" cy="19.8" r="1" />
      </Outline>
    ),
  },
  {
    key: 'phone',
    label: 'Техника',
    render: (props) => (
      <Outline {...props}>
        <rect x="6.5" y="2.5" width="11" height="19" rx="3" />
        <path d="M10.5 18.5h3" />
      </Outline>
    ),
  },
  {
    key: 'gift',
    label: 'Подарки',
    render: (props) => (
      <Outline {...props}>
        <rect x="3" y="8.5" width="18" height="12.5" rx="2" />
        <path d="M3 13h18" />
        <path d="M12 8.5V21" />
        <path d="M12 8.5H8.2a2.6 2.6 0 0 1 0-5.2C10.8 3.3 12 8.5 12 8.5Z" />
        <path d="M12 8.5h3.8a2.6 2.6 0 0 0 0-5.2C13.2 3.3 12 8.5 12 8.5Z" />
      </Outline>
    ),
  },
  {
    key: 'salary',
    label: 'Зарплата',
    render: (props) => (
      <Outline {...props}>
        <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
        <circle cx="12" cy="12" r="2.8" />
        <path d="M6 12h.5M17.5 12h.5" />
      </Outline>
    ),
  },
  {
    key: 'savings',
    label: 'Накопления',
    render: (props) => (
      <Outline {...props}>
        <path d="M16 9h1.5a2.5 2.5 0 0 1 0 5H16" />
        <path d="M5 12c0-3.3 3.1-6 7-6 2.6 0 4.8 1.1 6 2.8" />
        <path d="M5 12v2a5 5 0 0 0 5 5h3a5 5 0 0 0 5-5v-1" />
        <path d="M8 19v2M15 19v2M5 14H3" />
        <circle cx="9.5" cy="11" r="0.8" fill="currentColor" stroke="none" />
      </Outline>
    ),
  },
  {
    key: 'investments',
    label: 'Инвестиции',
    render: (props) => (
      <Outline {...props}>
        <path d="M19 5 5 19" />
        <circle cx="7.5" cy="7.5" r="2.5" />
        <circle cx="16.5" cy="16.5" r="2.5" />
      </Outline>
    ),
  },
  {
    key: 'finance',
    label: 'Финансы',
    render: (props) => (
      <Outline {...props}>
        <path d="M3.5 9V7.5A2 2 0 0 1 5.5 5.5h12" />
        <rect x="3.5" y="8.5" width="17" height="11" rx="2.5" />
        <path d="M15.5 14h2.5" />
      </Outline>
    ),
  },
  {
    key: 'clothes',
    label: 'Одежда',
    render: (props) => (
      <Outline {...props}>
        <path d="M9 3.5 4 6.5l2 4.2 2-1.1v9.9h8v-9.9l2 1.1 2-4.2-5-3Z" />
        <path d="M9 3.5a3 3 0 0 0 6 0" />
      </Outline>
    ),
  },
  {
    key: 'pets',
    label: 'Питомцы',
    render: (props) => (
      <Outline {...props}>
        <circle cx="6.5" cy="10" r="1.9" />
        <circle cx="10.5" cy="6.3" r="1.9" />
        <circle cx="15.5" cy="6.3" r="1.9" />
        <circle cx="19" cy="10.5" r="1.9" />
        <path d="M12.8 11.5c2.9 0 5.4 2.3 5.4 4.9 0 1.9-1.4 3.1-3.3 3.1-1.2 0-1.6-.4-2.4-.4s-1.2.4-2.4.4c-1.9 0-3.3-1.2-3.3-3.1 0-2.6 2.5-4.9 5.4-4.9Z" />
      </Outline>
    ),
  },
  {
    key: 'tag',
    label: 'Другое',
    render: (props) => (
      <Outline {...props}>
        <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2.5 12V2.5h9.5l8.6 8.6a2 2 0 0 1 0 2.3Z" />
        <circle cx="7" cy="7" r="1" />
      </Outline>
    ),
  },
]

const ICONS_BY_KEY = new Map(CATEGORY_ICONS.map((option) => [option.key, option]))
const FALLBACK =
  ICONS_BY_KEY.get(DEFAULT_CATEGORY_ICON) ?? CATEGORY_ICONS[CATEGORY_ICONS.length - 1]

export function CategoryIcon({ name, ...props }: { name?: string } & IconProps) {
  const option = (name ? ICONS_BY_KEY.get(name) : undefined) ?? FALLBACK
  return option.render(props)
}
