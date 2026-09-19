import { Link, useNavigate } from 'react-router-dom'
import { IconChevron } from '../components/Icons'
import { useAuth } from '../context/AuthContext'

export function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      <h1 className="page-title">Профиль</h1>
      <p className="page-subtitle">Настройки аккаунта</p>

      <div className="profile-card">
        <h2>{user?.username}</h2>
        <p>{user?.email}</p>
      </div>

      <div className="menu-list">
        <Link className="menu-item" to="/transactions">
          Операции
          <IconChevron width={18} height={18} />
        </Link>
        <Link className="menu-item" to="/categories">
          Категории
          <IconChevron width={18} height={18} />
        </Link>
        <Link className="menu-item" to="/accounts">
          Счета
          <IconChevron width={18} height={18} />
        </Link>
        <button
          type="button"
          className="menu-item"
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
        >
          Выйти
          <span>→</span>
        </button>
      </div>
    </>
  )
}
